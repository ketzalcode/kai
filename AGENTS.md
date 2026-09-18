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
| Granting and reconciling work: leases, lifecycle, recovery, dispatch, backlog, board | `kai-core-work-granting` |
| The durable work-item record and its schema | `kai-core-work-item` |
| Workspace resolution, `.kai` layout, storage modes, artifact paths | `kai-core-workspace-paths` |
| Initiative layout, coordination, closure, and the schema-3 manifest | `kai-core-workspace-initiative` |
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
reintroduce their eager declarations or dependency guards. `.kai/personal/`
remains the private data lane and is unrelated to plugin retirement.

The install owners are `kai-core`, `kai-engineering`, and `kai-creative`.
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

## Communicating with the operator

The block below is the one thing kai ships that binds the **main CLI agent**
rather than a kai agent. The host loads `AGENTS.md` from the *user's*
repository, never from a plugin, so `kai-core-operating-rules` — which governs how
kai roles talk to each other — cannot reach the top-level assistant that
actually replies to a human. A consumer opts into this block at onboarding;
kai carries it here because a style we ship and do not use ourselves is a
recommendation nobody tested.

The block's canonical text lives in `scripts/lib/communication-style-block.md`,
`kai-core-workspace-onboarding` installs it into a consumer's `AGENTS.md` on
explicit opt-in, and `npm test` fails if this file's copy drifts from the
canonical one, if the markers are missing, or if onboarding stops referencing
it. **Edit the canonical file, never this copy.**

<!-- >>> kai communication style (managed by workflow-workspace-init) >>> -->
## Communication style

Think broadly, communicate narrowly. Simple English, short sentences,
bullets and small tables over paragraphs. Write as a teammate, not a
consultant.

**Don't narrate.** No play-by-play of searches, tool calls, edits, or
checks that passed. During autonomous work, speak only for a decision, a
blocker, a failure, or a material change. Otherwise keep working and
report at the end.

**Match the shape to the moment.**

- Factual question — answer it. No preamble, no structure.
- Decision — recommendation first, at most three options with real
  trade-offs, one marked Recommended. End with a single question.
- Finished work — the outcome, the evidence that settles it, what a
  review found and what you fixed, what you could **not** verify, and one
  next action. Then stop.

**Never trade truth for brevity.** Never drop failures, uncertainty,
review findings, or unverified claims to hit a length target. Never
claim something was verified without saying how. If it wasn't checked,
say so. Target 200 words and exceed it when the evidence needs the room.

**Don't print ten follow-ups.** Say what you found and offer to file the
rest as issues or backlog items.

Durable architecture, API, schema, or UI decisions belong in a repository
document. The terminal gets the result and the link.
<!-- <<< kai communication style <<< -->

## Releasing this plugin

These steps apply **only when your change modifies the kai plugin repo itself**
(`agents/`, `skills/`, `scripts/`, a committed `plugins/` tree, or `plugin.json`) —
never to work done in a consumer workspace. Users pull updates with
`copilot plugin update <pack>@kai-plugins`, so the version is descriptive
metadata, not an update gate;
keep it honest anyway.

Any PR that changes shipped plugin behavior must, in the **same PR**:

1. Bump the version in **`plugin.json`**, **`package.json`**, and
   **`.github/plugin/marketplace.json`** (both `metadata.version` and
   every `plugins[]` entry) together — `npm version <x.y.z> --no-git-tag-version`,
   then set the other two to match. CI rejects a stale marketplace index,
   because it installs fine while reporting the wrong version. Run
   `npm install` if you touched dependencies so `package-lock.json` stays in
   sync; version-only changes do not require an install. Regenerate every
   package manifest/lock/script with `npm run pack-preview -- --write`.
2. Add a dated **`CHANGELOG.md`** entry under the new version
   (Added / Changed / Fixed / Removed) **and its `[x.y.z]:` compare link**, and
   refresh the README `## Status` stamp.
3. If you added, removed, or renamed an agent or skill, file it in `CATEGORIES`
   in `scripts/generate-catalog.mjs`, then run `npm run docs:generate` and
   commit `docs/reference/agents-and-skills.md`. `npm test` fails until both are
   done.
4. Run `npm test`, then open the PR.

CI **enforces** all of this: a behavior-sensitive change (`agents/`, `skills/`,
`scripts/`, a committed `plugins/` tree, or the dependency manifests) that lacks a
version bump plus changelog/README updates fails the `release-guard` gate, and the
static checks reject a missing changelog section/link, a stale README stamp, a
stale generated catalog, or a `package.json` ↔ `package-lock.json` mismatch. Docs-
and test-only changes are exempt.

After it merges to `main`, tag `vX.Y.Z` and cut the matching GitHub release from
that changelog entry.

Pick the number by semver (full table in
`docs/reference/plugin-structure.md` → **Versioning & releases**):
while pre-1.0, both features and breaking changes are a **minor** bump and fixes
are a **patch**; after 1.0, breaking changes are **major**, features **minor**,
fixes **patch**. Docs- or test-only changes need no bump.

The historical `1.0.0` milestone made packs the install surface (#29).
Current changes follow the post-1.0 column. Incubating the five unfinished
capability packages prepares `13.0.0` because it removes five package names
from the shipped surface; prepared metadata is not a tag, release,
publication, or host-verification claim.
