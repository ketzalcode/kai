---
name: generate-audio
description: "Turn any folder of markdown notes — personal notes, OSS READMEs, course content, blog drafts — into multilingual narrated audio by shelling out to lectoria. Resolves paths against the caller's cwd, so it travels across codebases."
tools: [bash, view]
user-invocable: true
argument-hint: [optional source path or single .md file]
---

# Generate Audio (cwd-relative)

Convert markdown into narrated audio in English + Spanish so the user
can listen while moving. Sister to bongo's `generate-audio` skill — but
bongo bakes in Microsoft-work paths (`library/dev-designs/`); this one
stays **cwd-relative** so you can run it from any project.

Wraps the [lectoria](https://github.com/RubenSaucedo/lectoria) CLI
through `scripts/generate-audio.ps1`. The wrapper prefers a locally-installed
lectoria (`node_modules/.bin/lectoria`) and falls back to a global install on
PATH. **Today lectoria must be installed globally** — `npm install` from its
git URL ships the `package.json` but not the built `dist/` (no `prepare` hook
upstream), so a plain repo-local install can't execute. Track the upstream
fix in lectoria's repo; until then the global install is the working path.

## When to use

- User says "podcast my notes", "narrate this README", "audio version of <file>"
- User explicitly asks: `/skills run generate-audio` (with or without a path)
- User is in a personal project, course folder, or any non-bongo codebase
  and wants audio output
- User extracted a Microsoft Learn module/path with `extract-learn-path.js`
  and wants per-unit audio of the `raw/` files

**Use bongo's `generate-audio` skill instead when:**
- The user is working in `C:\src\bongo` and means their dev-designs.
  bongo's defaults (`library/dev-designs/` -> `library/audio/`) are
  more convenient there.

## Examples

<example>
Context: User is in a personal notes folder.
user: "podcast everything here"
assistant: "Narrating every markdown file in $(pwd) -> ./audio/, en+es."
[runs: pwsh C:\src\kai\scripts\generate-audio.ps1]
</example>

<example>
Context: User wants to hear a single README.
user: "make me an audio version of README.md in spanish"
assistant: [runs: pwsh C:\src\kai\scripts\generate-audio.ps1 -Source ./README.md -Lang es]
</example>

<example>
Context: User wants verbatim narration (no LLM expansion) of a course chapter.
user: "verbatim audio of chapter-3.md"
assistant: [runs: pwsh C:\src\kai\scripts\generate-audio.ps1 -Source ./chapter-3.md -Style verbatim]
</example>

<example>
Context: User finished extracting a Microsoft Learn learning path and
wants per-unit Spanish audio (one mp3 per unit file, not one giant audio).
user: "generate audio for the new learn run, spanish only"
assistant: [runs: pwsh C:\src\kai\scripts\generate-audio.ps1 -Source .kai/runs/learn/<slug>/<timestamp>/raw -Lang es]
</example>

## How

1. **One-time install** in this repo: `cd C:\src\kai; npm install` for
   the extract scripts. Lectoria itself is **globally** installed (today):
   `npm install -g git+https://github.com/RubenSaucedo/lectoria.git`. The
   wrapper will pick up either a local `node_modules/.bin/lectoria` (once
   upstream ships `dist/` via a `prepare` script) or the global one.
2. **Don't `cd` anywhere when invoking.** The script resolves `-Source` and
   `-Out` against the user's current working directory by design — that's
   how it travels across codebases.
3. **Run from wherever the user is**, with an absolute path to the script:
   ```powershell
   pwsh C:\src\kai\scripts\generate-audio.ps1 [-Source <path>] [-Lang <list>] [-Style <kind>] [-DryRun]
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
   even inside `library/`, so audio never bloats the repo (see
   `workspace-conventions`).

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
