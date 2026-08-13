---
name: extract-writing-style
description: "Extracts the user's writing style from past messages and writes the current Kai workspace's portable profile to `kai/personal/identity/voice.md`. Designed for persona-self to consume on every draft. Run initially and when voice drifts; idempotently preserves manual_overrides. Privacy-first and gitignored."
tools: [bash, shell, view, edit, ask_user, session_store_sql]
---

# Extract Writing Style

This skill builds the **portable writing-style profile** that the
`persona-self` agent consumes when drafting messages, posts, emails,
docs, and PRs in the user's voice with a senior-engineer overlay.

The skill does the **expensive analysis once** so the agent can do
the **cheap drafting many times** without re-deriving voice on every
invocation.

## When to apply

- The user is setting up `persona-self` for the first time and has no
  profile yet.
- The user feels their voice has drifted (adopted new vocabulary,
  shifted role, learned new patterns) and wants the profile refreshed.
- The user wants to add a new corpus source (GitHub history, Slack
  export, pasted samples) to an existing profile.

**Skip for:**

- Drafting a single message — that's the `persona-self` agent's job;
  it loads the existing profile and writes. Don't re-extract for one
  draft.
- Simulating someone other than the user. This skill is for the
  user's own voice; impersonating other humans is off-scope.

## What this skill produces

A single file: `kai/personal/identity/voice.md`.

The folder is gitignored by default (see Privacy below). The profile
is plain markdown with YAML frontmatter — inspectable, hand-editable,
portable across LLMs and agent runtimes.

### Profile shape

```markdown
---
name: persona-self
display_name: <user's display name, if known>
language_primary: <en | es | en+es | …>
last_extracted: <YYYY-MM-DD>
sources:
  - kind: session-store
    range: <YYYY-MM-DD..YYYY-MM-DD>
    sample_count: <number of user turns analyzed>
    word_count: <approx word count>
  - kind: github-comments
    range: <YYYY-MM-DD..YYYY-MM-DD>
    sample_count: <number>
  - kind: pasted-samples
    files: ["<filename>", …]
attributes:
  # IMPORTANT: every prose attribute value MUST use the `|` block-scalar
  # style. Writing-style descriptions naturally include colons, double
  # quotes, em dashes, asterisks, and other YAML-significant characters
  # (e.g. "With humans: adds warmth" — that colon-space breaks single-
  # line YAML parsing). Block scalars are immune. Single-line plain
  # scalars are ONLY safe for enumerated values (short | medium | long)
  # or pure numbers / percentages with no punctuation.
  tone: |
    <Multi-line prose description of overall tone. Use this block style
    even for short values to be safe.>
  formality: |
    <Multi-line prose description. May describe per-register variation
    if the user has distinct formal vs informal modes.>
  sentence_length: mixed-short-medium   # plain scalar OK for enumerated values
  contractions: often                   # plain scalar OK for enumerated values
  hedging: |
    <Block scalar — descriptions of hedging often contain quoted phrases
    like "I think" / "I'd say" which are unsafe in plain scalars.>
  emphasis: |
    <Block scalar — emphasis descriptions often contain ALL-CAPS examples
    in quotes which are unsafe in plain scalars.>
  punctuation_tics:
    - em dashes for parenthetical asides       # short list items can be plain
    - frequent comma-spliced clauses           # but avoid embedded `: ` or unbalanced quotes
    - rarely uses semicolons
  code_switching: |
    <Block scalar — code-switching descriptions reference multiple
    languages and quoted words, always use block style.>
  capitalization: |
    <Block scalar — capitalization descriptions often contain quoted
    examples ("Hi <Name>") which are unsafe in plain scalars.>
manual_overrides: |
  <Free-form block. The user can write rules here that override the
  extracted attributes. The skill preserves this block verbatim on
  re-runs and the agent applies it after the attributes.>
---

# <Display name>'s writing voice

<One-paragraph prose description of the voice as a whole.>

## Vocabulary signals

### Favored words and phrases
- <word/phrase> — <how it's used>
- <word/phrase> — <how it's used>

### Avoided / never-used
- <word/phrase> — <if there's a pattern of avoidance>

### Bilingual / code-switching patterns
<Prose paragraph if EN↔ES or other code-switching is part of voice.
What contexts trigger ES words mid-EN sentence? Specific tics?>

## Sentence shape

<Prose: typical sentence length, how the user opens sentences, how
they end them, how questions are phrased.>

## Hedging and decisiveness

<How the user signals certainty vs uncertainty. Does "I think" mean
weak conviction or polite directness? When are they decisive vs
exploratory?>

## Greeting and sign-off patterns

<Openers, closers, sign-offs by context.>

## Punctuation and emphasis tics

<Specific markers — em dashes, parentheticals, exclamation use,
ellipses, emphasis via caps or italics, etc.>

## Decisiveness markers (preserve these)

<Phrases or patterns that signal the user is settled on a position —
these MUST survive any rewrite. List 3-7 concrete examples.>

## Dos and don'ts for the ghostwriter

### Do
- <Concrete rule, e.g. "Keep em dashes for parenthetical asides">
- <Concrete rule>

### Don't
- <Concrete rule, e.g. "Don't flatten 'lets do' to 'let us do' in casual chat">
- <Concrete rule>

## Verbatim samples (5-10 anchors)

> <Verbatim quote from the user's own writing, 1-3 sentences. No
> redaction. These are the ground truth anchors the agent uses for
> style matching.>

> <Another sample>

> <…>

## Extraction notes

<Brief: what sources were used, what was filtered out, any caveats
about coverage gaps or low-signal areas. This is for the user, not
for the agent's drafting.>
```

