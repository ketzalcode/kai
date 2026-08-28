# kai plugin tests

Six dependency-free, CI-enforced guards protect the plugin. All run on every
PR and push to `main` and must stay fast:

- **`npm run validate`** (`scripts/validate-plugin.mjs`) — the plugin **source**
  contract, including **release hygiene** (semver, current-version changelog
  section + link, README status stamp, `package.json` ↔ `package-lock.json`
  consistency, git-dependency allowlist).
- **`npm run doctor:self-test`** (`scripts/workspace-doctor.mjs --self-test`) —
  the generated **consumer-workspace** contract, exercised against committed
  golden fixtures.
- **`npm run host-contract`** (`scripts/host-contract.mjs --self-test`) — the
  **Kai frontmatter acceptance** heuristic: the expected discoverable inventory
  matches a committed golden snapshot, and malformed frontmatter fixtures are
  rejected.
- **`npm run host-tool-probe:self-test`**
  (`scripts/host-tool-probe.mjs --self-test`) — the offline parser,
  warning/grant classifier, redaction, determinism, and read-only contract for
  the optional live host probe.
- **`npm run release-guard:self-test`** (`scripts/release-guard.mjs --self-test`)
  — the decision core of the release gate: a behavior-sensitive change must carry
  a version bump plus changelog/README updates; docs/test-only changes are exempt.
  On pull requests CI also runs `release-guard --base <sha> --head <sha>`, which
  diffs the PR against its base and enforces the same rule for real.
- **`npm run check-syntax`** (`scripts/check-syntax.mjs`) — `node --check` on
  every shipped `.mjs`/`.js` helper and a PowerShell parse of `generate-audio.ps1`
  (skipped cleanly where `pwsh` is unavailable).

`npm test` runs all six.

## Deterministic checks (in CI)

### Plugin source — `validate-plugin.mjs`

Structural (original):

- every agent/skill has valid frontmatter, and its `name` equals its path id;
- every skill folder has a `SKILL.md`; no stray files under `agents/`;
- backtick agent references and every `inherit`ed skill/agent resolve;
- `plugin.json` exists and its `agents`/`skills` paths exist.

Behavioral-contract and host compatibility:

- **Kai tool-vocabulary lint.** Every declared `tools:` entry must be in
  `SUPPORTED_TOOLS`, Kai's explicit least-privilege vocabulary. This is a lint
  heuristic, not a claim about the live host parser. The host-tool probe measures
  validator warnings and runtime grants independently.
- **Inherited-skill access.** Every agent with an `**Inherits:**` declaration
  must also declare the `skill` tool. Delegated custom agents receive only
  declared tools, so omitting it makes inherited contracts unreachable.
- **Frontmatter shape.** `argument-hint` must be a quoted scalar (never an inline
  array — the CLI silently drops that); `user-invocable` must be boolean; the
  skill-only keys `argument-hint`/`user-invocable`/`allowed-tools` are invalid on
  an agent.
- **Run-area usage.** Every concrete `.kai/runs/<area>/` literal in an agent or
  skill must reference a registered area in the manifest.
- **Workspace-contract consistency (drift detectors).** The workspace contract
  is described in several files that must not diverge:
  - the managed `.gitignore` block is byte-identical between the repo
    `.gitignore` and the `kai-core-workspace-onboarding` template agents install;
  - the `.kai/runs` **areas** match across the manifest schema
    (`kai-core-workspace-conventions`), the onboarding scaffold, and
    `workflow-workspace-init`;
  - the initiative `artifacts/` directories match between
    `kai-core-workspace-conventions` and `workflow-initiative-init`;
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

### Pack migration — `workspace-doctor.mjs --migration-check`

