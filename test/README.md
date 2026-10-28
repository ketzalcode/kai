# Kai behavioral tests

`npm test` runs product-critical entrypoints in one Node test process:

| Suite | Guarantee |
| --- | --- |
| `repository-instructions-self-test.mjs` | Managed repository instructions install and detect byte drift. |
| `release-automation-self-test.mjs` | Release readiness and note extraction enforce the current release contract. |
| `workspace-current-self-test.mjs` | Only schema 6 and the split runtime locations are accepted. |
| `coordination-schema-self-test.mjs` | Core contains only standalone Task/A2A schema; install packages stay distinct from workspace packages. |
| `coordination-core-self-test.mjs` | Standalone Task authority, versions, leases, collisions, dependencies, and opaque planning refs behave correctly. |
| `project-management-self-test.mjs` | The private planning runtime owns hierarchy/closure and emits a valid standalone Core Task handoff without cross-database writes. |
| `publication-contract-self-test.mjs` | Package publication declarations route valid artifacts and reject unsafe paths. |
| `package-build-self-test.mjs` | Five active packages build in supported combinations with closed imports, stable filenames, and drift detection. |
| `consumer-install-self-test.mjs` | Every installed public executable loads outside the checkout without repository dependencies. |
| `creative-screenplay-self-test.mjs` | Screenplay and take parsing preserve the current executable media contract. |
| `creative-capture-mode-self-test.mjs` | Recorded, replay, and illustration modes are reported honestly. |
| `creative-pacing-self-test.mjs` | Measured narration gaps flag long holds without treating missing evidence as a pass. |
| `creative-format-self-test.mjs` | Caption declarations do not substitute for inspection of the exact render. |
| `creative-status-self-test.mjs` | Resume receipts distinguish complete, stale, failed, and unknown stages. |
| `creative-bundle-self-test.mjs` | Editor-neutral bundles preserve provenance and export aligned narration. |
| `creative-music-self-test.mjs` | Music acceptance, safe outputs, and full-length ducked mixing preserve source media. |

Music owns cue parsing and acceptance checks; bundles reuse them rather than
maintaining a second policy. Bundles therefore require the same source, measured
duration, operator, and acceptance timestamp as the music command. Narration
and music reuse one output guard, including input aliases even with `--replace`.
Detailed rejection cases belong at the shared owner, with focused integration
checks at its callers.

The suite intentionally excludes historical migrations, prose-only assertions,
browser/demo matrices, native-host permutations, and duplicate command-level
coverage. Package combinations are checked in memory by the package-build
suite; the consumer suite uses one all-pack installation to execute every
public generated entrypoint once.

Additional developer commands remain separate:

- `npm run validate` validates plugin source.
- `npm run docs:check` checks generated catalog and package drift.
- `npm run consumer-install:self-test` reruns copied-package acceptance alone.

Use these commands for narrower evidence. `npm test` already runs copied-package
acceptance; `npm run build:check` remains a separate generated-drift gate.
