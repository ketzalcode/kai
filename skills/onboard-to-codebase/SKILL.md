---
name: onboard-to-codebase
description: "Fast codebase onboarding report. Use when mapping an unfamiliar repo's stack, commands, architecture, conventions, patterns, and gotchas for future sessions."
tools: [read, search, execute, edit]
user-invocable: true
argument-hint: "optional focus, e.g. frontend only or auth subsystem"
---

# Onboard to Codebase

Produce a structured, durable map of an unfamiliar codebase so the user
(and future Copilot sessions) can move fast without re-discovering the
same things every time.

## When to use

- First time entering a repo
- Returning to a repo after months away
- The repo's structure has just changed materially (big refactor, migration)
- The user invokes `/skills run onboard-to-codebase` directly

**Do not use this for:**
- Repos you've already mapped in a recent session (re-read the saved
  report instead — see Step 6)
- Tiny single-file scripts or experiments
- A repo the user is actively working in and clearly already knows

## Examples

<example>
Context: User just cloned a new repo.
user: "/skills run onboard-to-codebase"
assistant: "I'll map this repo across 8 dimensions and save the report
to `.copilot/onboarding.md`. Expect ~3-5 minutes."
</example>

<example>
Context: User wants a narrower scope.
user: "/skills run onboard-to-codebase frontend only"
assistant: "Focusing on the frontend slice. I'll skip backend, infra,
and pipelines."
</example>

## Workflow

### Step 1 — Check for an existing report

Look for `.copilot/onboarding.md` (or `.github/onboarding.md`,
`docs/onboarding.md`) in the repo root.

- **Exists and < 30 days old:** read it, summarize freshness, ask whether
  to *refresh* (re-scan and overwrite) or *augment* (append a delta) or
  *use as-is*.
- **Exists and stale (>30 days) or repo HEAD has moved significantly:**
  default to refresh after confirming.
- **Doesn't exist:** proceed to Step 2.

### Step 2 — Identify the stack

Read in parallel (one tool call each, batched):

- `package.json` (root + each workspace) → JS/TS, framework, scripts
- `pnpm-workspace.yaml`, `lerna.json`, `nx.json`, `turbo.json` → monorepo shape
- `*.csproj`, `*.sln`, `Directory.Packages.props` → .NET
- `pyproject.toml`, `requirements.txt`, `Pipfile` → Python
- `go.mod` → Go
- `Cargo.toml` → Rust
- `tsconfig*.json`, `eslint.config.*`, `.eslintrc*`, `prettier.config.*` → TS/lint config
- `.editorconfig`, `.gitattributes` → editor/line-ending norms
- `Dockerfile*`, `docker-compose*.yml`, `.devcontainer/`, `pipelines/`, `.github/workflows/` → CI/runtime
- `README.md`, `AGENTS.md`, `CLAUDE.md`, `.github/copilot-instructions.md`,
  `CONTRIBUTING.md`, `docs/` → human-authored guidance

Capture: primary language(s), framework(s), package manager, monorepo
tool, runtime targets.

### Step 3 — Extract the dev loop commands

From `package.json` scripts, `Makefile`, `justfile`, `Taskfile.yml`, or
the pipeline YAML, identify and record the canonical commands for:

- Install dependencies
- Build
- Run dev server / debug
- Lint
- Typecheck
- Unit tests
- Integration / e2e tests
- Format
- Clean

Never invent commands. If unknown, mark as "unknown — ask the team."

### Step 4 — Map the directory architecture

Top 2 levels of meaningful directories (skip `node_modules`, `bin`, `obj`,
`dist`, `build`, `.next`, `out`, `.vs`, generated). For each significant
directory, one line describing its purpose, inferred from:

- Folder name
- README in the folder (if any)
- A spot-check of 2–3 representative files

### Step 5 — Surface conventions and patterns

Look for repeated shapes across the codebase. **Three is a pattern.**
Examples to scan for:

- **Naming**: PascalCase vs camelCase for files; suffixes (`*.service.ts`,
  `*Module.cs`); test file naming (`*.test.ts`, `*.spec.ts`, `*Tests.cs`)
- **Module boundaries**: barrel exports? feature folders? layered?
- **State management** (FE): Redux, Zustand, Context, React Query, signals
- **Data access** (BE): repository pattern, raw EF, Dapper, ORM choice
- **Error handling**: thrown exceptions, Result types, error boundaries,
  problem-details responses
- **Logging**: which library, log levels, structured fields, correlation IDs
- **Dependency injection**: container choice; constructor-only vs property
- **Async**: `async/await` everywhere? Tasks vs Promises vs Observables?
- **i18n**: which library, key conventions, where strings live
- **Auth**: how the request identity arrives in a handler
- **Feature flags**: which library, where flag definitions live
- **Testing approach**: unit-heavy vs integration-heavy; mocking style;
  fixture vs factory; Testing Library queries vs `data-testid`

For each pattern: name it, show one canonical example with file path and
line range.

### Step 6 — Capture pitfalls

Hunt for gotchas a newcomer will trip over:

- `.gitignore` entries hinting at must-have-but-not-committed files (`.env*`)
- README warnings ("don't run X locally", "this requires VPN")
- TODO/FIXME/HACK clusters (run a grep) — note the worst hotspots
- Tests that are skipped or marked flaky
- Long-running migrations or codemods in progress

### Step 7 — Write the report

Write to `.copilot/onboarding.md` (create the directory if missing) using
this structure:

```markdown
# Onboarding: <repo name>

_Last generated: <ISO date>_
_Generated against commit: <short SHA from `git rev-parse --short HEAD`>_

## At a glance
- **Stack:** ...
- **Package manager / monorepo tool:** ...
- **Primary frameworks:** ...

## Dev loop
| Action | Command |
| ------ | ------- |
| Install | ... |
| Build | ... |
| Dev | ... |
| Lint | ... |
| Typecheck | ... |
| Test (unit) | ... |
| Test (e2e) | ... |
| Format | ... |

## Layout
<directory tree with one-line annotations>

## Conventions
### Naming
### Module boundaries
### State management
### Error handling
### Logging
### Testing
<...as discovered>

## Patterns
<each pattern with name + canonical example + file:lines>

## Pitfalls
<bulleted list with file:lines where relevant>

## Open questions
<things to ask the team — never guess>
```

### Step 8 — Summarize back to the user

In chat, give a 5–8 line digest of the most important findings and the
report path. Don't paste the full report — point at the file.

## Rules

- **Never invent** commands, conventions, or patterns. If you didn't see
  it three times in the repo, it's not a pattern — it's an observation,
  and goes under "Open questions."
- **Always cite** file paths and line numbers for patterns and pitfalls.
- **Respect privacy.** Never include secrets, tokens, or `.env` contents
  in the report.
- **Don't scan** `node_modules`, `bin`, `obj`, `dist`, `build`, `.next`,
  `out`, or any folder listed in `.gitignore`.
- **Skip generated code** when sampling patterns (`*.g.ts`, `*.designer.cs`,
  schemas auto-generated from proto/OpenAPI).
- **One report per repo.** Don't fragment by subsystem unless the user
  asked for a narrow focus — in that case, write to
  `.copilot/onboarding-<focus>.md` instead.
- If the repo has its own `AGENTS.md` or `.github/copilot-instructions.md`,
  the report **augments** them, it doesn't replace them.
