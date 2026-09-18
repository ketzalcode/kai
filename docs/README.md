[kai](../README.md) / Docs

# kai documentation

Four guides and package references. Start wherever your question is. kai ships
three packages — `kai-core`, `kai-engineering`, and `kai-creative` — at
prepared `13.0.0` metadata, which is not a verified remote release. Five
further capability packages are parked under
[`incubator/`](../incubator/README.md) and do not ship.

| Guide | Read it when |
| ----- | ------------ |
| [Getting started](getting-started.md) | You want kai installed and one real piece of work finished. Covers install, optional audio and browser setup, the first request, updating, and migrating an existing workspace. |
| [How kai works](how-kai-works.md) | You want to know which role fires when, and how work travels from a need to production. Includes every flow diagram and the trigger table. |
| [Workspace model](workspaces.md) | You want to choose external, repo-local, or shared state and understand explicit project publication under `docs/kai/`. |
| [Host capabilities](host-capabilities.md) | You are choosing between the Copilot CLI and the cloud coding agent, or wondering why a capability behaves differently. Also explains how kai's shared rules reach your session. |

**Reference**

| Page | Contents |
| ---- | -------- |
| [Agents & skills](reference/agents-and-skills.md) | The full catalog of what the three shipping packages supply. |
| [Package availability](reference/package-availability.md) | What ships, what is incubated, and what "incubated" actually excludes. |
| [Package: `kai-engineering`](reference/packages/kai-engineering.md) | Thirteen direct-use engineering roles, five task-local skills, model/authority boundaries, and deferred fleet wiring. |
| [Package: `kai-creative`](reference/packages/kai-creative.md) | UI/UX, visual identity and media; supplied-input boundaries and demo-runtime prerequisites. |
| [Plugin structure](reference/plugin-structure.md) | The layout of this repository, and what to run before opening a PR. |

`kai-core` owns shared contracts, workspace machinery and requested
coordination; `kai-engineering` owns implementation, architecture, reliability,
trust and technical writing; `kai-creative` owns design and media. Cross-agent
routing to retired engineering identities is deferred; use the engineering
package reference for direct work, and the
[incubator index](../incubator/README.md) for what is parked.

**Elsewhere in the repo**

- [`examples/e2e-feature-delivery/`](../examples/e2e-feature-delivery/) — a
  committed, CI-validated workspace showing one feature carried from brief to
  production. The fastest way to see what kai actually produces.
- [`examples/proactive-runner/`](../examples/proactive-runner/) — the external
  runner pattern for pushed updates.
- [`CHANGELOG.md`](../CHANGELOG.md) — every release, with rationale.

---

**Next:** [Getting started](getting-started.md) · [How kai works](how-kai-works.md)
