# kai plugin tests

`npm run validate` (`scripts/validate-plugin.mjs`) is the dependency-free,
CI-enforced guard for the plugin contract. It runs on every PR and push to
`main` and must stay fast.

## What is checked automatically

Structural (original):

- every agent/skill has valid frontmatter, and its `name` equals its path id;
- every skill folder has a `SKILL.md`; no stray files under `agents/`;
- backtick agent references and every `inherit`ed skill/agent resolve;
- `plugin.json` exists and its `agents`/`skills` paths exist.

Behavioral-contract and host compatibility (this suite):

- **Host-tool allowlist.** Every declared `tools:` entry must be a real host
  tool in `SUPPORTED_TOOLS`. A typo or an unsupported generic alias
  (`read` / `search` / `write`) fails CI, so a shipped agent never silently
  loses a capability. Adding a new host tool is a deliberate edit to the
  allowlist.
- **Workspace-contract consistency (drift detectors).** The workspace contract
  is described in several files that must not diverge:
  - the managed `.gitignore` block is byte-identical between the repo
    `.gitignore` and the `workspace-onboarding` template agents install;
  - the `.kai/runs` **areas** match across the manifest schema
    (`workspace-conventions`), the onboarding scaffold, and
    `workflow-workspace-init`;
  - the initiative `artifacts/` directories match between
    `workspace-conventions` and `workflow-initiative-init`;
  - the `library/<type>/` set matches across the conventions "Library types"
    table and both library scaffolds.
- **Fixture manifest schema.** `test/fixtures/repo-workspace/.kai/manifest.json`
  must match the documented manifest schema and canonical areas, contain no
  machine-specific absolute paths, and use `workspace_root: "."` in repository
  mode.

Fixtures are self-contained and committed with **no** machine-specific paths or
secrets (repository-mode roots are relative).

## What still needs a host (not in CI)

kai is a **declarative** plugin: its agents and skills are prompts, so the
prompt-level behaviors below cannot be executed deterministically in a
dependency-light CI check. They are verified by a manual smoke run inside a
Copilot host (CLI or coding agent) against a scratch workspace:

- current-workspace resolution and optional linked-workspace aggregation;
- operator `decision`/`reply`/`action` detection, answered-question removal,
  proposed-item exclusion, and release-ready inclusion in the agenda;
- consultation packet/bridge sanitization and read-only boundaries;
- setup/migration idempotence (`.persona-self/`, retired `.kai/local.json`,
  manifest `workspace_kind`) without exposing private local paths;
- workspace-scoped identity extraction and `status: stub` handling;
- content-grounding claim-safety end to end on a real `product_context.json`.
- support triage redaction, grounded deduplication, and incident-first routing;
- growth/data metric-contract, causal-status, small-cell, and scope-boundary
  behavior;
- security/SRE non-mutating review, exact-`change_ref` evidence, and explicit
  operator risk waivers;
- incident SEV/lifecycle transitions, operator decision/action split, unsent
  communication, recovery evidence, and release/incident separation.

When adding a new run area, `library/` type, or host tool, update the manifest
schema/scaffolds/allowlist together — the consistency checks above will fail
until they agree.
