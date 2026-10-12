# kai-contributor

`kai-contributor` is a standalone, agent-free package for improving Kai itself.
It provides public feedback filing and lean authoring guidance for Copilot
agents and skills.

## What it provides

- `kai-feedback` turns one public-safe Kai problem into a confirmed,
  duplicate-checked `ketzalcode/kai` issue;
- `kai-create-agent` defines focused responsibility-based agents; and
- `kai-create-skill` defines reusable, caller-agnostic skills with valid package
  ownership and dependency direction.

## Install

```text
copilot plugin install kai-contributor@kai-plugins
```

It can be installed without `kai-core`. Start a new Copilot session after
installation or update.

## Workspace behavior

Installing this plugin creates no `.kai/` or `docs/kai/` state. Direct work
through its skills also creates no Kai workspace, runtime database, package
directory, artifact route, or publication record.

Feedback writes only the explicitly confirmed public GitHub issue or comment.
Agent and skill authoring writes only the repository files authorized by the
request.

## Boundaries

- Contributor owns no agents, runtime, workspace schema, or publication
  vocabulary.
- Feedback is privacy-reviewed and confirmation-gated; it never starts
  automated remediation.
- Authoring guidance follows the target repository's loader and contribution
  rules rather than creating a parallel framework.

See the generated
[agents and skills catalog](https://github.com/ketzalcode/kai/blob/main/docs/reference/agents-and-skills.md)
for the current inventory.
