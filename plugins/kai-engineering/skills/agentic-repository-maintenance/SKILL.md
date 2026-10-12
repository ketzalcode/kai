---
name: agentic-repository-maintenance
description: "Use when installing, updating, or validating the opt-in daily Agentic Workflow that audits an engineering repository and files bounded maintenance issues."
tools: [execute, read, edit, search, ask_user]
user-invocable: true
argument-hint: "setup | update | validate"
---

# Agentic Repository Maintenance

Install or update the automated repository-maintenance audit for an engineering
workspace. This skill configures automation; it does not perform a manual
maintenance audit.

The canonical GitHub Agentic Workflow ships in
`references/agentic-repository-maintenance.md`. It runs daily, inspects the
repository read-only, and may file bounded deduplicated issues through isolated
safe outputs.

Installing or running the workflow creates no `.kai` state. GitHub issues are
the only maintenance output. Remediation remains a separate authorized task.

Require a GitHub repository with Actions enabled and an authenticated `gh`
client. GitHub Agentic Workflows must be available for the repository. Copilot
uses organization-billed `copilot-requests: write`; otherwise configure the
`COPILOT_GITHUB_TOKEN` engine credential required by GitHub.

Inspect first, then show the exact plan:

1. copy the shipped reference byte-for-byte to
   `.github/workflows/agentic-repository-maintenance.md`;
2. compile it with `gh aw compile agentic-repository-maintenance`;
3. retain the generated
   `.github/workflows/agentic-repository-maintenance.lock.yml`;
4. create the `maintenance` label when absent; and
5. validate with `gh aw validate agentic-repository-maintenance`.

Do not overwrite an existing source or lock file without showing its diff and
obtaining explicit approval. Installing the `gh-aw` extension, creating the
label, and writing workflow files are separate mutations covered by that
approval.

The workflow is intentionally issue-only:

- the agent receives read permissions;
- isolated safe outputs may create at most three deduplicated maintenance
  issues;
- it cannot push, edit repository content, create a pull request, assign
  Copilot, or close issues; and
- automatic remediation requires a different, separately approved workflow
  and credential.

## Result

Return the setup target, source/lock changes, label state, compilation and
validation evidence, authentication unknowns, and one next action.
