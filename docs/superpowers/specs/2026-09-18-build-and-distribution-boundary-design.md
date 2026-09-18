[kai](../../../README.md) / [Docs](../../README.md) / Specs / Build and distribution boundary

# Separating what kai develops from what kai ships

**Status:** design, approved in conversation 2026-09-18. Not implemented.
**Supersedes:** nothing. **Depends on:** nothing.

## Summary

kai has no boundary between its development toolchain and its product. One
directory, `scripts/`, is both. Which files reach a consumer is *inferred* from
prose mentions plus an import closure rather than declared, so developer tooling
has silently leaked into every installed copy. Consumers receive 56 executable
files totalling 1,070 KB — including kai's own release machinery, self-test
code, and one 46 KB script nothing references.

This design introduces that boundary, adds a build step that emits one bundled
artifact per entry point, removes an npm dependency that never installs on a
consumer machine, and closes a platform-coverage gap in CI.

It ships in four independently valuable phases. Phase 1 delivers most of the
benefit and requires no bundler.

## What this is not

Two claims were tested during investigation and did **not** hold. They are
recorded so nobody re-derives them.

**The missing boundary does not cause the cross-platform breakage.** That has
two unrelated causes: every CI job runs `ubuntu-latest`, so the maintainer's own
development platform has no coverage at all; and shipped path code imports bare
`isAbsolute`/`resolve`/`sep` from `node:path` with no `path.win32`/`path.posix`
anywhere in the tree. Phase 0 addresses both directly. Reorganising the
repository would not have fixed either.

**Bundling the audio dependency does not make audio work offline.** `lectoria`'s
`createTTS()` unconditionally constructs an Azure Speech client. After bundling,
audio still opens a WebSocket to `wss://<region>.tts.speech.microsoft.com`,
still requires `AZURE_SPEECH_REGION` plus a key or `az login`, and still bills
per character. Bundling converts a mysterious failure into an honest one. That
is worth doing and is not the same as delivering a working offline feature.

## Evidence

Measured on 2026-09-18 at `e24c08e`.

### The root `scripts/` directory is 89% product

| Destination | Files | Size |
| --- | ---: | ---: |
| copied into `kai-core` | 52 | 890 KB |
| copied into `kai-creative` | 5 | 182 KB |
| developer tooling, never shipped | 7 | 196 KB |

The seven dev-only files are `validate-plugin.mjs`, `pack-preview.mjs`,
`release-guard.mjs`, `host-contract.mjs`, `check-syntax.mjs`,
`lib/incubation-contract.mjs`, and `extract-learn-path.js`.

### What a consumer actually receives

56 executable files, 1,070 KB. Only **9 are entry points**; the other 47 are
internal modules pulled in by the import closure. The coordination runtime is
35 modules with zero direct entry points.

Entry points today:

| Pack | Entry point | Invoked by |
| --- | --- | --- |
| core | `coordinate.mjs` | skill instruction |
| core | `activity.mjs` | skill instruction |
| core | `workspace-doctor.mjs` | skill instruction |
| core | `observe-subagent.mjs` | **host hook** (`hooks.json`) |
| core | `observe-watch.mjs` | user/service |
| creative | `demo-format.mjs` | skill instruction |
| creative | `demo-narrate.mjs` | skill instruction |
| creative | `demo-zoom.mjs` | skill instruction |

### Three concrete leaks

1. **113 KB of release machinery.** `workflow-self-check.agent.md:85` mentions
   `scripts/generate-catalog.mjs` in prose. The closure ships it (13 KB), which
   imports `lib/pack-plan.mjs` (93 KB — kai's partition, migration baselines,
   retired-agent lists, marketplace policy) and `lib/loader-contract.mjs` (7 KB).
   Every consumer of `kai-core` receives kai's own release tooling.
2. **Self-test code.** Roughly 35-45% of `activity.mjs` and 20-30% of
   `observe-watch.mjs` and `workspace-doctor.mjs` is `--self-test` code a
   consumer never runs. These are estimates from visible test blocks, not
   measured coverage.
3. **Unreferenced code.** `demo-capture.mjs` (46 KB) ships to `kai-creative`
   and is referenced by **zero** shipped markdown.

### The npm dependency never installs

