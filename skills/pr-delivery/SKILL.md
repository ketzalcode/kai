---
name: pr-delivery
description: "The shared contract for how one finished change physically leaves the workspace: branch naming from a three-rung anchor ladder, conventional-commit title, and a core-plus-triggered PR body whose Verification names the exact command that ran. Owns delivery hygiene only \u2014 sizing stays with pr-sizing, readiness with definition-of-done, deployment with workflow-ship, code judgment with the principal-swe roles. Never bypasses branch protection and never presses merge."
tools: [bash, shell, view, edit, create, grep, glob]
---

# PR Delivery

The span between "the work is finished" and "the change is merged" is the one
step in kai's chain with no encoded shape. Sizing, readiness, and deployment all
have owners; the **branch, the narrative, the version bump, and merge
readiness** have lived only in whoever happened to be doing the work.

This skill is that shape. It is **delivery hygiene, not judgment** — it never
re-decides anything another skill owns.

## Where it sits

```text
pr-sizing          PR-DELIVERY            definition-of-done      workflow-ship
─────────          ───────────            ──────────────────      ─────────────
splits the    ──►  opens and lands   ──►  says it is        ──►   deploys it
work               ONE pull request       release-ready

                   branch
                   commits
                   PR narrative
                   version bump
                   merge readiness
```

| Question | Owner |
|---|---|
| Was the work split into the right increments? | `pr-sizing` |
| Is the code correct and well-designed? | `principal-swe-*` |
| Is it ready to release? | `definition-of-done` |
| How does it reach production? | `workflow-ship` |
| **How does this change physically reach `main`?** | **this skill** |

## 1 — The anchor ladder

Every branch carries a **deterministic, non-model-generated anchor**, because a
model-generated slug drifts between sessions. Take the highest rung available:

| Rung | Anchor | Example |
|---|---|---|
| 1 | GitHub issue number | `kai/feat/28-progressive-onboarding` |
| 2 | Coordination item id | `kai/feat/kai-59-run-path-migration` |
| 3 | Local date `YYYY-MM-DD` | `kai/fix/2026-08-08-crlf-guard` |

Rung 2 matches the run grammar in `workspace-conventions`, whose `<descriptor>`
already prefers the work-item key so same-epic artifacts stay greppable. A
branch on rung 2 greps against the item, its runs, and its PR at once.

Rung 3 needs no `<NN>` index. A run folder's descriptor is optional, so runs need
the index to stay unique; a branch slug is **mandatory**, so two same-day changes
are already distinguished by their slugs. A genuine collision would mean the same
change twice.

### A `feat` on rung 3 is a smell — say so, do not block

`scope-discipline` routes anything scope-expanding to the committed backlog as a
PROPOSAL. So a **feature** with no issue and no coordination item means the work
was never scoped, and the PR is the first time anyone sees it.

Report it and offer to file the issue. **Do not block** — a spike or an explicit
operator "just do it" is legitimate. Consistent with how `definition-of-done`
treats a waiver: allowed, but *visible* rather than silent. A `fix`, `docs`, or
`chore` on rung 3 is entirely normal and needs no remark.

## 2 — Branch name

```text
kai/<type>/<anchor>-<slug>
```

- **`kai/`** marks provenance, and — because it is a plain prefix — lets CI
  filters and branch-protection rules target the whole group (`kai/**`). It also
  generalizes: a human lane is `<user>/<type>/<anchor>-<slug>`.
- **`<type>`** is the conventional-commit type, the **same one used in the PR
  title**: `feat` / `fix` / `docs` / `refactor` / `chore`. Branch and title can
  never disagree.
- **`<anchor>-<slug>`** stay in **one segment**. This is load-bearing, not
  cosmetic — see below.

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
quick fix on that issue hits a confusing fatal error mid-flow — or, having got
there first, breaks kai's branch instead. Keeping `<anchor>-<slug>` in one
segment reserves nothing.

Slugs are kebab-case, lowercase, and short enough to read in a branch list.

## 3 — Title

```text
<type>: <imperative summary>
```

- The **same `<type>`** as the branch.
- Imperative mood, **72 characters or fewer** — it becomes the merge-commit
  subject, and 72 is where git wraps.
- **No trailing `(#N)`.** It does nothing functional: `Closes #N` **in the body**
  is what closes the issue. On a squash-merge GitHub *auto-appends the PR
  number*, so a hand-written ref yields `feat: ... (#28) (#80)`.

## 4 — Body: core plus triggered

A fixed template trains readers to skip sections, because most PRs would fill
half of them with "N/A". So the body is **proportional**, the same way
`definition-of-done` waives dimensions that do not apply: four sections always,
the rest only when their trigger fires.

Order is fixed so a reviewer meets the **diagnosis before the remedy**.

```markdown
## Problem
Why now, with evidence.

## Change
What you did.

## The change at a glance          <- trigger: it alters a structure or flow
## The constraint that shaped this <- trigger: a non-obvious constraint forced the design
## Deliberately not done           <- trigger: scope trimmed, or a PROPOSAL routed to the backlog
## Review fixes                    <- trigger: a review returned findings
## Before / after                  <- trigger: a user-visible surface changed

## Verification
The exact command that ran.

## Rollout / reversibility         <- trigger: not instantly reversible

Closes #28                         <- trigger: rung 1 (rungs 2 and 3 cite the item or nothing)
```

