# Contributing to the kai plugin repo

These are the **repo-local** rules for changing kai itself. They apply to work
inside this repository only.

> **The shared operating contract lives in `skills/team-operating-rules/SKILL.md`,
> not here.** A plugin's own root `AGENTS.md` is never loaded as custom
> instructions in a consumer workspace — the host reads `AGENTS.md` only from
> the user's repository root and working directory. Rules placed here reach kai
> contributors and nobody else. Anything that must bind agent behaviour in every
> workspace belongs in the `team-operating-rules` skill, and every agent
> declares it on its `**Inherits:**` line.

## Where the rules live

| Concern | Home |
| --- | --- |
| Role taxonomy, ownership boundaries, acting-agent loop, test ownership, completion ladder, communication, `@operator` | `skills/team-operating-rules/SKILL.md` |
| Workspace roots, schema version, artifact targets | `skills/workspace-conventions/SKILL.md` |
| Item lifecycle, leases, handoffs | `skills/work-coordination/SKILL.md` |
| Persona-specific craft | `agents/*.agent.md` |
| Releasing this plugin | this file, below |

## Declaring inherited contracts

Every agent carries exactly one `**Inherits:**` line as the first line of its
body, directly under the frontmatter, listing the skills that bind it, followed
by the verbatim directive in `scripts/lib/inherits-block.txt`:

```markdown
**Inherits:** `team-operating-rules`, `workspace-conventions`, `work-coordination`
```

`npm test` enforces that the line exists exactly once and comes first, that the
directive matches the canonical text byte for byte, that every skill it names
exists, that every agent inherits `team-operating-rules`, that every
`director-*` / `principal-*` / `workflow-*` agent also inherits
`workspace-conventions`, and that every skill claimed by a profile's
"Contracts you inherit" section or by inheritance prose appears on the line.

The directive is deliberately duplicated into every agent rather than
referenced, because a skill loads on demand: an agent that never names it never
receives it. Keeping the text in one file and pinning it in CI is what stops the
copies from drifting.

## Releasing this plugin

These steps apply **only when your change modifies the kai plugin repo itself**
(`agents/`, `skills/`, `scripts/`, or `plugin.json`) — never to work done in a
consumer workspace. Users pull updates with `/plugin update kai`, so the version
is descriptive metadata, not an update gate; keep it honest anyway.

Any PR that changes shipped plugin behavior must, in the **same PR**:

1. Bump the version in **`plugin.json`** and **`package.json`** together
   (`npm version <x.y.z> --no-git-tag-version`, then set `plugin.json` to match).
   Run `npm install` if you touched dependencies so `package-lock.json` stays in
   sync.
2. Add a dated **`CHANGELOG.md`** entry under the new version
   (Added / Changed / Fixed / Removed) **and its `[x.y.z]:` compare link**, and
   refresh the README `## Status` stamp.
3. Run `npm test`, then open the PR.

CI **enforces** all of this: a behavior-sensitive change (`agents/`, `skills/`,
`scripts/`, or the dependency manifests) that lacks a version bump plus
changelog/README updates fails the `release-guard` gate, and the static checks
reject a missing changelog section/link, a stale README stamp, or a
`package.json` ↔ `package-lock.json` mismatch. Docs- and test-only changes are
exempt.

After it merges to `main`, tag `vX.Y.Z` and cut the matching GitHub release from
that changelog entry.

Pick the number by semver (full table in README → **Versioning & releases**):
while pre-1.0, both features and breaking changes are a **minor** bump and fixes
are a **patch**; after 1.0, breaking changes are **major**, features **minor**,
fixes **patch**. Docs- or test-only changes need no bump.

