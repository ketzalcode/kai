# Kai behavioral tests

`npm test` runs nine product-critical entrypoints in one Node test process:

| Suite | Guarantee |
| --- | --- |
| `repository-instructions-self-test.mjs` | Managed repository instructions install and detect byte drift. |
| `release-automation-self-test.mjs` | Release readiness and note extraction enforce the current release contract. |
| `workspace-current-self-test.mjs` | Only schema 5 and the current workspace layout are accepted. |
| `coordination-schema-self-test.mjs` | The executable coordination registry is complete and immutable. |
| `coordination-core-self-test.mjs` | Transactions, authority, leases, hierarchy creation, completion evidence, Direction drift, and snapshots behave correctly. |
| `publication-contract-self-test.mjs` | Package publication declarations route valid artifacts and reject unsafe paths. |
| `package-build-self-test.mjs` | Three active packages build in supported combinations with closed imports, stable filenames, and drift detection. |
| `consumer-install-self-test.mjs` | Every installed public executable loads outside the checkout without repository dependencies. |
| `creative-screenplay-self-test.mjs` | Screenplay and take parsing preserve the current executable media contract. |

The suite intentionally excludes historical migrations, prose-only assertions,
browser/demo matrices, native-host permutations, and duplicate command-level
coverage. Package combinations are checked in memory by the package-build
suite; the consumer suite uses one all-pack installation to execute every
public generated entrypoint once.

Additional developer commands remain separate:

- `npm run validate` validates plugin source.
- `npm run docs:check` checks generated catalog drift.
- `npm run host-contract` checks the distinct frontmatter and golden-inventory
  contract.
- `npm run pack-preview:check` checks the committed generated package tree.
- `npm run check-syntax` parses shipped JavaScript and PowerShell.

These commands are not implied by `npm test` and must be run when their owned
surface changes.
