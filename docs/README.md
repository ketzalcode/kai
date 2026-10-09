[kai](../README.md) / Docs

# Kai documentation

The active documentation describes only the current system.

| Page | Use it for |
| --- | --- |
| [Architecture](architecture.md) | Three-package topology, authority map, build boundary, consumer runtime, assets, and host capabilities |
| [Workspaces](workspaces.md) | Current schema 5, onboarding, re-onboarding, private paths, publication, and coordination |
| [Development process](development-process.md) | Fast-ship profile, validation levels, nightly checks, version/build workflow, and Monday releases |
| [Plugin structure](reference/plugin-structure.md) | Repository layout, contributor authoring rules, build mechanics, and semantic versioning |
| [Agents & skills](reference/agents-and-skills.md) | Generated catalog of the active three-package surface |
| [Approved design](designs/development-system-simplification.md) | Durable rationale and exit criteria for the current development architecture |

Kai ships `kai-core`, `kai-engineering`, and `kai-creative`. Five other
capability packages remain inactive under [`incubator/`](../incubator/README.md).

`docs/kai/` demonstrates accepted project publication. Private drafts,
evidence, scratch files, and coordination state belong under an ignored
`.kai/` workspace and are never part of the documentation tree.

Release history remains in [`CHANGELOG.md`](../CHANGELOG.md).
