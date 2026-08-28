# Architecture Decision — marketplace rename, `packs/` → `plugins/`, and the v1.0.4 user migration

**Item:** `kai/coordination/items/area-plugins-migration-architecture.md`
**Initiative:** area-plugins (milestone `decisions-locked`)
**Author:** `principal-swe-architect` — `DECISION 2026-08-27-1922` as amended by
revisions 2 (`2001`), 3 (`2028`) and **4 (`2053`, current)**
**Status:** **Accepted with conditions** — `principal-sre`
`independent-reliability` review `REVIEW 2026-08-27-2228`, verdict
**CONDITIONAL**, P0 0 / P1 0 / P2 4, `satisfies_requirement: true`
**Promoted:** 2026-08-27 by `principal-sre` on approval

> **This artifact is the promoted, canonical form of the decision.** The working
> record, all four architect revisions and **all three `changes-requested`
> verdicts** live in `kai/coordination/threads/area-plugins-migration-architecture.md`,
> which remains the append-only audit trail and is never rewritten to match this
> file. Where this artifact summarises, the thread governs.
>
> **Nothing here is implemented and nothing is shipped.** No production code,
> manifest or marketplace file was changed by any pass of this decision:
> `.github/plugin/marketplace.json:2` still reads `"kai-plugins"` and
> `scripts/lib/pack-plan.mjs:49` still reads `PACKS_DIR = 'packs'`. Every claim
> about CI behaviour is `derived-from-source` — read from the checks — never
> `observed`; no session in this chain had a shell.

---

## 1. The decision in one line

Rename the marketplace `kai-plugins → kai` as a **renamed index** (not a new
index, not a dual-publish window), rename the generated tree `packs/ → plugins/`,
and ship the two as **two separate releases, folder first**, with the marketplace
rename gated on an operator-run host probe **before merge** — because in this
repository merging *is* publishing.

## 2. Why the layer separation carries the record

The non-stranding and no-coexistence invariants appear to conflict only if the
three layers are collapsed:

| layer | what it is | what this record does to it |
|---|---|---|
| **source** | the marketplace name a host resolves against | renamed `kai-plugins → kai` |
| **repo** | the committed tree name | renamed `packs/ → plugins/` |
| **identity** | the published plugin names | **untouched — no identity moves** |

Non-negotiable #9 binds the **identity** layer. Neither rename touches it, so
"no old and new identity coexists" is preserved without bending, and
"nobody is stranded" is a source-layer question answered by recognition rather
than by republication.

## 3. Decisions

Full argument for each is in the thread at the cited line.

