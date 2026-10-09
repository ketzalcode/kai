# Task 7 report: Stop compiling explanatory prose

## Outcome

- Deleted the listed prose validators, their validator loops, imports, errors,
  and mutations.
- Removed additional prose scans for documentation references, skill
  reachability, authoring-reference tables, availability sentences, and Core
  fallback wording.
- Kept structural route identity/order, frontmatter, tool, package ownership,
  namespace, reference, publication, generated-runtime, hook, and build checks.
- Replaced publication-skill suffix discovery with
  `publicationDeclarationInventoryErrors`, driven by each pack's
  `publication.json`.
- Removed generated publication tables and schema-history checker markers.
- Deleted `test/coordination-source-routing-self-test.mjs` and trimmed stale
  prose/historical mutations from affected source-contract tests.
- Updated the clean-consumer test to read structured `publication.json`
  declarations rather than parsing Markdown tables or refusal prose.
- Regenerated the committed pack output.

## Mutation target

- Before: `pack-preview self-test: 209 checks passed`.
- After: `pack-preview self-test: 13 checks passed`.
- The remaining assertions are the 13 requested structural, security,
  ownership, and build mutations.

## Verification

Passed:

- `node tools\validate-plugin.mjs`
- `node tools\pack-preview.mjs --self-test`
- `node tools\pack-preview.mjs --gate all`
- `node tools\pack-preview.mjs --check`
- `node tools\check-syntax.mjs`
- `git diff --check`
- `node --test test\publication-contract-self-test.mjs`
- `node test\consumer-install-self-test.mjs`
- affected Engineering and Creative source-contract tests

`npm test` progressed through the coordination report and host suites, then
failed in the existing
`native question-answer delegation binds the exact Task question and recipient`
case. `native-host.mjs` passes `.kai/manifest.json` through the typed private
artifact route validator. The failing runtime files and test are unchanged from
base, so this is outside Task 7.

## Review round 1/5 — 2026-10-08

- Reworked the missing-generated-file mutation to write a drift-clean generated
  tree, delete only `kai-core/plugin.json`, and require drift detection to report
  that exact path as the sole drift.
- Removed or corrected stale comments that claimed fallback or prose-semantic
  validation in `pack-plan.mjs`, `pack-preview.mjs`, and `validate-plugin.mjs`.

Evidence:

- RED: the exact-path mutation failed against the prior whole-directory setup
  (`12 checks passed, 1 FAILED`).
- `node tools\pack-preview.mjs --self-test` — 13 checks passed.
- `node tools\validate-plugin.mjs` — valid (21 agents, 39 skills).
- `node tools\pack-preview.mjs --gate all` — all four gates clean.
- `node tools\pack-preview.mjs --check` — committed plugins match the generator.
- `node tools\check-syntax.mjs` — 74 JS/MJS helpers parse cleanly.
