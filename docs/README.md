[kai](../README.md) / Docs

# kai documentation

Four guides and package references. Start wherever your question is. The current
source has eight packages and prepared `11.0.0` metadata, not a verified remote
release. The default marketplace surface is core, engineering, and creative;
assistant, product, marketing, revenue, and learning remain source-retained
pre-release packages. See the availability and replacement guidance in Getting
started and the package-availability reference.

| Guide | Read it when |
| ----- | ------------ |
| [Getting started](getting-started.md) | You want kai installed and one real piece of work finished. Covers install, optional audio and browser setup, the first request, updating, and migrating an existing workspace. |
| [How kai works](how-kai-works.md) | You want to know which role fires when, and how work travels from a need to production. Includes every flow diagram and the trigger table. |
| [Workspace model](workspaces.md) | You want to choose external, repo-local, or shared state and understand explicit project publication under `docs/kai/`. |
| [Host capabilities](host-capabilities.md) | You are choosing between the Copilot CLI and the cloud coding agent, or wondering why a capability behaves differently. Also explains how kai's shared rules reach your session. |

**Reference**

| Page | Contents |
| ---- | -------- |
| [Agents & skills](reference/agents-and-skills.md) | The full catalog of all 50 agents and 46 skills, split across default and pre-release packages. |
| [Package availability](reference/package-availability.md) | Which package IDs are on the default marketplace surface and which remain source-retained pre-release. |
| [Package: `kai-engineering`](reference/packages/kai-engineering.md) | Thirteen direct-use engineering roles, five task-local skills, model/authority boundaries, and deferred fleet wiring. |
| [Package: `kai-assistant`](reference/packages/kai-assistant.md) | What the personal-assistance package owns, where its private state lives, its acceptance scenarios, and its current limitations. |
| [Package: `kai-creative`](reference/packages/kai-creative.md) | UI/UX, visual identity and media; supplied-input boundaries and demo-runtime prerequisites. |
| [Package: `kai-product`](reference/packages/kai-product.md) | Discovery, scope, analytics, growth and product assessment; independent acceptance boundaries. |
| [Package: `kai-marketing`](reference/packages/kai-marketing.md) | Positioning, campaigns, social and search; factual grounding without compulsory sibling producers. |
| [Package: `kai-revenue`](reference/packages/kai-revenue.md) | Seven commercial/customer and solution-fit roles, no local skills; human authority and escalation limits. |
| [Package: `kai-learning`](reference/packages/kai-learning.md) | Teaching, paths, materials and career development; separate Markdown, HTML and audio outcomes. |
| [Plugin structure](reference/plugin-structure.md) | The layout of this repository, and what to run before opening a PR. |

`kai-core` owns shared contracts, workspace machinery and requested
coordination; `kai-engineering` owns implementation, architecture, reliability,
trust and technical writing. The generated catalog still lists all 50 agent / 46
skill IDs, but the default marketplace surface is only core, engineering, and
creative. Cross-agent routing to retired engineering identities is deferred;
use the engineering package reference for direct work and the package
availability page for the pre-release split.

**Elsewhere in the repo**

- [`examples/e2e-feature-delivery/`](../examples/e2e-feature-delivery/) — a
  committed, CI-validated workspace showing one feature carried from brief to
  production. The fastest way to see what kai actually produces.
- [`examples/proactive-runner/`](../examples/proactive-runner/) — the external
  runner pattern for pushed updates.
- [`CHANGELOG.md`](../CHANGELOG.md) — every release, with rationale.

---

**Next:** [Getting started](getting-started.md) · [How kai works](how-kai-works.md)
