---
name: pr-delivery
description: "Use when an accepted delivery slice needs branch naming, title, version handling, a scenario-based PR description, verification evidence, and protection-safe handoff."
tools: [execute, read, edit, search]
---

# PR Delivery

The span between "the work is finished" and "the change is merged" is the one
step in kai's chain with no encoded shape. Sizing, readiness, and deployment all
have owners; the **branch, the PR description, the version bump, and merge
readiness** have lived only in whoever happened to be doing the work.

This skill is that shape. It is **delivery hygiene, not judgment** - it never
re-decides anything another skill owns.

## Where it sits

```text
pr-sizing          PR-DELIVERY            kai-core-definition-of-done      workflow-ship
---------          -----------            ------------------      -------------
splits the    -->  opens and prepares -->  says it is        -->   deploys it
work               ONE pull request       release-ready

                   branch
                   commits
                   PR description
                   version bump
                   merge readiness
```

| Question | Owner |
|---|---|
| Was the work split into the right increments? | `pr-sizing` |
| Is the code correct and well-designed? | `eng-reviewer-code` |
| Is it ready to release? | `kai-core-definition-of-done` |
| How does it reach production? | `workflow-ship` |
| **How does this change physically reach `main`?** | **this skill** |

## 1 - The anchor ladder

Every branch carries a **deterministic, non-model-generated anchor**, because a
model-generated slug drifts between sessions. Take the highest rung available:

| Rung | Anchor | Example |
|---|---|---|
| 1 | GitHub issue number | `kai/feat/28-progressive-onboarding` |
| 2 | Coordination Task id | `kai/feat/engineering-task-run-path-migration` |
| 3 | Local date `YYYY-MM-DD` | `kai/fix/2026-08-08-crlf-guard` |

Rung 2 uses the typed Task key so same-Epic work stays greppable. A branch on
rung 2 greps against the Task and its PR at once.

Rung 3 needs no `<NN>` index. A run folder's descriptor is optional, so runs need
the index to stay unique; a branch slug is **mandatory**, so two same-day changes
are already distinguished by their slugs. A genuine collision would mean the same
change twice.

### A `feat` on rung 3 is a smell - say so, do not block

`kai-core-scope-discipline` keeps unapproved scope expansion conversational and
routes durable proposals to named authority. So a **feature** with no issue and
no coordination Task means the work was never scoped, and the PR is the first
time anyone sees it.

Report it and offer to file the issue. **Do not block** - a spike or an explicit
operator "just do it" is legitimate. Consistent with how `kai-core-definition-of-done`
treats a waiver: allowed, but *visible* rather than silent. A `fix`, `docs`, or
`chore` on rung 3 is entirely normal and needs no remark.

## 2 - Branch name

```text
kai/<type>/<anchor>-<slug>
```

- **`kai/`** marks provenance, and - because it is a plain prefix - lets CI
  filters and branch-protection rules target the whole group (`kai/**`). It also
  generalizes: a human lane is `<user>/<type>/<anchor>-<slug>`.
- **`<type>`** is the conventional-commit type, the **same one used in the PR
  title**: `feat` / `fix` / `docs` / `refactor` / `chore`. Branch and title can
  never disagree.
- **`<anchor>-<slug>`** stay in **one segment**. This is load-bearing, not
  cosmetic - see below.

### Never put the anchor in its own path segment

Git refs are real directories, so a ref and a ref-prefix are mutually exclusive
**in both directions**:

```text
git branch feat/28            ok
git branch feat/28/kai/slug   fatal: 'refs/heads/feat/28' exists; cannot create ...

git branch feat/28/kai/slug   ok
git branch feat/28            fatal: 'refs/heads/feat/28/kai/slug' exists; cannot create ...
```

A pattern like `<type>/<number>/<author>/<slug>` permanently **reserves
`feat/28` as a folder**. Any contributor typing `git checkout -b feat/28` for a
quick fix on that issue hits a confusing fatal error mid-flow - or, having got
there first, breaks kai's branch instead. Keeping `<anchor>-<slug>` in one
segment reserves nothing.

