# Changelog

All notable changes to the **kai** plugin are documented here. The format is
based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/). Being pre-1.0,
minor bumps (`0.x`) carry features and patch bumps carry fixes.

## [0.52.0] - 2026-08-13

### Added

- **`scripts/pack-preview.mjs`** — a harness that materialises a throwaway
  two-plugin preview of the pack architecture (#29) from the **live roster**
  rather than from toy fixtures, so the host-behaviour questions that gate the
  split are answered against the agents we would actually publish. It builds a
  `kai-core-preview` (shared skills plus a `kai-core-contract-v1` preflight) and
  a `kai-personal-preview` (9 real agents with a fail-closed preflight injected),
  and supports `--no-core` and `--contract N` to reproduce a missing core and a
  version skew. Nothing in the shipped plugin moves. 10 self-test checks.

### Changed

- `docs/proposals/pack-architecture.md` records the Phase 1 and Phase 2 results,
  which change two design decisions:
  - **Core skills must carry contract-versioned names.** With legacy `kai` and
    `kai-core-preview` both providing `team-operating-rules`, the agent bound to
    whichever plugin was loaded **first** — and the preflight did not catch it,
    because core was present and answering while a different plugin supplied the
    rules. Renaming removes the ambiguity; load order is not a mitigation.
  - **Directors may stay in core**, because an agent can enumerate the installed
    roster and does not invent availability for a role that is absent — provided
    they resolve availability *before* claiming work or taking a lease.
  - Also recorded: core is larger than the six universal contracts. A 9-agent
    pack pulls **10** skills from core, because shared utilities cross
    departments just as the operating contracts do.

## [0.51.0] - 2026-08-13

### Changed

- **Every agent and skill `description:` rewritten to fit a budget.** These
  descriptions are the host's routing surface — they load into *every* session
  to answer "should this fire?" — but they had accumulated capability
  inventories, implementation notes and example lists that each file's body
  already carried. Measured cost before: **~13.4k tokens per session** (56
  agent descriptions ~7.4k, 49 skill descriptions ~6.1k). After rewriting all
  105 to "what it does, when it fires": **~4.9k tokens**, a **63% reduction**
  and ~8.5k tokens returned to every session.
- The nine `review-*` lenses no longer open with near-identical phrasing. Each
  now names its lens in the first words, so the right lenses fire on a document
  instead of all of them looking interchangeable.
- Near-neighbour roles that a router could confuse — the five `principal-swe-*`
  layers, product manager vs strategist vs marketing, growth vs demand
  generation, the two `director-*` routers, and the `demo-*` pipeline stages —
  carry an explicit disambiguation clause naming the agent they are *not*.

### Added

- **A discovery-metadata budget in `validate-plugin.mjs`**: 250 characters per
  agent description, 180 per skill. Without a ratchet the prose grows back one
  reasonable-looking sentence at a time and nothing fails until someone
  re-measures. Verified to catch a violation at exactly one character over.
- `docs/proposals/pack-architecture.md` — the measured assessment behind #29
  (`kai-core` plus department packs), including the finding that an agent in one
  plugin *can* load a skill from another, so packs need no duplicated contracts.

### Fixed

- Restored the exact boundary between near-neighbour roles in the routing
  surface: several descriptions previously disambiguated only in prose the
  router never sees, because the distinguishing detail sat in the body.


- **kai publishes its own marketplace index**, at
  `.github/plugin/marketplace.json`. The host has deprecated direct
  `owner/repo` installs — the form every instruction kai shipped used — and
  announced no removal date, so the documented install path was scheduled to
  break on someone else's clock, for new users, all at once. Installing is now:

  ```
  copilot plugin marketplace add RubenSaucedo/kai
  copilot plugin install kai@kai-plugins
  ```

  A marketplace is just a repository containing that index, so this needs
  nobody's approval and works today. Verified end to end against the real
  remote: register, browse, install, list, update. The marketplace is named
  `kai-plugins` rather than `kai` because the host uses the manifest's own name
  as the registration key with no local override — so the name is effectively
  permanent, and keeping it distinct from the plugin leaves room to publish more
  than one. The direct form is kept as a documented fallback, with its warning
  explained, for as long as the host honours it. (#102)

- **A migration path for anyone already installed the direct way.** Registering
  the marketplace does not move an existing install onto it, and installing over
  the top does **not** replace the old copy — it leaves both `kai` and
  `kai@kai-plugins` installed at once, which was measured, not assumed.
  `docs/getting-started.md` now documents uninstalling first, notes that a
  workspace (`.kai/`, `kai/`) is untouched by either command, and says how to
  recover if you already ended up with both.

- **A CI rule keeps the index honest.** The marketplace entry carries its own
  copy of the version, name and description; a stale one does not fail an
  install, it succeeds and reports the wrong version, which is worse than a
  clean break. Validation requires the file to exist, the marketplace name to be
  exactly the one every document tells users to type, `owner.name` to be
  present, exactly one entry matching the plugin, its `source` to resolve to a
  directory that really contains a `plugin.json`, and its version and
  description to match `plugin.json` — which is canonical for both.

### Fixed

- **`fleet-observation` no longer speculates about the install layout.** It said
  a marketplace install "will not look like a direct one" without knowing how.
  Both kinds were measured: a marketplace install **is** a full repository
  checkout — 56 agents, `scripts/`, `hooks.json` — so the watcher is reachable
  either way, which is the assumption that skill's central promise rests on.
  The two observed layouts are recorded as *examples* (`kai-plugins/kai` and
  `_direct/RubenSaucedo--kai`) with the instruction to always search by
  filename rather than build a path from them: the host has never documented the
  layout, and one machine is not a contract. A `--plugin-dir` source checkout is
  now listed as a third place to look, which contributors hit and the list had
  missed.

### Changed

- Install instructions in `README.md` and `docs/getting-started.md` lead with
  the marketplace form. Updating now documents **two** caches — refresh the
  marketplace catalog (`marketplace update kai-plugins`) before updating the
  plugin, or the update has nothing new to find. The host's documented
  `autoUpdate` opt-in for self-added marketplaces is called out as **not
  currently working**, so nobody relies on it.
- The local-checkout instructions now use `copilot --plugin-dir .` and say
  plainly that it *loads* rather than *installs*, so the flag is needed every
  session. The previous instruction, `/plugin install .`, was itself a
  deprecated direct install.
- `docs/getting-started.md` said kai ships 54 agents and 40 skills. It ships 56
  and 49.

## [0.49.3] - 2026-08-13


### Fixed

- **The live fleet view now redraws in place instead of scrolling.** Every
  frame began with `ESC[2J`, which erases the screen — but macOS Terminal
  implements that by pushing the erased lines into scrollback rather than
  clearing them, so the view grew downward and updates happened below the
  fold. It was reported from an actual macOS run. The view now takes the
  terminal's alternate screen buffer, which has no scrollback by construction,
  homes the cursor each frame and erases per line as it writes. That also
  removes the flicker that clear-then-draw always had, and leaves the shell's
  scrollback exactly as it found it.
- **A frame taller than the window is fitted rather than scrolled.** The
  alternate screen removes scrollback but does not stop a too-tall frame from
  scrolling, which would have reintroduced the same bug on a fleet larger than
  the window. Worker rows are dropped with an explicit `N more row(s) not
  shown`; the caveat block is never what disappears, because a view that
  scrolls its own warnings off the bottom has failed in the same way as one
  that never printed them. When the window cannot fit even the header and the
  caveats, it says so plainly instead of rendering a confident-looking
  fragment.

  The fit is measured in **wrapped rows, not lines** — on a window narrower
  than the layout a single line occupies several rows, and counting newlines
  would have under-counted the frame and let it scroll anyway. A window with no
  usable rows at all renders one line rather than the whole frame.
- **The terminal is restored on every exit path.** Only `SIGINT` was handled;
  `SIGTERM`, `SIGHUP`, an uncaught exception, an unhandled rejection and normal
  exit now restore the cursor and leave the alternate screen too. The restore
  is written and *flushed* before exiting, because TTY writes are asynchronous
  on Windows and exiting straight after the write can drop it. A terminal
  abandoned on the alternate screen with a hidden cursor needs `reset` to
  recover, which is a worse outcome than anything it could follow. Resizing the
  window redraws instead of leaving the previous layout behind.

The control sequences are used **only** on a real TTY in the continuous view.
`--once`, `--sequence`, `--feed`, and a piped `--scene` still emit plain text —
alternate-screen output on `--once` would erase itself on exit, and ANSI in a
pipe or a file is garbage.

## [0.49.2] - 2026-08-13

### Fixed

- **A withheld summary no longer looks like a broken feature.** `--with-summary`
  refuses a path-shaped line, which is the common shape of a subagent's opening
  sentence — agents answer questions about a codebase. The result was a silent
  `null` a large fraction of the time, indistinguishable from never having
  opted in. Records now carry `tldr_withheld` and the feed renders
  `[summary withheld: named a path]` or `[no summary: no prose in the reply]`.
  The reason records the *shape* of what was refused, never the text, so it
  leaks nothing and the path check is not relaxed. (#103)

  The three cases an operator must tell apart — never opted in, no usable
  prose, and refused for privacy — are now distinct in the log and on screen.

  A `tldr_withheld` value outside the allowlist is dropped at the parser, so a
  hostile log cannot render text through the marker.

### Changed

- `tldrFrom` is now a thin wrapper over `tldrDetail`, which returns the reason
  alongside the line. The line walk already continued past a refusal — #103
  reported otherwise, and that part of the issue was mistaken; it is now
  covered by a test so it stays true.
## [0.49.1] - 2026-08-13

### Fixed

- **Every kai agent had no shell on Windows.** 54 of 56 agents declared
  `tools: ["bash", ...]`. The host does not map `bash` per-OS: on Windows it
  drops the name silently and hands the agent a toolset with no way to run
  anything. Measured — an agent declaring `bash` received `view, skill, sql`
  and nothing else, while one declaring `shell` received the full
  `powershell` family. Every agent and skill now declares **both**, which is
  the only portable form; an unrecognised name costs nothing because the host
  ignores it.

  This had silently broken every script-running contract on the platform,
  `work-activity` among them — which is why nothing had ever been observed
  writing `.kai/activity.jsonl`. A live run under `--plugin-dir` now writes a
  paired start/stop and the sequence view renders it.

  A CI rule keeps the pair together in both directions, so neither name can be
  dropped by a well-meant tidy-up.

- The watcher printed "No observation log yet" and hook setup instructions
  even when `.kai/activity.jsonl` was present and full. The declared tier
  stands on its own — it is the only tier that records kai's own agents — so
  the banner now appears only when **neither** log exists.


### Added

- **A participation sequence view**: `node scripts/observe-watch.mjs --sequence`
  renders every run in the retained history, in the order it began — role, tier (`said` or
  `seen`), start, end, span, and any caveat. This is the view
  `fleet-observation` has always told agents to read; until now no command
  produced one, and the skill described an artifact that did not exist.
  - Open runs appear in the sequence rather than being held back for the
    ambient view, so the most recent work is not the only work missing.
  - A stop whose start fell outside the read window shows neither a start
    clock nor a span, labelled `start not in view`, instead of rendering as a
    run that took no time. The same applies to a run first heard from at
    `progress`: its first record is not its start.
  - A run with no stop reads `no stop recorded`, never `open` or `idle`,
    and the render says plainly that this is not evidence a process is alive.
  - Repeated runs of one role are numbered, because retrying rather than
    escalating is the pattern most worth noticing and counting rows by hand is
    how it gets missed.
  - The view lists only what a log recorded. It deliberately does **not** name
    the roles that should have taken part: kai holds no plan to compare
    against, and a display that invented one would look authoritative while
    being fiction.
  - The limit travels with the data. Every render carries the reason a missing
    role is not a finding — the host observes no kai agent, and an agent can
    run without declaring — rather than leaving it in documentation the reader
    may not have opened. The empty render, the one most likely to be read as
    `nothing ran`, keeps every caveat.
  - A run is described by the start it closes, so a stop naming a different
    role cannot rewrite which role took part; the disagreement is disclosed.
  - A stop timestamped before its own start is detected and disclosed rather
    than shown as two separate half-runs.

### Fixed

- The sequence view holds its layout from 40 to 100 columns. A caveat is never
  truncated to make a row fit; it moves to its own line, because a row that
  lost its doubt reads as a confident row. The name column is sized once for
  the table rather than per row, which had made the column jump.


### Fixed

- **Five agents that do real work were invisible in the fleet view.**
  `workflow-pull-request`, `workflow-issue-analysis`, `workflow-proactive-scan`,
  `workflow-course-to-audio` and `workflow-weekly-pulse` never inherited
  `work-activity`, so they wrote nothing to the declared log. Since v0.48.0
  established that the host observes no plugin-provided agent at all, that made
  them invisible in **both** tiers — the fleet view rendered them as though they
  had never run. All five now declare their runs.
- **The obligation is now enforced as an opt-out.** Any `director-*`,
  `principal-*` or `workflow-*` agent must inherit `work-activity` or appear in
  `ACTIVITY_EXEMPT` with a written reason, and an exemption that also inherits
  the skill is itself an error so the list cannot rot into a false claim about
  the fleet. Opt-out rather than opt-in is deliberate: forgetting to exempt an
  agent costs a line of bookkeeping, while forgetting to opt one in costs an
  agent nobody can see. Both directions are covered by tests.

### Known gap

- `principal-ai-researcher` and `principal-ai-applied-engineer` do bounded work
  worth seeing and remain invisible. `work-activity` appends through a script
  that needs the `bash` tool, and neither agent holds a shell by design. They are
  exempted with that reason recorded rather than granted one, because trading a
  sandbox boundary for observability is the wrong way round. Tracked in #132,
  where the real fix — the delegating agent recording on the subagent's behalf —
  is specified.

## [0.48.0] - 2026-08-12

### Fixed

- **The fleet view claimed absences it could not observe.** Measurement settled
  a question that had been guessed at for weeks: the host emits **no** subagent
  lifecycle events for plugin-provided agents. An A/B in a single session, same
  hook config, produced 4 events for a built-in `explore` and **0** for
  `kai:principal-swe-backend`. Every kai persona is therefore invisible to
  `.kai/observed.jsonl` by construction. The observer's core claim — that it can
  surface a role which never took part — was true only for built-in agents, and
  silently false for all 56 of kai's own. `fleet-observation` now states the
  limit up front and forbids "did not run" language on that basis.
- **The same measurement narrowed the "agents report as explorers" theory.**
  They were not mis-attributed. Loaded as a plugin, kai's personas are offered
  to the host as real agent types (`kai:principal-swe-architect`) and the name
  is correct. The simplest reading of the historical log is that it was accurate
  and those really were the agents delegated to — though the experiment
  establishes current naming, not a replay of that history.
- **One hook event delivered twice is no longer counted twice.** The rule
  depends on the evidence available: within a second when the record carries a
  run or agent id, and only at an *identical* timestamp when it carries neither.
  A `start` has no id, so two real agents launched a second apart cannot be told
  from one event delivered twice, and some duplicate starts survive on purpose —
  a double-count is visible in the view and a deleted agent is not. The ceiling
  is one second because the corpus contains an `agentId` **reused** by two
  distinct runs 90,244 seconds apart, so identity alone is never sufficient;
  collapsing on it — the fix originally proposed — would have deleted a real
  run. Regression tests pin both halves.
- **Roles the host qualifies with a namespace are no longer quarantined.** The
  host names plugin agents `kai:<name>`; the role pattern rejected the colon, so
  the day those events start arriving every one of them would have rendered as
  `<invalid-role>`.
- **Provenance now comes from the file, never from the record.** A `src` field
  inside a record is a field either writer can set, so anything able to append
  to the observed log could have presented itself as an agent's own considered
  account, or the reverse — and a run id in an observed record could have closed
  a declared run outright. Each log is parsed under the tier of the path it was
  read from, run ids are accepted only from the tier that issues them, and
  pairing keys are namespaced per tier.
- **The rotated declared log is read.** `activity.jsonl` rotates exactly like
  `observed.jsonl`, and the watcher was reading only the current generation, so
  a rotation mid-run made a healthy, still-running agent vanish from the view.
- **A run reporting progress with no start in view is shown, not dropped.**
  Previously it rendered as an idle fleet, which is the one thing this view must
  never do. It appears, marked `start not in view`.
- **A replayed declared start no longer strands a worker.** A second start for
  one run id was treated as a second agent, leaving a row no stop could clear.
- **Rows fit the terminal.** Column widths are derived from the surrounding
  content rather than a constant left over from an earlier layout. At narrow
  widths the *name* gives up space and a caveat contracts to a short form, but
  is never dropped: a row that has quietly lost its doubt reads as a confident
  one.

### Added

- **The watcher reads both tiers.** `.kai/activity.jsonl` (declared, written by
  agents about themselves) is merged with `.kai/observed.jsonl` (observed,
  written by the host). Since the host cannot see kai's agents at all, the
  declared tier is the only evidence that exists for them. Every row is labelled
  `said` or `seen`, and the two are merged for display but never reconciled — an
  agent in one tier and not the other is the normal case, not a discrepancy.
- **Declared runs pair exactly.** They carry a run id, so two runs of one role
  at the same time are matched by identity rather than by arrival order. The
  ambiguity warning is now raised only by the tier that earns it.
- **A run is late against its own promise, not against a threshold kai
  invented.** `next_report_by` from the declared tier drives a
  `past its own check-in` mark, and a `progress` record renews it.

## [0.47.0] - 2026-08-12

### Added

- **An opt-in communication-style block, because kai could not previously reach
  the agent that actually talks to you.** Every kai agent is bound by
  `team-operating-rules`, but the **main CLI agent** — the top-level assistant
  that collects subagent results and replies in the terminal — is not a kai
  agent and loads no kai agent file. Subagent verbosity is largely invisible;
  what a user reads is that synthesis. The host discovers instructions from the
  *user's* `AGENTS.md`, never from a plugin, so a style rule had nowhere to live.
  `workflow-workspace-init` now offers, once, to install a managed block into
  the workspace's `AGENTS.md`.
- **Off by default, and the question says who it binds.** Many people want the
  agents and skills and nothing else. The prompt states plainly that `AGENTS.md`
  is committed and therefore applies to everyone working in the repository —
  including the Copilot coding agent — rather than being a personal setting.
- **Marked, so it can be updated or removed.** The block is delimited by
  `<!-- >>> kai communication style ... >>> -->` markers, the same pattern the
  managed `.gitignore` block already uses. kai replaces or deletes exactly the
  marked region and never touches a line the user wrote; it appends to an
  existing `AGENTS.md` rather than replacing it, and never stages or commits it.
  Without markers kai would have to guess which lines were its own, and the only
  safe guess — touch nothing — is the same as never being able to update it.
- **kai uses the style it ships.** The canonical text lives in
  `scripts/lib/communication-style-block.md` and is carried verbatim in kai's own
  `AGENTS.md`, pinned byte for byte by `npm test` — the discipline already used
  for `scripts/lib/inherits-block.txt`. A style shipped to users and not used
  here would be a recommendation nobody tested. Validation also fails if
  `workspace-onboarding` stops naming the canonical file, since the block would
  then ship to nobody.

The rule the block actually turns on: **don't narrate routine work** — speak for
a decision, blocker, failure, or material change, and at completion. It sets a
200-word target rather than a cap, and forbids dropping failures, uncertainty,
review findings, or unverified claims to hit it. A hard limit would quietly
resolve the choice between brief and truthful in favour of brief.

`AGENTS.md` is the repository's own file, not kai workspace state, so it is not
covered by `corpus_visibility: local` — onboarding says so explicitly when both
decisions are made in one session.

## [0.46.0] - 2026-08-12

### Added

- **`corpus_visibility` — kai state no longer has to be published with a public
  repository.** Onboarding committed `kai/coordination/`, `kai/initiatives/` and
  textual `kai/library/` unconditionally, on the reasoning that the working
  corpus is closer to `docs/` than to `.vscode/` and humans should browse it.
  That reasoning holds for a team repository and breaks for a public open-source
  one, where the same files are usually the maintainer's own working notes and
  committing them publishes backlog, coordination churn and decision records to
  everyone. `workflow-workspace-init` now resolves an optional
  `corpus_visibility` key in `.kai/manifest.json`: `committed` (the default)
  keeps today's behaviour, and `local` extends the managed ignore block with
  `/kai/` and `/.kai/` so untracked kai state is excluded from ordinary `git
  add` and never reaches the remote. Paths are identical under both, so no agent
  or skill changes.
- **The question is asked only when it is a real question.** A demonstrably
  private repository is `committed` without asking. Public, no remote, or
  visibility that cannot be read all mean *ask* — a repository with no remote is
  unpublished rather than private, and the corpus accumulates long before the
  first push. Visibility is never inferred from a remote's host name, and an
  inferred `committed` is left absent rather than written, so a guess never
  becomes indistinguishable from a decision. The choice is framed as who the
  corpus is *for* rather than as public-versus-private, because a project that
  wants transparent design docs should still commit.
- **The cost of `local` is stated, not discovered.** It narrows durability to
  one checkout: the corpus does not survive a clone and is invisible to
  teammates, other machines, CI, cloud agents, and clean worktrees. Agents
  sharing one working tree still coordinate, so it is single-checkout rather
  than single-user.
- **The recorded value is verified against git, not trusted.** `workspace-doctor`
  now checks a `local` workspace with `git ls-files` and `git check-ignore`: kai
  paths that are tracked, or a corpus that is not actually ignored, are errors
  that block claiming work. A manifest reading `local` over a `.gitignore` that
  never received the block is precisely the silent failure the setting exists to
  prevent. Outside a git work tree it reports the exclusion as **unverified**
  and claims nothing. An unrecognized value is rejected outright rather than
  falling back to a default — a typo would otherwise silently publish the corpus
  the operator asked to keep local.
- **Ignoring a path is not unpublishing it.** If tracked kai paths already exist
  when `local` is chosen, onboarding lists them, states that `git rm --cached`
  stops future commits but leaves the content in history and in every existing
  clone and fork, and reports the contract **blocked** rather than complete —
  the requested exclusion is not in force, and calling that success would tell
  the operator their state is private when it is not. It takes no destructive
  action; untracking and any history rewrite stay the operator's explicit call.

### Changed

- The ignore-block verification in `workspace-onboarding` now **inverts** under
  `local` — the corpus paths must be *ignored* — rather than being skipped. An
  unverified `local` workspace is one commit away from publishing exactly what
  it was configured to withhold.
- `work-coordination` no longer describes repository coordination as committed
  without qualification. Under `local` it is durable only within the checkout,
  which is the same caveat external workspaces already carried.

Nothing migrates. `corpus_visibility` is optional and its absence means
`committed`, so every existing workspace stays valid and `schema_version`
remains 2. Reconciliation deliberately never invents the key: it answers a
question only the operator can answer.

## [0.45.1] - 2026-08-12

### Fixed

- **Narration could not actually be synthesised.** `demo-narrate --synthesize`
  shipped in 0.44.0 calling `lectoria speak`, a subcommand that did not exist —
  lectoria's CLI only exposed `run`, the whole document-to-podcast pipeline. The
  capability was always there one layer down (`createTTS()` returns Azure's own
  measured `audioDuration`); only the CLI surface was missing. Contributed
  upstream as RubenSaucedo/lectoria#28 and the pinned dependency moved to it, so
  the command kai has been issuing since 0.44.0 now resolves.
- **An unconfigured machine failed once per beat.** Every beat produced the same
  "Azure is not set up" message, burying the one fact that mattered under a wall
  of repetition. `not-configured` is now fatal: synthesis stops at the first
  beat and says so. Nothing was billed, so there was nothing to preserve by
  continuing. A `synthesis-failed` beat is still recorded and the run continues,
  because that one may be transient.
- **Failure reasons were scraped from the last line of stderr**, which turned a
  multi-line explanation into a fragment and could not tell "never set up" from
  "the call was attempted and failed". kai now reads the structured
  `error.reason` that `lectoria speak --json` emits, and falls back to the old
  behaviour so an older lectoria degrades rather than breaks.

### Changed

- kai refuses a synthesis result that carries no measured duration, or that is
  an estimate. lectoria reports projections under `estimatedDurationSec` and
  measurements under `durationSec` specifically so the two cannot be confused;
  this enforces that at the seam rather than trusting it, since a placed
  estimate is indistinguishable from a placed measurement after the fact.

## [0.45.0] - 2026-08-12

### Added

- **`create-product-demo` skill and `scripts/demo-format.mjs`** — the pipeline
  could record, focus and narrate a demo, but nothing had an opinion about
  whether the result was the right *shape* for where it was going. A screenplay
  now declares a `placement` (`social-teaser`, `landing-hero`, `readme`,
  `walkthrough`, `deep-walkthrough`) and marks its payoff steps with
  `intends_to_show`; the checker reports on provenance, runtime, tail, arrival,
  size, sound-off comprehension and framing.
- **`INCOMPLETE` as a first-class verdict.** A checker that silently skips is
  worse than no checker, because it prints a clean pass over a demo it barely
  looked at. Every check declares the input it needs, and a run missing one is
  `INCOMPLETE` rather than a qualified pass. `skipped` (input absent) is kept
  distinct from `n/a` (nothing to check).

### Changed

- **`creative-video-director` must declare `placement` and `intends_to_show`
  before a demo is recorded.** Neither is recoverable downstream — no tool can
  look at footage and work out what the demo was for or where it was going.
- **Editorial length caps can no longer fail a demo.** The "demos must be under
  60 seconds" rule is not supported by the evidence it is usually cited from:
  Wistia's 13M-video dataset puts the material engagement drop near five minutes,
  and the sub-minute figure is a *completion* benchmark, which is an argument
  about teasers. Targets and caps are now warnings that name their own
  provenance. Only `max_seconds` — a limit somebody actually declared — fails on
  runtime. Byte limits stay hard failures, because an over-limit upload is
  refused rather than discouraged.
- The word budget is documented and reported as a **planning forecast**, not a
  validation. Word counts at an assumed pace cannot see how a voice reads code,
  command names and URLs, and an aggregate that fits can still contain a single
  line that cannot fit its span. `demo-narrate` remains the deciding answer.

### Fixed

- **The take is not the final timeline.** Found by adversarial review before
  release: the first version of the format checker measured runtime from the take
  manifest. On kai's own shipped demo the last measured step ends at 37.2s while
  the video is 50.0s, so it would have reported a 50-second demo as 37 seconds
  and passed it. Runtime, framing and size are now measured from the rendered
  file via ffprobe, and a new tail check surfaced those 12.8 seconds of dead air
  — which had shipped, invisible to everything.
- README's catalog line still claimed 47 skills, stale since 0.44.0.

## [0.44.1] - 2026-08-12

### Fixed

- **`demo-narrate` looked for lectoria everywhere except where it is.** It checked
  `LECTORIA_BIN` and then PATH, but kai *pins* lectoria as a git dependency, so
  `npm install` puts it at `node_modules/.bin/lectoria` -- not global, not on
  PATH. On a machine where lectoria was installed exactly the way this plugin
  installs it, narration reported the tool absent and refused to synthesise: a
  message accurate about what it checked and wrong about the conclusion.
  `generate-audio` had the right order all along and this now matches it, with
  the pinned copy winning over a stray global so a demo is narrated by the
  version this plugin pins. The absence message names all three places it looked,
  and mentions lectoria's Node requirement, because a version error otherwise
  looks like an install problem. (#120)

- **`creative-video-director` emitted audio cues that `demo-narrate` refuses.**
  The two halves of the narrated-demo feature disagreed about whether narration
  has timestamps. The director produced `{event_id, timestamp, video_action,
  audio_action}` under a rule that a cut is an audio cue at the same timestamp;
  `demo-narrate` rejects any beat carrying a time. Handing one to the other
  would have been rejected outright, which is why nothing routed to the skill
  that shipped in 0.44.0.

  Both sides were right for different videos, so the fix is a branch rather than
  a translation layer -- converting one into the other would have laundered a
  guess into something that looked measured. Cutting **existing footage**, a
  timestamp is legitimate: the material is recorded, so the director reads its
  timeline rather than inventing one. Directing a **live interface**, the footage
  does not exist, and the two numbers that decide where a line goes are measured
  by the synthesiser and the recorder respectively. The director now emits
  narration beats for that case, routes to `demo-narrate`, and is told plainly
  that a line which does not fit comes back to it as a script defect. (#121)

- Corrected an inaccurate claim in the 0.44.0 notes: kai's *scripts* import
  nothing outside Node's standard library, but the package does pin lectoria for
  `generate-audio`. CI still needs no install step.

## [0.44.0] - 2026-08-12

### Added

- **Narration placed against a measured recording, or refused.** `demo-narrate`
  adds the voice track, and it is the part of the pipeline with the most ways to
  quietly produce something false, so it is built almost entirely out of
  refusals.

  Only two numbers matter and neither is the author's to write: **how long a line
  takes to say** is measured by the synthesiser before capture, and **when a
  state actually appears** is measured by the recorder during it. A narration
  beat that declares `start`, `end`, `seconds`, `duration` or `offset` is
  rejected in the same words a step declaring a source second already was.

  The obvious design -- one line per step, the line's length setting the step's
  dwell -- was proposed and rejected: a 0.3-second click is not a nine-second
  visual scene, and keying one to the other manufactures long inert holds.
  Knowing a clip's duration up front still does not say when the line should
  start, because that depends on when the interface reached the described state.
  So a beat instead **spans** the visual states it describes and names the
  earliest state it may follow (`start_after`), which is the whole defence
  against narration claiming an outcome before the viewer can see it.

  When speech does not fit, that is a script defect rather than an editing
  problem, and the rejection computes the fix: if a later state is still on
  screen when the line ends it names that step -- the *smallest* span that would
  work -- and otherwise says so and how many words to cut. It will not slow
  typing to fit prose, freeze while the app is supposedly responding, or stretch
  a loading state. A freeze that conceals latency is a lie about how fast the
  product is.

  Refused outright: narrating a step the take recorded as `failed` or
  `unsettled`, a partial synthesis, a clip that failed (which is not silence),
  and a clip synthesised from words the screenplay no longer carries.

- **`lectoria` is an optional external tool, not a dependency.** It carries
  sixteen runtime dependencies including a PDF parser and a DOM implementation;
  kai's scripts import nothing outside Node's standard library, which is why CI
  needs no install step. (kai does *pin* lectoria in `package.json`, at a SHA, for
  `generate-audio` — but no script imports it.) So it is
  discovered at run time exactly as ffmpeg is, and its absence is stated plainly
  rather than degrading into something silent that looks like it worked. A line
  that fails to synthesise is recorded as a failed clip and **not retried** --
  a retry of a paid request nobody asked for is a charge nobody agreed to.

- `--estimate` prints the size and projected length of a synthesis run **without
  making a paid call**, and labels every number it prints an estimate.

- Narration is mixed onto the finished render with the video **copied, not
  re-encoded**, so re-narrating in another language cannot change a single frame
  of what was recorded. `-shortest` is deliberately absent: placement already
  guarantees the narration fits, so it could only ever cut the end off the demo.

- New `demo-narrate` skill documenting the beat contract and every refusal.

## [0.43.0] - 2026-08-12

### Added

- **A drawn cursor, built from measured pointer telemetry.** At 2x zoom the
  operating system's cursor is easy to lose, so it is hard to tell what a shot is
  pointing at. Captures now run with `-draw_mouse 0` and the finished video
  carries an arrow we control.

  The tempting shortcut was to place that arrow at the centre of each step's
  target rectangle. That is false data: a rectangle records *intended* geometry
  and says nothing about the path taken, the hover dwell, or when the button went
  down. Worse, hiding the OS cursor does not disable its effects -- the physical
  pointer still drives hover state, so an invented path would show the arrow
  somewhere the application never reacted.

  So the driver **glides the real pointer** and records where it actually was,
  on the same measured clock as every other timing. Movement is linear in time
  because the renderer interpolates linearly between samples; an eased glide
  would look better and would make two recorded endpoints a lie about the path
  between them. The pointer is marked hidden while typing, since the arrow would
  otherwise cover the text the shot exists to show. **A take with no telemetry
  produces no cursor** -- it is never reconstructed.

  The arrow is drawn *after* the zoom, not before. Compositing it first would
  have magnified it with everything else, so its size would change shot to shot,
  its edges would blur under the same interpolation as the pixels, and the crop
  would clip it. Instead the measured source position is pushed through the crop
  the zoom is performing, using the same `clip()` the zoom itself uses so the two
  cannot drift, and a constant-size arrow is drawn in output space.

- `scripts/lib/cursor-png.mjs` generates the arrow with `zlib`, a Node built-in,
  rather than committing a binary asset that would have to be kept in step by
  hand with the code that places it.

### Changed

- Out of scope, and rejected rather than approximated: drag, scroll,
  hover-triggered menus, and cursor shape changes. This draws a cursor from
  measurements; it is not a compositor.

## [0.42.0] - 2026-08-12

Recording a real demo with 0.41.0 exposed the seam it left open: `demo-zoom`
renders a plan, but nothing owned producing one. The plan was hand-typed from
memory, and both ways that failed are now fixed by construction.

### Added

- `demo-capture`, the capture half of the demo seam (#108). It drives a declared
  screenplay and writes a take manifest recording, per step, the **measured**
  source second it happened and the rectangle it acted on. The recording clock is
  pinned against ffmpeg's own `-progress` output rather than assumed, and
  preflight refuses a take before spending it: a uniformly black frame (how
  `gdigrab` captures a GPU-composited browser while appearing to work), an odd
  capture dimension h264 cannot encode, or an unresolved target.
- `demo_screenplay.json` (`kai.demo-screenplay/v1`) as a sixth `video-direction`
  artifact: steps, the exact text to type, semantic targets, and which moments
  deserve emphasis. It carries no source seconds or frame coordinates, and the
  tooling refuses one that does.
- `demo-zoom --compile`, joining a screenplay's intent to a take's measurements
  (#109). It resolves `emphasis.anchor` against the recorded rectangle, splits
  overlapping lead-in and hold at the midpoint, trims an ease that no longer
  fits, skips a step the take recorded as failed, and stamps the plan with its
  `take_id` so it cannot silently render against another recording.
- `demo-zoom --review`, a contact sheet of four frames per segment (#111):
  source before, source at, render at peak zoom, render near the end. It catches
  the two editorial failures no validator can see. It found one on its first run
  against a real plan.

### Fixed

- `demo-zoom` no longer passes `-c:a`/`-b:a` when the source has no audio
  stream (#110). Since a screen recording usually has none, the most common path
  was printing an unused-AVOption paragraph that reads like a fault.
- `creative-video-director` was told to emit a `demo_plan.json` that nothing
  defined, validated, or consumed, and that it could not honestly produce: its
  timings are estimates by contract while a focus plan needs measurements (#107).
  It now hands off a screenplay, and is explicitly forbidden from emitting a
  source second or a frame coordinate.
- Four defects found by running the emitted driver for real, each of which had
  passed a self-test that only inspected the generated text:
  - The preflight brightness gate scraped `-match` over an **array** of ffmpeg
    output lines. PowerShell's `-match` filters an array instead of populating
    `$matches`, so the reading was always zero and every take aborted claiming a
    black frame. It now joins the output first, and distinguishes "the frame is
    black" from "the statistic could not be read" rather than reporting both as
    the former.
  - `metadata=print` logs at info level, which `-v error` discarded. The
    statistic is now written to a file, whose name is relative and free of `:`
    and `\` because ffmpeg's filter parser treats both as syntax.
  - A `type` step clicked its field as soon as the previous step's authored
    `settle` elapsed. When the form had not finished rendering, the click missed
    the input, `Ctrl+A` selected the whole document, and the opening characters
    of the typed text were lost — producing a plausible-looking take with a
    truncated title. How long an app takes to paint is not something a
    screenplay can know, so the driver now **measures** it: successive captures
    are compared until they are near-identical. A screen that never settles is
    recorded as `unsettled` in the manifest instead of being passed off as clean.
  - The estimated take duration ignored that measured wait, so the recorder
    could stop before the last step happened. It is now budgeted.

### Changed

- `demo-zoom`'s workflow leads with compiling from a take; hand-authoring is
  documented as the fallback for footage that already exists, and as the path
  where someone is typing seconds from memory.
## [0.41.0] - 2026-08-11

### Added

- **`scripts/demo-zoom.mjs`** and the **`demo-zoom`** skill - render a
  focused demo from a declared focus plan. A recording where the interesting
  part occupies a small corner of the frame is technically correct and
  practically unwatchable; this moves the camera to whatever the director said
  matters. Focus is declared rather than detected: nothing inspects pixels to
  guess what is interesting, because that fails by zooming confidently onto the
  wrong thing, and a written plan can be reviewed before an encode is spent.
  Renders as a single continuous `zoompan` pass, so there are no segment
  seams and no audio to resynchronise. `--grid` lifts one frame out of the
  recording ruled into tenths, so coordinates are read off the picture instead
  of guessed. `--explain` describes the render in plain numbers first, and
  `--print` emits the ffmpeg command for machines that have ffmpeg when this
  one does not. Needs ffmpeg on PATH and nothing else.
- The zoom curve is a sum of per-segment eased weights rather than nested
  conditionals, which makes every transition continuous by construction: the
  camera cannot jump, and the arithmetic is checked without ffmpeg by 68
  self-test assertions. `--verify` proves the render itself, by zooming onto
  a marker at a known point and reading the centre pixel back out.
- The tool refuses a plan it cannot honour rather than rendering something
  misleading - overlapping segments, an ease too long to reach its zoom factor,
  a path that ffmpeg would read as an option, or an output that would overwrite
  the source - and names the segment and the reason each time.

### Review fixes

An independent review of the first cut found eight defects; all are fixed here
and each is pinned by an assertion.

- **Two touching hard cuts added their zoom together.** Segments are allowed to
  meet, and with both endpoints inclusive both were fully active for the instant
  they shared, so a 2x segment meeting a 3x segment showed 4x for one frame. The
  interval is now half-open: a segment is released before the next begins.
- **A well-formed plan could build a filter too long to hand to a process.** The
  limit was a segment count, which is only a proxy for the thing that actually
  breaks. The built expression is now measured against what a command line can
  carry and refused with the reason, rather than failing inside `spawn`.
- **Snapping the crop origin to even pixels was justified by an unmeasured
  claim** and made each step twice as large. It is gone. The crop is instead
  computed on a frame twice the output size, which halves the smallest possible
  step -- stated as the arithmetic it is, with the smooth-motion claims removed
  from the doc, the header, and the tests.
- **The doc claimed `--explain` caught a segment running past the end of the
  material, which it could not know.** It now probes the duration with
  `ffprobe` and names any segment that overruns, or says plainly that the
  duration is unknown.
- **A focus point near an edge cannot be centred**, because centring it would
  show padding. The render always clamped; the doc called the coordinate a
  centre anyway. It is now described as a target, and `--explain` prints where
  each shot actually lands next to what was asked for.
- **`--print` emitted a command that would not run** for a path containing a
  space, and left the filter's parentheses exposed to a shell. Arguments are now
  quoted.
- **Audio was stream-copied**, which fails outright when the source codec cannot
  enter the output container. It is re-encoded to AAC.
- **Values that passed validation could still fail deep inside ffmpeg** -- a
  `00x00` size, a frame rate that rounds to zero, a CRF of 100. All are now
  refused where the error is readable. The grid's `--size` and `--plan`
  options are documented, and an explicitly named plan that cannot be parsed is
  fatal rather than silently falling back to a default size, which would have
  produced coordinates for a different frame.
### Fixed

- **README stated two different inventories.** One line claimed 56 agents and 45
  skills and another claimed 54 agents and 40 skills. `release-guard` checks
  the version stamp but not the surrounding prose, which is how it survived.
  Both now agree with the generated catalog.
## [0.40.0] - 2026-08-11

### Added

- **`scripts/observe-watch.mjs`** — a live, ambient view of the subagent fleet.
  The observed log answers which roles emitted lifecycle events during a piece
  of work, but reading JSONL is not watching a team; this renders it, so a
  supervisor can glance at a second terminal instead of scrolling a transcript
  or waiting on a subagent.
  - A **separate process by necessity**: the observer is not a daemon, it is
    spawned per event and exits, so nothing holds state between events. The file
    is all the two share — which also means the writer can never be slowed,
    blocked, or crashed by whatever is rendering.
  - **Strictly read-only.** A viewer that wrote to its own source would become a
    second writer and destroy the append-only integrity that keeps concurrent
    subagents safe.
  - **Does not invent liveness.** A start with no stop is reported as a fact
    about the log, not as proof a process is alive, and long-open entries are
    aged rather than trusted. Same-role overlap is labelled as ordering-based
    pairing, because `subagentStart` carries no agent id.
  - Modes: ambient view by default, `--feed` for piping or a narrow pane,
    `--scene` to force the view when stdout is not a TTY, `--once` for a
    snapshot. Plain ASCII, no dependencies.
- **`fleet-observation` skill** — the operator path, so adoption does not require
  cloning the repository. Covers locating the scripts inside the plugin's
  install directory, granting consent, launching the watcher detached in its own
  terminal, and reading a participation sequence — including the absences, which
  is where the finding usually is. It also carries the distinction people get
  wrong: the observer is not a service, the watcher is.

### Fixed

- The watcher now reads the **rotated** generation of the log as well as the
  current one. A run that started before a rotation lived only in
  `observed.jsonl.1`, so the view retired a worker that never stopped and
  reported an empty fleet with full confidence. When history still cannot be
  read in full, the shortfall is stated on screen instead of being rendered as
  quiet.
- Every field the watcher renders is now validated by the watcher itself rather
  than trusted from the file. It reads a plain file any process can append to,
  so a hand-edited role containing a path is quarantined instead of printed, and
  terminal control sequences in a summary are stripped — a terminal treats an
  escape sequence as an instruction, not as text. An impossible timestamp is
  formatted rather than thrown.
- Pairing is now done on reconciled time, so a stop written before its own start
  no longer leaves a run counted as both finished and still working, and records
  with no session are labelled as a guess rather than silently closing
  each other's runs.
- `--feed` tracks emitted events by identity instead of by count, so a rotation
  no longer causes it to skip or repeat lines, and a late `fs.watch` error now
  falls back to timer polling instead of terminating the process.

## [0.39.0] - 2026-08-11

### Added

- **`hooks.json`** — kai now ships its own hook registration, so installing the
  plugin wires the subagent observer with no manual configuration. Hook sources
  are merged rather than overwritten, so this adds nothing to any file you own,
  and the observer stays inert until you run `npm run observe:enable`.
  - The command uses `${PLUGIN_ROOT}`, which expands to the plugin's install
    directory. 0.38.0 deliberately withheld this file because the hooks
    reference documents that variable only for LSP configuration. It has now
    been **verified** against a real plugin install and a real subagent, which
    also confirmed that a root `hooks.json` is auto-discovered with no
    `plugin.json` entry and that a hook's working directory defaults to the
    plugin root.
  - Deleting `hooks.json` from the install directory, or uninstalling the
    plugin, removes the registration entirely. Nothing else in kai depends on it.
- **A hooks contract check** in `validate-plugin.mjs`. `hooks.json` is the one
  file in the repository the host executes on its own, on every subagent, for
  everyone who installs kai — and a mistake in it is silent, because a wrong
  path simply fails to spawn in someone else's session. CI now rejects a command
  that omits `${PLUGIN_ROOT}` (it would resolve against the *user's* repository),
  a path that does not exist in the plugin, a subscription to any event other
  than `subagentStart`/`subagentStop` (`preToolUse` is fail-closed, and
  per-tool-call events cost ~66 ms each), a missing half of the start/stop pair,
  a `timeoutSec` above 15s, and malformed JSON. Each rejection is proved by a
  negative case.

## [0.38.0] - 2026-08-11

### Added

- **Opt-in subagent observer** (`scripts/observe-subagent.mjs`). A host hook
  records two events per subagent — `start` and `stop` — into a gitignored
  `.kai/observed.jsonl`, so the *participation sequence* of a feature becomes
  checkable: which roles took part, in what order, and which were skipped. The
  declared activity log cannot answer that, because a role that was never
  consulted never writes a record.
  - Off by default, in two independent steps: `npm run observe:enable` grants
    consent, and wiring the hook is a separate file you add under
    `~/.copilot/hooks/` (hook sources are merged, so kai edits nothing you own).
    kai does not ship a plugin-level `hooks.json` yet, because a plugin hook
    command needs an absolute path to its own install directory and the host's
    plugin-root variable is unverified — a hook whose path failed to expand
    would spawn and fail on every subagent.
  - Consent is a file (`.kai/observer-consent`) checked inside
    the hook, because the host has no "installed but inactive" state; without it
    the script writes nothing and leaves no file behind. `npm run
    observe:enable`, `npm run observe:status`, `--disable` to revoke.
  - Only a capped single-line summary of a subagent's reply can ever be stored,
    never the full response — and summaries are a **second** opt-in
    (`--with-summary`), off by default. The declared log's note is authored by an
    agent that knows it is being logged and can self-redact; this summary is
    scraped from prose written for a parent agent, so path shapes are refused and
    the line is capped but it is **not secret-scrubbed**. Participation alone
    answers the question the observer exists to answer, so participation alone is
    the default.
  - Absolute paths are refused and the session and agent ids are digested,
    asserted against the bytes that land on disk rather than the object in
    memory.
  - **stdout stays empty and the exit code stays 0, always.** `subagentStop`
    reads a hook's stdout for `decision` and `modifiedResponse`, so an observer
    that spoke could block or rewrite a real agent's answer.
  - Scoped to subagents only: a hook costs ~66 ms to spawn, so per-tool-call
    events would add ~33 s of overhead across 500 calls, and the main CLI
    session is the conversation rather than an employee to be watched.
  - `general-purpose` subagents emit neither host event and are therefore
    invisible to the observer — a documented limit.
- **`creative-*` role prefix** in `team-operating-rules`, a lane for creative and
  media-production judgment — concept, narrative, and craft direction for
  produced content. Creative roles direct; they do not render, edit, or publish.

### Changed

- **Managed `.gitignore` block** now covers `.kai/observed.jsonl` and
  `.kai/observer-consent`, in both the repo file and the
  `workspace-onboarding` template.
- **Renamed `principal-video-director` to `creative-video-director`.** The
  `principal-*` prefix marks domain ownership generally, but a video director is
  a creative lead rather than a principal individual contributor; the new
  `creative-*` prefix names that lane directly. Behavior, inherited contracts,
  and produced artifacts are unchanged. Update any saved references to the old
  agent name.

## [0.37.0] - 2026-08-11

### Added

- **`no-self-remediation`**, the directional write contract for roles that
  assess without acting. An assessor may write its own evidence, report, and
  findings; it must not mutate the target under review. Mutation is defined
  broadly on purpose — creating, shadowing, deleting, renaming, patching,
  formatting, or generating a file inside the reviewed target all count, because
  a new auto-discovered file can make a finding stop reproducing without
  changing one existing byte. Inherited by an eleven-role assessor roster that
  CI now pins.
- **`requires_tools:`** in skill frontmatter, and a validator check that an
  agent inheriting such a skill actually holds those tools. `work-activity`
  declares `requires_tools: [bash]` because its procedure is to run
  `scripts/activity.mjs`. The check found two real defects on its first run.

### Fixed

- **Five assessors were granted `edit` but not `create`** —
  `principal-qa-ui`, `principal-seo`, `persona-ux-first-time-user`,
  `persona-professional-nutritionist`, and `persona-professional-trainer`
  are each told to stub a `report.md`, which `create` does and `edit`
  cannot. They held the tool that endangers the artifact under review and
  lacked the one that structurally cannot touch it.
- **`principal-ai-applied-engineer` and `principal-ai-researcher` inherited
  `work-activity` without holding `bash`**, so they could not run the
  reporter that contract requires. Both are deliberately shell-free
  document-producing roles, so the contract was removed rather than granting
  shell for a logging side-effect.

### Changed

- The capability tiers are now stated honestly rather than implied. Most kai
  assessors are `unrestricted-capability`: they hold `bash`, so the
  boundary is this contract, not the host. Removing shell would not harden the
  review — it would break it, turning a revision-bound security review into a
  working-tree guess. A genuinely hard boundary needs a read-only review input
  mounted separately from a writable evidence root, which a declarative plugin
  does not control.

## [0.36.0] - 2026-08-10

### Added

- **`work-activity` — an append-only activity log, so a fleet is legible
  between item updates.** A coordination item changes a handful of times across
  days of work; between two updates a supervisor can only say "unknown". Agents
  now append a `start` and a `stop` (and optionally a `progress`) to a
  gitignored `.kai/activity.jsonl`, carrying who is working, on which item, and
  **when they will report next**.

  ```bash
  RUN=$(node scripts/activity.mjs new-run)
  node scripts/activity.mjs start --root <ws> --role principal-swe-backend \
    --item export-audit --run "$RUN" --for 45m
  node scripts/activity.mjs stop  --root <ws> --role principal-swe-backend \
    --run "$RUN" --outcome handoff
  node scripts/activity.mjs show  --root <ws>     # who else is live
  ```

  This also gives agents something they never had: a live view of their peers
  before claiming work — who is in flight, on what, and whether the peer they
  are about to ask is mid-run.
- **A boundary the writer enforces, not one the docs request.** The item record
  is a compare-and-swap surface: every write increments `version` and is
  verified against a lease token, which is precisely why a heartbeat cannot live
  there — it would inflate the field that detects racing, and read-modify-write
  is the lost-update pattern append-only avoids. So the log is a separate file,
  and a record naming `state`, `verdict`, `change_ref`, `version`, `lease`, or
  `decision` is **rejected at write time**. Two surfaces that can never carry
  the same fact cannot drift into two truths.
- **A live overlay in `work-status`.** Open runs are counted, and a run that
  declared it would report by `T` when `T` has passed becomes a `derived`
  UNKNOWN finding. It never says "crashed" — that requires an observer this
  plugin does not have. With no log present, the report behaves exactly as it
  did in 0.35.0.

### Changed

- `npm test` is now **nine** checks; `npm run activity` and
  `npm run activity:self-test` are available directly.
- The managed `.gitignore` block gained `/.kai/activity.jsonl`. Existing
  workspaces pick it up by re-running `workflow-workspace-init`.
- The 42 agents that inherit `work-coordination` now also inherit
  `work-activity`, which is what gives the skill a real firing path.

### Notes

Concurrency is measured, not assumed. Each agent is a separate OS process, so
single-threaded JavaScript grants no mutual exclusion; what makes this safe is
`O_APPEND` plus one `write()` per record. The self-test runs six concurrent
writer processes and asserts every record survives intact — if that ever stops
holding, the test catches it.

The log is **declared**, like the item records: an agent that crashes never
writes its `stop`, and one that forgets never writes at all. It does not
pretend otherwise.

## [0.35.0] - 2026-08-10

### Added

- **`work-status` — an exception report that answers "where must I intervene?"**
  (`node scripts/work-status.mjs --root <workspace>`, plus `--json`). As work
  scales, reading every coordination record to find the two that need a decision
  does not scale with it. This reads the authoritative item records under
  `kai/coordination/items/` — never `BOARD.md`, which is itself derived and can
  drift — and prints only exceptions, in severity order:
  - **NEEDS YOU** — an open question addressed to `@operator`, and any state only
    a human can advance (`release-ready`, `deploying`, `production-verification`),
    since kai never deploys.
  - **INTEGRITY** — records that contradict each other: a review that approved a
    different `change_ref` than the item now carries, a dependency on an item
    that does not exist, an unreadable record, a terminal state with required
    reviews unmet.
  - **BLOCKED** — declared blocked, or waiting on a typed dependency that has not
    reached its required state.
  - **UNKNOWN** — an expired lease, active work with no `next_role` and no
    holder, or `waiting_on_questions` naming a question with no packet in the
    thread.

  Healthy work is counted, not listed. Ordinary blocked work exits `0` — being
  blocked is a normal state of a healthy board, not a failure; only an integrity
  finding exits non-zero.
- **A confidence tier on every finding** — `declared` (the record asserts it) or
  `derived` (the tool checked it: two records contradict each other, or the
  condition is one the tool can evaluate itself). Coordination records are
  maintained by agents following prose, so a record that has not changed is
  indistinguishable from an agent that is still working, one that crashed, and
  one that forgot. Where the tool cannot tell, it reports `UNKNOWN` rather than
  showing green, and the report states plainly that it describes what agents
  have **declared**, not verified live activity. A confident green board that is
  green because nobody updated it is worse than no board.
- `scripts/lib/coordination.mjs` — the shared parser for coordination records.
  `workspace-doctor` validates these records and `work-status` reports on them;
  both now read through one module, because a second parser would be a second
  truth. Adds list, map-list, and QUESTION-packet parsing on top of the helpers
  the doctor already had.
- Docs: *Seeing what needs you* in the workspace model guide, covering the
  sections, the exit codes, and — explicitly — what the report cannot tell you.

### Changed

- `npm test` is now **eight** checks; `npm run status` and
  `npm run status:self-test` are available directly.
- `workspace-doctor` now exports `checkWorkspace` and only runs its CLI when
  invoked as the entry point. Previously, importing it executed the CLI and
  consumed the importer's own flags — `work-status --self-test` silently ran the
  doctor's self-test instead of its own.

### Fixed

- `docs/README.md` advertised "54 agents and 40 skills"; the shipped surface is
  56 and 42.

## [0.34.0] - 2026-08-10

### Added

- **Documented the three ways a skill reaches a session**, in
  `docs/reference/plugin-structure.md` -> *How a skill reaches a session*:
  **inherited** (named on an agent's `**Inherits:**` line), **user-invoked**
  (`user-invocable: true`, run directly by the operator), and **orchestrated**
  (declared as a dispatch entry in an agent's prose and run situationally, as
  `workflow-doc-review` does with its review lenses). All three are legitimate,
  and a skill may have more than one. The page also records the auditing
  pitfall: **parse only the `**Inherits:**` line** — grepping whole agent files
  also counts prose mentions and inflates the count.
- `npm run validate` now **fails a skill with zero firing paths**. A skill with
  no inheritor, no `user-invocable: true`, and no dispatching agent previously
  passed every check and appeared in the generated catalog while being
  unreachable. The check accepts all three designs and rejects only the
  genuinely orphaned case. The orchestrated path is matched by the dispatch
  declaration shape rather than by any backticked mention, so an incidental
  reference — a cross-link, or a "do not use `x`" sentence — cannot pass an
  unreachable skill off as reachable. Verified against a probe skill with every
  path removed, and against that incidental-mention case.

### Changed

- `principal-swe-backend`, `principal-swe-frontend`, `principal-swe-infra`,
  and `principal-ai-applied-engineer` now inherit `research-before-coding` and
  `pr-sizing`, matching the carrier set already used for `coding-style`.
  Investigating before writing code is the normal path for these roles, and
  `research-before-coding` self-limits — it skips typos, comment edits, and
  doc-only changes, reduces to a two-line proposal for a change under one file
  or thirty lines, and accepts implicit approval — so inheriting it cannot
  impose ceremony on atomic work.

### Fixed

- `workflow-issue-analysis` claimed `research-before-coding` had no inheritor
  and was therefore "a routing intent rather than a live seam". That was
  overstated even when written — the skill is `user-invocable: true` — and is
  now false in both respects. Corrected.
- `docs/reference/plugin-structure.md` described `npm test` as six checks and
  omitted the proactive-runner self-test added in 0.32.0. It is seven.

## [0.33.0] - 2026-08-08

### Added

- `issue-analysis` skill — the discipline for turning an issue into a chosen
  approach: proportionality (a fast path for a typo, the full loop for anything
  with a disputed premise, multiple viable approaches, or a hard-to-reverse
  choice), grounding against what already exists, **verifying the decisive
  assumption by experiment rather than assertion**, restating the problem before
  proposing a remedy, framing only the options that genuinely exist, and stopping
  at the authorized decision owner.
- `workflow-issue-analysis` agent — the front door for picking up an issue. It
  ends in one of three named states: AWAITING SELECTION, FINDING, or BLOCKED.
  There is no state in which it began the work.
- Issue health as a first-class outcome: stale, duplicate, wrongly-premised, and
  "several issues wearing one hat" are **successful** results, not failures to
  comply. Two issues in this repository had to be consolidated by hand.
- Acceptance-evidence classification — CI-provable, manually verifiable,
  externally observable, or not presently provable. Marking a criterion unprovable
  is honest; inventing a test that appears to cover it converts a known limitation
  into a false assurance.

### Changed

- `workflow-issue-analysis` is the **first agent in this plugin that holds no
  `edit` and no `create`.** The central rule of issue analysis — analysis ends in
  a decision request, it does not slide into implementation — is exactly the rule
  a confident model steps over once the answer feels obvious. Removing the write
  tools makes the boundary a capability rather than a promise. The agent
  documents the honest limit of that: it still holds `bash`, because verifying a
  decisive fact requires running things, and `bash` can write.
- The catalog's `Delivery` agent category is now **`Intake & delivery`**, covering
  the full life of one change: issue, to approach, to merged PR, to production.
- `director-chief-of-staff` inherits `issue-analysis` and routes issue intake to
  `workflow-issue-analysis`, so the skill has real carriers. A skill nothing
  inherits never fires — `research-before-coding` has zero inheritors today.

## [0.32.0] - 2026-08-08

### Added

- `examples/proactive-runner/runner.mjs` — the delivery-side logic the scheduled
  runner calls, dependency-free Node ESM with a 33-check fixture suite wired into
  `npm test`. Three commands: `plan` (decide `deliver` / `skip` / `fail`),
  `retain` (apply the retention policy, idempotently), and `redact` (a diagnostic
  carrying no personal content).
- Real non-interactive host invocation for both phases. `copilot -p "<prompt>"
  --agent workflow-proactive-scan` replaces the two `echo` placeholders that made
  the shipped runner non-executable end to end. Tools are granted **narrowly**
  (`--allow-tool view/grep/glob/create/edit`, `--deny-tool bash`) rather than with
  `--allow-all-tools`, because the scan is specified read-only apart from writing
  under `kai/personal/proactive/`.
- Documented authentication: a fine-grained PAT with **Copilot Requests: Read**
  in `COPILOT_GITHUB_TOKEN`. The built-in Actions `GITHUB_TOKEN` does not carry
  Copilot permissions.
- Redacted failure diagnostics uploaded as an artifact — status, signal counts by
  kind and state, and gap reasons **classified** to `unreadable` / `invalid` /
  `unspecified`. Gap reasons are model-authored free text that can name a file,
  and a CI artifact is readable by anyone with Actions read access, so they are
  classified rather than copied. Signal summaries, item paths, workspace labels,
  and root ids are omitted by policy.
- A retention policy: an **acked** payload is deleted and the outbox is pruned to
  the five most recent, because the ledger and not the outbox is the durable
  record. Deletion is gated on the ack rather than the delivery: ack can fail
  after a successful send, and a payload whose ledger entry never advanced will
  be needed again on the next run.
- `check-syntax` now parses `examples/` as well as `scripts/`. Shipped examples
  are copied verbatim into consumer repos, so their executable helpers earn the
  same gate.

### Fixed

- **Consent was checked with a grep.** `grep -Eiq 'consent:[[:space:]]*yes'`
  matches that string **anywhere** in `channels.md` — including the prose that
  documents the format, and including a block whose `enabled: false`. It never
  checked `enabled`, the channel `type`, or that `secret_ref` named the secret
  actually being spent. `plan` now parses only the fenced yaml block and requires
  all four, honoring `secret_ref` exactly; a `secret_ref` the runner does not hold
  fails loudly rather than delivering down an unconsented path. A fixture asserts
  the naive grep would have been fooled by the same input the parser refuses.
- **The Actions cache held personal content.** It persisted all of
  `kai/personal/proactive/`, including the outbox's notification summaries;
  GitHub advises against sensitive data in caches, since a pull request with read
  access can read base-branch caches. Only `snapshot.json` — all that dedup needs
  — is cached now.
- A misconfigured channel no longer resembles a quiet week: broken configuration
  and a scan `status: error` exit non-zero, while "nothing to send" and "no
  consent" exit zero.
- **Scan-derived values were interpolated into `run:` blocks with `${{ }}`.**
  That substitutes the raw string before the shell parses it, so a model-authored
  gap reason containing `$(...)` would have executed on the runner. Every such
  value now reaches the shell through `env:`.
- A signal-bearing status carrying an empty `signals` array now skips instead of
  delivering a hollow notification.
- A `#` inside a quoted yaml value is no longer stripped as a comment.

## [0.31.0] - 2026-08-08

### Added

- `pr-delivery` skill — the contract for how one finished change physically
  leaves the workspace. Branch naming from a three-rung anchor ladder (GitHub
  issue, then coordination item id, then date), a conventional-commit title, and
  a **core-plus-triggered** PR body: Problem / Change / Verification always,
  with `The change at a glance`, `The constraint that shaped this`,
  `Deliberately not done`, `Review fixes`, `Before / after`, and
  `Rollout / reversibility` firing only on their trigger, so no section is ever
  filled with "N/A". Verification must name the exact command that ran. A defect
  fix additionally carries what happened, repro steps, and how it was found. A
  change that alters a structure or flow carries a `build-diagrams` ASCII
  diagram; a changed user-visible surface carries before/after screenshots.
  Inherited by `principal-swe-backend`, `-frontend`, `-infra`, and
  `director-chief-of-staff`.
- `workflow-pull-request` agent — the front door for that span, and the only
  place the part a skill cannot do lives: **investigating live branch protection
  and required checks**, then classifying the change MERGEABLE, NOT YET, or
  STRUCTURALLY BLOCKED. A solo-maintainer repo requiring one approving review is
  unmergeable by construction; that is escalated to `@operator` as a
  configuration decision rather than resolved with a silent admin bypass. It
  drafts and validates only — the human presses merge, tag, and release.

### Changed

- The delivery chain is now explicit end to end: `pr-sizing` splits the work,
  `pr-delivery` lands one PR, `definition-of-done` says it is ready, and
  `workflow-ship` deploys it. Previously nothing owned the span between "the work
  is sized" and "the work is ready to deploy", so branch, PR narrative, version
  bump, and merge readiness lived only in whoever happened to be doing the work.

### Fixed

- Branch naming avoids a real git hazard: because refs are directories, a
  pattern like `<type>/<number>/<author>/<slug>` permanently reserves
  `feat/28` as a folder, and a contributor running `git checkout -b feat/28`
  then hits `cannot lock ref`. Keeping `<anchor>-<slug>` in one segment
  (`kai/feat/28-progressive-onboarding`) reserves nothing, while the `kai/`
  prefix still lets CI filters and protection rules target `kai/**`.
- PR titles drop the trailing `(#N)`. It is non-functional — `Closes #N` in the
  body is what closes the issue — and on a squash-merge GitHub auto-appends the
  PR number, yielding `feat: ... (#28) (#80)`.
- Review fix: `pr-delivery` originally told agents not to maintain a CHANGELOG
  where squash-merged PR titles serve the same purpose — which contradicted
  kai's own CI-enforced release process, in the skill that
  `principal-swe-backend`, `-frontend`, `-infra`, and `director-chief-of-staff`
  now inherit while editing this very repo. It is now workspace-conditional:
  follow the repo's process, and only avoid introducing a *second* list.

## [0.30.0] - 2026-08-08

### Added

- `docs/` — the README split into five task-oriented guides plus a reference:
  [getting-started](docs/getting-started.md), [how-kai-works](docs/how-kai-works.md),
  [workspaces](docs/workspaces.md), [host-capabilities](docs/host-capabilities.md),
  `docs/reference/agents-and-skills.md`, and `docs/reference/plugin-structure.md`,
  indexed by `docs/README.md`. Every page opens with a breadcrumb and closes with
  a "Next / Related" row, so no page is reachable only by scrolling (#63).
- `scripts/generate-catalog.mjs` plus `npm run docs:generate` and
  `npm run docs:check` (wired into `npm test`). The agent/skill catalog is now
  **generated** from each agent's and skill's own shipped `description:` — the
  exact text the host reads — so the catalog cannot describe a capability the
  plugin does not declare. Grouping stays editorial in a `CATEGORIES` table, and
  coverage is enforced: a new agent or skill fails the build until it is filed
  under exactly one heading.

### Changed

- **README is a landing page, not a manual** — 1,167 lines down to ~150. It
  keeps the pitch, a route table, the CI-checked `## Status` stamp, a three-step
  first five minutes, what you actually get, and one flow diagram; everything
  else links out. Compatibility headings (`## Install`, `## Workspace`,
  `## What it ships`, `## How the agents chain`, `## Contributing`) remain and
  point at their new homes.
- `## Status` is now a version stamp plus one paragraph on the current release.
  The chained multi-release narrative it used to carry lives in this changelog,
  which was always its real home.
- `scripts/validate-plugin.mjs` scans every `docs/**/*.md` for both unresolvable
  agent references and workspace paths written without their `kai/` parent —
  the same two checks it already ran over `README.md`. Without this, extracting
  the most reference-dense prose would have silently dropped both guarantees.
  `CHANGELOG.md` stays excluded, since historical entries legitimately describe
  retired layouts.

### Fixed

- The agent/skill catalog was hand-maintained in the README, so every new agent
  needed a second, easily-forgotten edit and the prose had drifted from the
  descriptions the host actually reads.
- `workflow-self-check` audited an inventory table in `README.md` that no longer
  exists; it now checks what generation cannot — that the editorial grouping in
  `scripts/generate-catalog.mjs` still matches what each agent does.
- Five browser-driving skills pointed at a "Browser automation setup" section in
  `README.md` that had moved to `docs/getting-started.md`.
- `docs/host-capabilities.md` named `extract-learn-path` as a browser-driven
  skill; the skill is `web-content-extraction` (`extract-learn-path` is a script).

## [0.29.0] - 2026-08-08

### Added

- `examples/e2e-feature-delivery/` — a committed, CI-validated workspace showing
  one feature carried from brief to production: the architecture decision with
  its rejected options and a revisit trigger, a full handoff thread that walks
  `release-ready -> deploying -> production-verification -> shipped` without
  skipping a state, revision-bound reviews with evidence and timestamps, a
  design sign-off on the net-new UI surface, a ship record with the deploy
  handoff and production-verification result, an item correctly held at
  `in-review` pending independent verification, and an adjacent idea routed to a
  proposal instead of being built. The workspace doctor validates its structure
  on every run (#28).
- A **First five minutes** section at the top of the README: copyable commands
  and prompts for install, workspace init — in both the default spine form and
  an opt-in "materialize everything now" form — the first request, a health
  check, and the worked example, plus a "what you can ignore at first" note.
- `test/fixtures/spine-workspace/` and a doctor self-test proving a freshly
  onboarded workspace with no output lane materialized is healthy and claimable.

### Changed

- **Onboarding creates only the spine.** `workflow-workspace-init` seeds the
  manifest, `CONVENTIONS.md`, the coordination registries, the initiative index,
  and the library README — roughly ten tracked files — plus the gitignored
  `kai/personal/` lane in full, so the personal agents always find their own
  startup state. Only the two output-only lanes, `.kai/runs/<area>/` and
  `kai/library/<type>/`, are materialized on first write by the agent that
  writes into them.
- `workspace-conventions` states that an absent output lane is not a defect,
  that no agent may refuse to act because one is missing, and that the lane
  directory is created on the way to writing the first file in it.
- README explains that the layout tree is the vocabulary, not the initial
  footprint.

### Fixed

- Pre-created empty lanes could not be tracked by git, so they never survived a
  clone: a teammate received a workspace shaped differently from the one
  onboarding reported building. Materializing a lane with its first real file
  keeps the reported tree and the tracked tree the same.

## [0.28.0] - 2026-08-07

### Added

- `team-operating-rules` skill — the portable operating contract every agent
  inherits: role taxonomy and ownership boundaries, target-workspace-root
  resolution and initiative grounding, the acting-agent claim/handoff loop,
  test ownership, the truthful completion/shipping ladder, role-addressed
  communication, and the reserved `@operator` endpoint. It ships as a skill
  because a plugin's own root `AGENTS.md` is never loaded as custom
  instructions in a consumer workspace (#34).
- A single `**Inherits:**` line as the first body line of all 54 agents,
  declaring the skills that bind each role, followed by a verbatim directive to
  load them that also inlines the non-negotiables which must hold even if a
  skill is not loaded.
- Validator rules enforcing that declaration: exactly one `**Inherits:**` line
  per agent, positioned first and carrying the canonical directive; every named
  skill must exist and appear once; every agent must inherit
  `team-operating-rules`; every `director-*` / `principal-*` / `workflow-*` role
  must also inherit `workspace-conventions`; and every skill claimed by a
  profile's "Contracts you inherit" section or by inheritance prose must appear
  on the line.

### Changed

- `AGENTS.md` is scoped to contributing to the kai plugin repo itself. It keeps
  the release procedure, adds a map of where each rule now lives, and states
  why plugin-root instructions do not propagate.
- README documents how shared rules actually reach a session (the skill and the
  `Inherits:` line), how to check what a host discovered (`copilot plugins list`
  or `/skills`, with `/instructions` for the separate custom-instruction set),
  and lists `team-operating-rules` in the skills table.

### Fixed

- README no longer claims `AGENTS.md` holds "house rules carried into every
  repo". A Copilot plugin manifest has no instruction component type, and the
  host discovers custom instructions only from the user's repository root and
  working directory, `$HOME/.copilot/`, and `COPILOT_CUSTOM_INSTRUCTIONS_DIRS`.

## [0.27.0] - 2026-08-07

**The kai working corpus moves out of your repository root and under a
single visible `kai/` parent (#70).** Onboarding a repository used to
scatter four generic top-level directories — `coordination/`,
`initiatives/`, `library/`, `personal/` — across its root, where they
collide with product folders and bury kai state. The workspace now splits
on one axis: `.kai/` is the **hidden control plane** (the `manifest.json`
discovery anchor, the contract, and ignored `runs/` evidence) and the new
visible `kai/` root is the **working corpus** humans browse, search, and
edit. `.kai/` does not move, so the bootstrap sentinel every agent
resolves is unchanged. This is a **mandatory `schema_version` 2
migration**, guarded end to end: the doctor resolves roots from the
manifest instead of assuming a layout and refuses a split-brain workspace,
and the plugin validator rejects any bare-root literal in a shipped prompt.
Roster is unchanged at **54 agents and 39 skills**.

### Changed
- **Workspace layout (breaking, migration required):** `coordination/`,
  `initiatives/`, `library/`, and `personal/` now live at
  `kai/<root>/`. `.kai/` and `.kai/runs/` are unchanged. There is exactly
  one supported layout — no per-workspace layout switch and no
  compatibility aliases.
- **`workspace-conventions`:** the canonical tree re-nests the four roots
  under `kai/`, the placement model is restated as *control plane vs
  working corpus*, and the manifest schema declares `schema_version: 2`
  plus a new `corpus` root and `kai/`-prefixed root values.
- **`workspace-onboarding`:** scaffold, managed `.gitignore` block, and
  legacy detection target the new layout; a schema-1 root-level
  `personal/` stays ignored until migration completes.
- **`workspace-doctor`:** `CURRENT_SCHEMA_VERSION` is `2`, and it resolves
  `coordination/` (items and BOARD) **from the manifest roots map** rather
  than hardcoding a path, so a workspace is validated as it is actually
  laid out.
- **All 54 agents and 39 skills:** ~520 path literals across 73 files
  repointed to the `kai/` prefix in one atomic change, plus `AGENTS.md`
  and the distributed `examples/proactive-runner/` templates.

### Added
- **Schema 1 → 2 migration step** in the `workspace-onboarding` ladder:
  history-preserving moves of the four roots, manifest reconciliation,
  ignore-block reinstall, and repointing of absolute root-relative
  references recorded inside work items.
- **Split-brain guard (`workspace-doctor`):** a workspace where a retired
  bare root **holding kai marker files** and its `kai/` counterpart both
  exist is a hard error. A product's own root-level `library/` or
  `personal/` is explicitly *not* kai state and is left alone — avoiding
  that collision is the point of the move. New `splitbrain-workspace` and
  `product-collision-workspace` self-test fixtures prove both directions.
- **Bare-root literal rule (`validate-plugin`):** CI rejects any shipped
  agent, skill, `AGENTS.md`, `README.md`, or distributed `examples/` file
  that names `coordination/`, `initiatives/`, `library/`, or `personal/`
  without the `kai/` parent — one stale prompt is exactly how a workspace
  would silently fork. Deliberate legacy text must opt out explicitly with
  a `<!-- kai:allow-legacy-roots -->` region, so every exemption is a
  decision on the record; an unclosed region is itself an error.

## [0.26.0] - 2026-08-04

**Dev designs now come with diagrams, drawn from a shared, standard
vocabulary (#62).** Engineering design artifacts — the architect's
`decision.md` and the backend/frontend/infra `design.md` — described
system shape, data models, flows, and topologies in prose, with no
expectation of a picture and no common way to draw one. A new
`build-diagrams` method skill fixes both: it owns the *how* (an
ASCII-first format rule and a catalog of familiar shapes), and each
engineering agent brings the domain judgment about *which* diagram its
design needs. Roster grows to **54 agents and 39 skills**.

### Added
- **`build-diagrams` skill:** the shared diagram vocabulary for technical
  and dev-design artifacts. Format rule — **at least one diagram, ASCII
  fenced in the Markdown by default**; `mermaid` only when ASCII genuinely
  can't carry it; embedded SVG/HTML only when the artifact is itself HTML.
  Ships a standard catalog (component/boundary, sequence/flow, data-model
  ER, state machine, deployment/topology, tree/hierarchy) plus a shared
  ASCII-convention block so every team diagram reads the same. Scoped as
  the technical counterpart to `ui-mockup` (which owns UI screens).

### Changed
- **The four dev-design producers now inherit `build-diagrams`:**
  `principal-swe-architect` (component/boundary; a new `## Diagram` slot in
  the decision-record scaffold), `principal-swe-backend` (data-model /
  sequence), `principal-swe-frontend` (component tree / state), and
  `principal-swe-infra` (deployment / topology). Each carries at least one
  diagram of its central structure.

## [0.25.0] - 2026-08-04

**`learn`/`lessons` runs are now goal-first and deterministic, closing the last
run-grammar gap from #59 (#61).** These two areas were deliberately excluded from
the date-first migration because a learner's runs accrete toward one durable goal,
not a point-in-time snapshot — but their *implementations* didn't group by a
durable goal either. `learn` wrote `learn/<source-slug>/<YYYY-MM-DD-HHMM>/`, where
the slug was the auto-derived Microsoft-Learn artifact slug and **every run spawned
a fresh timestamp folder**, so studying one subject across a few paths/re-runs
scattered into unrelated, timestamp-named folders. `lessons` keyed under the agent
name and a coarse free-text `<theme>` bucket (`certifications`), so `az-204` and
`aws-saa` collided in one folder. Both now use a durable **goal slug** plus the
same order-sorted run tail as every other area. No roster change — still **54
agents and 38 skills**.

### Changed
- **Goal-keyed run grammar unified (#61):** `learn` and `lessons` now follow
  `<area>/<goal-slug>/<NN>-<flavor>-<descriptor>/` — the `<goal-slug>` is the
  durable learning goal (`learn-react`, `az-204`, `prep-for-interview-vercel`),
  reused across runs, and `<NN>` is the next index **within the goal** (highest
  existing + 1, never filling gaps). It simply swaps the date for the goal and
  keeps the universal `<NN>-<flavor>-<descriptor>` tail and run-order sort. Flavors:
  `learn` → `extract`, `lessons` → `tutor`. Updated in `workspace-conventions`
  (grammar + area registry), `web-content-extraction`, `workflow-course-to-audio`,
  `instructor-teacher`, `instructor-tutor`, `generate-html-lesson`, and
  `generate-audio`.
- **`extract-learn-path.js` writes the new shape:** it accepts an optional
  `--goal <goal-slug>` (defaulting to the source slug), computes the next `<NN>`
  by scanning the goal folder, and writes
  `.kai/runs/learn/<goal-slug>/<NN>-extract-<source-slug>/` — the timestamp folder
  is gone.
- **Cross-references move to frontmatter, not paths:** an artifact derived from
  another run (e.g. a teacher lesson built from an extraction) records a
  `produced_from:` path in its frontmatter, so the goal-first layout stays stable
  and agent-to-agent hand-off is never coupled to folder nesting. (`instructor-teacher`
  still writes its packaged `lessons/` subfolder inside the extraction run it built
  from — that parent folder is the natural cross-reference.)

## [0.24.0] - 2026-08-04

**Refreshes the pinned Lectoria build to pick up a dependency-modernization
pass — including one fix that directly affects narrated audio quality.**

Lectoria upgraded `pdf-parse` from 1.x to 2.x. Version 2 inserts a
`-- N of M --` marker between pages by default, and that text flows straight
into the generated script — meaning **every page break in a PDF lesson would
have been read aloud**. Lectoria suppresses it now, so PDF-sourced audio no
longer narrates page separators. Its PDF parser also releases the underlying
pdf.js document on every exit path, so a long batch of PDFs no longer leaks
one document per file.

This raises the Node floor: lectoria is compiled from source by `npm install`
here, and it now requires `^22.22.2 || ^24.15.0 || >=26.0.0`. That range is
declared in this plugin's `engines` and documented in the skill. No roster
change — still **54 agents and 38 skills**.

### Changed
- **Re-pinned `lectoria` to `84e4c11db31f26f9be62db67bb398e93534ff18f`**, which
  upgrades `openai` to 7.x, `jsdom` to 30.x, `zod` to 4.x, and `pdf-parse` to
  2.x, and adds the first test coverage for lectoria's PDF path.
- **Declared `engines.node` as `^22.22.2 || ^24.15.0 || >=26.0.0`** and
  documented the requirement in `skills/generate-audio/SKILL.md`, so an
  incompatible Node fails at `npm install` with a clear reason instead of a
  confusing build error.

### Fixed
- **PDF lessons no longer narrate `-- N of M --` page separators**, via the
  refreshed lectoria pin.



## [0.23.0] - 2026-08-04

**Refreshes the pinned Lectoria release and re-pins it to an exact commit.**
Lectoria shipped two reliability fixes that matter for `generate-audio`:
concurrent runs no longer duplicate paid Azure work (each document's paid work
is now locked and its checkpoint re-read inside the lock), and
`--continue-on-error` now exits non-zero when a source failed instead of
reporting success to CI. It also adds `intermedio-femenino`, the female
counterpart to the default `intermedio` voice.

Separately, the `lectoria` dependency had drifted to an **unpinned**
`github:RubenSaucedo/lectoria`, which floats to whatever that repository's
default branch happens to be at install time. It is pinned back to an exact
40-hex commit. No roster change — still **54 agents and 38 skills**.

### Added
- **`intermedio-femenino` voice for `generate-audio`:** a female host/guest pair
  matched to the pacing of the default `intermedio` preset, for lessons that
  want a different narrator without changing cadence. Accepted by
  `scripts/generate-audio.ps1 -Voice` and documented in the skill.

### Changed
- **Pinned `lectoria` to `5dba356f51c8ec9fe2e191d27fc170a917e843ad`** instead of
  tracking its default branch, so an upstream push cannot silently change what
  `npm install` builds here.
- **Picked up Lectoria's reliability fixes:** batch runs that hit an error now
  surface a failing exit code, and two `generate-audio` runs over the same
  output directory no longer pay Azure twice for the same document.


## [0.22.0] - 2026-08-03

**The design-options flow no longer accepts "option theater" for crowding
problems (#38).** `ui-mockup` required "3-4 materially different options" — but
that was satisfiable while **every option kept the same container/placement**. For
a crowding / visual-weight / context / space / discoverability problem, that means
the actually-correct answer (relocate the affordance to another surface,
progressively disclose it, or remove it) is **never generated**, and the human
picks the least-bad within-container variant. Real incident: `exercise-demo-videos`
offered 4 in-row options, all rejected — "host the demo in the existing LogModal"
only surfaced after a human re-framed it. This makes the container itself a
first-class variable in option generation. No roster change — still **54 agents and
38 skills**.

### Added
- **Container-challenge rule in `ui-mockup` (#38):** for a crowding / visual-weight
  / context / space / discoverability problem, **≥1 option must challenge the
  container/placement framing** — relocate to a **different existing surface**, use
  **progressive disclosure** into an existing modal/sheet/panel/detail view, or
  **remove** it — not merely a within-container variant. "Materially different" now
  explicitly covers a different container/placement, not only within-container
  layout. Hard rule 3 restated to match.
- **`container tunnel-vision` anti-pattern in `ui-mockup` (#38):** all options
  sharing the same container/placement assumption when the complaint is about
  crowding / context / space / discoverability is now a named anti-pattern.
- **A pre-option "challenge the framing" step for `principal-product-designer`
  (#38):** a dedicated DESIGN-workflow step (before option generation) treats any
  container/placement/host surface named in the brief as a **hypothesis, not
  authority** — it enumerates the alternative host surfaces that **already exist**
  in the app (grep the codebase per `design-grounding` for existing
  modals/sheets/panels/drawers/detail views), records why each is in or out, and
  MUST carry ≥1 relocation / progressive-disclosure / removal candidate into the
  option set for a crowding-class problem. The designer's REVIEW fork and hard rule
  9 enforce the same container challenge, so an escalated review option set never
  stays inside the surface the finding is about. This operationalizes the existing
  "treat placement as a hypothesis" principle into an actual option-generation step.

## [0.21.0] - 2026-08-03

**Net-new user-facing UI now needs designer sign-off before it can ship (#54).**
An engineering agent could author a brand-new user-facing surface — a new
component, or a changed layout/placement/prominence/flow — and reach
`release-ready` with **zero designer involvement**: every existing gate that pulls
the designer in was conditioned on a design *already* existing, so when design was
skipped entirely, nothing bounced it (QA-walk + green build satisfied the gate).
This adds a proportional **design sign-off sub-gate** to the readiness contract.
No roster change — still **54 agents and 38 skills**.

### Added
- **Design sign-off sub-gate in `definition-of-done` (#54):** for a **net-new or
  materially-changed user-facing surface**, Dim 2 (verified) + Dim 3 (reviewed)
  now require **either** an approved design artifact **plus** a
  `principal-product-designer` conformance verdict on the current `change_ref`,
  **or** a steward/operator-recorded product-design waiver bound to that
  `change_ref` (a self-declared "it's minor" is not a waiver). Absent both → **Gap
  → bounce**, owner `principal-product-designer`, message *"consult the designer
  before this is passed."* Detection is **independent** — DoD and `workflow-ship`
  decide the trigger from the surface itself, so it fires **even when no designer
  entry was ever added to `review_requirements`** (that missing entry is the
  failure, not an exemption). It stays proportional: a token-compliant copy fix or
  a like-for-like refactor doesn't trigger the sub-gate at all — no design theater.

### Changed
- **`workflow-ship` Dim 2 gate (#54):** the `in-review → release-ready` gate now
  confirms design sign-off for a net-new/materially-changed user-facing surface,
  and routes an unsigned surface to `principal-product-designer` on bounce.
- **`director-chief-of-staff` dispatch (#54):** added a catch rule so that **even
  when engineering built the surface directly** (no design routed up front), a
  net-new user-facing surface arriving at readiness with no design + conformance
  verdict (or waiver) is bounced to the designer rather than silently sequenced
  toward release.
- **`principal-swe-frontend` pre-handoff self-check (#54):** before moving
  net-new/materially-changed user-facing UI to `in-review`, the frontend engineer
  stops and routes to `principal-product-designer` when no approved design exists
  — it is the last guardrail before an unreviewed layout reaches the ship gate.

## [0.20.0] - 2026-08-03

**All run areas are now date-first, with canonical-path enforcement (#59).** The
run-folder grammar led with a **model-generated `<target-slug>`** that drifted
from run to run — so the same feature scattered across sibling slug folders and
runs were hard to find — and artifacts sometimes landed in ephemeral Copilot
session-state, a temp dir, or the caller's cwd instead of `.kai/runs/`. Every
snapshot-run area now anchors on the **date** (deterministic, never
model-generated) with a per-day sequential run index, and the canonical path is
mandatory even when a non-owning agent or a browser/stress harness (`OUT`) drives
the run. Goal- and period-keyed areas (`learn`/`lessons`, `pulse`) keep their own
grammar (learn redesign tracked in #61). No roster change — still **54 agents and
38 skills**.

### Changed
- **Universal run grammar → date-first (#59):** every snapshot-run area moves from
  `<area>/<target-slug>/<YYYY-MM-DD-HHMM>-<flavor>/` to
  `<area>/<YYYY-MM-DD>/<NN>-<flavor>-<descriptor>/`, where `<NN>` is a zero-padded
  per-day run index (highest existing + 1, never fill gaps, never reuse) so runs
  sort in the order they ran, and `<descriptor>` (work-item/epic key when present,
  else a slug) is descriptive only — **not** the grouping key. `workspace-conventions`
  now documents date-first as *the* rule, with `learn`/`lessons` (goal slug) and
  `pulse` (ISO week) named as the deliberate goal/period-keyed exceptions. Applied
  across the qa, eng, product, revenue, content, ship, incident, review, and ai
  areas — `web-evaluation`, `principal-qa-ui`, `principal-seo`,
  `principal-product-manager`, the persona evaluators, `workflow-product-explore`,
  `product-exploration`, `principal-swe-*` (architect/manager/backend/frontend/infra),
  `principal-product-strategist`, `principal-sales`, `principal-partnerships`,
  `principal-security`/`sre`/`data-*`, `workflow-doc-review`, `workflow-ship`,
  `workflow-incident-response`, `principal-ai-*`, `linkedin-content`,
  `video-direction`, `ui-mockup`, `product-marketing-intelligence`, and more.
  Library promotion mirrors the shape:
  `library/<type>/<YYYY-MM-DD>/<NN>-<flavor>-<descriptor>/`.

### Fixed
- **Canonical-path enforcement (#59):** a run's artifacts must resolve under
  `.kai/runs/<area>/`; any harness `OUT` pointing at session-state, a temp dir, or
  the caller's cwd is rejected/rewritten — enforced **even when a non-owning agent
  orchestrates the run**. This is the guard against designs, reports, and evidence
  scattering to unfindable locations.
- **Screenshot-policy contradiction:** `web-evaluation` said screenshots are
  "committed alongside reports," contradicting its own promotion rule and
  `workspace-conventions` (heavy binaries stay ignored even below `library/`).
  Resolved to the authoritative policy — screenshots are **local evidence, not
  committed**; promote the text and reference evidence by run path.

## [0.19.0] - 2026-08-03

**Document the Playwright MCP prerequisite for browser-driving agents (#40).**
Nine agents and five skills declare `tools: [..., playwright]` and drive a real
browser, but Install/Prerequisites never told you a **Playwright MCP server** must
be registered in your host — so on a fresh install every browser-driving agent was
silently inert. kai still ships no MCP servers; this documents the prerequisite and
adds a point-of-use reminder. No roster change — still **54 agents and 38 skills**.

### Added
- **README → "Browser automation setup (optional)" (#40):** an Install subsection
  listing the browser-driving agents/skills with a copy-paste `~/.copilot/mcp-config.json`
  `playwright` server block (key must be `playwright`), a `/mcp` verify step, and a
  note that the Copilot coding agent (cloud) has the Playwright MCP server enabled
  by default. Documentation-only; kai ships no MCP servers.
- **Point-of-use reminder (#40):** each of the nine browser-driving agents
  (`principal-qa-ui`, `persona-ux-first-time-user`, `persona-professional-trainer`,
  `persona-professional-nutritionist`, `principal-product-designer`,
  `principal-product-marketing`, `principal-seo`, `workflow-product-explore`,
  `workflow-course-to-audio`) and five skills (`web-evaluation`,
  `web-content-extraction`, `product-exploration`, `product-marketing-intelligence`,
  `ui-mockup`) now carries a one-line note that a `playwright` MCP server is required,
  pointing to the README subsection — surfaced only for the agents that need it.

## [0.18.0] - 2026-07-30

**Wire the house comment discipline into the code-writing agents (#39).** The
`coding-style` skill already encoded the right rule — no comments restating the
code, inline comments ≤1 line, doc blocks ≤2–3 lines — but **no agent inherited
it**, so it reached none of the agents that actually write code and they
over-commented (essay-length JSDoc rationale in source files). This wires the
skill into every code-writing agent and reinforces the rationale-goes-in-the-
artifact boundary. No roster change — still **54 agents and 38 skills**.

### Added
- **`coding-style` §4 (#39):** an explicit rule that design rationale and
  alternatives-considered (a single-pass-vs-second-pass tradeoff, why a
  dependency was or wasn't added) belong in the design/decision artifact or the
  PR/handoff description — **not** a multi-paragraph doc comment in a source
  file; a rationale comment states the non-obvious *why* in ≤1–2 lines.

### Changed
- **`principal-swe-backend`, `principal-swe-frontend`, `principal-swe-infra`,
  and `principal-ai-applied-engineer` now inherit `coding-style` (#39).** The
  three domain SWE builders and the applied-AI engineer that authors FE/BE code
  each gained the inherited-skill reference, so the comment discipline (and the
  rest of the house code style) is enforced where code is actually written.
  `principal-ai-applied-engineer`, which previously had no inherited-contract
  line, now carries one.

## [0.17.0] - 2026-07-30

**Default narration voice → `intermedio`.** The `generate-audio` wrapper now
defaults `-Voice` to **`intermedio`** (a less regionally-marked, international
Spanish read) instead of falling through to lectoria's `espana` default. Pass
`-Voice espana` or `-Voice latino` to override. No roster change — still
**54 agents and 38 skills**.

### Changed
- `scripts/generate-audio.ps1`: `-Voice` now defaults to `intermedio` (was
  unset → lectoria default `espana`).

## [0.16.0] - 2026-07-30

**Voice-preset tuning.** Refreshes the pinned `lectoria` to the release that
renames the default narration preset and retunes pacing. No roster change —
still **54 agents and 38 skills**.

### Changed
- Renamed the default voice preset **`emprendedor` → `espana`** (peninsular
  Castilian). The `generate-audio` `-Voice` set is now
  `espana | latino | intermedio`, and unset still uses lectoria's default
  (`espana`).
- Bumped the pinned `lectoria` git dependency to pick up the rename plus a
  faster **`latino`** preset (Mexican voices sped to +5%/+7% so they no longer
  feel slow next to `espana`).

## [0.15.0] - 2026-07-30

**Enforce release hygiene and dependency consistency in CI (#35).** The release
policy (bump `plugin.json` + `package.json`, add a dated changelog section,
refresh the README status stamp) was documented but CI only checked version
parity, so a behavior change could merge green with no bump, changelog, or README
update — and dependency metadata could drift (the lockfile had gone stale at a
different version and carried an unpinned view of the `lectoria` git dependency).
This wires the full policy into CI. No roster change — still **54 agents and 38
skills**.

### Added
- **Static release-hygiene checks in `validate-plugin.mjs` (#35)** (run by
  `npm test`, so they hold locally and in CI): semantic-version format; a dated
  `## [<version>]` CHANGELOG section **and** a `[<version>]:` reference link for
  the current version; a README `## Status` stamp that names the current
  `v<version>`; `package.json` ↔ `package-lock.json` agreement (declarations and
  root version); and a git-dependency allowlist that sanctions `lectoria` while
  rejecting any other git-sourced dependency or a git dep not pinned to a 40-hex
  commit SHA.
- **`scripts/release-guard.mjs` (#35)**: a CI gate that diffs a PR against its
  base and, when a behavior-sensitive path (`agents/`, `skills/`, `scripts/`,
  `plugin.json`, `package.json`, `package-lock.json`) changed, requires a version
  bump plus `CHANGELOG.md` and `README.md` updates. Docs/test-only changes are
  exempt. Its decision core is covered by a fixtureless `--self-test`.
- **`scripts/check-syntax.mjs` (#35)**: `node --check` on every shipped
  `.mjs`/`.js` helper and a PowerShell parse of `generate-audio.ps1` (skipped
  cleanly where `pwsh` is absent).
- The `validate` workflow now checks out full history (`fetch-depth: 0`) and runs
  the release-guard self-test, the syntax check, and the PR-only release-guard
  gate.

### Fixed
- Resynced `package-lock.json` (was stuck at an older version than
  `package.json`) and backfilled the missing `[0.12.0]`–`[0.14.0]` CHANGELOG
  reference links surfaced by the new checks.
- Regenerated the host-loader golden inventory snapshot
  (`test/fixtures/inventory.json`), which had gone stale when the
  `instructor-*` collection replaced the engineering teacher/tutor agents —
  `npm test` was red on `main` before this.

## [0.14.0] - 2026-07-29

**Voice presets for narrated audio.** Refreshes the pinned `lectoria` to the
release that adds named voice presets, and exposes them through the
`generate-audio` wrapper. No roster change — still **54 agents and 38 skills**.

### Added
- `scripts/generate-audio.ps1` gains a **`-Voice <preset>`** parameter
  (`emprendedor` | `latino` | `intermedio`) that selects the narrator voices +
  pace per language, passed through to `lectoria run --voice`.

### Changed
- Bumped the pinned `lectoria` git dependency to the voice-presets release. The
  default Spanish narration is now **`emprendedor`** — a warm, measured,
  peninsular-Castilian read (`es-ES-AlvaroNeural`) suited to study/learning
  content — instead of the previous single fixed voice. Run `lectoria voices`
  (at the plugin root) to list presets.

## [0.13.0] - 2026-07-29

**Lectoria wired for repo-local installs (no global install needed).** Makes the
`generate-audio` skill / instructor-* audio path work from a fresh plugin install.
No roster change — still **54 agents and 38 skills**.

### Changed
- Pin **`lectoria`** as a git dependency (`github:RubenSaucedo/lectoria`) in
  `package.json`, so a one-time `npm install` at the plugin root fetches and
  **builds** it — paired with lectoria's new `prepare` hook that compiles
  `dist/` on install. A global install is no longer required (still supported as
  a fallback).
- Fix `scripts/generate-audio.ps1` local-bin detection to work on macOS/Linux,
  not just Windows: it now checks both `node_modules/.bin/lectoria` (POSIX) and
  `lectoria.cmd` (Windows) before falling back to a global install.

### Added
- `.env.example` at the plugin root documenting the Azure Speech / OpenAI
  credentials the `generate-audio` wrapper loads from `.env`.

## [0.12.0] - 2026-07-29

Introduces the **`instructor-*` learning collection** — a subject-agnostic
teaching lane that replaces the engineering-scoped teacher/tutor. The roster is
now **54 agents and 38 skills**. Updates reach users via `/plugin update kai`.

### Added
- **`instructor-path-mentor`** — new agent that stewards a whole
  certification/learning path over time: plan, schedule against a target/exam
  date, per-objective progress, and spaced review, persisted in the workspace's
  gitignored `personal/learning/<slug>.md`. Dispatches `workflow-course-to-audio`
  (extract), `instructor-teacher` (package), and `instructor-tutor` (author a gap
  topic); never auto-runs paid audio. Executes a chosen path — career *strategy*
  (whether a cert is worth it) stays with `principal-engineer-career-mentor`.

### Changed
- **Generalized the learning agents into the `instructor-*` family.**
  `principal-engineer-tutor` → **`instructor-tutor`** (now authors concrete-first
  lessons on any subject — cert objectives, languages, finance, engineering/AI —
  not just engineering), and `principal-engineer-teacher` → **`instructor-teacher`**
  (subject-agnostic packaging of existing markdown). Pedagogy, Lectoria-friendly
  narration rules, and the audio-cost discipline are preserved.
- Retargeted every cross-reference (`principal-engineer-career-mentor`,
  `persona-self`, `principal-ai-researcher`, `generate-html-lesson`, README,
  AGENTS.md) to the new agent ids, and registered the `instructor-*` family in
  the AGENTS.md role taxonomy and personal-front-door routing.
- Extended `scripts/validate-plugin.mjs` cross-reference integrity to cover the
  `instructor-` prefix.

### Removed
- **BREAKING:** `principal-engineer-tutor` and `principal-engineer-teacher`
  agent ids — superseded by `instructor-tutor` and `instructor-teacher`. Update
  any direct invocations.

## [0.11.0] - 2026-07-29

**Coordination lifecycle + durable record schemas (#31).** Three contracts
disagreed on what `ready` meant — the steward promoted to `ready`, the director
dispatched from `ready`, and stewardship prose implied `ready` had to be
runnable — so a `ready` item with an undelivered-but-declared dependency looked
both dispatchable and not, producing non-deterministic dispatch and steward
re-promotion churn. This release fixes the contradiction (decision **A**) and
standardizes the records the lifecycle already relied on but never pinned down.
No roster change — still **53 agents and 38 skills**.

### Changed
- **`ready` means committed, not runnable (#31, decision A)**: `ready` is a
  steward commitment — scope fits, acceptance is defined, dependencies are
  *declared* — and no longer requires those dependencies to be complete. The
  director computes a derived **`executable`** predicate at dispatch (deps in
  their required state, lease-free, unblocked, touch-safe); `executable` is never
  stored on the item. A `ready` downstream item simply waits at the director; the
  steward never re-promotes it per upstream completion.
- **`change_ref` must be a git SHA (#31, decision A1)**: an item's `change_ref`
  must be a commit or PR-head SHA (7–40 hex) — the only reproducible-across-machines
  form — not a bespoke diff digest. Touch-set reconciliation derives the changed
  path set from `git show --name-only <change_ref>` plus reported untracked files.
  `workspace-doctor` now rejects a non-SHA `change_ref`.

### Added
- **RECOVERY record (#31)**: a parseable packet the grantor appends when it
  reclaims a stale lease — `reclaimed`, `stale_lease`, `observed`, `disposition`,
  `new_lease`, `state`, `next` — documenting the observed partial work and the
  fresh grant that invalidates the crashed run's token.
- **Design-waiver (WAIVER) record (#31)**: a durable structured record — `kind`,
  `grantor`, `reason`, `change_ref`, `scope`, `expires` — that replaces free-form
  design-step waivers, binds the waiver to an exact `change_ref`, and is
  referenced from the item's `completed_reviews`. Distinct from the
  definition-of-done "Waived-with-reason" release concept.
- **`director-summary` minimum scaffold (#31)**: the director summary now has a
  required section skeleton (Outcome, Milestones, Decisions, Deliverables,
  Open/deferred, What needs the operator).
- **Lifecycle fixtures (#31)**: the healthy fixture now includes a `ready`
  downstream item whose dependency is only `in-review` (proving `ready` ≠
  `executable` is healthy), the broken fixture exercises the non-SHA `change_ref`
  rejection, and the concurrency thread demonstrates the structured RECOVERY and
  WAIVER records.

## [0.10.0] - 2026-07-29

**Collision-safe lease acquisition (#30).** Coordination leases were
read-check-write-reread, which is not atomic in a markdown store: two parallel
peers could each read the same `version`, each write it back with a different
lease, and each re-read before the other's write landed — both then believed
they held the item. This release makes lease *granting* serial and lease
*holding* verifiable, and reconciles what an item actually changed against what
it claimed. No roster change — still **53 agents and 38 skills**.

### Added
- **Unique lease token bound to the item version (#30)**: the `lease` block gains
  `token` and `version_at_grant`. A held lease (non-null `holder`) must carry a
  unique grant `token` bound to the `version` it was issued against; the token
  travels in the dispatch packet and is the acting role's authority to write.
- **Verify-before-write + collision stop (#30)**: `work-coordination` requires an
  acting role to re-read and confirm its `holder`/`token`/`version` before every
  state-changing write, and to **stop before modifying product state** with a new
  `COLLISION` thread record if the grant was lost or overwritten. A re-grant
  writes a fresh token, so a resurrected stale peer fails verification and stops.
- **Concurrency fixture (#30)**: `test/fixtures/concurrency-workspace/` plus a
  `workspace-doctor` self-test case demonstrate collision detection (an
  un-tokened held lease is rejected) and stale-lease recovery (an expired but
  properly tokened lease is surfaced as a recovery signal, not silently
  reclaimed).

### Changed
- **Single-grantor protocol (#30)**: `director-chief-of-staff` is the sole lease
  grantor for a working tree — it reserves items **serially** (write lease +
  token, increment `version`, re-read to confirm) *before* launching any parallel
  peer, so two peers can never be granted the same item. `AGENTS.md` and the
  hard-rules reflect the serialized grant.
- **Touch-set reconciliation (#30)**: reconciliation now compares an item's
  **actual changed paths** (diff at `change_ref` / `git diff --name-only`)
  against its declared `touches` and reports unexplained expansion instead of
  trusting the declaration; overlap with another active item forces
  serialization.
- **Multi-machine scope made explicit (#30)**: serial granting is atomic only
  within one synchronized working tree; `work-coordination` documents the
  single-tree model and git conflict detection as the cross-tree backstop.
- **Doctor lease checks (#30)**: `workspace-doctor.mjs` now errors when a held
  lease lacks a `token` or an integer `version_at_grant`, alongside the existing
  expiry checks.

## [0.9.0] - 2026-07-28

Host-loader **acceptance** testing (#33). CI now proves not just that the source
is internally consistent, but that a Copilot host could actually *load* the
advertised inventory — and that malformed frontmatter is rejected before release,
closing the gap that let five skills ship with a shape the CLI silently drops
(#23). No roster change — still **53 agents and 38 skills**.

### Added
- **Host-loader acceptance mirror (#33)**: `scripts/host-contract.mjs` loads
  every agent/skill exactly as a host would and asserts the discoverable
  inventory — agent roster, skill roster, and the user-invocable skill surface
  (name + `argument-hint`) — matches a committed golden snapshot
  (`test/fixtures/inventory.json`), so a roster or invocation-surface change is
  explicit and reviewable in the PR. Run via `npm run host-contract`; regenerate
  the golden with `npm run host-contract:update`.
- **Malformed-frontmatter fixtures (#33)**: `test/fixtures/host-loader/invalid/`
  reproduces real load-time failure classes (the #23 `argument-hint`-as-array
  bug, a non-array `tools`, an unsupported tool, a skill-only key on an agent, a
  name/id mismatch); the mirror's `--self-test` asserts each is rejected for the
  expected reason. Wired into `.github/workflows/validate.yml` and `npm test`.
- **README quickstart drift guard (#33)**: the mirror asserts the README status
  stamp (`**N agents and M skills**`) equals the live loadable inventory and that
  every `npm run <script>` the README documents exists in `package.json`.

### Changed
- **Shared loader contract (#33)**: the host-loader parsing rules (frontmatter
  parse, tool allowlist, `argument-hint`/`user-invocable` shape, skill-only-key
  separation) moved to `scripts/lib/loader-contract.mjs`, imported by both
  `validate-plugin.mjs` and `host-contract.mjs` so the validator and the
  acceptance mirror can never drift.
- **Docs (#33)**: `test/README.md` documents the new host-loader acceptance layer
  and reframes the remaining live-host work as the #33 follow-up; README
  Contributing/release steps run `npm test` (all three guards).

## [0.8.0] - 2026-07-28

Workspace **schema versioning** and a dependency-light **workspace doctor**
(#27). A generated workspace now declares its contract version independently of
the plugin build, upgrades follow a deterministic migration ladder, and a
read-only validator gates whether coordinated agents may claim work — so a
workspace produced by an older plugin can no longer silently drift out of
contract. No roster change — still **53 agents and 38 skills**.

### Added
- **`schema_version` in the workspace manifest (#27)**: `.kai/manifest.json`
  carries a `schema_version` integer (currently `1`) separate from the plugin
  `version` stamp. `workspace-conventions` documents the version-vs-schema
  distinction and the post-update flow; the contract validator requires it in
  the manifest and fixture.
- **Schema-version migration ladder (#27)**: `workspace-onboarding` defines an
  append-only ladder (baseline `1`, `→ 1` from a pre-schema workspace) so each
  future contract change ships a discrete, idempotent migration step.
- **Claim-time schema gate (#27)**: `work-coordination` adds a step-0
  compatibility + doctor check to "Claiming work safely"; agents refuse to claim
  work in an incompatible or unmigrated workspace.
- **`scripts/workspace-doctor.mjs` (#27)**: a dependency-free (Node built-ins
  only) validator for a *consumer* workspace — manifest schema and
  `schema_version` compatibility (emitting the migration plan when behind), item
  `type`/`id`/lifecycle state, `change_ref`-bound review states, typed
  dependencies and cycle detection, lease shape/expiry, durable-path
  containment, and `BOARD.md` drift. Run via `npm run doctor` (`--root <dir>`,
  default cwd); errors block, warnings (stale lease, board drift) don't.
- **Doctor self-test in CI (#27)**: `npm run doctor:self-test`
  (`--self-test`) asserts committed golden fixtures — a healthy
  `test/fixtures/repo-workspace/` and a `test/fixtures/broken-workspace/` that
  must be rejected (pre-schema manifest, `in-review` item without `change_ref`,
  dangling dependency, machine-absolute `artifact_target`). Wired into
  `.github/workflows/validate.yml` and `npm test`.

### Changed
- **Contract validator (#27)**: the fixture-manifest check now requires an
  integer `schema_version`.
- **Docs (#27)**: README gains an "Upgrading a workspace after a plugin update"
  section and `test/README.md` separates deterministic (CI), host-backed
  (tracked in #33), and manual-only coverage.

## [0.7.1] - 2026-07-28

Audit remediation for the four P0 findings (#23, #24, #25, #26): the contract
validator now catches the frontmatter shape that the Copilot CLI rejects,
shipped scripts and prompts no longer hard-code an author's checkout, run-area
usage is enforced against the registry, and the README documents where CLI and
cloud hosts differ. No roster change — still **53 agents and 38 skills**.

### Fixed
- **`argument-hint` frontmatter (#23)**: five user-invocable skills
  (`coding-style`, `generate-audio`, `onboard-to-codebase`, `pr-sizing`,
  `research-before-coding`) declared `argument-hint` as an inline array, which
  the Copilot CLI silently rejects at load. They are now quoted scalars.
- **Author-machine paths (#24)**: `generate-audio.ps1`, `extract-learn-path.js`,
  and the six prompts that call them no longer embed `C:\src\kai\…` /
  `C:\src\ketzal-swe\…`. Prompts reference a portable `<kai-plugin>/scripts/…`
  path; the extractor now writes to the caller's `.kai/runs/learn/<slug>/<run>/`
  (not the retired `.ketzal-learn/`), defaults to Playwright's bundled Chromium
  (override via `LEARN_BROWSER_CHANNEL`), and drops the stale
  `npm run generate-audio` recommendation.

### Changed
- **Contract validator (#23, #26)**: the hand-rolled frontmatter parser now
  reads hyphenated keys (`argument-hint`, `user-invocable`, `allowed-tools`),
  rejects an array-shaped `argument-hint`, validates `user-invocable` as a
  boolean, separates agent vs. skill schemas (skill-only keys are invalid on an
  agent), and scans every agent/skill for concrete `.kai/runs/<area>/` literals,
  failing any area not in the manifest registry.
- **Self-check output (#26)**: `workflow-self-check` writes under the registered
  `review/` area (`.kai/runs/review/kai/<date>-self-check/report.md`) instead of
  the unregistered `.kai/runs/self-check/`.
- **Host-capability docs (#25)**: the README adds a CLI-vs-cloud capability
  matrix and stops implying feature parity; `web-evaluation` notes the
  localhost-reachability boundary and fails fast when the host can't reach the
  target.

## [0.7.0] - 2026-07-28

Kai's Enablement & Operations phase closes the remaining go-to-market and
operations gaps with seven roles spanning documentation, revenue operations,
demand generation, partnerships, localization, data engineering, and brand. The
roster now contains **53 agents and 38 skills**.

### Added
- **Technical-writer principal**: `principal-technical-writer` owns product and
  developer documentation — doc plans, how-tos, references, concept guides,
  release notes, and doc audits. Grounds every instruction in shipped behavior;
  routes product scope to the PM, ground truth to engineering, UX copy to the
  designer, and claims to marketing. Never invents a capability, ships an
  unverified instruction, or publishes without operator approval.
- **Revenue-operations principal**: `principal-revenue-operations` owns the SaaS
  metric model (MRR/ARR, churn, NRR, CAC, LTV, magic number), forecast
  operations, pipeline hygiene, billing operations, and comp/territory structure.
  Routes metric validity to analytics, price to pricing, per-deal to sales, and
  financial decisions to the operator; preserves analytics causal status. Never
  touches a live billing system or invents a metric result.
- **Demand-generation principal**: `principal-demand-generation` owns campaign
  strategy, campaign briefs, lifecycle/nurture email programs, channel mix, and
  lead-handoff (MQL/SQL) definitions. Inherits `content-grounding`; routes
  positioning and claims to marketing, PLG lifecycle to growth, channel content to
  the content agents, and measurement to analytics. Never fabricates leads or
  metrics, ships an unbacked claim, spends, or sends.
- **Partnerships principal**: `principal-partnerships` owns partner strategy,
  partner-fit assessment, integration-partnership design, channel/reseller
  programs, and co-sell/co-marketing framing. Routes customer deals to sales,
  feasibility to the solutions architect, economics to pricing/revops, and
  agreements to the operator and counsel. Never signs, commits revenue share,
  promises an unbuilt integration, or contacts a real partner.
- **Localization workflow**: `workflow-localization` runs a bounded i18n-readiness
  and locale-QA procedure — audits externalized strings, formatting,
  pluralization, RTL, and encoding; assesses locale readiness; routes translation
  to translators/services; and QAs a localized build. Never translates content,
  edits product code, or publishes a localized build.
- **Data-engineer principal**: `principal-data-engineer` owns data-pipeline and
  data-shape engineering — ingestion/ELT design, warehouse/lakehouse modeling,
  data contracts, event-instrumentation specs, and pipeline-layer data quality and
  lineage. Routes metric meaning to analytics, provisioning to infra, and
  PII/retention to privacy-compliance. Never pulls real production data or PII into
  the workspace, deploys a pipeline, or defines what a business metric means.
- **Brand-designer principal**: `principal-brand-designer` owns visual brand
  identity — logo/color/typography/iconography systems, brand guidelines, and
  visual-asset direction and critique. Grounds work in the app's design system,
  presents load-bearing directions as human-confirmable option boards, and routes
  interaction to the product designer and claims to marketing. Never implements
  UI, originates a product claim, or imitates a protected mark.

### Changed
- Added canonical initiative artifact lanes `docs/`, `revops/`, `campaigns/`,
  `partnerships/`, `localization/`, `data-engineering/`, and `brand/`, kept in
  parity across `workspace-conventions`, `workflow-initiative-init`, and
  `work-coordination`. Registered the new run-area flavors (`docs`, `localization`,
  `brand` under `product`; `data-eng` under `eng`; `revops`, `partnerships` under
  `revenue`; `demand-gen` under `content`).
- Extended the role taxonomy in `AGENTS.md`, `director-chief-of-staff`, and the
  README (status stamp, agent tables, trigger table) for the seven new roles, and
  added reciprocal seam bullets to `principal-data-analytics`,
  `principal-product-marketing`, `principal-pricing-monetization`,
  `principal-sales`, `principal-growth`, and `principal-product-designer`.

## [0.6.0] - 2026-07-27

Kai's Revenue phase adds pre-sale go-to-market judgment: deal execution and
technical solution fit. The roster now contains **46 agents and 38 skills**.

### Added
- **Sales principal**: `principal-sales` owns pre-sale deal qualification,
  discovery, deal strategy and competitive positioning, objection handling,
  proposal structure, forecast/pipeline hygiene, and win/loss synthesis. Applies
  approved pricing/discount policy and escalates exceptions; keeps prospect PII
  and deal terms local. Never fabricates pipeline, promises capability or dates,
  sets price, asserts technical fit, contacts real prospects, or accepts
  contracts.
- **Solutions-architect principal**: `principal-solutions-architect` owns
  pre-sale technical discovery, requirement-to-capability fit, integration
  feasibility, POC/pilot scope with exit criteria, technical objection handling,
  and security/compliance questionnaire drafts. Grounds fit in shipped capability;
  routes gaps to the PM and attestations to the security/privacy owners. Never
  invents capability, commits roadmap or dates, certifies compliance, prices,
  implements, or touches a customer's live systems or data.

### Changed
- Added a dedicated `revenue` run area (flavors `sales`, `solutions-architect`)
  and canonical initiative artifact lanes `sales/` and `solutions/`, keeping
  sensitive pre-sale deal and prospect data separate from post-sale `product` and
  technical `eng` work.
- Reciprocal routing updated across the Chief of Staff and AGENTS taxonomy:
  sales applies pricing's discount policy and escalates exceptions; the solutions
  architect routes questionnaire claims to security/privacy-compliance for
  confirmation and capability gaps to the PM; customer-success takes the post-sale
  handoff at close; and product-marketing supplies claim-safe positioning to both
  revenue roles.

## [0.5.0] - 2026-07-27

Kai's Expansion phase adds monetization, privacy/compliance, feedback synthesis,
and independent experiment-integrity review. The roster now contains **44 agents
and 38 skills**.

### Added
- **Pricing & monetization principal**: `principal-pricing-monetization` owns
  pricing models, packaging/tiering, price-change and migration design,
  discount/deal-desk policy, willingness-to-pay analysis, and monetization
  experiments. Preserves analytics causal status; never changes a live
  price/quote/billing system, drafts contracts, or uses deceptive or
  discriminatory pricing.
- **Privacy & compliance principal**: `principal-privacy-compliance` owns DPIAs,
  data inventories and lawful-basis maps, data-subject-rights process design,
  consent/retention/notice policy, framework-mapped reviews, and breach-obligation
  analysis. Not legal advice; never ingests real personal data, files, notifies,
  certifies, or accepts legal risk.
- **Customer-feedback synthesis workflow**: `workflow-customer-feedback` turns
  solicited feedback (surveys, NPS/CSAT, reviews, interviews, feature requests)
  into de-identified themes with grounded denominators and representativeness
  caveats, routed to product/CS/growth/pricing/marketing owners.
- **Experiment-integrity gate**: `workflow-experiment-review` independently
  certifies experiment design and readout integrity (pre-registration, power,
  SRM, exposure, peeking, multiplicity, guardrails, causal-status) against the
  exact analysis revision.

### Changed
- Reused the `product` and `eng` run areas with new `pricing`, `feedback`,
  `experiment-review`, and `compliance` flavors, and added canonical initiative
  lanes for pricing, feedback, experiments, and compliance.
- Registered `privacy-compliance` and `experiment-integrity` as revision-bound
  `review_requirements` in `definition-of-done`.
- Growth now routes pricing to the monetization owner and gates Scale decisions
  through experiment-integrity; security routes legal/compliance to the privacy
  owner; support-triage and customer-success route pricing and solicited feedback
  to their new owners; directors and AGENTS taxonomy reflect the new seams.

## [0.4.0] - 2026-07-27

Kai's Core SaaS operating team is complete. The roster now contains **40 agents
and 38 skills**.

### Added
- **Support triage workflow**: `workflow-support-triage` screens incident and
  security candidates first, classifies/deduplicates supplied tickets, assigns
  impact-based urgency, and routes each item without replying, resolving, or
  leaking account material.
- **Growth and decision analytics principals**: `principal-growth` owns bounded
  lifecycle hypotheses and readout recommendations;
  `principal-data-analytics` owns metric contracts, data quality, uncertainty,
  causal-status labels, supplied-data analysis, and instrumentation gaps.
- **Security, SRE, and incident command**: `principal-security` owns defensive
  threat/control judgment, `principal-sre` owns reliability/readiness evidence,
  and `workflow-incident-response` coordinates one SEV/timeline with real domain
  leads and human-executed action packets.

### Changed
- Added dedicated `support` and `incident` raw-run areas plus canonical
  initiative lanes for support, growth, analytics, security, reliability, and
  sanitized incident records.
- Director, PM, product/customer, engineering, QA, ship, DoD, and review
  contracts now preserve the new ownership seams and revision-bound
  security/SRE evidence.
- Active incident command may create a priority-zero knowledge item directly,
  but remediation and follow-up scope still follow normal stewardship and ship
  gates.

## [0.3.0] - 2026-07-24

Kai's SaaS operating team gains its first customer-operations principal. The
roster now contains **34 agents and 38 skills**.

### Added
- **Customer success principal**: `principal-customer-success` owns post-sale
  customer outcomes, success/adoption plans, evidence-based account health,
  churn/renewal risk, QBR/renewal briefs, and portfolio patterns. Account data is
  local by default; product gaps are de-identified and routed to the PM; pricing,
  contracts, promises, support resolution, and outbound communication remain
  outside the role.

### Changed
- The `product` run-area registry now includes the `customer-success` flavor,
  de-identified product signals have a canonical
  `artifacts/customer-success/<item-id>.md` target, and the PM/director routing
  contracts explicitly preserve the customer success -> product-scope boundary.
- The contract validator now prevents initiative artifact directories from
  drifting between workspace conventions and initiative scaffolding.

## [0.2.0] - 2026-07-23

First feature release since the initial scaffold. The roster grew to **33 agents
and 38 skills**, adding a product→content pipeline, CI safety nets, a richer
personal-assistant lane, and design tooling. Updates reach users via
`/plugin update kai` (or a new session) — the plugin loads from the repo, so no
version pin is required.

### Added
- **Design-system grounding + human-confirmable mockups** for
  `principal-product-designer`: the `design-grounding` and `ui-mockup` skills
  (offline HTML/ASCII option mockups behind an `ask_user` confirmation gate),
  the designer↔frontend seam, and a neutral design-system extraction mode for
  `workflow-product-explore`. (#20)
- **Proactive runtime contract**: the `proactive-scan` skill,
  `workflow-proactive-scan`, and an external-runner template — an honest
  two-phase scan/ack model (kai emits, your runner delivers). (#17)
- **Personal task lifecycle + privacy**: `personal-agenda` gains
  proposed/open/waiting/snoozed/done states with recurrence, dedup, and
  least-privilege field sharing. (#16)
- **Creative video director**: `principal-video-director` + `video-direction`,
  plus the shared `content-grounding` claim-safety contract. (#14)
- **LinkedIn content strategist**: `principal-linkedin-strategist` +
  `linkedin-content`. (#13)
- **Product marketing intelligence**: `principal-product-marketing` +
  `product-marketing-intelligence`, emitting a typed, grounded
  `product_context.json`. (#12)
- **Personal-assistant front door**: the executive-assistant lane — decision
  briefs, peer consultations, and a forward agenda. (#7)
- **Plugin contract tests**: `scripts/validate-plugin.mjs` gains a host-tool
  allowlist, contract-consistency drift detectors, and a fixture manifest, all
  run in CI. (#15)
- **Plugin contract validator** and the initial `npm run validate` structural
  check wired into CI. (#6)
- **Scope discipline**: the `scope-discipline` classify-before-adopt gate. (#5)

### Changed
- **Workspace migration completeness**: `workspace-onboarding` reconciles the
  manifest schema and names legacy destinations so old-architecture workspaces
  upgrade cleanly and idempotently. (#18)

### Removed
- Retired the multi-"pal" workspace model in favor of a single plugin that
  scaffolds its own workspace anywhere — including inside another repo.

## [0.1.0] - 2026-06-28

### Added
- Initial open-source release: the kai Copilot plugin scaffold — senior-engineer
  principals (frontend / backend / infra / architect / manager), reviewer
  personas and `review-*` lenses, a fan-out `workflow-doc-review`, learning and
  web-evaluation tracks, and the `workspace-conventions` + `workflow-workspace-init`
  workspace contract.

[0.52.0]: https://github.com/RubenSaucedo/kai/compare/v0.51.0...v0.52.0
[0.51.0]: https://github.com/RubenSaucedo/kai/compare/v0.50.0...v0.51.0
[0.50.0]: https://github.com/RubenSaucedo/kai/compare/v0.49.3...v0.50.0
[0.49.3]: https://github.com/RubenSaucedo/kai/compare/v0.49.2...v0.49.3
[0.49.2]: https://github.com/RubenSaucedo/kai/compare/v0.49.1...v0.49.2
[0.49.1]: https://github.com/RubenSaucedo/kai/compare/v0.49.0...v0.49.1
[0.49.0]: https://github.com/RubenSaucedo/kai/compare/v0.48.1...v0.49.0
[0.48.1]: https://github.com/RubenSaucedo/kai/compare/v0.48.0...v0.48.1
[0.48.0]: https://github.com/RubenSaucedo/kai/compare/v0.47.0...v0.48.0
[0.47.0]: https://github.com/RubenSaucedo/kai/compare/v0.46.0...v0.47.0
[0.46.0]: https://github.com/RubenSaucedo/kai/compare/v0.45.1...v0.46.0
[0.45.1]: https://github.com/RubenSaucedo/kai/compare/v0.45.0...v0.45.1
[0.45.0]: https://github.com/RubenSaucedo/kai/compare/v0.44.1...v0.45.0
[0.44.1]: https://github.com/RubenSaucedo/kai/compare/v0.44.0...v0.44.1
[0.44.0]: https://github.com/RubenSaucedo/kai/compare/v0.43.0...v0.44.0
[0.43.0]: https://github.com/RubenSaucedo/kai/compare/v0.42.0...v0.43.0
[0.42.0]: https://github.com/RubenSaucedo/kai/compare/v0.41.0...v0.42.0
[0.41.0]: https://github.com/RubenSaucedo/kai/compare/v0.40.0...v0.41.0
[0.40.0]: https://github.com/RubenSaucedo/kai/compare/v0.39.0...v0.40.0
[0.39.0]: https://github.com/RubenSaucedo/kai/compare/v0.38.0...v0.39.0
[0.38.0]: https://github.com/RubenSaucedo/kai/compare/v0.37.0...v0.38.0
[0.37.0]: https://github.com/RubenSaucedo/kai/compare/v0.36.0...v0.37.0
[0.36.0]: https://github.com/RubenSaucedo/kai/compare/v0.35.0...v0.36.0
[0.35.0]: https://github.com/RubenSaucedo/kai/compare/v0.34.0...v0.35.0
[0.34.0]: https://github.com/RubenSaucedo/kai/compare/v0.33.0...v0.34.0
[0.33.0]: https://github.com/RubenSaucedo/kai/compare/v0.32.0...v0.33.0
[0.32.0]: https://github.com/RubenSaucedo/kai/compare/v0.31.0...v0.32.0
[0.31.0]: https://github.com/RubenSaucedo/kai/compare/v0.30.0...v0.31.0
[0.30.0]: https://github.com/RubenSaucedo/kai/compare/v0.29.0...v0.30.0
[0.29.0]: https://github.com/RubenSaucedo/kai/compare/v0.28.0...v0.29.0
[0.28.0]: https://github.com/RubenSaucedo/kai/compare/v0.27.0...v0.28.0
[0.27.0]: https://github.com/RubenSaucedo/kai/compare/v0.26.0...v0.27.0
[0.26.0]: https://github.com/RubenSaucedo/kai/compare/v0.25.0...v0.26.0
[0.25.0]: https://github.com/RubenSaucedo/kai/compare/v0.24.0...v0.25.0
[0.24.0]: https://github.com/RubenSaucedo/kai/compare/v0.23.0...v0.24.0
[0.23.0]: https://github.com/RubenSaucedo/kai/compare/v0.22.0...v0.23.0
[0.22.0]: https://github.com/RubenSaucedo/kai/compare/v0.21.0...v0.22.0
[0.21.0]: https://github.com/RubenSaucedo/kai/compare/v0.20.0...v0.21.0
[0.20.0]: https://github.com/RubenSaucedo/kai/compare/v0.19.0...v0.20.0
[0.19.0]: https://github.com/RubenSaucedo/kai/compare/v0.18.0...v0.19.0
[0.18.0]: https://github.com/RubenSaucedo/kai/compare/v0.17.0...v0.18.0
[0.17.0]: https://github.com/RubenSaucedo/kai/compare/v0.16.0...v0.17.0
[0.16.0]: https://github.com/RubenSaucedo/kai/compare/v0.15.0...v0.16.0
[0.15.0]: https://github.com/RubenSaucedo/kai/compare/v0.14.0...v0.15.0
[0.14.0]: https://github.com/RubenSaucedo/kai/compare/v0.13.0...v0.14.0
[0.13.0]: https://github.com/RubenSaucedo/kai/compare/v0.12.0...v0.13.0
[0.12.0]: https://github.com/RubenSaucedo/kai/compare/v0.11.0...v0.12.0
[0.11.0]: https://github.com/RubenSaucedo/kai/compare/v0.10.0...v0.11.0
[0.10.0]: https://github.com/RubenSaucedo/kai/compare/v0.9.0...v0.10.0
[0.9.0]: https://github.com/RubenSaucedo/kai/compare/v0.8.0...v0.9.0
[0.8.0]: https://github.com/RubenSaucedo/kai/compare/v0.7.1...v0.8.0
[0.7.1]: https://github.com/RubenSaucedo/kai/compare/v0.7.0...v0.7.1
[0.7.0]: https://github.com/RubenSaucedo/kai/compare/v0.6.0...v0.7.0
[0.6.0]: https://github.com/RubenSaucedo/kai/compare/v0.5.0...v0.6.0
[0.5.0]: https://github.com/RubenSaucedo/kai/compare/v0.4.0...v0.5.0
[0.4.0]: https://github.com/RubenSaucedo/kai/compare/v0.3.0...v0.4.0
[0.3.0]: https://github.com/RubenSaucedo/kai/compare/v0.2.0...v0.3.0
[0.2.0]: https://github.com/RubenSaucedo/kai/releases/tag/v0.2.0
[0.1.0]: https://github.com/RubenSaucedo/kai/commit/d85cf51
