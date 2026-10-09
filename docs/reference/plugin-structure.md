[kai](../../README.md) / [Docs](../README.md) / Plugin structure

# Plugin structure

This page is for contributors changing Kai itself. Product installation and
first-use instructions are in the root [README](../../README.md).

## Repository layout

```text
kai/
|-- AGENTS.md                         binding contributor instructions
|-- package.json                      edited release-version authority
|-- CHANGELOG.md                      manually authored release notes
|-- plugins/
|   |-- kai-core/
|   |-- kai-engineering/
|   `-- kai-creative/
|-- src/core/                         Core runtime source
|-- src/creative/                     Creative runtime source
|-- tools/                            build and release tooling
|-- test/                             lean behavioral suite
|-- docs/                             active durable documentation
|-- incubator/                        inactive, non-installable source
|-- plugin.json                       generated root metadata
`-- .github/plugin/marketplace.json   generated marketplace metadata
```

Agents and skills are declarative Markdown with YAML frontmatter. Their owning
package directory is authoritative. Core may not depend on a department;
Engineering and Creative may depend on Core but not on each other. Incubated
source is excluded from discovery, validation, generation, and installation.

## Authoring agents and skills

- Add an agent or skill only for a durable recurring responsibility.
- Keep authority, refusal boundaries, tools, inputs, outputs, and handoffs
  explicit.
- Load shared contracts at the instruction that needs them; do not restore
  eager inheritance lists or dependency-guard prose.
- Give every skill a real firing path through an agent route or explicit user
  invocation.
- Durable producers declare their package-local publication entry point.
- Put package publication vocabulary in `plugins/<pack>/publication.json`, not
  in a validator that parses explanatory prose.
- When an agent or skill is added, removed, or renamed, update `CATEGORIES` in
  `tools/generate-catalog.mjs`; the build regenerates
  `docs/reference/agents-and-skills.md`.

New durable roles use `<provider>-<posture>-<scope>`, with the provider,
posture, and scope chosen from the repository's current validator constants.
Existing names remain stable unless the change explicitly breaks that surface.

## Build boundary

Use:

```powershell
npm ci
npm run build
npm run build:check
```

`npm run build` validates structured source, renders publication and catalog
material, writes all version metadata, and bundles committed consumer scripts.
Generated files are outputs; edit `src/`, package declarations, or
`package.json`, then rebuild. Stable runtime bundle names avoid content-hash
churn.

No installed package contains an npm manifest. The host copies files and never
runs a lifecycle script. `npm run consumer-install:self-test` proves the copied
packages execute without checkout `node_modules`.

## Contributor validation

The binding fast-ship and validation-agreement rules are in `AGENTS.md`. The
usual Lean release preparation is:

```powershell
npm test
npm run build:check
npm run consumer-install:self-test
node tools\release-readiness.mjs --base <available-tag-or-merge-base> --head HEAD --json
git diff --check
```

Kai runs no pull-request or push CI. A Linux/Node 24 nightly supplies scheduled
repository confidence. See [Development process](../development-process.md) for
the schedules, release guard, and evidence expectations.

## Versioning

Kai follows semantic versioning:

| Change | Version |
| --- | --- |
| Breaking consumed contract or removed public ID | major |
| Additive public capability | minor |
| Compatible fix | patch |
| Documentation- or test-only | no bump required |

`package.json` is the only edited version source:

```powershell
npm version <x.y.z> --no-git-tag-version
npm run build
```

The build updates the root and package manifests, locks, generated metadata,
and every marketplace entry. Add the dated `CHANGELOG.md` section and
comparison link manually.

## Release boundary

After merge, the Monday workflow owns tagging and GitHub release creation. It
uses the exact SHA validated by the latest successful nightly and skips when
`main` moved, the version is already tagged, release facts are incomplete, or
generated output was not clean.

Feature PRs must not tag, publish, or manually create the release. A missing
local expected tag is not a reason to weaken release-readiness: fetch tags or
use a deterministic merge-base ref, and report which base was actually used.

---

**Next:** [Agents & skills](agents-and-skills.md) ·
[Architecture](../architecture.md) ·
[Development process](../development-process.md)
