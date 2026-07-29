# kai plugin tests

Two dependency-free, CI-enforced guards protect the plugin. Both run on every PR
and push to `main` and must stay fast:

- **`npm run validate`** (`scripts/validate-plugin.mjs`) — the plugin **source**
  contract.
- **`npm run doctor:self-test`** (`scripts/workspace-doctor.mjs --self-test`) —
  the generated **consumer-workspace** contract, exercised against committed
  golden fixtures.

`npm test` runs both.

## Deterministic checks (in CI)

### Plugin source — `validate-plugin.mjs`

Structural (original):

- every agent/skill has valid frontmatter, and its `name` equals its path id;
- every skill folder has a `SKILL.md`; no stray files under `agents/`;
- backtick agent references and every `inherit`ed skill/agent resolve;
- `plugin.json` exists and its `agents`/`skills` paths exist.

Behavioral-contract and host compatibility:

- **Host-tool allowlist.** Every declared `tools:` entry must be a real host
  tool in `SUPPORTED_TOOLS`. A typo or an unsupported generic alias
  (`read` / `search` / `write`) fails CI, so a shipped agent never silently
  loses a capability. Adding a new host tool is a deliberate edit to the
  allowlist.
- **Frontmatter shape.** `argument-hint` must be a quoted scalar (never an inline
  array — the CLI silently drops that); `user-invocable` must be boolean; the
  skill-only keys `argument-hint`/`user-invocable`/`allowed-tools` are invalid on
  an agent.
- **Run-area usage.** Every concrete `.kai/runs/<area>/` literal in an agent or
  skill must reference a registered area in the manifest.
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
  must match the documented manifest schema (including an integer
  `schema_version`) and canonical areas, contain no machine-specific absolute
  paths, and use `workspace_root: "."` in repository mode.

### Generated workspace — `workspace-doctor.mjs`

Validates a scaffolded consumer workspace (not the plugin source). The
`--self-test` mode asserts the committed golden fixtures behave:

- `test/fixtures/repo-workspace/` — a **healthy** workspace the doctor passes:
  a schema-compatible manifest plus a clean `coordination/` set (items, BOARD).
- `test/fixtures/broken-workspace/` — a workspace the doctor **must reject**:
  a pre-schema manifest (migration required), an `in-review` item with no
  `change_ref`, a dangling dependency, and a machine-absolute `artifact_target`.

The doctor checks manifest presence/JSON/keys, `schema_version` compatibility
(emitting the migration ladder when behind), item `type`/`id`/lifecycle state,
`change_ref`-bound review states, typed dependencies + cycles, lease shape and
expiry, durable-path containment, and `BOARD.md` drift. Run it against a real
workspace with `npm run doctor` (or `node scripts/workspace-doctor.mjs --root
<dir>`).

Fixtures are self-contained and committed with **no** machine-specific paths or
secrets (repository-mode roots are relative). The broken fixture's one
deliberate machine-absolute path lives inside a value the doctor is expected to
reject, not in a shipped manifest.

## Host-backed checks (not yet automated)

An acceptance layer that mounts the plugin in a real Copilot host — asserting the
agent/skill inventory is loadable, scaffolding a scratch workspace against a
golden contract, and exercising degraded CLI/cloud paths — is tracked in #33. It
belongs in a separate, possibly release-gated, job so the checks above stay fast.

## Manual-only coverage (needs a host)

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
until they agree. When changing the generated workspace contract, bump
`schema_version`, append a migration step to the `workspace-onboarding` ladder,
and update the doctor + fixtures together.
