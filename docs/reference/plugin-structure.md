[kai](../../README.md) / [Docs](../README.md) / Plugin structure

# Plugin structure

The layout of this repository, and what to run before opening a PR. This page is
for people changing kai itself. If you are *using* kai, you want
[Getting started](../getting-started.md) instead.

## Repository layout

```
kai/
├── plugin.json         # temporary lockstep release metadata
├── README.md           # the landing page
├── AGENTS.md           # contributor rules for this repo only
├── CHANGELOG.md        # every release
├── LICENSE             # MIT
├── plugins/            # authoritative installable plugin trees
│   └── <plugin>/
│       ├── agents/     # authoritative role profiles
│       └── skills/     # authoritative skills and contracts
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

Agent and skill files are edited only in their owning plugin. Legacy department
agents carry one region bounded by `kai core dependency guard` HTML-comment
markers; `npm run pack-preview -- --write` may replace only that region. Do not
hand-edit inside the markers. `kai-agent-v1` and core agents carry no guard
region. Skill companion files may
live beside `SKILL.md`; derived-file cleanup is restricted to manifests, locks,
hooks, and routed `scripts/`.

## Creating or refining an agent

Run the user-invocable `kai-core-create-agent` skill before adding a role. It
classifies the need as a durable role, workflow, persona, instructor, or reusable
skill; requires a permanent role to earn its slot; and defines authority,
execution profile, host-specific tools, on-demand skills, handoffs, and acceptance cases
before prose is written.

New durable roles use `<provider-family>-<posture>-<scope>`. Provider families
are `core`, `personal`, `prod`, `eng`, and `gtm`; postures are `lead`, `builder`,
`reviewer`, `operator`, `coordinator`, and `advisor`. Existing seniority-based
identities remain valid during the staged migration, but they are not templates
for new roles. This skill handles one agent at a time; a fleet-wide identity
migration belongs to a separate procedure.

## How a skill reaches a session

A skill is not loaded because it exists. It is loaded on demand through an agent
route or a direct user invocation. Legacy inheritance remains a temporary third
path until each old agent migrates. What is not legitimate is a skill with no
firing path, which ships and appears in the catalog while being unreachable.

```
  skills/<id>/SKILL.md
          |
          +-- 1. agent-routed -> named in the instruction that needs it, so the
          |                      agent invokes it only at that workflow step.
          |                      Not collected into a manifest section.
          |
          +-- 2. user-invoked -> `user-invocable: true` (+ `argument-hint`).
          |                      The operator runs it directly. Use for a
          |                      procedure a human starts on purpose.
          |
          +-- 3. legacy ------> named on an old agent's `**Inherits:**` line
                                and loaded at startup. Do not use this path in
                                a new or migrated agent.
