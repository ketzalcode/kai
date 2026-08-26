---
name: kai-core-generate-audio
description: "Markdown-to-audio lesson generation. Use when converting notes, READMEs, course content, or drafts into multilingual narrated audio with lectoria."
tools: [bash, shell, view]
user-invocable: true
argument-hint: "optional source path or single .md file"
---

# Generate Audio (cwd-relative)

Convert markdown into narrated audio in English + Spanish so the user
can listen while moving. Sister to bongo's `kai-core-generate-audio` skill — but
bongo bakes in Microsoft-work paths (`kai/library/dev-designs/`); this one
stays **cwd-relative** so you can run it from any project.

Wraps the [lectoria](https://github.com/RubenSaucedo/lectoria) CLI
through `scripts/generate-audio.ps1` (at the kai plugin root). The wrapper prefers
a locally-installed lectoria (`node_modules/.bin/lectoria`) and falls back to a
global install on PATH. **Lectoria is pinned as a git dependency in this plugin's
`package.json`**, so a one-time `npm install` at the plugin root fetches and builds
it (lectoria's `prepare` hook compiles `dist/`) — no global install needed. A
global `npm install -g git+https://github.com/RubenSaucedo/lectoria.git` still
works as a fallback.

**Node requirement.** Because `npm install` compiles lectoria from source, it
needs a Node version lectoria supports: `^22.22.2 || ^24.15.0 || >=26.0.0`.
On an older Node, `npm install` reports `EBADENGINE` and the build may fail.

Voice presets are `espana`, `latino`, `intermedio`, and
`intermedio-femenino`; the wrapper defaults to `intermedio`.

**Resolving the script path.** `<kai-plugin>` below is the directory this
plugin was installed to — the folder that contains `agents/`, `skills/`, and
`scripts/`. Resolve it from where this skill was loaded, never a hard-coded
checkout like `C:\src\...`. On a local clone it is your repo root; when installed
via `/plugin` it is the plugin's install directory.

**Platform:** the wrapper is PowerShell 7+ (`pwsh`) and runs on Windows, macOS,
and Linux where `pwsh` is available.

## When to use

- User says "podcast my notes", "narrate this README", "audio version of <file>"
- User explicitly asks: `/skills run kai-core-generate-audio` (with or without a path)
- User is in a personal project, course folder, or any non-bongo codebase
  and wants audio output
- User extracted a Microsoft Learn module/path with `extract-learn-path.js`
  and wants per-unit audio of the `raw/` files

**Use bongo's `kai-core-generate-audio` skill instead when:**
- The user is working in the bongo repo and means their dev-designs.
  bongo's defaults (`kai/library/dev-designs/` -> `kai/library/audio/`) are
  more convenient there.

## Examples

<example>
Context: User is in a personal notes folder.
user: "podcast everything here"
assistant: "Narrating every markdown file in $(pwd) -> ./audio/, en+es."
[runs: pwsh <kai-plugin>/scripts/generate-audio.ps1]
</example>

<example>
Context: User wants to hear a single README.
user: "make me an audio version of README.md in spanish"
assistant: [runs: pwsh <kai-plugin>/scripts/generate-audio.ps1 -Source ./README.md -Lang es]
</example>

<example>
Context: User wants verbatim narration (no LLM expansion) of a course chapter.
user: "verbatim audio of chapter-3.md"
assistant: [runs: pwsh <kai-plugin>/scripts/generate-audio.ps1 -Source ./chapter-3.md -Style verbatim]
</example>

<example>
Context: User finished extracting a Microsoft Learn learning path and
wants per-unit Spanish audio (one mp3 per unit file, not one giant audio).
user: "generate audio for the new learn run, spanish only"
assistant: [runs: pwsh <kai-plugin>/scripts/generate-audio.ps1 -Source .kai/runs/learn/<goal-slug>/<NN>-extract-<source-slug>/raw -Lang es]
</example>

## How

1. **One-time install** at the kai plugin root: `npm install` for
   the extract scripts. Lectoria itself is **globally** installed (today):
   `npm install -g git+https://github.com/RubenSaucedo/lectoria.git`. The
   wrapper will pick up either a local `node_modules/.bin/lectoria` (once
   upstream ships `dist/` via a `prepare` script) or the global one.
2. **Don't `cd` anywhere when invoking.** The script resolves `-Source` and
   `-Out` against the user's current working directory by design — that's
   how it travels across codebases.
3. **Run from wherever the user is**, with the plugin-relative path to the script:
   ```powershell
   pwsh <kai-plugin>/scripts/generate-audio.ps1 [-Source <path>] [-Lang <list>] [-Style <kind>] [-Voice <preset>] [-DryRun]
   ```
4. **If `-Source` is a folder, audio output mirrors its tree.** A folder
   with subfolders becomes one feed per subfolder. Single-file input
   produces a single-episode podcast. For Microsoft Learn extractions,
   point `-Source` at the `raw/` subfolder so each unit becomes its own
   mp3 (not one giant per-module audio).
5. **Cost-aware**: long docs (>10k tokens) spend more. For experiments,
   default to `-Style verbatim` (less LLM expansion) or `-Lang en` only.
   Use `-DryRun` first when in doubt.
6. **Tell the user where the audio landed**: by default `./audio/`
   relative to their cwd. Audio is heavy and regenerable — the `.kai/runs/`
   working root is gitignored wholesale, and `*.mp3`/`audio/` stay ignored
   even inside `kai/library/`, so audio never bloats the repo (see
   `kai-core-workspace-conventions`).

## Failure modes

- **`'lectoria' is not available`**: user hasn't run `npm install` in this
  repo yet, and no global lectoria is on PATH. Surface the install command
  the script prints — do not guess at alternatives.
- **`Azure credentials missing`**: lectoria itself will print the env vars
  it needs. They live in this repo's `.env` (loaded automatically by the
  wrapper). If `.env` is empty or missing, point the user to lectoria's
  `.env.example` + the README's "Provisioning Azure resources" section.
- **`429 Too Many Requests`**: lectoria already chunks long docs per
  section, but the per-minute Azure OpenAI TPM cap can still hit on
  very long source files. Retry; do not pre-emptively split the doc.

## Defaults (set in `scripts/generate-audio.ps1`)

| Flag       | Default            | Why                                                     |
|------------|--------------------|---------------------------------------------------------|
| `-Source`  | `.`                | Caller's cwd — narrate whatever they're looking at      |
| `-Out`     | `./audio`          | Right next to the source, easy to find                  |
| `-Lang`    | `en,es`            | User listens in both                                    |
| `-Style`   | `conversational`   | ~70% fidelity; balanced for most prose                  |
| `-Voice`   | `intermedio`       | Less regionally-marked; use `intermedio-femenino` for its female counterpart |
