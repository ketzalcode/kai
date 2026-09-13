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
| Live peer sub-agents (`agent` / `write_agent` / `read_agent`) | ✅ | ❌ — fall back to durable threads |
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

So kai's shared contracts ship as **skills** — the universal operating rules in
[`kai-core-operating-rules`](../plugins/kai-core/skills/kai-core-operating-rules/SKILL.md),
with the workspace, work, and asset contracts beside it. An agent names each
skill in the imperative, at the exact instruction that needs it, and routes
`kai-core-contract-v1` before its first other core skill:

```markdown
Invoke `kai-core-contract-v1` before the first other core skill.
Load `kai-core-work-item` before writing an item record.
```

`npm test` enforces those routes so a required contract can never be silently
dropped, and checks that each agent names `.kai` and carries an
install-or-update instruction that names the `kai-core` package in the same
paragraph as its core route — a loose vocabulary-and-placement check that
accepts any of several verbs, not one fixed phrase. What the refusal says in the
agent's own words, and that it narrows the agent to bounded direct work, is
judged in review rather than by CI. Because a skill loads on demand rather
than automatically, each route sits at the step whose rule it carries. All
eight current packages use task-local routes, without eager declarations or
dependency-guard blocks. The current refactor was inspected at source level;
effective tool grants, skill execution and degraded-mode behavior have not
been rerun in either host.

To check what a host actually discovered, run `copilot plugins list` (or
`/skills` in a session) for kai's skills, and `/instructions` for the separate
set of custom-instruction files. Discovery is necessary but not sufficient —
only the agent naming a skill causes it to be applied.

kai's own `AGENTS.md` therefore holds only rules for contributing to this repo.

---

**Next:** [Getting started](getting-started.md) ·
**Related:** [How kai works](how-kai-works.md) ·
[Plugin structure](reference/plugin-structure.md)
