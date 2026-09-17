[kai](../README.md) / [Docs](README.md) / Host capabilities

# Host capabilities

kai runs in both the **Copilot CLI** and the **Copilot coding agent** (cloud).
kai is declarative, so its **record** — agents, skills, coordination contracts —
is identical on every host, and its coordination runtime is plain local Node
plus SQLite rather than a service. What differs is the **live tooling** each
host exposes.

The two hosts are **not** feature-identical; workflows degrade gracefully when a
capability is absent, and a few features simply require the richer host.

| Capability | Copilot CLI | Copilot coding agent (cloud) |
|---|---|---|
| Agents + skills (the declarative core) | ✅ | ✅ |
| Coordination runtime (`scripts/coordinate.mjs`, schema-4 store) | ✅ | ⚠️ read-only in practice — see the gap below |
| Live peer sub-agents (`agent` / `write_agent` / `read_agent`) | ✅ | ❌ — fall back to the durable record |
| Peer model/effect observation | ❌ `UNSUPPORTED_HOST` | ❌ `UNSUPPORTED_HOST` |
| Native session `resume` | ❌ not advertised | ❌ not advertised |
| Web search / fetch | ✅ built-in | ⚠️ only if the repo configures a web MCP tool |
| Browser automation (Playwright: `kai-core-web-evaluation`, `kai-core-web-content-extraction`) | ✅ local + localhost targets | ⚠️ public URLs only; no localhost |
| Local shell scripts (`kai-core-generate-audio`, extractors) | ✅ | ⚠️ depends on the runner's toolchain |

**Rule of thumb:** multi-agent brainstorming, local-app QA, and audio generation
are richest in the **CLI**; single-agent review, design, and planning run well in
**both**. Where a workflow needs a capability the host lacks, the agent announces
the degraded mode and either takes the recorded fallback or fails fast naming
what's missing — it never silently pretends the capability is present.

## The coordination runtime's host gap

The runtime itself is plain local Node plus SQLite, not a service — but it
cannot **create** a store on a host that has no `ask_user` journal, and the
cloud coding agent is such a host.

Every coordinated write requires an issued capability, and the only two issuers
are `authorize` and `delegate`. `delegate` can only subdivide a capability that
already exists, so the chain starts at `authorize`, which resolves a human
decision by re-reading the host's own event journal: it requires
`COPILOT_AGENT_SESSION_ID` **and** an existing
`~/.copilot/session-state/<id>/events.jsonl` containing the matching `ask_user`
tool call. Without that journal the lookup fails with `UNSUPPORTED_HOST` — *this
context has no standalone journal*.

The consequence is concrete: `init` requires an authorized capability, so on a
journal-less host it can never succeed, the store is never created, and every
verb except `inspect` then refuses with `SCHEMA_MISMATCH` — *coordination store
is missing; use explicit authorized init*. So on the cloud coding agent, treat
the coordination runtime as **inspect-only**: schema reads work, coordinated
work does not. A store created elsewhere and carried in is out of scope here —
that has not been measured.

This gap is a host-journal dependency, not a missing feature in kai, and it has
not been closed on any host.

## What has actually been measured

Metadata-only ACP discovery was exercised against a real Copilot CLI **1.0.85**:
`session/new` returned the qualified agent roster and the approved model IDs, no
model prompt was sent, and the transport closed. One further probe reserved work
through the runtime and launched a standalone session whose prepared ID, journal,
selected role and ordering all matched. That launched worker **actually ran both
exact canonical commands** — one reporting its environment identity, one making
a read-only claim — and both the environment identity and the genuine CLI
receipt matched the prepared reservation, while the authoritative runtime
summary stayed unchanged. Its **human authorization was an explicitly synthetic
isolated fixture**, not a real approval.

So: role discovery, launch ordering, and those two exact worker commands are
measured. Nothing else is — not real human approval, not any other tool start,
not a coordinated multi-role workflow, not another host. Peer model/effect
observation returns `UNSUPPORTED_HOST` by
design, and `plan` reports `automatic: false` — kai never dispatches a role by
itself. Treat anything beyond the measured probe as designed behavior awaiting
host acceptance.

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