```

A skill can have more than one path. For example, an agent may route a skill
that the operator can also invoke directly.

`npm run validate` fails on a skill with zero firing paths. The orchestrated
form is matched by that declaration shape specifically, not by any backticked
mention, so an incidental reference cannot pass an unreachable skill off as
reachable. That check exists because its absence produced a filed issue
asserting that user-invocable skills "never fire" — the counting method, not the
plugin, was wrong. Audits parse structured dispatch entries and, for legacy
agents only, the `**Inherits:**` line; incidental prose does not count.

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
| `npm run validate` | Source contract: valid agent/skill frontmatter, `name`-to-path agreement, resolvable cross-references, progressive skill routes or legacy inheritance, at least one firing path per skill, Kai tool-vocabulary lint, workspace-contract consistency, and release hygiene (semver, current-version changelog section + link, README status stamp, `package.json` ↔ `package-lock.json` consistency, git-dependency allowlist). |
| `npm run docs:check` | The generated agent/skill catalog matches the shipped surface. |
| `npm run doctor:self-test` | Generated-workspace contract, including the example workspaces, plus the pack-migration scenario matrix. |
| `npm run host-contract` | Kai frontmatter acceptance heuristic — the expected discoverable inventory matches the golden snapshot and malformed frontmatter is rejected. |
| `npm run release-guard:self-test` | The behavior-change-requires-a-bump decision core. |
| `npm run activity:self-test` | The activity-log contract: the item/log boundary, privacy bounds, and concurrent-writer integrity. |
| `npm run status:self-test` | The exception-report rules, against fixture workspaces. |
| `npm run observe:self-test` | The subagent observer: consent gate, leak bounds, and the empty-stdout/exit-0 guarantee. |
| `npm run observe:watch-self-test` | The ambient view: start/stop pairing, ambiguity labelling, and layout bounds. |
| `npm run pack-preview:self-test` | Plugin-source planning: partition rules, managed guarantee regions, derived-file generation, and cross-plugin reference resolution, each failure proven by a mutation. |
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
**enforces** this — a change under `agents/`, `skills/`, `scripts/`,
`plugins/`, or the dependency manifests that lacks a version bump plus
changelog/README updates fails the `release-guard` gate; docs- and test-only
changes stay exempt.

| Change | Pre-1.0 (`0.x`) | Post-1.0 |
| ------ | --------------- | -------- |
| Breaking (remove/rename an agent or skill, change a consumed contract) | minor (`0.Y.0`) | major (`X.0.0`) |
| New feature (new agent/skill, additive capability) | minor (`0.Y.0`) | minor (`x.Y.0`) |
| Fix / small tweak | patch (`0.x.Z`) | patch (`x.y.Z`) |
| Docs- or test-only | no bump (or patch) | no bump (or patch) |

Cutting `1.0.0` is a deliberate stability milestone, not automatic.

### What `1.0.0` is reserved for

**`1.0.0` is the release in which packs become the install surface** — where
`kai` stops being a single plugin and `kai-core` plus department plugins replace
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
- **The measured gates must be green before the marketplace flips.** `1.0.0`
  reads as a stability promise, so the Phase 3 host, partition, dependency, and
  migration gates are release prerequisites rather than follow-up work.

Until then the pre-1.0 column above applies unchanged: breaking changes ride in
a **minor**.

### Release steps

Also in `AGENTS.md` → **Releasing this plugin**:

1. `npm version <x.y.z> --no-git-tag-version`, then set the matching version in
   `plugin.json` **and in `.github/plugin/marketplace.json`** (both
   `metadata.version` and every published `plugins[]` entry — CI rejects a stale index,
   because it installs fine while reporting the wrong version).
2. Add a dated `CHANGELOG.md` entry (Added / Changed / Fixed / Removed) **and its
   `[x.y.z]:` compare link**; refresh the README status stamp. (CI checks all
   three for the current version.)
3. `npm test`, open the PR, then **verify all three of these at the exact head you
   are about to merge** — a later records-only commit does not inherit an earlier
   head's evidence:
   - `git merge-base --is-ancestor <reviewed-ref> HEAD` — every independent
     approval was given on an ancestor of this head.
   - `git diff --exit-code <reviewed-ref> HEAD -- . ':(exclude)kai/'` — nothing
     outside the coordination records moved since that review, so the approvals
     still describe the shipped change.
   - a **fresh** CI run whose head SHA is this exact head, green on every required
     job. Never merge on an attested equivalence, and never on a run a later
     commit superseded.
   Then merge on green.
4. On the exact merge commit, register `RubenSaucedo/kai` in an isolated
   `COPILOT_HOME`, browse `kai-plugins`, install every newly published pack,
   run idempotent updates, and run the installed core migration doctor with
   `--json`. Do not tag while names, versions, enabled state, provenance, or
   install trees disagree.
   Also run the doctor against a real direct-monolith host whose
   `settings.json` has no plugin override; it must report `legacy-installed`
   without `enabled-state-unverified`. That probe measures the *empty* override
   map only: the `name@marketplace` override key is measured, but the bare-`name`
   key the doctor assumes for a **direct** install has never been exercised on a
   real host. It is documented as inferred, not gated — see the parked
   measurement proposal and its revisit trigger in the pack-split initiative
   backlog.
5. Tag `vX.Y.Z` on `main` and cut the GitHub release from the changelog entry.

### Emergency rollback of the pack marketplace

The marketplace serves the default branch, so a broken pack flip must be
restorable through an ordinary reviewed PR rather than an undocumented direct
push.

1. Get operator authorization and branch from the current `main`.
2. Make a forward patch release (for example `1.0.1`), set
   `metadata.installSurface` in `.github/plugin/marketplace.json` to
   `legacy-rollback`, replace **every** pack entry with the root `kai` entry at
   the same patch version, and add the required changelog and README notice.
3. Run `npm test` and the exact release guard, then merge through normal branch
   protection. The validator accepts `legacy-rollback` only at `1.0.0` or later
   and requires the monolith while forbidding **every pack name the partition can
   publish** — the set is derived from `PACKS` in `scripts/lib/pack-plan.mjs`, not
   listed here or there, so a pack published after this runbook was written is
   forbidden by name without anyone remembering to add it. A rollback index that
   restored the monolith beside a still-served department pack would be the exact
   coexistence the migration doctor refuses on a host; it is refused in the index
   too.
4. From an isolated home, update the marketplace, browse it, install
   `kai@kai-plugins`, and verify a fresh session before tagging the patch.
   From an already-migrated home, uninstall `kai-personal`, `kai-product`,
   `kai-engineering`, and `kai-gtm` first, then uninstall `kai-core` last.
   Confirm `copilot plugin list` shows neither surface, then install
   `kai@kai-plugins`, then start a fresh session. Never install the restored
   monolith beside packs; the doctor correctly refuses that coexistence.
5. Reverse the workspace provenance on every workspace already migrated. Run
   `node <kai-plugin>/scripts/workspace-doctor.mjs --migration-check --rollback
   --root <workspace-root>`: the explicit rollback intent first requires the
   monolith to be one installed, enabled, identity-consistent copy whose
   recorded config provenance agrees with its tree, every pack to be absent,
   and both host evidence surfaces to be readable. Only then does it report
   `workspace-provenance-ahead` and emits the one-key edit that sets
   `.kai/manifest.json` `"plugin"` back to `kai`, plus the re-check that confirms
   the workspace is healthy afterwards. The rollback plan never emits
   `copilot plugin uninstall kai`; without the explicit mode or complete
   evidence, no reverse edit is offered. Run the steps it prints; the doctor
   itself changes nothing.
6. Publish a forward plugin restoration in a later patch by returning
   `metadata.installSurface` to `packs`; never leave both surfaces listed.

---

**Next:** [Agents & skills](agents-and-skills.md) ·
**Related:** [Host capabilities](../host-capabilities.md) ·
[Workspace model](../workspaces.md)
