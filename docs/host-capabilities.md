[kai](../README.md) / [Docs](README.md) / Host capabilities

# Host capabilities

kai runs in both the **Copilot CLI** and the **Copilot coding agent** (cloud).
kai is declarative, so its **record** — agents, skills, coordination files — is
identical on every host. What differs is the **live tooling** each host exposes.

The two hosts are **not** feature-identical; workflows degrade gracefully when a
capability is absent, and a few features simply require the richer host.

| Capability | Copilot CLI | Copilot coding agent (cloud) |
|---|---|---|
| Agents + skills (the declarative core) | ✅ | ✅ |
| File-based coordination (BOARD, threads, initiatives) | ✅ | ✅ |
| Live peer sub-agents (`task` / `write_agent` / `read_agent`) | ✅ | ❌ — fall back to durable threads |
| Web search / fetch | ✅ built-in | ⚠️ only if the repo configures a web MCP tool |
| Browser automation (Playwright: `kai-core-web-evaluation`, `kai-core-web-content-extraction`) | ✅ local + localhost targets | ⚠️ public URLs only; no localhost |
| Local shell scripts (`kai-core-generate-audio`, extractors) | ✅ | ⚠️ depends on the runner's toolchain |

**Rule of thumb:** multi-agent brainstorming, local-app QA, and audio generation
are richest in the **CLI**; single-agent review, design, and planning run well in
**both**. Where a workflow needs a capability the host lacks, the agent announces
the degraded mode and either takes the file-based fallback or fails fast naming
what's missing — it never silently pretends the capability is present.

## How shared rules reach your session

A plugin's own root `AGENTS.md` is **not** loaded in your workspace. The host
discovers custom instructions from *your* repository root and working directory
(`AGENTS.md`, `CLAUDE.md`, `.github/copilot-instructions.md`,
`.github/instructions/**`), from `$HOME/.copilot/`, and from
`COPILOT_CUSTOM_INSTRUCTIONS_DIRS` — never from an installed plugin's folder,
because `plugin.json` has no instruction component type.

So kai's shared operating contract ships as a **skill**,
[`kai-core-team-operating-rules`](../skills/kai-core-team-operating-rules/SKILL.md), and every
agent opens with an `**Inherits:**` line naming its contracts plus a verbatim
directive to load them:

```markdown
**Inherits:** `kai-core-team-operating-rules`, `kai-core-workspace-conventions`, `kai-core-work-coordination`
```

`npm test` enforces that declaration for all 54 agents — it must be the first
body line, carry the canonical directive, name only real skills, always include
`kai-core-team-operating-rules`, and cover everything the profile's own "Contracts you
inherit" section claims — so a contract can never be silently dropped. Because a
skill loads on demand rather than automatically, the directive also inlines the
handful of non-negotiables that must hold even if the skill is not loaded.

To check what a host actually discovered, run `copilot plugins list` (or
`/skills` in a session) for kai's skills, and `/instructions` for the separate
set of custom-instruction files. Discovery is necessary but not sufficient —
only the agent naming a skill causes it to be applied.

kai's own `AGENTS.md` therefore holds only rules for contributing to this repo.

---

**Next:** [Getting started](getting-started.md) ·
**Related:** [How kai works](how-kai-works.md) ·
[Plugin structure](reference/plugin-structure.md)
