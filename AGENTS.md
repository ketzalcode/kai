# Contributing to the kai plugin repo

These are the **repo-local** rules for changing kai itself. They apply to work
inside this repository only.

> **The shared operating contract lives in `plugins/kai-core/skills/kai-core-team-operating-rules/SKILL.md`,
> not here.** A plugin's own root `AGENTS.md` is never loaded as custom
> instructions in a consumer workspace — the host reads `AGENTS.md` only from
> the user's repository root and working directory. Rules placed here reach kai
> contributors and nobody else. New `kai-agent-v1` agents route that contract
> just in time before coordinated Kai work; legacy agents still declare it on
> their `**Inherits:**` line until migration.

## Where the rules live

| Concern | Home |
| --- | --- |
| Role taxonomy, ownership boundaries, acting-agent loop, test ownership, completion ladder, communication, `@operator` | `plugins/kai-core/skills/kai-core-team-operating-rules/SKILL.md` |
| Workspace roots, schema version, artifact targets | `plugins/kai-core/skills/kai-core-workspace-conventions/SKILL.md` |
| Item lifecycle, leases, handoffs | `plugins/kai-core/skills/kai-core-work-coordination/SKILL.md` |
| Persona-specific craft | `plugins/*/agents/*.agent.md` |
| Releasing this plugin | this file, below |

## Routing shared contracts

New and materially migrated agents use `kai-agent-v1`. They declare a
`## Skills on demand` section with one explicit activation trigger per skill.
They do not preload skills, carry an `**Inherits:**` line, or embed the legacy
core dependency guard. They call `kai-core-contract-v1` just before their first
other core skill. If core is unavailable, ordinary single-shot domain work may
continue, but Kai coordination and `.kai` state may not. The agent states that
limitation once and tells the operator to install or update `kai-core`.

Pre-`kai-agent-v1` agents retain exactly one `**Inherits:**` line as the first
line of the body and the verbatim directive in `scripts/lib/inherits-block.txt`:

```markdown
**Inherits:** `kai-core-team-operating-rules`, `kai-core-workspace-conventions`, `kai-core-work-coordination`
```

`npm test` preserves that legacy contract while validating that
`kai-agent-v1` roles instead provide required on-demand routes and carry no
legacy guard.

The legacy directive remains byte-pinned only for unmigrated agents. Do not copy
it into a new role.

The same reasoning applies to the communication-style block below, for the
opposite reason: it must reach the **main CLI agent**, which loads no skill and
no agent file at all. Its canonical text lives in
`scripts/lib/communication-style-block.md`, `kai-core-workspace-onboarding` installs it
into a consumer's `AGENTS.md` on explicit opt-in, and `npm test` fails if this
file's copy drifts from the canonical one, if the markers are missing, or if
onboarding stops referencing it. **Edit the canonical file, never this copy.**

## Communicating with the operator

The block below is the one thing kai ships that binds the **main CLI agent**
rather than a kai agent. The host loads `AGENTS.md` from the *user's*
repository, never from a plugin, so `kai-core-team-operating-rules` — which governs how
kai roles talk to each other — cannot reach the top-level assistant that
actually replies to a human. A consumer opts into this block at onboarding;
kai carries it here because a style we ship and do not use ourselves is a
recommendation nobody tested.

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
   **`.github/plugin/marketplace.json`** (both `metadata.version` and the
   `plugins[]` entry) together — `npm version <x.y.z> --no-git-tag-version`,
   then set the other two to match. CI rejects a stale marketplace index,
   because it installs fine while reporting the wrong version. Run
   `npm install` if you touched dependencies so `package-lock.json` stays in
   sync.
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

**`1.0.0` is reserved** for the release in which packs become the install
surface — `kai-core` plus department packs replacing the single `kai` plugin
(#29). Nothing else takes the major, and it is not cut early to signal
maturity: groundwork for the split stays on `0.x` however substantial, because a
consumer's install command has not changed. See **What `1.0.0` is reserved for**
in `docs/reference/plugin-structure.md` for the gates it waits on.