`kai-core` and `kai-creative` declare a runtime dependency on `lectoria`, pinned
to a GitHub release tarball. The Copilot CLI host is a file-copying installer —
it has no documented install or build step, and `plugin.json` has no `scripts`,
`build`, `main`, or `dependencies` field in either manifest format.

CI proves `npm ci --prefix plugins/<pack>` succeeds *in a git checkout of this
repository*. A consumer has `~/.copilot/installed-plugins/<marketplace>/kai-core`,
populated by a host copy, where nobody runs npm. kai's own wrapper admits this
and instructs the user to run `npm ci` into that cache directory — which plugin
updates overwrite, including the documented automatic session-start auto-update.
The failure therefore recurs on every update.

A GitHub-wide code search found kai is the only public Copilot CLI plugin that
asks consumers to run `npm ci`. Independent projects that hit the same wall
(`microsoft/TypeAgent`, `vectorize-io/hindsight`) both solved it by bundling.

### Bundling is viable

Verified empirically: the pinned tarball was downloaded, its sha512 matched, its
full 184-package tree installed, and esbuild bundles were built **and executed**.

| Artifact | Raw | Minified |
| --- | ---: | ---: |
| `speak` slice (what `demo-narrate.mjs` uses) | 2.0 MB | 861 KB (measured) |
| full CLI, jsdom external | 6.7 MB | ~3 MB (projected) |
| full CLI, everything inlined | 18.7 MB | ~8-9 MB (projected) |

No native addons in `lectoria` itself, no install scripts anywhere in the tree,
no `os`/`cpu` constraints, pure ESM. `@napi-rs/canvas` never enters the bundle
because pdfjs reaches it through `createRequire`, inside a try/catch that warns.

`microsoft/TypeAgent` is a working existence proof: esbuild ESM bundles,
`hooks.json` pointing at built output, in production.

## Goals

1. A consumer receives only what a consumer runs.
2. What ships is **declared**, not inferred, and the declaration is enforced.
3. No shipped package depends on an install step the host never performs.
4. CI covers the platform the maintainer develops on.
5. Path validation behaves identically on every supported platform.

## Non-goals

- Making audio work without Azure credentials. Out of scope; not possible with
  this dependency.
- Changing any consumer-facing invocation path. `hooks.json` and every markdown
  command string stay byte-identical.
- Rewriting the coordination runtime. It gets bundled, not redesigned.
- Publishing to npm, or changing the marketplace install flow.

## Design

### 1. The boundary

Three trees, one job each:

```
src/        product source — everything that ships
  core/     → kai-core
  creative/ → kai-creative
tools/      developer tooling — never ships
plugins/    generated output, committed
test/       tests for both
```

`src/` needs no shared subtree. No source file is currently copied into more
than one pack — the 52/5 split is disjoint — so each pack's source sits under
its own directory with no cross-pack imports. If a module is ever genuinely
needed by two packs, the existing partition rule already answers it: core owns
it and the department imports it. The build inlines it into both bundles either
way, so this is a source-layout question only, not a distribution one.

Shipping becomes declared. Each pack names its entry points in one place:

```js
export const PACK_ENTRY_POINTS = {
  core: ['coordinate', 'activity', 'workspace-doctor',
         'observe-subagent', 'observe-watch'],
  creative: ['demo-format', 'demo-narrate', 'demo-zoom'],
  engineering: [],
};
```

The validator enforces both directions:

- a shipped markdown instruction referencing a script that is **not** a declared
  entry point is an error — this is the rule that would have caught
  `generate-catalog.mjs`;
- a declared entry point that no shipped markdown, hook, or documented command
  invokes is an error — this is the rule that catches `demo-capture.mjs`.

Internal modules are no longer a shipping concern: they are inlined by the build
and never appear in a pack.

`workflow-self-check` is removed. It audits kai's own plugin surface and only
means anything inside this repository. Its removal also severs the last path
that pulled `pack-plan.mjs` into a consumer install.

### 2. The build

One bundle per entry point, emitted to **the path that already exists**:

```
src/core/coordinate.mjs + 35-module runtime
  → plugins/kai-core/scripts/coordinate.mjs
```

