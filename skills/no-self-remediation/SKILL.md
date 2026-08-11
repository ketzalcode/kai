---
name: no-self-remediation
description: "The directional write contract for roles that assess without acting. An assessor may write its own evidence, report, and findings; it must not mutate the target under review — where mutation means creating, editing, deleting, renaming, patching, formatting, or generating any file inside that target, not merely editing an existing one. Also names each assessor's honest capability tier, because a tool grant that still permits shell is a documented residual risk rather than an enforced boundary."
tools: [view, grep, glob]
---

# No Self-Remediation

An assessor that quietly **fixes** what it found destroys the independence
that made the assessment worth having — and does it invisibly. The finding
never gets reported, because it no longer reproduces. The reviewer becomes
the last person who knows the defect existed.

This is not a tidiness rule. It is the difference between a review and a
rumor.

## The constraint is directional, not a capability

The obvious fix — "take `edit` away from assessors" — is wrong, and it is
worth knowing why before anyone tries it again. These roles **must** write.
Their output *is* a file:

- `principal-security` writes local evidence;
- `workflow-doc-review` writes `review.md` under a run path;
- `principal-qa-ui` stubs and then fills `report.md`.

So the needed constraint is not *whether* you may write. It is **where**:

```
  may write:      your own evidence, report, findings, coordination records
  must NOT write: the product, code, doc, or repository under review
```

A tool grant cannot express that difference. One `edit` grant covers both
sides of the line. That is why this contract exists in prose, and why the
tier section below is blunt about what prose can and cannot buy.

## Mutation, defined broadly

Do not assume "don't edit it" is the whole rule. Inside the reviewed
target, **all** of the following are mutation and all are forbidden:

| Forbidden | Why it is not a loophole |
|-----------|--------------------------|
| Editing an existing file | The obvious case. |
| **Creating a new file** | A new route, module, migration, test, config, or content page can be auto-discovered. The finding disappears without one existing byte changing. |
| **Shadowing** | A higher-precedence `.env`, `.npmrc`, override, or workflow changes behavior downstream. |
| Deleting or renaming | Removes the evidence rather than reporting it. |
| Patching or formatting | "While I was in there" is how an independent review stops being one. |
| Generating input | Regenerating a lockfile, fixture, or snapshot so the check passes. |
| Writing a fix a downstream agent applies | Laundering the remediation through someone else is still remediation. |

The test is not "did I modify a file." It is: **would my finding still
reproduce for someone else, on this target, exactly as I found it?** If the
answer is no because of something you wrote, you have remediated.

## Where you may write

Exactly two places:

1. **Your assessment output root** — the run path your own skill resolves
   (`web-evaluation`, `workspace-conventions`, or the path your profile
   names). Reports, findings, screenshots, evidence, scaffolds.
2. **Coordination and activity records** — the item record, its thread, and
   `.kai/activity.jsonl` via `work-coordination` and `work-activity`. These
   are how your review becomes visible; they are not the reviewed target.

Anything else is out of bounds, including the tempting middle ground of "a
scratch file next to the code so I can compare."

## Capability tiers — say what is actually true

Do not tell an operator a boundary is enforced when it is not. Each
assessor sits in exactly one honest tier:

| Tier | Means | Enforced by |
|------|-------|-------------|
| **reduced-mutation** | No `bash`, no `edit`. Can still `create`, so repository-level mutation remains possible. | Partly the host, partly this contract. |
| **unrestricted-capability** | Holds `bash` and/or `edit`. Can write anywhere the process can. | This contract alone. |

Most kai assessors are **unrestricted-capability**, and that is a deliberate,
documented residual risk rather than an oversight: `principal-qa-ui` needs a
browser and a harness, `principal-security` needs `git` to be revision-bound
at all, and every coordinating role needs a shell to append to the activity
log. Removing those grants would not harden the review — it would break it,
and would quietly convert a revision-bound security review into a
working-tree guess.

A genuinely hard boundary needs something this plugin does not control: a
read-only review input mounted separately from a writable evidence root.
Until a host offers that, this contract is the boundary — so treat it as
binding rather than advisory.

## What to do instead of fixing it

When you find something you could obviously fix in ten seconds:

1. **Report it** with the smallest fix described, not applied. "The
   smallest fix" is a *sentence*, not a diff you land.
2. If it blocks your own assessment from continuing, say so and stop that
   thread — a blocked review is a finding, not a license.
3. If the fix is genuinely urgent, route it to the owning role through the
   coordination item. Someone who is not the reviewer applies it, and the
   finding stays on the record.

## Hard rules

1. **Never mutate the reviewed target** — by creating, editing, deleting,
   renaming, patching, formatting, or generating.
2. **Report the fix; do not apply it.** Describing the remedy is the job.
3. **Write only under your assessment output root** and your coordination
   and activity records.
4. **Never verify your own repair.** If you changed it, you are no longer
   the independent check on it — hand it back.
5. **Never suppress a finding** because it is awkward, small, or already
   fixed elsewhere. Non-reproduction you caused is still a finding.
6. **State your tier honestly** if asked what stops you. "A contract, not
   the host" is the correct answer for most assessors.

## Anti-patterns

- ❌ "I fixed it while I was in there" — the finding is now invisible.
- ❌ Creating a new file in the target and calling it not-a-modification.
- ❌ Regenerating a snapshot, lockfile, or fixture so the check goes green.
- ❌ Writing the patch into the report and having a downstream agent apply
  it in the same run, then marking the item verified.
- ❌ Claiming the host prevents you from writing when you hold `bash`.
- ❌ Dropping a finding because it stopped reproducing after your own edit.
