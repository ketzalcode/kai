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

## How a skill reaches a session

A skill is not loaded because it exists. It is loaded on demand, and there are
exactly three ways it can fire. All three are legitimate; what is not legitimate
is a skill with none of them, which ships and appears in the catalog while being
unreachable.

```
  skills/<id>/SKILL.md
          |
          +-- 1. inherited ----> named on an agent's `**Inherits:**` line.
          |                      Loads whenever that agent runs. Use for a
          |                      contract the role must always obey.
          |
          +-- 2. user-invoked -> `user-invocable: true` (+ `argument-hint`).
          |                      The operator runs it directly. Use for a
          |                      procedure a human starts on purpose.
          |
          +-- 3. orchestrated -> declared as a dispatch entry in an agent's
                                 prose, in the list shape
                                 `- **`skill-id`** — when it applies`, and run
                                 situationally. Use for a lens that would be
                                 waste to run every time — the review lenses
                                 `workflow-doc-review` calls only when the
                                 change touches their subject.
```

A skill can have more than one path: `research-before-coding` is both inherited
by the code-writing agents and user-invocable.

`npm run validate` fails on a skill with zero firing paths. The orchestrated
form is matched by that declaration shape specifically, not by any backticked
mention, so an incidental reference cannot pass an unreachable skill off as
reachable. That check exists because its absence produced a filed issue
asserting that user-invocable skills "never fire" — the counting method, not the
plugin, was wrong. **When auditing inheritance, parse only the `**Inherits:**`
line**; grepping whole agent files also counts prose mentions and inflates the
result.

## Contributing

This is a personal open-source plugin, but issues and PRs are welcome.
New skills should:

- Solve a real, recurring problem (not a "nice to have").
- Be framework-agnostic unless explicitly scoped (e.g., `react-style`).
- Cite their own conventions inside `SKILL.md` so the agent can apply them
  without inventing rules.

Before opening a PR, run `npm test` — the dependency-free checks below, which
also run in CI on every pull request:

| Command | Checks |
| ------- | ------ |
| `npm run validate` | Source contract: valid agent/skill frontmatter, `name`-to-path agreement, resolvable cross-references, the `**Inherits:**` declaration, at least one firing path per skill, host-tool allowlist, workspace-contract consistency, and release hygiene (semver, current-version changelog section + link, README status stamp, `package.json` ↔ `package-lock.json` consistency, git-dependency allowlist). |
| `npm run docs:check` | The generated agent/skill catalog matches the shipped surface. |
| `npm run doctor:self-test` | Generated-workspace contract, including the example workspaces, plus the pack-migration scenario matrix. |
| `npm run host-contract` | Host-loader acceptance — the discoverable inventory matches the golden snapshot and malformed frontmatter is rejected. |
| `npm run release-guard:self-test` | The behavior-change-requires-a-bump decision core. |
| `npm run activity:self-test` | The activity-log contract: the item/log boundary, privacy bounds, and concurrent-writer integrity. |
| `npm run status:self-test` | The exception-report rules, against fixture workspaces. |
| `npm run observe:self-test` | The subagent observer: consent gate, leak bounds, and the empty-stdout/exit-0 guarantee. |
| `npm run observe:watch-self-test` | The ambient view: start/stop pairing, ambiguity labelling, and layout bounds. |
| `npm run pack-preview:self-test` | The pack generator: the partition rules, the injected guarantee blocks, and the cross-pack reference resolution, each failure proven by a mutation. |
| `npm run pack-preview:gate` | The same rules over the live tree, as four named gates — partition, collision, partial-install, version-skew — which is how CI runs them. |
| `npm run check-syntax` | `node --check` on shipped JS, plus a PowerShell parse. |
| `node examples/proactive-runner/runner.mjs --self-test` | The kai-core-proactive-scan runner's decision, redaction, and retention core. |

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
4. For a new skill, give it a firing path — inherit it from an agent, mark it
   `user-invocable: true`, or have an agent dispatch it by name. `npm test`
   fails until one exists.

**When you add a documentation page**, put it under `docs/` — the validator
scans every `docs/**/*.md` for unresolvable agent references and for workspace
paths written without their `kai/` parent, exactly as it scans the agents and
skills themselves.

## Versioning & releases

kai follows [semantic versioning](https://semver.org). Updates reach users via
`copilot plugin update <pack>@kai-plugins` and a new session. Copilot loads the
plugin from the repo, so the version is descriptive metadata, **not** an update
gate. Keep it honest:
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

Cutting `1.0.0` is a deliberate stability milestone, not automatic.

### What `1.0.0` is reserved for

**`1.0.0` is the release in which packs become the install surface** — where
`kai` stops being a single plugin and `kai-core` plus department packs replace
it (see [the pack architecture proposal](../proposals/pack-architecture.md) and
issue #29). Nothing else takes the major.

That split is breaking in the literal semver sense, which is why it earns the
number rather than merely coinciding with it: install commands change, and core
skills gain contract-versioned names because skill binding was measured to be
**load-order dependent** — with two plugins providing the same skill name, the
agent binds to whichever loaded first, and a preflight cannot detect it.

Two consequences, both deliberate:

- **Do not cut `1.0.0` early to signal maturity.** The version is a promise
  about the install contract, not a maturity badge. Groundwork for the split —
  harnesses, validators, metadata work — stays on `0.x` no matter how
  substantial, because a consumer's install command has not changed.
- **Do not cut it while the split's failure modes are unmeasured.** `1.0.0`
  reads as a stability promise, so it waits on the Phase 3 gates: roster
  enumeration under the full agent set, skill collision under real install
  order and fresh sessions, and macOS plus the cloud host. Ship the split when
  those are closed, and ship it *as* `1.0.0`.

Until then the pre-1.0 column above applies unchanged: breaking changes ride in
a **minor**.

### Release steps

Also in `AGENTS.md` → **Releasing this plugin**:

1. `npm version <x.y.z> --no-git-tag-version`, then set the matching version in
   `plugin.json` **and in `.github/plugin/marketplace.json`** (both
   `metadata.version` and the `plugins[]` entry — CI rejects a stale index,
   because it installs fine while reporting the wrong version).
2. Add a dated `CHANGELOG.md` entry (Added / Changed / Fixed / Removed) **and its
   `[x.y.z]:` compare link**; refresh the README status stamp. (CI checks all
   three for the current version.)
3. `npm test`, open the PR, merge on green.
4. Tag `vX.Y.Z` on `main` and cut the GitHub release from the changelog entry.

---

**Next:** [Agents & skills](agents-and-skills.md) ·
**Related:** [Host capabilities](../host-capabilities.md) ·
[Workspace model](../workspaces.md)
