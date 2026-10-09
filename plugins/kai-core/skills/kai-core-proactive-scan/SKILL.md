---
name: kai-core-proactive-scan
description: "Use when an explicitly requested read-only scan must classify, deduplicate, deliver, and acknowledge operator-relevant signals."
tools: [read, execute, search]
---

# Proactive scan

The scan surfaces evidence. It never acts on a signal.

## Sources

- schema-5 coordination reads from
  `.kai/core/runtime/coordination.sqlite`;
- explicitly configured communication, repository, document, or issue sources;
- registered additional workspaces with valid project/workspace identity;
- the prior private delivery ledger for this report.

SQLite is the **only coordination authority**. Read it through `status`, typed
`detail`, `context`, and `messages`. A report, export, or cached payload is not
authority.

## Operator signals

Surface only evidence that needs operator attention, such as:

- a human-only authority decision;
- a release or production action only the operator may perform;
- a stale Direction binding or explicit hold needing human resolution;
- a blocking question addressed to the operator;
- a lease-recovery decision;
- a materially changed risk, failure, or deadline.

A proposed hierarchy record by itself is not an operator signal. Its named
steward and scope authority own promotion and priority.

## Classification

Classify each stable signal as:

```text
new | changed | overdue | unchanged | cleared
```

`cleared` requires a fully read source and positive evidence that the prior
condition ended. An unreadable source creates a gap, never a clear.

Hash normalized signal identity and material content. Suppress unchanged
already-delivered signals. Preserve source, observed time, subject, authority,
severity, requested decision, and basis revision.

## Private report state

The caller's validated core report target holds:

```text
drafts/payload-<timestamp>.json
drafts/ledger.json
evidence/<source snapshots or minimized extracts>
```

The owning workflow derives the full typed path. This skill does not invent an
artifact root.

The ledger advances only after explicit acknowledgement of the exact payload.
Failed, partial, or ambiguous delivery leaves it unchanged.

## Hard boundaries

- Read-only against every source.
- Never reply, approve, grant, reprioritize, commit, merge, publish, or deploy.
- Never scan an unregistered workspace.
- Never store credentials or raw sensitive content in the payload.
- Never treat the private ledger as coordination authority.
- Never create a Markdown board, backlog, milestone, thread, Task, or hierarchy
  log.