### Problem — diagnosis before remedy

State what is wrong and the evidence for it, before what you did about it. The
test: **a reader who disagrees can tell whether they disagree with the diagnosis
or with the fix.** Those need different conversations, and a PR that fuses them
gets neither.

**When the change fixes a defect**, the Problem section additionally carries:

| | |
|---|---|
| **What happened** | the observed behavior, not the suspected cause |
| **Repro steps** | numbered, from a known starting state, ending at the wrong result |
| **How it was found** | a failing test, a QA run, a production report, a review |

"How it was found" is not bookkeeping. A defect found in production that a test
suite should have caught is itself a finding, and it is invisible unless the PR
says where it came from.

### The change at a glance — diagram it

Trigger on **kind, not size**. A 500-line generated file needs no diagram; a
20-line routing change does. Diagram it when the change alters a **structure or
flow**: paths, states, order, ownership, or layering.

Use **`build-diagrams`** — do not invent a local style. The point is that every
diagram in the repo reads the same. Keep it small: a reviewer should catch the
shape of the change in seconds, then read the diff for detail. This never
replaces a dev-design artifact, which has its own structure and home.

```text
before                          after
------                          -----
README.md  1,167 lines   ──►    README.md   ~150 lines (route map)
  everything                     docs/
                                   getting-started.md
                                   how-kai-works.md
                                   reference/agents-and-skills.md  (generated)
```

### Before / after — always screenshot a UI change

**A user-visible surface changed, the PR shows it.** Reading a diff to guess what
moved is exactly the work a screenshot removes. The bar is deliberately low:
proportionality applies to *effort*, not to *whether you show it* — a cropped
before/after of the one element that moved is enough for a copy tweak, and a
full-surface pair is warranted for a layout change. What is not acceptable is a
reviewer having to run the branch locally to find out what changed.

This is not only for the reviewer. QA's evidence lives under `.kai/runs/` and
`kai/library/**/screenshots/`, both **gitignored and local-only** — so it dies
with the run folder. The PR is the **only durable home** for before/after
evidence, and putting it there means the next person reads the PR instead of
re-running Playwright.

Because those paths are not committed, screenshots **cannot be linked by repo
path**. Upload them as GitHub attachments (the `github-pr-media` builtin skill,
when the host provides it). Label each pair `before` / `after` and name the
surface and state.

### Verification — name the command

Paste the command that actually ran. **"Tests pass" is not verification**; a
reviewer cannot check it, reproduce it, or tell whether it covered the change.

```markdown
## Verification
- `npm test` — green, including the new `docs:check`.
- Negative-tested: inserting a bad agent ref into a docs page fails the validator.
```

### Review fixes — disclose the ones you introduced

When a review returned findings, say what they were and what you did — including
**blockers you created yourself**. That disclosure is the whole value of the
section; a "Review fixes: minor tweaks" that hides a real defect is worse than
omitting it.

## 5 — Version bump

When the repo carries a version:

1. **Fetch first.** Compare against the *remote* tip (`git fetch`, then read the
   version from `origin/<default>`) before choosing a number. Concurrent work
   makes the local file an unreliable baseline.
2. **Detect every version-carrying file.** A repo may hold a `package.json`, a
   lockfile, a plugin manifest, a module file — a bump that touches one and not
   the others is a silent drift.
3. **Judge semver against the public/installed surface, not the diff size.** A
   thousand-line internal refactor with no surface change is a patch; a one-line
   default change that alters behavior for every consumer is not.
4. **Refuse a bump that contradicts the change** and say why.

If the repo maintains a CHANGELOG, update it per **its** release process — kai's
own, for instance, is CI-enforced and requires a dated section plus a compare
link on every behavior-changing PR. What to avoid is introducing a *second*
hand-maintained changelog where squash-merged PR titles already serve that
purpose; two lists drift apart.

## 6 — Pre-flight

Before opening the PR:

- `git fetch` and re-check the remote version, per above.
- Run **the repo's own** test/lint command — the one its docs or `package.json`
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
5. **Verification names the command.** An unnamed claim is not verification.
6. **A changed user-visible surface ships before/after screenshots**, scaled to
   the change — a cropped pair for a copy tweak, a full pair for a layout change.
7. **Read conventions from the workspace, not from memory.** A repo with a
   single `package.json`, a Go module, and a plugin manifest all differ; so do
   their default branch names.

## Anti-patterns

- Pushing to a protected `main` and reporting `Bypassed rule violations` as
  though it were success.
- A PR body that describes the fix but never states the problem, so the reviewer
  cannot disagree with the diagnosis.
- "Tests pass" with no command, or a Verification section written before the
  command was run.
- A `feat` branch with no issue and no coordination item, delivered silently.
- Bumping a minor because the diff was large, or a patch because it felt small —
  semver describes the **surface**, not the effort.
- A UI change whose reviewer has to run the branch locally to see what moved.
- Inventing a diagram style per PR instead of using `build-diagrams`.
- Filling every triggered section with "N/A" — that is the boilerplate this
  shape exists to avoid.