Consumer-facing paths do not change, so `hooks.json`, every markdown command
string, and kai's own `^scripts/<name>\.(mjs|js|cjs|ps1|sh|py)$` hook-asset rule
keep working with no edit. This is deliberate and is what makes the migration
cheap; TypeAgent's bundler is designed the same way for the same reason.

Build configuration:

- `format: esm`, `platform: node`, target matching the `engines` floor.
- `banner` injecting `createRequire` — required because ESM output contains CJS
  dependencies. **Do not** also shim `__dirname`/`__filename` in the banner: a
  transitive dependency declares its own, and esbuild hoisting produces
  `SyntaxError: Identifier '__dirname' has already been declared`. Let esbuild
  shim per-module.
- `sourcemap: true`. Minification is optional and orthogonal; sourcemaps matter
  more than bytes for a hook failing on a machine you cannot inspect.
- `node:*` built-ins stay external, including `node:sqlite`.
- Self-test blocks are eliminated by a build-time define plus dead-code
  elimination. Tests continue to run against `src/`, not against the bundle.

Expected result: **55 shipped files → 8**, one bundle per entry point. Every
entry point is now Node ESM; the one PowerShell script was removed with audio
in 14.0.0.

#### The test that would have caught the lectoria bug

A consumer-install simulation: copy a built pack to a temporary directory with
**no `node_modules`**, then execute every declared entry point. Nothing today
tests what the host actually does, which is why a dependency that cannot resolve
on any consumer machine passed CI for multiple releases.

This test is the primary acceptance gate for Phase 2.

#### Accepted cost

This adds `esbuild` as a devDependency and gives CI an install step. The
repository's current "dependency-free, no install in CI" property is spent here.
That was weighed and accepted: the property is worth less than a shipped
artifact a consumer can actually run. Shipped **product** code remains
dependency-free: 14.0.0 removed the last runtime dependency, and a gate now rejects any bare import in shipped code.

### 3. Audio — **done, by deletion (14.0.0)**

This phase was superseded before implementation. Rather than bundle the `speak`
slice, the audio and narration-synthesis capability was removed outright in
`14.0.0`, and with it the npm dependency machinery this phase existed to fix.

The reasoning: the dependency's heaviest consumer was `kai-learning`, incubated
in `13.0.0`. What remained was a feature that could not run on any consumer
machine — because the host never installs it — serving a package that no longer
ships. Bundling would have spent ~1 MB and a build dependency to make a
credential-gated Azure feature reachable for a capability nobody had.

What was removed: `kai-core-generate-audio`, `generate-audio.ps1`,
`video-create-narration`, the synthesis and estimate paths in
`demo-narrate.mjs`, `PACK_RUNTIME_DEPENDENCIES`, `RUNTIME_ARTIFACTS`,
`runtimeDependencyMatrix()`, `packPackageMetadata()`,
`generatedPackageErrors()`, every per-pack `package.json`/`package-lock.json`,
the `runtime-dependencies` CI job, and the root dependency.

What survives: `video-align-narration` and `demo-narrate.mjs --place`/`--mix`.
Narration you supply is still placed and mixed with ffmpeg; kai no longer
generates speech.

The `lectoria` bundling research in this document is retained as evidence —
it established that the host accepts built artifacts, which Phase 2 still
depends on, and it is what made the cost of *keeping* audio legible enough to
decide against.

**Consequence for Phase 2:** shipped code now declares no runtime dependency at
all, and `generatedRuntimeErrors()` rejects any bare import outright. The build
step therefore has no dependency-resolution problem to solve — only bundling
kai's own modules.

### 4. Platform

**Windows CI.** Add a `windows-latest` leg. Verified on 2026-09-18: all nine
coordination suites pass on Windows today, so the leg goes green on arrival and
is a regression guard rather than a backlog of failures.

**Platform-independent path validation.** `projectBinding()` in
`src/.../evidence-content.mjs` rejects drive-relative paths in two clauses. The
first, `/^[a-z]:(?![\\/])/i`, is platform-independent and correctly rejects
`C:project` everywhere. The second is gated on `process.platform === 'win32'`,
so `\project` is rejected on Windows and silently accepted on Linux, where it
resolves to a directory literally named `\project`.

