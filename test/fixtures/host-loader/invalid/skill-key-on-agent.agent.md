---
name: skill-key-on-agent
description: An agent that carries a skill-only frontmatter key (user-invocable).
tools: [read]
user-invocable: true
---

# skill-key-on-agent (malformed fixture)

Proves the loader mirror rejects a skill-only affordance
(`user-invocable`/`argument-hint`/`allowed-tools`) on an agent. Do not "fix" it —
it must stay malformed.
