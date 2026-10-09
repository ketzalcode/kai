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

### Agent taxonomy

Choose the kind from the responsibility, not from a title:

| Kind | Qualification | Identity form |
| --- | --- | --- |
| Durable role | Holds standing judgment or execution responsibility across requests. | `<family>-<posture>-<scope>` |
| Workflow | Runs a bounded procedure with a defined completion condition. | `workflow-<outcome>` |
| Persona | Represents a user or stakeholder viewpoint without delivery authority. | `persona-<viewpoint>` |
| Instructor | Teaches or structures learning for the operator. | `instructor-<teaching-scope>` |
| Skill | Supplies reusable method without an independent authority lane. | `<kebab-case>`; core skills use `kai-core-*` |

The active durable-role provider families are:

| Family | Package | Responsibility |
| --- | --- | --- |
| `core` | `kai-core` | Shared contracts, workspace machinery, and explicitly requested coordination |
| `eng` | `kai-engineering` | Software delivery, architecture, trust, reliability, and technical documentation |
| `creative` | `kai-creative` | Interaction design, visual identity, video direction, and bounded creative production |

Use full responsibility words in scope: `frontend`, `backend`, and `software`,
not `fe`, `be`, or `swe`. Choose the posture with this first-match rule:

| Priority | Primary responsibility | Posture |
| ---: | --- | --- |
| 1 | Independent verdict on another role's revision | `reviewer` |
| 2 | Action on a live or stateful operational system | `operator` |
| 3 | Final domain decision or role-level acceptance | `lead` |
| 4 | Implementation of accepted repository scope | `builder` |
| 5 | Routing or reconciliation of other roles | `coordinator` |
| 6 | Recommendation without acceptance authority | `advisor` |

A new durable role earns a permanent slot only when every row has evidence:

| Test | Required evidence |
| --- | --- |
| Recurring trigger | A repeated request class, not one current task |
| Distinct lane | One sentence naming authority or execution no existing role owns |
| Stable boundary | Named neighboring owners and clear routing seams |
| Dispatch value | Its frontmatter description is sufficient to select it |
| Independent output | A recognizable artifact, implementation lane, decision, or verdict |
| Cost justified | Reduced ambiguity exceeds the permanent context and coordination cost |

If any row fails, strengthen an existing agent, add reusable method to a skill,
or use a bounded workflow instead.

### Execution profiles and models

Agent model policy is deterministic and versioned as
`kai-agent-models-v2`. Declare exactly one
`**Primary profile:** <profile>` line and use the exact quoted model:

| Profile | Allowed posture or kind | Required model |
| --- | --- | --- |
| `judgment` | `lead`, `advisor` | `claude-opus-5` |
| `technical-judgment` | `lead`, `advisor` | `gpt-5.6-sol` |
| `review` | `reviewer` | `claude-opus-5` |
| `technical-review` | `reviewer` | `gpt-5.6-terra` |
| `execution` | `builder` | `claude-sonnet-5` |
| `operations` | `operator` | `claude-sonnet-5` |
| `coordination` | `coordinator` | `claude-sonnet-5` |
| `advisory` | `advisor` | `claude-sonnet-5` |
| `procedure` | `workflow` | `claude-sonnet-5` |
| `teaching` | `instructor` | `claude-sonnet-5` |
| `simulation` | `persona` | `claude-sonnet-5` |

Use `technical-judgment` when repository evidence is central to the standing
decision lane, and `technical-review` when the independent verdict centers on
code, tests, or technical contracts. Do not switch models per task. A model
policy change updates `src/core/lib/agent-model-policy.mjs`, its policy version,
the loader contract, malformed fixtures, policy tests, and every affected agent
in one reviewed change.

### Prompt and contract budget

| Measure | Target | Required action |
| --- | ---: | --- |
| Authored agent body | at most 250 lines | Refocus when over 250 lines |
| Agent prompt | at most 20,000 characters | Refocus when over 20,000 characters |
| Host hard limit | 30,000 characters | Must not be exceeded |

Refocus by removing repeated shared rules, extracting reusable method into a
skill, or splitting only when both resulting roles pass every slot test. Record
why any agent that remains above a Kai target must stay whole.

Before prose, define the contract: authority and final acceptance, positive and
neighbor routing examples, required inputs and evidence, output and completion,
handoffs, tools and situational skills, durable-output behavior, and behavioral
acceptance cases. The cases cover a positive route, neighbor route, authority
seam, human gate, completion condition, and runtime fit.

### Agent change checklist

1. Read `AGENTS.md`, the target agent, one to three nearest agents, and the
   skills they route at the relevant steps.
2. Record the recurring trigger, owned lane, nearest neighbor, completion
   output, taxonomy choice, slot evidence, profile, and model.
3. Edit only the canonical
   `plugins/<package>/agents/<agent-id>.agent.md`. Keep filename and
   frontmatter `name` identical; declare `description`, quoted `model`,
   `durable-output-producer`, and only tools required by real actions.
4. Route skills inside the instruction that needs them. Route
   `kai-core-contract-v1` immediately before the first other core skill; do not
   add an eager inheritance list or dependency-guard block.
5. Set `durable-output-producer: true` only for an authorized typed Kai
   artifact branch. Route the owning package's publication skill immediately
   before `kai-core-asset-producing`; non-producers route neither.
6. For an added, removed, or renamed agent, update exactly one `CATEGORIES`
   entry in `tools/generate-catalog.mjs` and search agents, skills, hooks,
   examples, tests, and documentation for the old and new IDs.
7. Run `npm run build`, `npm test`, `npm run build:check`, and
   `npm run consumer-install:self-test`, then inspect the generated diff.

Existing public names remain stable unless the change explicitly accepts the
breaking surface.

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