| # | decision | disposition | thread |
|---|---|---|---|
| **D0** | Host syntax is fixed at `<plugin>@<marketplace>`, yielding `kai-engineering@kai`. No marketplace named after an area; no plugin named `kai`. | Endorse | `:267` |
| **D1** | The rename is a **renamed index**. Dual-publish is rejected because it would *manufacture* the provenance collision it claims to prevent. Publication is gated by **PROBE-M**, an operator-run host probe. | Reshape | `:277` |
| **D2** | Non-stranding and no-coexistence do not conflict; the tension is between layers, not between goals. | Endorse | `:351` |
| **D3** | `kai-personal` is **retired**. `LEGACY_PLUGIN` widens from a scalar to an append-only `RETIRED_PACK_PLUGINS`, preserving uninstall-first and coexistence-refused verbatim. | Reshape | `:388` |
| **D4** | The doctor gets **one name to instruct, many to recognise**: `MARKETPLACE` + `MARKETPLACE_ALIASES`. `stale-source` is a `note`, so a healthy un-re-pointed 1.0.4 host stays `clear` rather than being filed under `unknown` — otherwise the doctor becomes the stranding mechanism. | Reshape | `:434` |
| **D5** | The derived `legacy-rollback` set had a **retirement hole**: it covered *current* publishable names, so a retired identity silently dropped out of `forbiddenPluginNames`. Fixed by one append-only list feeding three consumers. | Reshape | `:523` |
| **D6** | `PACKS_DIR` stays the single source of truth for the tree name; the hard-coded `packs/` literals that do not follow it are enumerated and fixed. `installSurface` is an **enum, not a directory** — `legacy-rollback` is not a path — and is left alone. | Reshape | `:573` |
| **D7** | Historical records are **mechanically out of reach**, not carefully avoided. Two mechanisms: **(a)** the ban checker never scans them; **(b)** a PR-level assertion. *(b) is superseded by D15.* | — | `:627` |
| **D8** | **Separately. Folder first, marketplace second. Two releases**, seven mechanism PRs (A-1…A-5, B-1, B-2). The folder move and the per-agent contract rewrite never land in the same PR. | Reshape | `:666` |
| **D9** | Not a critical-boundary call. These are reversible engineering calls, made. The one operator dependency is an **action**, not a decision. | — | `:732` |
| **D10** | **Merging B-2 *is* publishing** — the marketplace serves the default branch — so **PROBE-M is a merge prerequisite of B-2**, not a post-merge step. Gating after the merge would place the probe past the point of no return. | Reshape | `:1505` |
| **D11** | **`RECOVERY-M`** — a real rename-specific recovery runbook, and a ruling on how recovery commands express the marketplace token for a two-population world. | Accept | `:1620` |
| **D12** | The retired-identity carve-out is **decoupled into two banned sets, marker-delimited**, so recovery prose can name a retired identity inside a marked block without the ban self-defeating. | Decouple | `:1720` |
| **D13** | The agent-procedure layer: **relocate the predicate to the doctor, then pin it**, so the recognise-many form is derived rather than hand-maintained. | Relocate | `:1785` |
| **D14** | **`MARKETPLACE_ALIASES` is recognition-only; the ban is derived from retirement** (`RETIRED_MARKETPLACE_NAMES`), with an entry guard `RETIRED ∩ KAI_PLUGINS = ∅`. *Enforcement is not the inverse of recognition.* | Decouple | `:2488` |
| **D15** | **The immutability scope is not the inverse of the ban-scan scope.** See §4. | Decouple | `:3391` |
| **R1** | `skills/demo-narrate/SKILL.md` satisfies A1 criterion (ii) with a **derived rule, not a pinned literal**. | — | `:759` |
| **R2** | The `kai-personal` string surviving a green build is closed by **one derived literal ban, in the `contract` job**. | — | `:819` |

## 4. D15 — the two scopes, split (current form of D7(b))

One array had been serving two jobs whose memberships must differ. The split:

```
BAN-SCAN SCOPE      = RENAME_EXEMPT_PREFIXES          [byte-for-byte UNCHANGED — D7(a)]
    predicate : the literal-ban check never READS these paths
    consumer  : scripts/validate-plugin.mjs (R2, D12, D14)
    declared  : scripts/lib/pack-plan.mjs, beside PACKS_DIR

IMMUTABILITY SCOPE  = HISTORY_APPEND_ONLY_PATHS       [NEW — D7(b)]
    = [ 'CHANGELOG.md',
        'kai/library/releases/',
        'docs/proposals/',
        'test/fixtures/host-installs.json' ]
    predicate : per path in the PR diff, DELETED-LINE COUNT == 0
                — these files may GROW, they may not be REWRITTEN
    consumer  : scripts/release-guard.mjs, beside evaluate()
    binding   : every pull request, unconditionally. No self-classification.
```

**Why the predicate is `deleted == 0`.** The acceptance line says historical
records are excluded from **rewriting**, not from touching. A rename sweep
replaces a token, which in a unified diff is a deletion plus an addition, so any
sweep into these paths fires. An append is additions only, so it passes — which
is required, because `release-guard.mjs:64-66` *mandates* a `CHANGELOG.md` entry
on every behaviour PR.