## Sources (in priority order)

### 1. Session store (primary, always available)

Query `session_store_sql.turns.user_message` over the last 90 days
(or a wider window if needed for coverage). This is the highest-
signal source because:

- It's the user's own first-person professional-conversational
  writing.
- It captures real working voice across many contexts (planning,
  pushback, asking for help, evaluating proposals, deciding).
- The volume is high (tens of thousands of words for an active user).

Filter rules:

- Only `user_message IS NOT NULL`.
- Only `length(user_message) > 50` — drops noise like "ok", "yes",
  one-word responses.
- Sample broadly across time and sessions; don't concentrate on a
  single thread.
- Skip any `user_message` that's pasted error logs, code blocks, or
  command output (heuristic: high non-prose-character ratio).

### 2. GitHub PR/issue comments (secondary, when `gh` available)

If the user has the `gh` CLI authenticated and is on a machine with
network access, optionally pull:

- `gh pr list --author @me --state all --limit 50 --json title,body`
- `gh issue list --author @me --state all --limit 50 --json title,body`
- For each: `gh pr view <num> --comments` to capture comment-thread
  voice (longer, more deliberate writing than chat).

This catches the user's voice in **more deliberate written contexts**
than chat — useful for the polished-overlay calibration.

### 3. Pasted samples (tertiary, user-provided)

If the user pastes specific samples (a blog post, a published doc,
a Slack thread they copied), include them as
`kind: pasted-samples`. Useful for:

- Establishing voice in a context the other sources don't cover
  (e.g., public-facing posts vs internal chat).
- Capturing voice from before the session-store history begins.

## What to extract

Beyond raw samples, the skill should derive:

- **Sentence length distribution** — compute median, p75, p95 from
  the corpus. Map to the `sentence_length:` attribute.
- **Contraction frequency** — count `don't`, `can't`, `won't`,
  `I'm`, etc. vs their expanded forms. Map to `contractions:`.
- **Hedging frequency** — count "I think", "maybe", "perhaps",
  "kinda", "sort of", "I guess". Map to `hedging:`.
- **Em-dash and parenthetical usage** — count and characterize.
- **Question patterns** — does the user ask "right?", "what do you
  think?", "make sense?" at the end of paragraphs? Note specific
  tics.
- **Code-switching events** — count and characterize Spanish words
  in English-dominant sentences (or vice versa). Note specific
  contexts ("lets", "okay", domain vocabulary).
- **Capitalization patterns** — count sentence-case starts vs all-
  lowercase starts. Note which contexts trigger which.
- **Favored vocabulary** — words/phrases that appear in the user's
  writing notably more often than in a generic English baseline.
  Don't include common words; focus on distinctive ones.
- **Decisiveness markers** — phrases that signal a settled
  position. "I think we should X" vs "what do you think about X?"
  vs "lets do X" — name the patterns the user uses.

## Workflow

### 1. Resolve the workspace and confirm scope

Resolve the current Kai workspace root through `workspace-conventions` and its
`.kai/manifest.json` sentinel. The output path is the absolute
`<workspace-root>/kai/personal/identity/voice.md`; never resolve it from an
incidental or nested cwd. If the workspace is not initialized, route to
`workflow-workspace-init`. Also route there when required personal paths are
missing or when legacy `.persona-self/`, `.kai/local.json`, or manifest
`workspace_kind` state is unresolved. This skill never scaffolds or migrates
workspace structure itself.

If a profile already exists at `kai/personal/identity/voice.md`:

- Read it. If its frontmatter says `status: stub`, treat it as no profile.
- Otherwise note the `last_extracted` date and existing sources.
- Ask the user: refresh fully (re-extract everything), incremental
  (only new data since `last_extracted`), or add a new source to
  the existing profile?
