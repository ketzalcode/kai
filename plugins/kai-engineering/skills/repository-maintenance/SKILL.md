---
name: repository-maintenance
description: "Use when an engineering workspace needs an evidence-based maintenance audit, or when installing the opt-in weekly issue-only maintenance workflow."
tools: [execute, read, edit, search, ask_user]
user-invocable: true
argument-hint: "audit | setup weekly"
---

# Repository Maintenance

Maintain an engineering repository without turning maintenance into an
unbounded cleanup project. This skill owns the audit and setup method, not
product repair.

## Choose one mode

- **Audit:** inspect current repository evidence and return or file bounded
  findings.
- **Setup weekly:** install the GitHub Agentic Workflow shipped in
  `references/repository-maintenance.md`.

Installing or running this method creates no `.kai` state. Repository files and
GitHub issues are the only outputs.

## Audit

Read `references/repository-maintenance.md` and apply its audit contract
manually. Read repository instructions first and derive checks from current
scripts, manifests, workflows, and contribution rules.

Use the smallest useful scope:

- changes since the requested ref or recent maintenance window;
- documentation and comments directly affected by those changes; and
- current authoritative surfaces needed to prove a contradiction.

Do not scan every file merely to look busy. A stale comment is a finding only
when current code or configuration proves it wrong. Do not add comments to
obvious code, rewrite prose for taste, or file speculative improvements.

Search open issues before proposing a new one. For a manual GitHub write, show
the exact public-safe title, body, labels, and repository, then obtain explicit
confirmation. Create at most three issues and prefer adding new evidence to an
existing issue.

This is assessment work. Report the smallest credible repair; do not edit the
finding away in the same run. A separately authorized builder or writing task
owns remediation.

## Setup weekly

Require a GitHub repository with Actions enabled and an authenticated `gh`
client. GitHub Agentic Workflows must be available for the repository. Copilot
uses organization-billed `copilot-requests: write`, or the repository must
provide the engine credential required by GitHub's current documentation.

Inspect first, then show the exact plan:

1. copy the shipped reference byte-for-byte to
   `.github/workflows/repository-maintenance.md`;
2. compile it with `gh aw compile repository-maintenance`;
3. retain the generated
   `.github/workflows/repository-maintenance.lock.yml`;
4. create the `maintenance` label when absent; and
5. validate with `gh aw validate repository-maintenance`.

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

Return the audited range or setup target, checks actually run, evidence-backed
findings, duplicate decisions, writes performed, validation, unknowns, and one
next action. No findings is a valid result.
