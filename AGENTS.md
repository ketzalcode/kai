# Contributing to the kai plugin repo

These are the **repo-local** rules for changing kai itself. They apply to work
inside this repository only.

> **The shared operating contract lives in the `kai-core` skills, not here.** A
> plugin's own root `AGENTS.md` is never loaded as custom instructions in a
> consumer workspace — the host reads `AGENTS.md` only from the user's
> repository root and working directory. Rules placed here reach kai
> contributors and nobody else. An agent routes each contract just in time, at
> the instruction that needs it.

## Where the rules live

| Concern | Home |
| --- | --- |
| Role kinds, staying in lane, test ownership, human-only gates, shipping honesty, `@operator` | `kai-core-operating-rules` |
| Acting on granted work: verify-before-write, collisions, handoffs, review routing | `kai-core-work-acting` |
| Granting and reconciling executable work: leases, recovery, and Task dispatch | `kai-core-work-granting` |
| Executable Task schema, lifecycle, lease, and recovery rules | `kai-core-work-task` |
| Workspace resolution, private schema-6 placement, and typed path grammar | `kai-core-workspace-paths`, `kai-core-workspace-onboarding` |
| Direction, Epic, Feature, Requirement, priority, holds, dependencies, and closure | `project-management-work-hierarchy`, `project-management-work-stewardship` |
| Pack-owned artifact vocabularies and formats | each package's `*-workspace-publication` skill |
| Producing and closing durable assets | `kai-core-asset-producing`, `kai-core-asset-closing` |
| Persona-specific craft | `plugins/*/agents/*.agent.md` |
| Releasing this plugin | this file, below |

## Routing shared contracts

An agent loads each shared contract inline, in the instruction that needs it,
never hoisted into a manifest section — a collected list recreates the eager
preload this design removed. It carries no `**Inherits:**` line and no
dependency-guard block. It routes `kai-core-contract-v1` just before its first
other core skill, and in the same paragraph states, in its own words, what it
still does and refuses when core is unavailable: ordinary single-shot domain
work may continue, but Kai coordination and `.kai` state may not, so it tells the
operator to install or update `kai-core` before resuming coordinated work.

`npm test` enforces those on-demand routes and the absence of any guard block.

Every shipped package uses task-local routes. The retired
go-to-market and personal plugins are not compatibility aliases; do not
reintroduce their eager declarations or dependency guards. Schema 6 has no
generic personal lane. Unsupported workspaces are re-onboarded without
importing historical private records.

The install owners are `kai-core`, `kai-project-management`,
`kai-engineering`, and `kai-creative`.
Keep each source in one owning package. A capability package's
baseline is core plus itself, with adequate supplied inputs rather than
compulsory sibling producers. Naming-family tokens do not define install owners.

Five further capability packages — product, marketing, revenue, assistant, and
learning — are incubated under `incubator/`. They are inactive by construction:
nothing there is discovered, validated as a pack, emitted, catalogued, or
installable, and no `incubator/` tree may carry a plugin or package manifest.
`npm test` enforces that. Do not route to an incubated role, add one to a
roster, or name one as a required producer. The inventory and the re-entry
procedure are in `incubator/README.md`.

## Repository instructions

The block below is the one managed repository-instruction block kai ships for
the **main CLI agent**. The host loads `AGENTS.md` from the user's repository,
never from a plugin, so this is where a consumer opts into Kai's communication,
development, and validation profile. Kai carries the same block here so the
instructions it ships are the instructions its contributors use.

The canonical text lives in
`src/core/lib/repository-instructions-block.md`.
`kai-core-workspace-onboarding` installs it into a consumer's `AGENTS.md` on
explicit opt-in, and `npm test` fails if this file's copy drifts from the
canonical one, if the markers are missing, or if onboarding stops referencing
it. **Edit the canonical file, never this copy.**

<!-- >>> kai repository instructions (managed by workflow-workspace-init) >>> -->
## Communication style

Think broadly and communicate narrowly. Report decisions, blockers, failures,
evidence, and unverified claims without narrating routine work.

## Development profile: fast-ship

Kai keeps direct work direct. Add coordination only when specialization,
isolation, or independent work materially improves the result.

- For implementation, use the smallest process that resolves real uncertainty:
  direct work for clear changes, one decision for material ambiguity, concise
  design approval for architecture, and root-cause investigation for uncertain
  defects.
- Use focused TDD for reproduced defects and stable contracts. Stabilize
  uncertain design before expanding tests.
- Use proportionate validation. Before handoff, run targeted automated checks
  and named manual scenarios. Escalate to broader suites only for cross-cutting
  risk, repository release rules, or an explicit request.
- Review, PR creation, merge, release, and deployment are separate actions. A
  continuation command does not restart completed lifecycle phases.
- CI provides nightly and release confidence, not per-PR approval.
<!-- <<< kai repository instructions <<< -->

## Releasing this plugin

These steps apply **only when your change modifies the kai plugin repo itself**
(`agents/`, `skills/`, `src/`, `tools/`, a committed `plugins/` tree, or `plugin.json`) —
never to work done in a consumer workspace. Users pull updates with
`copilot plugin update <pack>@kai-plugins`, so the version is descriptive
metadata, not an update gate;
keep it honest anyway.

Any PR that changes shipped plugin behavior must, in the **same PR**:

1. Set the version only through
   `npm version <x.y.z> --no-git-tag-version`. `package.json` is the edited
   authority. In a clean checkout run `npm ci`, then `npm run build`; the build
   writes `plugin.json`, every package manifest and lock, all marketplace
   version fields, generated references, and bundled consumer scripts.
2. Add a dated **`CHANGELOG.md`** entry under the new version
   (Added / Changed / Fixed / Removed as relevant) **and its `[x.y.z]:`
   comparison link**. Refresh the README `## Status` text.
3. If you added, removed, or renamed an agent or skill, file it in `CATEGORIES`
   in `tools/generate-catalog.mjs`; `npm run build` regenerates
   `docs/reference/agents-and-skills.md`.
4. Run the agreed local validation and record the exact evidence and
   unverified areas in the PR. Kai has no pull-request or push CI.

The daily Linux/Node 24 nightly runs `npm test`, `npm run build:check`,
`npm run consumer-install:self-test`, and release readiness. The Monday
workflow tags and creates the GitHub release only from the exact successful
nightly SHA. Do not tag or publish from a feature PR.

If the expected previous tag is absent locally, fetch tags or use a
deterministic merge-base ref for release-readiness. Never weaken the check to
hide a missing ref. The changelog comparison link still names the documented
previous released version.

Pick the number by semver (full table in
`docs/reference/plugin-structure.md` → **Versioning**):
while pre-1.0, both features and breaking changes are a **minor** bump and fixes
are a **patch**; after 1.0, breaking changes are **major**, features **minor**,
fixes **patch**. Docs- or test-only changes need no bump.
