---
on:
  schedule: daily
  workflow_dispatch:
permissions:
  contents: read
  issues: read
  pull-requests: read
  actions: read
  copilot-requests: write
network: defaults
engine:
  id: copilot
  model: gpt-5.6-terra
tools:
  github:
    toolsets: [repos, issues, pull_requests, actions]
safe-outputs:
  create-issue:
    title-prefix: "[maintenance] "
    labels: [maintenance]
    max: 3
    expires: false
    deduplicate-by-title: 2
---

# Daily Agentic Repository Maintenance

Perform one read-only, evidence-based maintenance audit of this engineering
repository. Read the repository instructions before inspecting files.

## Scope

Start with changes merged during the last seven days. Inspect only the current
authoritative files needed to verify affected behavior and claims. On the first
run, establish the same bounded baseline without inventing a full-repository
rewrite.

Check:

1. README and package-level documentation affected by current behavior;
2. commands, links, versions, examples, generated docs, manifests, schemas, and
   workflow claims that may have drifted from their source;
3. comments, TODOs, and FIXMEs in changed code when current implementation
   proves them stale, misleading, or no longer actionable;
4. reproducible bugs or exact contract contradictions exposed by the audit; and
5. concrete improvements with a named current owner and observable outcome.

Run only repository-native, read-only validation commands established by the
repository. Do not install dependencies or tools, mutate files, change Git
state, contact production, or inspect secrets.

## Finding quality

A finding needs exact repository evidence and a reachable consequence. Do not
file:

- formatting or wording preferences;
- requests to add comments to self-explanatory code;
- speculative abstractions, features, or performance work;
- duplicates of an open issue; or
- failures already reported clearly by an active workflow unless new evidence
  changes the diagnosis or repair.

Search open issues using the specific symbols, paths, commands, or behavior
before requesting a new issue. Prefer new evidence on an existing issue, but
this workflow has no comment or issue-update permission: when a likely
duplicate exists, create nothing and report the duplicate in the run summary.

## Safe output

If no material finding remains, create no issue.

Request at most three issues. Each issue must be independently actionable and
contain:

```markdown
## Type
bug | improvement

## Observed
<exact current behavior or contradiction>

## Expected
<current contract or maintainable outcome>

## Evidence
<public-safe paths, symbols, commands, and observed results>

## Impact
<specific reliability, usability, maintenance, or contributor cost>

## Smallest credible action
<bounded repair, not an architecture wish list>

## Acceptance
- <observable completion condition>

## Boundary
<what this issue must not broaden into>
```

Never include secrets, personal data, private repository context, raw prompts,
or proprietary content. Never request a pull request, code edit, issue closure,
agent assignment, release, deployment, or external publication.
