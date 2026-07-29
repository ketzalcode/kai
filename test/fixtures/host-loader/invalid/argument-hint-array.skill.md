---
name: argument-hint-array
description: A skill whose argument-hint is an inline array — the Copilot CLI silently rejects this shape at load (the #23 bug).
tools: [view, grep]
user-invocable: true
argument-hint: [file, area]
---

# argument-hint-array (malformed fixture)

This fixture exists to prove the host-loader mirror rejects an `argument-hint`
declared as an inline array. Do not "fix" it — it must stay malformed.
