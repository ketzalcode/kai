[kai](../README.md) / Docs

# kai documentation

Four guides and package references. Start wherever your question is. The current
source has eight packages and prepared `7.0.0` metadata, not a verified remote
release. Install core plus the capabilities needed from a source containing
this refactor; see the availability and replacement guidance in Getting started.

| Guide | Read it when |
| ----- | ------------ |
| [Getting started](getting-started.md) | You want kai installed and one real piece of work finished. Covers install, optional audio and browser setup, the first request, updating, and migrating an existing workspace. |
| [How kai works](how-kai-works.md) | You want to know which role fires when, and how work travels from a need to production. Includes every flow diagram and the trigger table. |
| [Workspace model](workspaces.md) | You want to choose external, repo-local, or shared state and understand explicit project publication under `docs/kai/`. |
| [Host capabilities](host-capabilities.md) | You are choosing between the Copilot CLI and the cloud coding agent, or wondering why a capability behaves differently. Also explains how kai's shared rules reach your session. |

**Reference**

| Page | Contents |
| ---- | -------- |
| [Agents & skills](reference/agents-and-skills.md) | The full catalog of all 56 agents and 57 skills, generated from their shipped frontmatter so it cannot drift. |
| [Package: `kai-assistant`](reference/packages/kai-assistant.md) | What the personal-assistance package owns, where its private state lives, its acceptance scenarios, and its current limitations. |
| [Package: `kai-creative`](reference/packages/kai-creative.md) | UI/UX, visual identity and media; supplied-input boundaries and demo-runtime prerequisites. |
| [Package: `kai-product`](reference/packages/kai-product.md) | Discovery, scope, analytics, growth and product assessment; independent acceptance boundaries. |
| [Package: `kai-marketing`](reference/packages/kai-marketing.md) | Positioning, campaigns, social and search; factual grounding without compulsory sibling producers. |
| [Package: `kai-revenue`](reference/packages/kai-revenue.md) | Six commercial/customer roles, no local skills; human authority and escalation limits. |
| [Package: `kai-learning`](reference/packages/kai-learning.md) | Teaching, paths, materials and career development; separate Markdown, HTML and audio outcomes. |
| [Plugin structure](reference/plugin-structure.md) | The layout of this repository, and what to run before opening a PR. |

`kai-core` owns shared contracts, workspace machinery and requested coordination;
`kai-engineering` owns implementation, architecture, reliability, trust and
technical writing. Their source boundaries remain intact. All eight owners and
their 56 agent / 57 skill IDs are listed in the generated catalog.

**Elsewhere in the repo**

- [`examples/e2e-feature-delivery/`](../examples/e2e-feature-delivery/) — a
  committed, CI-validated workspace showing one feature carried from brief to
  production. The fastest way to see what kai actually produces.
- [`examples/proactive-runner/`](../examples/proactive-runner/) — the external
  runner pattern for pushed updates.
- [`CHANGELOG.md`](../CHANGELOG.md) — every release, with rationale.

---

**Next:** [Getting started](getting-started.md) · [How kai works](how-kai-works.md)