**Why it lives in `release-guard.mjs`.** That module already runs only on pull
requests (`validate.yml:66-68`), already computes the three-dot `--no-renames`
diff (`:74-80`), and already owns *"what must a PR contain"*. Placing the
immutability rule beside `evaluate()` puts the rule that **requires** the
changelog append and the rule that **constrains** it in the same function. They
previously met only in a CI log, which is how the contradiction survived three
review passes. **No new job, workflow step, script, module or import.**

**Why the mutable state machines are deliberately excluded.**
`kai/coordination/items/**`, `ACTIVE.md`, `BOARD.md`, `backlog.md` and
`kai/initiatives/**` are mutable by design — `version`, `state` and `lease` change
on every pass — so an append-only predicate over them would be unsatisfiable in
the mirror-image way. They keep the acceptance line's protection through **D7(a)**:
a path the scanner cannot see is a path no sweep is ever directed to.

> **Reviewer's note, carried into this artifact.** The acceptance line names four
> paths. **Two** of them (`CHANGELOG.md`, `kai/library/releases/**`) hold
> mechanical write-protection under D15; all four hold D7(a)'s visibility
> protection. That is stated plainly rather than claimed as full coverage.
> `kai/coordination/threads/**` is append-only by contract and fits the predicate;
> whether to add it is condition **P2-9** below.

## 5. Sequencing

Two releases, folder first. Seven mechanism PRs plus a recovery patch, all eight
verified mergeable against the `contract` job under D15.

```
Release A (repo layer)                    Release B (source layer)
  A-1  guard + preview + workflow           B-1  fixture arms (added, old kept)
  A-2  the two source-of-truth modules      B-2  marketplace.json:2 → "kai"
  A-3  the derived checks + D15                  MARKETPLACE / ALIASES / RETIRED
  A-4  PACKS_DIR + git mv + source: ×5           installer regen + prose sweep
  A-5  docs sweep                                ▲
                                            PROBE-M must pass BEFORE this merge
                                            (merging B-2 IS publishing — D10)
```

`.github/plugin/marketplace.json:2` in **B-2** is the only irreversible byte, and
the irreversible **act** is the operator's publish, which this repo couples to the
merge. Hence D10.

## 6. Recovery — `RECOVERY-M` step 2

A revert is **anti-monotonic** and `release-guard` is monotonic on both release
artifacts, so a bare `git revert` is red on the version check
(`release-guard.mjs:39-49`, `:61-63`) independently of D15:

```
git revert -n <B-2 merge commit>
git restore --source=HEAD --staged --worktree -- CHANGELOG.md plugin.json package.json package-lock.json
# then: MARKETPLACE_ALIASES = ['kai']; forward patch bump; append a new dated
#       CHANGELOG.md section; re-stamp README.md "## Status". Commit.
```

- **`README.md` is deliberately NOT restored.** `release-guard.mjs:67-69` requires
  only that it *appear* in the diff, so the reverted prose satisfies the gate while
  the sweep-back to `@kai-plugins` survives. Restoring it would strand new
  installers on `@kai` prose after the marketplace went back.
- The restore list is exactly the two monotonic release artifacts plus the lockfile
  that mirrors the version. No site list, no judgment call.
- Everything that matters travels backwards mechanically: `marketplace.json:2`,
  `MARKETPLACE`, `RETIRED_MARKETPLACE_NAMES`, the regenerated installer skill and
  every swept prose token.

**Operator-facing summary:** run the two commands and every gate arm is green —
**including the derived pins, which you should not expect to see red**, because
B-2 carried the installer regeneration and the revert restores it.

## 7. The named residual — accepted

After a recovery, a stale `@kai` token in hand-authored docs names a marketplace
**no host declares**. Marketplaces are added by **repo slug**
(`copilot plugin marketplace add RubenSaucedo/kai`) and the marketplace's *name* is
declared at `.github/plugin/marketplace.json:2` — so the token cannot resolve, and
cannot resolve to a third party. **Loud failure at first use; no partial state, no
silent misdirection.** `observed`, per `REVIEW 2026-08-27-2042`.

