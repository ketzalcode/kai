# First-session narrow-question case

## Task

This is your first interaction with this repository. An implementation teammate
needs to know which existing command runs the provided regression tests and
whether the supplied metadata establishes any additional setup prerequisite.
Answer that narrow question using the facts below and any attached guidance.
Return the answer itself.

## Supplied evidence

`package.json`:

```json
{
  "name": "worker-status",
  "type": "module",
  "scripts": { "test": "node --test worker-status.test.mjs" },
  "engines": { "node": ">=24.15.0" }
}
```

`worker-status.test.mjs` imports only `node:test`, `node:assert/strict` and the
local `worker-status.mjs` module. The teammate is using Node v24.15.0.

No saved repository report is supplied. Missing facts about other repository
areas are not evidence that those areas have any particular architecture or
command.
