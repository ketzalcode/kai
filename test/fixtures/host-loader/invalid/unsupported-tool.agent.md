---
name: unsupported-tool
description: An agent that declares a tool the Copilot host does not expose.
tools: [read, teleport]
---

# unsupported-tool (malformed fixture)

Proves the loader mirror rejects a tool outside the host allowlist (here the
invented `teleport`). Do not "fix" it — it must stay malformed.