The protected population — existing 1.0.4 installs — is untouched in every branch,
the highest-traffic path is gate-enforced, and the residual exists only on the
non-default hand-authored fallback. A repo slug is an **address**, not a **name**;
the deferred positive marketplace-token rule must therefore key on **token shape,
never command position**, or it would demand `marketplace add kai` and red-light
the generator-derived installer skill.

## 8. Review history

| pass | verdict | findings | bound to |
|---|---|---|---|
| `REVIEW 2026-08-27-1944` | changes-requested | P0 0 / P1 4 / P2 6 | rev 1 (`DECISION …1922`) |
| `REVIEW 2026-08-27-2015` | changes-requested | P0 0 / P1 1 / P2 5 | rev 2 (`DECISION …2001`) |
| `REVIEW 2026-08-27-2042` | changes-requested | P0 0 / P1 1 / P2 2 | rev 3 (`DECISION …2028`) |
| **`REVIEW 2026-08-27-2228`** | **approved-with-conditions** | **P0 0 / P1 0 / P2 4** | **rev 4 (`DECISION …2053`)** |

Four defects of one recurring shape were found and fixed across the chain — a list
justified by one rationale being reused for a second, incompatible one (D5, D14,
D15). The general form, stated in the record so a fourth instance is recognisable:
**a list justified by "the checker should ignore these" is never automatically the
list justified by "an author may not change these." Ignoring is about reading;
immutability is about writing.**

## 9. Conditions on acceptance

Binding on the **implementation** of D15 in PR **A-3** (`principal-swe-infra` owns
the *how*). None reopens architecture; none gates the milestone.

1. **P2-8** — `HISTORY_APPEND_ONLY_PATHS` must stay within the coverage of
   `RENAME_EXEMPT_PREFIXES`; a frozen-but-scannable path is unsatisfiable by
   construction. Record the invariant beside the constant and prefer a witness arm
   in the existing `release-guard.mjs --self-test` (`validate.yml:48-49`) over a
   new gate.
2. **P2-9** — correct the "every change is a relaxation / nothing becomes newly
   forbidden" summary: dropped paths newly permit *rewriting*, not only appending,
   and the binding axis **tightens** from "the rename PRs" to "every pull request".
   Both are defensible — the tightening is the better design — but the record must
   say so. Rule explicitly on `kai/coordination/threads/**`.
3. **P2-10** — a JSON-object append is **not** a 0-deletion operation in the
   general case: adding a key after the last entry of `homes` requires the previous
   closing brace to gain a comma. Resolve before B-1 is authored — drop
   `test/fixtures/host-installs.json` from the constant, state the
   insert-before-last constraint where B-1's author will read it, or count only
   non-structural deletions.
4. **P2-11** — `git revert -n <B-2 merge commit>` requires `-m <parent>` if B-2
   lands as a true merge commit. State the repo's merge strategy in `RECOVERY-M`
   step 2 or write the flag with a one-clause note.
5. **Standing** — the first real execution of D15's predicate is A-3's CI run.
   Until then every green in this record is `derived-from-source`. If A-3's run
   contradicts any arm, that is a new reliability question, not a discharged one.

## 10. What remains outside this decision

- **PROBE-M and PROBE-M′ are operator *actions*, not decisions.** The design is
  identical under every outcome.
- **Whether `contract` is a required status check on `main` is an operator
  *verification*** and stays `reported`. R1, R2 and D7 all depend on it.
- **No release state has moved.** `workflow-ship` alone owns `release-ready`,
  `deploying`, `production-verification` and `shipped`. **Nothing here is
  shipped** — no human has deployed or verified anything.
- **No human on-call obligation is assigned by this record.**
