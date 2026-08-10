[kai](../README.md) / Docs

# kai documentation

Four guides and a reference. Start wherever your question is.

| Guide | Read it when |
| ----- | ------------ |
| [Getting started](getting-started.md) | You want kai installed and one real piece of work finished. Covers install, optional audio and browser setup, the first request, updating, and migrating an existing workspace. |
| [How kai works](how-kai-works.md) | You want to know which role fires when, and how work travels from a need to production. Includes every flow diagram and the trigger table. |
| [Workspace model](workspaces.md) | You want to know what kai writes to your repo, where, and why — the `.kai/` and `kai/` contract, promotion to the library, and how agents talk to each other. |
| [Host capabilities](host-capabilities.md) | You are choosing between the Copilot CLI and the cloud coding agent, or wondering why a capability behaves differently. Also explains how kai's shared rules reach your session. |

**Reference**

| Page | Contents |
| ---- | -------- |
| [Agents & skills](reference/agents-and-skills.md) | The full catalog of all 56 agents and 42 skills, generated from their shipped frontmatter so it cannot drift. |
| [Plugin structure](reference/plugin-structure.md) | The layout of this repository, and what to run before opening a PR. |

**Elsewhere in the repo**

- [`examples/e2e-feature-delivery/`](../examples/e2e-feature-delivery/) — a
  committed, CI-validated workspace showing one feature carried from brief to
  production. The fastest way to see what kai actually produces.
- [`examples/proactive-runner/`](../examples/proactive-runner/) — the external
  runner pattern for pushed updates.
- [`CHANGELOG.md`](../CHANGELOG.md) — every release, with rationale.

---

**Next:** [Getting started](getting-started.md) · [How kai works](how-kai-works.md)
