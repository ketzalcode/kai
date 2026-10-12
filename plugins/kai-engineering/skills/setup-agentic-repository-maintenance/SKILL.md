---
name: setup-agentic-repository-maintenance
description: "Use when evaluating and setting up automated repository maintenance after comparing feasible platform, permission, agent, scheduler, and issue-tracker approaches."
tools: [execute, read, edit, search, ask_user]
user-invocable: true
argument-hint: "maintenance goal, cadence, or target repository"
---

# Setup Agentic Repository Maintenance

Design and install evidence-based maintenance automation for an engineering
workspace. Do not assume GitHub, GitHub Actions, `gh-aw`, a hosted AI agent, or
permission to change repository automation.

This is setup work. It does not perform a manual maintenance audit and creates
no `.kai` state.

## Investigate before proposing

Inspect enough current evidence to determine:

- repository host, issue tracker, visibility, default branch, and protection;
- available schedulers, CI/pipeline systems, runners, and agent runtimes;
- repository, user, service-account, and token permissions;
- administrator-only enablement, secrets, billing, and approval requirements;
- stack-native validation commands and required operating system/toolchain;
- network, private dependency, secret, and data-residency constraints;
- safe write target: issue, ticket, report, comment, or no automated write;
- duplicate handling, issue limits, cadence, cost, and failure visibility; and
- existing maintenance automation that should be extended rather than
  duplicated.

Use current platform documentation for capabilities and authentication that
may have changed. Keep unsupported facts unknown. Investigation is read-only.

## Compare feasible approaches

Return two or three viable approaches when available. Typical shapes are:

1. a platform-native agentic workflow with read-only analysis and isolated
   issue/ticket output;
2. a deterministic scheduled pipeline for links, generated drift, tests, and
   known static checks, explicitly excluding semantic comment or improvement
   judgment; or
3. an approved external runner when the repository host has no suitable agent
   or scheduler, with its trust and credential boundary made explicit.

For each option name:

- coverage of documentation, comments, bugs, and improvements;
- repository and external permissions;
- admin, secret, billing, and runner setup;
- available models, assessment quality, model cost, and fallback behavior;
- stack/environment compatibility;
- expected cost and cadence;
- write authority, issue limits, and deduplication;
- failure/recovery behavior; and
- what remains manual.

Recommend one option or recommend no automation when no safe mechanism meets
the goal. Do not present an unavailable platform feature as a degraded success.

## Obtain sign-off

Show the selected approach's exact files, commands, permissions, secrets by
name, labels/projects, schedule, outputs, and removal path. Obtain explicit
operator approval before installing tools, creating labels, writing pipeline
files, configuring secrets, or enabling a schedule.

## Implement only the selected approach

Follow the target repository's native automation conventions. Re-read current
state before each mutation and stop on collisions or changed permissions.

For GitHub repositories where GitHub Agentic Workflows and Copilot requests are
confirmed available, this package includes one validated issue-only option at
`references/github-agentic-repository-maintenance.md`. Copy it to
`.github/workflows/agentic-repository-maintenance.md`, compile with
`gh aw compile agentic-repository-maintenance`, retain the generated lock file,
create the approved `maintenance` label, and validate with
`gh aw validate agentic-repository-maintenance`.

The reference pins `gpt-5.6-terra` for Kai's review-oriented maintenance run.
Before reuse, confirm that model is available and acceptable for the target
repository's quality, cost, and billing constraints. A model change belongs in
the compared plan and operator sign-off; never silently fall back.

That reference is an option, not the universal implementation. Do not copy it
to GitLab, Azure DevOps, Bitbucket, a local-only repository, or a GitHub
repository without confirmed Agentic Workflow support.

Keep assessment and remediation separate. The installed automation may report
evidence-backed findings through its approved output, but it must not edit
code, push, create repair PRs, close issues, deploy, publish, or assign another
agent unless the operator separately approves that authority.

## Validate and report

Validate syntax or compilation, authentication readiness, effective
permissions, schedule registration, issue/ticket limits, deduplication, and a
manual dry run or dispatch when supported. Never claim the first scheduled run
or AI result was verified when it has not occurred.

Return the investigated environment, compared options, accepted approach,
mutations, admin/operator actions still required, validation, rollback/removal
path, unknowns, and one next action.