- Always preserve the `manual_overrides:` block verbatim.

If no profile exists:

- Confirm the sources to use (session-store always; GitHub if
  `gh` available; pasted samples if the user has them).
- Confirm the user's display name and primary language(s) — these
  go into the frontmatter.

### 2. Pull the workspace-scoped corpus

For session-store, first identify sessions whose `cwd` is the resolved workspace
root or a descendant, or whose `repository` matches the current repository.
Then query turns only for those session IDs and the requested time window.
Never scan all recent turns by default.

```sql
WITH scoped_sessions AS (
  SELECT id
  FROM sessions
  WHERE created_at > now() - INTERVAL '90 days'
    AND (
      lower(COALESCE(cwd, '')) = '<normalized-absolute-workspace-root>'
      OR starts_with(
        lower(COALESCE(cwd, '')),
        '<normalized-absolute-workspace-root><separator>'
      )
      OR lower(COALESCE(repository, '')) = '<normalized-current-repository>'
    )
)
SELECT t.user_message, t.timestamp
FROM turns t
WHERE t.session_id IN (SELECT id FROM scoped_sessions)
  AND t.user_message IS NOT NULL
  AND length(t.user_message) > 50
  AND t.timestamp > now() - INTERVAL '90 days'
ORDER BY t.timestamp DESC
```

Normalize path separators/case for the host before comparing. Guard nullable
`cwd` and `repository` values. If the scoped corpus is too small, ask before
including named additional workspaces or broader session history; record that
consent and every included workspace in `sources:`.

Cap the corpus at ~50K-100K words. More than that is diminishing
returns and slows analysis. If the corpus is larger, sample randomly
across time buckets rather than truncating chronologically.

For GitHub, default to the current repository:

- Use `gh pr list --repo <owner/repo> --author @me ...` and the equivalent
  issue/comment commands. Capture title + body + any
  comments authored by the user.
- Ask before adding another repository.

For pasted samples:

- Read the files the user pointed at. No transformation; preserve
  verbatim.

### 3. Filter and clean

Drop:

- Pasted code blocks (detected by triple-backtick fences).
- Pasted error logs (heuristic: high ratio of non-alpha characters,
  stack-trace patterns).
- URLs and file paths inline — the user's surrounding prose is the
  signal; the path itself isn't.
- Quoted text the user copied from someone else (heuristic: lines
  starting with `>`).

Keep:

- Everything else, verbatim including typos and informality. The
  typos *are* voice signal.

### 4. Analyze

Run the metrics listed in *What to extract* over the cleaned corpus.

For sentence-shape analysis, simple tokenization on `[.!?]` is
sufficient; don't overthink it. The goal is approximate signal,
not linguistic precision.

For vocabulary, compare the user's word frequencies against a
generic English (or Spanish) baseline — words that appear in the
user's corpus more than ~5× their baseline frequency are
"favored". Drop any word that's a domain technical term used in
the user's job (those aren't voice — they're context).

### 5. Synthesize prose sections

