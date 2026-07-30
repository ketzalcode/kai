# kai plugin tests

Three dependency-free, CI-enforced guards protect the plugin. All run on every
PR and push to `main` and must stay fast:

- **`npm run validate`** (`scripts/validate-plugin.mjs`) — the plugin **source**
  contract.
- **`npm run doctor:self-test`** (`scripts/workspace-doctor.mjs --self-test`) —
  the generated **consumer-workspace** contract, exercised against committed
  golden fixtures.
- **`npm run host-contract`** (`scripts/host-contract.mjs --self-test`) — the
  **host-loader acceptance** mirror: the discoverable inventory a host would
  expose matches a committed golden snapshot, and malformed frontmatter fixtures
  are rejected.

`npm test` runs all three.

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
  Includes `sample-downstream` — a `ready` item whose dependency is only
  `in-review` (not its required `shipped`) — to prove the revised lifecycle from
  #31: `ready` means committed with *declared* dependencies, not runnable, so
  this item is healthy and simply waits for the derived `executable` predicate.
- `test/fixtures/broken-workspace/` — a workspace the doctor **must reject**:
  a pre-schema manifest (migration required), an `in-review` item with no
  `change_ref`, an `in-review` item whose `change_ref` is a **non-SHA** label
  (rejected per #31 — only a git commit/PR-head SHA is allowed), a dangling
  dependency, and a machine-absolute `artifact_target`.
- `test/fixtures/concurrency-workspace/` — a **lease-safety** fixture backing
  the collision-safe lease contract from #30. Three item records exercise the
  guard: a held lease with **no grant token / `version_at_grant`** (the racy
  pre-token shape), a tokened grant whose **`version_at_grant` equals the item
  `version`** (a grant that skipped the increment — the double-write shape), and
  a well-formed tokened lease whose **expiry has passed** (surfaced as a
  stale-work recovery signal, not silently reclaimed). `threads/stale-recovery.md`
  narrates the full HANDOFF → `COLLISION` → `RECOVERY` flow and includes the
  structured #31 `RECOVERY` and design-step `WAIVER` records, so the fixture
  demonstrates the behavior, not only the static schema.

The doctor checks manifest presence/JSON/keys, `schema_version` compatibility
(emitting the migration ladder when behind), item `type`/`id`/lifecycle state,
`change_ref`-bound review states, typed dependencies + cycles, lease shape —
including that a held lease carries a unique `token` bound to a
`version_at_grant` that is strictly less than the item `version` — expiry,
durable-path containment, and `BOARD.md` drift.
Run it against a real workspace with `npm run doctor` (or `node
scripts/workspace-doctor.mjs --root <dir>`).

Fixtures are self-contained and committed with **no** machine-specific paths or
secrets (repository-mode roots are relative). The broken fixture's one
deliberate machine-absolute path lives inside a value the doctor is expected to
reject, not in a shipped manifest.

### Host-loader acceptance — `host-contract.mjs`

Mirrors the Copilot host loader to take the acceptance view of the shipped
inventory. The shared loader contract lives in `scripts/lib/loader-contract.mjs`
and is imported by **both** this mirror and `validate-plugin.mjs`, so the two
can never drift. `--self-test` asserts:

- **The discoverable inventory is host-loadable and matches a golden snapshot.**
  Every agent/skill is loaded exactly as a host would; any loader rejection is a
  failure (a broken entry never silently drops from the roster). The resulting
  inventory — agent roster, skill roster, and the user-invocable skill surface
  (name + `argument-hint`) — is diffed against `test/fixtures/inventory.json`, so
  a roster or invocation-surface change is explicit and reviewable in the PR.
  Regenerate the golden with `npm run host-contract:update` when the change is
  intended.
- **Malformed frontmatter is rejected before release.** The fixtures under
  `test/fixtures/host-loader/invalid/` each reproduce a real load-time failure
  class — the #23 `argument-hint`-as-inline-array bug, a non-array `tools`, an
  unsupported tool, a skill-only key on an agent, and a name/id mismatch — and
  the loader must reject each for the expected reason.
- **The README quickstart mirrors a passing scenario.** The README status stamp
  (`**N agents and M skills**`) must equal the live loadable inventory, and every
  `npm run <script>` the README documents must exist in `package.json`.

## Host-backed checks (not yet automated)

The mirror above is deterministic — it reproduces the host's *loader contract*,
not a live host. Mounting the plugin in a **real** Copilot host (asserting the
inventory loads in-process, scaffolding a scratch workspace, and exercising
degraded CLI/cloud paths) is the remaining host-backed layer, tracked in #33. It
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
and update the doctor + fixtures together. When adding, removing, or renaming an
agent/skill (or changing a user-invocable skill's `argument-hint`), regenerate
the golden inventory with `npm run host-contract:update` and commit it.