The same script carries the read-only pack-migration check (#29): what this
**host** has installed, where each install came from, and whether a pack install
may proceed. `--self-test` runs it over a 33-scenario matrix and asserts each
verdict exactly — `clear` (may proceed), `blocked` (refused), `unknown` (the
evidence did not settle it). A case that must be `unknown` failing as `clear` is
a test failure, because "unverified" reported as success is the bug this check
exists to prevent.

The matrix covers a clean legacy install, a clean pack set, legacy/pack
coexistence, a department pack without `kai-core`, a stale install tree left by
an uninstall, metadata left by an interrupted uninstall, the same pack installed
from both a direct source and the marketplace, config/`plugin.json` identity
disagreement, inferred and unknown provenance, a truncated config, junk config
entries, missing/malformed install surfaces, symlinked install roots, foreign
identities in kai-shaped trees, Windows/macOS cache-path normalization, an
unreadable and a non-boolean `settings.json` enabled state, and each
workspace-provenance state (current, stale, ahead, unrecognized, unreadable).
One assertion snapshots every fixture file before and after and requires them
byte-identical: the check is read-only, and that is proven rather than promised.

The fixtures live in `test/fixtures/host-installs.json` as **data**, not
directories: a host cache tree (`installed-plugins/_direct/…`) and an empty
directory are things a git checkout cannot reproduce faithfully, so the
self-test materializes them into a temp directory and removes it afterwards.
Run the check against a real host with `npm run doctor:migration`. Add `-- --json`
for automation; exit codes are `0` clear, `2` blocked, and `3` unknown.

### Kai frontmatter acceptance — `host-contract.mjs`

Applies Kai's deterministic authoring rules to the shipped inventory. The
shared contract lives in `scripts/lib/loader-contract.mjs` and is imported by
both this guard and `validate-plugin.mjs`, so Kai's two lint paths cannot drift.
It does not claim to reproduce the live host parser. `--self-test` asserts:

- **The expected discoverable inventory matches a golden snapshot.** Every
  agent/skill must satisfy Kai's authoring rules. The resulting
  inventory — agent roster, skill roster, and the user-invocable skill surface
  (name + `argument-hint`) — is diffed against `test/fixtures/inventory.json`, so
  a roster or invocation-surface change is explicit and reviewable in the PR.
  Regenerate the golden with `npm run host-contract:update` when the change is
  intended.
- **Malformed frontmatter is rejected before release.** The fixtures under
  `test/fixtures/host-loader/invalid/` each reproduce a real load-time failure
  class — the #23 `argument-hint`-as-inline-array bug, a non-array `tools`, a
  tool outside Kai's vocabulary, a skill-only key on an agent, and a name/id
  mismatch — and the guard must reject each for the expected reason.
- **The README quickstart mirrors a passing scenario.** The README status stamp
  (`**N agents and M skills**`) must equal the live loadable inventory, and every
  `npm run <script>` the README documents must exist in `package.json`.

## Host-backed checks

`npm run host-tool-probe:plan` prints the exact direct/delegated matrix,
throwaway frontmatter, and `copilot` argv without writing or spawning. After
reviewing that plan, `npm run host-tool-probe` runs against an isolated plugin
and workspace outside the repository and writes a redacted report under
`.kai/runs/eng/`. The live run is manual: CI executes only the synthetic
`host-tool-probe:self-test`, so it needs no host binary, credentials, or network.
Use `--rows R2-primary,R8-repo-current,R9-control` for a bounded retry, and
`--copilot-entry <absolute-versioned-index.js>` to measure a retained CLI build
without allowing the active launcher shim to substitute a newer version.
`--update --from <report> --baseline <file>` and the matching `--check` compare
explicit, normalized redacted reports; the repository carries no live baseline.

Broader in-process inventory, degraded CLI/cloud, and fleet certification remain
tracked in #33.

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
- kai-core-content-grounding claim-safety end to end on a real `product_context.json`.
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
`schema_version`, append a migration step to the `kai-core-workspace-onboarding` ladder,
and update the doctor + fixtures together. When adding, removing, or renaming an
agent/skill (or changing a user-invocable skill's `argument-hint`), regenerate
the golden inventory with `npm run host-contract:update` and commit it.