The structured attributes go in YAML frontmatter; the **prose
sections** (vocabulary signals, sentence shape, hedging, greetings,
tics, decisiveness markers, dos/don'ts) are where the human voice
description lives. Write them in plain language as if briefing
another writer on how to sound like this person.

Be specific. *"Uses em dashes"* is weak; *"uses em dashes for
parenthetical asides at the rate of about 1 every 2 paragraphs,
typically to add a qualifier or a side comment, never for ranges"*
is what the agent can act on.

### 6. Select verbatim samples (5-10)

Pick samples that:

- Cover different contexts (decisive moments, exploratory questions,
  pushback, agreement, scope clarification, frustration if present).
- Are 1-3 sentences each — long enough to show shape, short enough
  to be a recognizable anchor.
- Are recent (last 30 days) when possible.
- Include code-switching examples if relevant.
- Don't reveal information the user wouldn't want preserved (skip
  anything with credentials, private business data, or personal
  details — surface and ask if borderline).

### 7. Write the profile

Render the markdown to `kai/personal/identity/voice.md` only after onboarding
validated that the directory exists. Set the `last_extracted` date.

If a previous profile existed, **preserve the `manual_overrides:`
block** verbatim by reading the prior file before writing the new
one.

**YAML hygiene** (mandatory):
- Every prose attribute value (anything that's not a pure enum or
  number) MUST use the `|` block-scalar style. Writing-style
  descriptions naturally contain colons, quotes, em dashes, asterisks,
  and other YAML-significant characters that break plain scalars. The
  classic failure: a phrase like *"With humans: adds warmth"* embedded
  in a single-line value, where the second `: ` is read as a nested
  mapping key.
- After writing, **validate the frontmatter parses as YAML**. Quick
  options (pick what's available on the host):
    - Node: `node -e "require('js-yaml').load(require('fs').readFileSync('kai/personal/identity/voice.md','utf8').split(/^---\s*$/m)[1])"`
    - Python: `python -c "import yaml; yaml.safe_load(open('kai/personal/identity/voice.md').read().split('---')[1])"`
    - PowerShell + ConvertFrom-Yaml (if installed): equivalent
  If validation fails, fix the offending line (usually convert to
  `|` block scalar) and re-validate before reporting back to the user.

### 8. Report back

Tell the user:

- Where the profile landed.
- Corpus size analyzed.
- Top 3-5 distinctive style signals found (so they can sanity-check
  the extraction).
- Whether the `manual_overrides:` block was preserved (if pre-existing).
- The exact next step: *"Open `kai/personal/identity/voice.md`, skim it,
  edit the `manual_overrides:` block if anything looks wrong, and
  you're ready to invoke `persona-self` for drafting."*

## Re-running the skill (idempotency)

Re-running on an existing profile should be safe. The skill must:

- **Always preserve `manual_overrides:` verbatim.** This is the
  user's contract with the skill: hand-tuned rules survive.
- **Update `last_extracted` to today.**
- **Append new sources to the `sources:` list**, don't replace —
  unless the user explicitly said "full re-extract".
- **Refresh derived attributes and prose sections.** Voice may have
  shifted; re-derive.
- **Refresh verbatim samples.** Old samples may be stale. Pick fresh
  ones unless the user pinned specific samples in `manual_overrides:`.

## Privacy

The profile contains intimate writing patterns of a specific human.
Default storage location is `kai/personal/identity/voice.md` — gitignored
on creation. The skill must:

- **Require the initialized `kai/personal/identity/` path and privacy contract.**
  If missing or invalid, route to `workflow-workspace-init`; do not create paths
  or edit `.gitignore` from this skill.
- **Never upload the profile** anywhere. No telemetry, no remote
  sync, no LLM training opt-in.
- **Never include credentials, private business data, or personal
  identifiers** in verbatim samples. Filter aggressively.
- **Surface borderline samples** to the user before including them.

Do not offer a tracked-profile escape hatch. `persona-self` consumes only the
workspace-local ignored path, and removing `/kai/personal/` protection could expose
unrelated private state.

## Insufficient-data handling

If the cleaned corpus is under ~3,000 words after filtering, the
extraction is **low-signal**. Surface to the user:

- The word count.
- A note that derived attributes will be rough.
- Options: proceed with low-signal profile (mark
  `confidence: low` in frontmatter), wait for more chat history,
  or supplement with pasted samples.

Don't bluff confident attributes on a thin corpus.

## When you defer

- The user wants to clone someone else's voice → refuse. This skill
  is for the user's own voice only.
- The user wants real-time style adaptation (the profile updates as
  they type) → not supported; this is a batch extraction.
- The user wants the profile as a fine-tuned model rather than a
  markdown file → out of scope; this skill produces a portable
  plain-text profile that works with any LLM.

## Anti-patterns

- ❌ Overwriting the `manual_overrides:` block. Always preserve.
- ❌ Including credentials or private data in verbatim samples.
- ❌ Bluffing confident attributes on a thin corpus.
- ❌ Treating the user's typos as bugs and "correcting" them in
  samples. Typos are voice signal.
- ❌ Concentrating samples in a narrow time window or single
  context. Sample broadly.
- ❌ Auto-running on every session. This is a rare-extraction skill;
  re-run is user-triggered.
- ❌ Storing the profile in `kai/library/` by default. The default is
  `kai/personal/identity/` (gitignored) for privacy.
- ❌ Generating prose sections that read like marketing
  descriptions ("a thoughtful and articulate communicator"). Be
  specific and actionable.
- ❌ Writing prose attribute values as single-line plain YAML scalars.
  Phrases like *"With humans: adds warmth"* or *"hedging: 'I think'
  liberally"* break parsers — the embedded colons and quotes are
  YAML-significant. Always use `|` block scalars for prose values.
- ❌ Skipping the post-write YAML validation step. A broken
  frontmatter silently breaks every consumer agent. Validate before
  reporting done.

## See also

- `persona-self.agent.md` — the agent that consumes this profile
  on every draft.
- Sister skills: `web-content-extraction` (different lane —
  extracts someone else's content for reading), `web-evaluation`
  (UI evaluation, not text analysis).
