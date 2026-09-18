# Creative foundation: fresh repository validation baseline

**Collected:** 2026-09-13, local timezone UTC-07:00.
**Repository revision:** `ca685d871682fa77f35cac8ce6b213c5e8d90bc5`.
**Initial tracked/untracked status:** clean.
**Purpose:** Record current validation before creative source changes. The
engineering merge (#212) is not evidence that these checks passed.

## Environment and execution

The ambient runtime was Node `v24.14.0`, npm `11.9.0`, on Windows.
That Node version is outside the declared
`^22.22.2 || ^24.15.0 || >=26.0.0` range.

An initial `npm test` on the ambient runtime exited 1 with 53 validator
errors. The supported baseline below uses an already present Node
`v24.15.0` binary in the engineering foundation worktree's ignored cache,
prepended to PATH only for the command process. No runtime or dependency was
installed and no global configuration was changed.

`npm test` was rerun from this checkout on supported Node. Because it stops
at its first failing stage, all 17 remaining stages were then invoked
individually, in package-script order, regardless of previous exit status.
Those independent stages ran from `21:29:20` to `21:31:20` local time.
The collection shell's exit 0 is not the checks' aggregate verdict.

Raw stdout/stderr logs and the timed per-stage results are retained under
[creative-baseline-2026-09-13](creative-baseline-2026-09-13/).
`creative-baseline-stages.json` maps each independent command to its raw log
and exit code. `manifest.json` records the environment, revision, file hashes,
and source/emitted-helper parity. Log files are copied without rewriting
their bytes; hashes describe those retained bytes.

## Results

Commands below use `node` from the supported runtime.

| Command | Exit | Observed result |
| --- | --- | --- |
| `npm test` | 1 | Foundation guard passed, then source validator reported 53 errors; later stages were not run by npm. |
| `node scripts\generate-catalog.mjs --check` | 0 | Generated catalog matches shipped surface. |
| `node scripts\workspace-doctor.mjs --self-test` | 0 | Workspace and migration self-tests completed. |
| `node scripts\host-contract.mjs --self-test` | 0 | Authoring heuristic accepted 55 agents / 47 skills; inventory and malformed fixtures matched. Not a live host test. |
| `node scripts\release-guard.mjs --self-test` | 0 | Release-policy self-tests completed. Not a real PR release verdict. |
| `node examples\proactive-runner\runner.mjs --self-test` | 0 | Self-tests completed. |
| `node scripts\activity.mjs --self-test` | 0 | Self-tests completed. |
| `node scripts\work-status.mjs --self-test` | 0 | Self-tests completed. |
| `node scripts\observe-subagent.mjs --self-test` | 0 | Self-tests completed. |
| `node scripts\observe-watch.mjs --self-test` | 0 | Self-tests completed. |
| `node scripts\demo-zoom.mjs --self-test` | 0 | 89 checks passed; no ffmpeg render verification. |
| `node scripts\demo-capture.mjs --self-test` | 0 | 41/41 checks passed; no live capture. |
| `node scripts\demo-narrate.mjs --self-test` | 0 | 57 checks passed; no paid synthesis or real mix. |
| `node scripts\demo-format.mjs --self-test` | 0 | 51 checks passed; no real product-demo assessment. |
| `node scripts\pack-preview.mjs --self-test` | 1 | `TypeError` at line 390, reading `includes` on undefined. |
| `node scripts\pack-preview.mjs --gate all` | 1 | Partition, collision, partial-install reported clean; version-skew crashed at `writePlugin`, line 142. |
| `node scripts\pack-preview.mjs --check` | 0 | Committed generated packs match generator. |
| `node scripts\check-syntax.mjs` | 0 | 25 JS/MJS and one PowerShell helper parsed. |

The foundation guard and validator are the first two stages of `npm test`.
The remaining 17 independently executed stages have 15 zero and two nonzero
exits. There are three failing validation surfaces in this record: source
validator, pack self-test, and version-skew within all-gates.

## Failure details and interpretation

### Source validator: 53 errors

The exact diagnostics are in
[supported npm-test log](creative-baseline-2026-09-13/creative-baseline-npm-test-node24.15.log).
They include taxonomy/provider-family mismatches, unresolved historical
references, core-probe wording, a missing skills path, and onboarding
contract/order failures.

All three creative agents are flagged for not explicitly stating that the
core probe precedes the first other core skill. Their current paragraphs do
load the probe followed by operating rules. The validator's matching rule
requires explicit first-core ordering; this baseline is not evidence of a
live agent actually loading core in the wrong order.

The supported run reproduces the reported 53-error count rather than resolving
it. No diagnostic was waived or suppressed.

### Pack self-test: retired partition assumption

[Raw self-test failure](creative-baseline-2026-09-13/creative-baseline-stage-14.log).

Source inspection at `scripts\pack-preview.mjs:386-403` shows the self-test
reads `plan.local.personal` and then calls `local.includes(...)`. The current
partition has assistant, creative and learning rather than a personal pack.
The failure occurs near the beginning of the test; later assertions are not
covered by this invocation.

### All-gates: distinct version-skew crash

[Raw all-gates output](creative-baseline-2026-09-13/creative-baseline-stage-15.log).

The first three gates complete. At
`scripts\pack-preview.mjs:1683`, the version-skew fixture calls
`buildAll({ out, packs: ['personal'], ...opts })`. The retired pack yields
undefined agent IDs, and `writePlugin` reads their `length` at line 142.
Version-skew never reaches a complete verdict; this is not another passing
gate hidden behind a logging issue.

These two crashes share an obsolete partition assumption but are separate
execution paths. They remain unfixed. The fresh run, not the historical
engineering narrative, establishes both current failures.

## Emitted creative helper parity

Each of these generated files was compared with its source in `scripts\`
after CRLF-to-LF normalization only:

- `plugins\kai-creative\scripts\demo-capture.mjs`
- `plugins\kai-creative\scripts\demo-format.mjs`
- `plugins\kai-creative\scripts\demo-narrate.mjs`
- `plugins\kai-creative\scripts\demo-zoom.mjs`
- `plugins\kai-creative\scripts\lib\cursor-png.mjs`

All five comparisons matched. The executed helper self-tests were the source
entry points named by `package.json`, not separate installed-provider runs.
This parity is file evidence, not host invocation or external-tool evidence.

## Not established

No skill-behavior baseline, no-guidance control, candidate comparison, paid
model campaign, live discovery, browser/accessibility check, actual desktop
capture, ffmpeg `--verify`, contact-sheet judgment, Azure synthesis, narration
mix, upload, or publication was performed.

The helper checks do not establish full screenplay/take/render revision
binding, actual caption presence, measured visual-state arrival, or rejection
of every bad interior narration state. The
[design proposal](../../superpowers/specs/2026-09-13-creative-skills-foundation-design.md#6-evidence-boundaries-the-methods-must-not-overclaim)
records those source-level limitations.

The CI dependency-install matrix and real base/head release guard were not
reproduced. Existing `.github\workflows\validate.yml` also selects Node 20 for
its contract job and 24.15.0 for runtime-dependency jobs; this local supported
Node run does not claim CI-environment parity.

**Disposition:** Failed repository baseline, preserved as evidence. No
implementation or baseline repair was attempted.
