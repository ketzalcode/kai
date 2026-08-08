[kai](../../README.md) / [Docs](../README.md) / Plugin structure

# Plugin structure

The layout of this repository, and what to run before opening a PR. This page is
for people changing kai itself. If you are *using* kai, you want
[Getting started](../getting-started.md) instead.

## Repository layout

```
kai/
├── plugin.json         # plugin manifest (name, version, paths)
├── README.md           # the landing page
├── AGENTS.md           # contributor rules for this repo only
├── CHANGELOG.md        # every release
├── LICENSE             # MIT
├── agents/             # one .agent.md per persona
├── skills/             # one folder per skill (each with SKILL.md)
├── scripts/            # dependency-free Node ESM: validators, doctor, generators
├── docs/               # this documentation set
├── examples/           # committed, CI-validated example workspaces
└── test/fixtures/      # fixtures the validators and the doctor self-test against
```

kai is **declarative**: agents and skills are markdown prompts with YAML
frontmatter. The only executable code is under `scripts/`, and it uses Node
built-ins only, so CI runs it with no install step. Note that a plugin's own
root `AGENTS.md` never loads in a consumer workspace — see
[Host capabilities](../host-capabilities.md#how-shared-rules-reach-your-session)
for why the shared rules ship as a skill instead.

## Contributing

This is a personal open-source plugin, but issues and PRs are welcome.
New skills should:

- Solve a real, recurring problem (not a "nice to have").
- Be framework-agnostic unless explicitly scoped (e.g., `react-style`).
- Cite their own conventions inside `SKILL.md` so the agent can apply them
  without inventing rules.

Before opening a PR, run `npm test` — six dependency-free checks that also run
in CI on every pull request:

| Command | Checks |
| ------- | ------ |
| `npm run validate` | Source contract: valid agent/skill frontmatter, `name`-to-path agreement, resolvable cross-references, the `**Inherits:**` declaration, host-tool allowlist, workspace-contract consistency, and release hygiene (semver, current-version changelog section + link, README status stamp, `package.json` ↔ `package-lock.json` consistency, git-dependency allowlist). |
| `npm run docs:check` | The generated agent/skill catalog matches the shipped surface. |
| `npm run doctor:self-test` | Generated-workspace contract, including the example workspaces. |
| `npm run host-contract` | Host-loader acceptance — the discoverable inventory matches the golden snapshot and malformed frontmatter is rejected. |
| `npm run release-guard:self-test` | The behavior-change-requires-a-bump decision core. |
| `npm run check-syntax` | `node --check` on shipped JS, plus a PowerShell parse. |

On pull requests CI additionally runs `release-guard --base <sha> --head <sha>`
to block a behavior-sensitive change that lacks a version bump plus
changelog/README updates.

**When you add, remove, or rename an agent or skill:**

1. File it under a category in `CATEGORIES` in `scripts/generate-catalog.mjs` —
   `npm test` fails until you do, so the catalog cannot silently omit it.
2. Run `npm run docs:generate` and commit
   `docs/reference/agents-and-skills.md`.
3. Regenerate the host-loader golden with `npm run host-contract:update` and
   commit `test/fixtures/inventory.json`.

**When you add a documentation page**, put it under `docs/` — the validator
scans every `docs/**/*.md` for unresolvable agent references and for workspace
paths written without their `kai/` parent, exactly as it scans the agents and
skills themselves.

## Versioning & releases

kai follows [semantic versioning](https://semver.org). Updates reach users via
`/plugin update kai` (or a new session) — Copilot loads the plugin from the repo,
so the version is descriptive metadata, **not** an update gate. Keep it honest:
any change to shipped plugin behavior bumps the version **in the same PR**. CI
**enforces** this — a change under `agents/`, `skills/`, `scripts/`, or the
dependency manifests that lacks a version bump plus changelog/README updates
fails the `release-guard` gate; docs- and test-only changes stay exempt.

| Change | Pre-1.0 (`0.x`) | Post-1.0 |
| ------ | --------------- | -------- |
| Breaking (remove/rename an agent or skill, change a consumed contract) | minor (`0.Y.0`) | major (`X.0.0`) |
| New feature (new agent/skill, additive capability) | minor (`0.Y.0`) | minor (`x.Y.0`) |
| Fix / small tweak | patch (`0.x.Z`) | patch (`x.y.Z`) |
| Docs- or test-only | no bump (or patch) | no bump (or patch) |

Cutting `1.0.0` is a deliberate stability milestone, not automatic. Release steps
(also in `AGENTS.md` → **Releasing this plugin**):

1. `npm version <x.y.z> --no-git-tag-version`, then set the matching version in
   `plugin.json`.
2. Add a dated `CHANGELOG.md` entry (Added / Changed / Fixed / Removed) **and its
   `[x.y.z]:` compare link**; refresh the README status stamp. (CI checks all
   three for the current version.)
3. `npm test`, open the PR, merge on green.
4. Tag `vX.Y.Z` on `main` and cut the GitHub release from the changelog entry.

---

**Next:** [Agents & skills](agents-and-skills.md) ·
**Related:** [Host capabilities](../host-capabilities.md) ·
[Workspace model](../workspaces.md)