Slugs are kebab-case, lowercase, and short enough to read in a branch list.

## 3 - Title

```text
<type>: <imperative summary>
```

- The **same `<type>`** as the branch.
- Imperative mood, **72 characters or fewer** - it becomes the merge-commit
  subject, and 72 is where git wraps.
- **No trailing `(#N)`.** It does nothing functional: `Closes #N` **in the body**
  is what closes the issue. On a squash-merge GitHub *auto-appends the PR
  number*, so a hand-written ref yields `feat: ... (#28) (#80)`.

## 4 - PR description

Read `references/pr-description.md` before drafting or updating the body. Use
the `Overview` and `Validation scenarios` sections by default. Add scoped ASCII
architecture when its trigger applies, and a rollout plan only when the change
has one.

Describe one accepted delivery slice. Name dependencies on earlier PRs and work
deliberately deferred to later slices. CI owns commands, pass/fail status,
changing counts, reviewer state, and exact-revision results. Keep those out of
the durable behavior description.

## 5 - Version bump

When the repo carries a version:

1. **Fetch first.** Compare against the *remote* tip (`git fetch`, then read the
   version from `origin/<default>`) before choosing a number. Concurrent work
   makes the local file an unreliable baseline.
2. **Detect every version-carrying file.** A repo may hold a `package.json`, a
   lockfile, a plugin manifest, a module file - a bump that touches one and not
   the others is a silent drift.
3. **Judge semver against the public/installed surface, not the diff size.** A
   thousand-line internal refactor with no surface change is a patch; a one-line
   default change that alters behavior for every consumer is not.
4. **Refuse a bump that contradicts the change** and say why.

If the repo maintains a CHANGELOG, update it per **its** release process - kai's
own, for instance, is CI-enforced and requires a dated section plus a compare
link on every behavior-changing PR. What to avoid is introducing a *second*
hand-maintained changelog where squash-merged PR titles already serve that
purpose; two lists drift apart.

## 6 - Pre-flight

Before opening the PR:

- `git fetch` and re-check the remote version, per above.
- Run **the repo's own** test/lint command - the one its docs or `package.json`
  declare, not an assumed one.
- Run whatever release/CI guard the repo ships locally, when it has one.
- The fix and its regression test are in **this** PR, not a follow-up.
- Write PR and release body text as **plain ASCII files**. Smart quotes, arrows,
  and box-drawing characters corrupt through some shells (a repeatedly-hit
  Windows/PowerShell hazard); ASCII survives everywhere.

## Hard rules

1. **Never commit to the protected branch.** Always branch.
2. **Never force-push, rewrite history, or delete a remote branch that is not
   your own.**
3. **Never bypass branch protection silently.** Report the blocking rule and
   escalate to `@operator`.
4. **The human presses merge.** Draft and validate; never merge, tag, or
   release. Consistent with every other kai role.
5. **Keep execution status out of the PR description.** CI and repository
   checks own commands, counts, and current results.
6. **A changed user-visible surface ships before/after screenshots**, scaled to
   the change - a cropped pair for a copy tweak, a full pair for a layout change.
7. **Read conventions from the workspace, not from memory.** A repo with a
   single `package.json`, a Go module, and a plugin manifest all differ; so do
   their default branch names.

## Anti-patterns

- Pushing to a protected `main` and reporting `Bypassed rule violations` as
  though it were success.
- A PR body that describes the fix but never explains the changed behavior, preserved behavior, scope boundary/dependency, or evidence, so the reviewer cannot disagree with the diagnosis.
- Copying test commands, pass counts, review status, or exact revision results
  into the durable PR description.
- A `feat` branch with no issue and no coordination Task, delivered silently.
- Bumping a minor because the diff was large, or a patch because it felt small -
  semver describes the **surface**, not the effort.
- A UI change whose reviewer has to run the branch locally to see what moved.
- Filling every optional reference section with stale boilerplate or live status
  noise instead of durable behavior and evidence.
