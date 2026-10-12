---
name: kai-core-feedback
description: "Use when the operator says Kai was incorrect, missed a principle, added too much process, or needs an improvement recorded for the Kai maintainers."
tools: [execute, read, search, ask_user]
user-invocable: true
argument-hint: "what Kai got wrong or missed"
---

# Provide feedback to Kai

Turn one concrete Kai experience into a public issue in `ketzalcode/kai`.
This is direct feedback work: create no `.kai` state, Task, lease, or activity
record.

## Establish the report

Capture only what is needed:

- the outcome that was expected;
- what Kai actually did or omitted;
- the principle, agent, skill, or workflow involved when known;
- the smallest reproduction or example;
- why the difference matters; and
- any suggested direction, clearly marked as a suggestion.

Do not require the operator to diagnose Kai internals. Separate observed facts
from inferred cause. If evidence is missing, say `Not provided`; never invent a
version, agent, command, repository detail, or reproduction.

## Protect the source repository

The destination is a **public GitHub issue**. Never include secrets, tokens,
personal data, employer or customer identifiers, private repository names or
URLs, proprietary source, raw prompts, logs, screenshots, or file contents
unless the operator explicitly approves the exact public excerpt.

Summarize private context by default. Redact before previewing. If redaction
would remove the evidence needed to understand the report, stop and return a
private draft instead of filing an unsafe or misleading issue.

## Check for an existing report

Verify GitHub access:

```text
gh auth status
gh repo view ketzalcode/kai
```

Search open feedback issues using the two or three most specific public-safe
terms from the report:

```text
gh issue list --repo ketzalcode/kai --state open --label kai-feedback \
  --search "<terms> in:title" --limit 10 --json number,title,url
```

If a likely duplicate exists, show it and ask whether to add the approved new
evidence as a comment or file a distinct issue. Never comment or file both by
default.

For a comment, prepare only the new public-safe evidence, preview its exact
body and target issue, and confirm before writing. Use a temporary UTF-8 file:

```text
gh issue comment <number> --repo ketzalcode/kai --body-file "<temporary-file>"
```

Return the comment URL and stop; do not create another issue.

## Prepare the public issue

Use a specific title: `Feedback: <incorrect or missing Kai behavior>`.

The body contains:

```markdown
## Expected Kai behavior
<expected outcome or principle>

## Observed behavior
<what happened or was missing>

## Minimal reproduction
- Kai package or version: <known value or Not provided>
- Agent or skill: <known value or Not provided>
- Host: <known value or Not provided>
- Steps: <smallest public-safe reproduction>

## Impact
<why this matters>

## Evidence
<approved public excerpt, link, or Not provided>

## Suggested direction
<optional suggestion or Not provided>
```

Show the exact title, body, repository, and `kai-feedback` label. State again
that the issue will be public. Obtain explicit confirmation before the external
write.

## Submit

After confirmation, write the approved body to a temporary UTF-8 file and run:

```text
gh issue create --repo ketzalcode/kai --title "<title>" \
  --body-file "<temporary-file>" --label kai-feedback
```

Delete the temporary file. Return the created issue URL and any context omitted
for privacy.

If authentication, repository access, duplicate lookup, label resolution, or
issue creation fails, stop and return the exact error plus the public-safe
title/body draft. Do not claim feedback was filed and do not silently create an
unlabeled issue.

This skill never adds an auto-fix label, assigns an agent, starts a cloud
session, or requests implementation. Feedback triage and remediation are
separate maintainer decisions.