`.kai/manifest.json` is a committed artifact in `shared` mode. The same file
travels between a Windows workstation and a Linux CI or cloud agent, so it must
validate identically in both. Remove the `process.platform` gate and evaluate
drive- and root-relative forms with `path.win32` semantics on every platform: a
path unsafe on **any** supported platform is rejected on **every** platform.

This makes the currently failing assertion in
`test/coordination-evidence-self-test.mjs:1269` correct rather than skipped.

## Phases

Each phase is independently shippable and independently valuable.

### Phase 0 — Platform

Ships as its own PR, first, because `coordination-runtime` is red on `main`
today.

- Remove the `process.platform` gate from `projectBinding`; use `path.win32`
  semantics on all platforms.
- Add a `windows-latest` CI leg.

**Accepted when:** the existing `\project` assertion passes unmodified on both
Linux and Windows; a new test asserts identical rejection independent of
`process.platform`; `coordination-runtime` is green on both platforms.

### Phase 1 — Boundary

No bundler. Delivers the leak fix on its own.

- Move product source to `src/`, developer tooling to `tools/`.
- Declare `PACK_ENTRY_POINTS`; enforce both directions in the validator.
- Remove `workflow-self-check`.
- Resolve `demo-capture.mjs`: promote it to a declared entry point with a real
  invocation, or delete it.

**Accepted when:** no consumer pack contains `generate-catalog.mjs`,
`pack-plan.mjs`, or `loader-contract.mjs`; a mutation test proves a
prose-referenced undeclared script fails validation; `npm test` green.

### Phase 2 — Build

- Add esbuild; emit one bundle per declared entry point to existing paths.
- Strip self-test code from bundles.
- Add the consumer-install simulation test.
- CI verifies the committed bundle matches a fresh build.

**Accepted when:** shipped executable count drops from 55 to 8; every entry
point runs from a copied directory with no `node_modules`; `hooks.json` is
unchanged; a mutation test proves committed-bundle drift fails CI.

### Phase 3 — Audio ✅ **superseded and closed in 14.0.0**

Removed rather than bundled. See §3 above.

**Accepted when:** ~~bundle~~ — no pack ships `package.json` or
`package-lock.json`; no shipped prose instructs `npm ci --prefix`; no shipped
code imports a bare module. **Met in 14.0.0.**

## Risks

| Risk | Mitigation |
| --- | --- |
| Bundling obscures stack traces from consumer machines | Ship sourcemaps; skip minification if it proves a problem in practice |
| esbuild in CI weakens the no-install property | Accepted deliberately; 14.0.0 removed the last runtime dependency, and a gate now rejects any bare import in shipped code |
| Bundled `lectoria run` unverified against real PDFs | Out of scope — `run` stays user-installed precisely so this is never on the shipped path |
| A large restructure lands on a just-green repository | Phase 0 and 1 carry no bundler; each phase is separately revertible |
| `path.win32` rules reject a manifest that works today | Only affects drive- and root-relative forms, which are already rejected on Windows; no valid POSIX path becomes invalid |

## Open items

Decisions deferred to implementation, each with a forcing function.

- **`demo-capture.mjs`** — currently shipped, referenced by nothing. Phase 1's
  declared-entry-point rule forces a promote-or-delete decision.
- **Minification** — measured only for the `lectoria` speak slice. Decide per
  artifact in Phase 2 once real sizes are known.
- **Bundled `lectoria run`** — deliberately not attempted. If it is ever wanted,
  two blockers must be solved first: jsdom's 11.7 KB `default-stylesheet.css`
  read through `__dirname`, and `cli.js` reading its own `../package.json`.

## Not verified

- Shipped self-test percentages are estimates from visible test blocks, not
  measured coverage.
- Minified sizes for the full `lectoria` CLI are projected from the measured
  57% ratio on the speak bundle. Only the 861 KB figure is measured.
- No bundle has been produced for any kai entry point. Feasibility is
  established for `lectoria` and by TypeAgent's production precedent, not by
  building kai's own artifacts.
- "The host never runs npm" rests on documentation silence plus an independent
  team reaching the same conclusion. GitHub has never published a statement
  either way.
- Nothing here has been installed into a host. No claim is made about consumer
  runtime behaviour after these changes until Phase 2's simulation test exists.
