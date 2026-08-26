# Core + personal first-department install proof

**Status:** PASS — evidence complete; architecture review pending  
**Executed:** 2026-08-26  
**Source revision:** `342cd8eb9bacb7bfc8ccd3679f3f09667f1bd246`  
**Source:** committed-unpublished `packs/kai-core` + `packs/kai-personal` at `0.64.0`  
**Host:** Windows, Node `v24.14.0`, GitHub Copilot CLI `1.0.80`

## Result

A fresh isolated Copilot CLI loaded the committed `kai-core` and `kai-personal`
trees through repeated `--plugin-dir`, selected
`kai-personal:persona-self`, invoked `kai-core-contract-v1` from the
`kai-core` provider, loaded inherited core skills, and returned:

```text
KAI_CORE_READY
contract: 1
DIRECT_OK
```

The migration doctor refused staged legacy/pack coexistence, required legacy
uninstall first, and accepted a clean core+personal inventory against an empty
workspace. Both staged inventories were unchanged after inspection. Marketplace
topology remained one `kai` entry at `source: "."`; no pack was published and
the global plugin registry was not mutated.

## Proof boundary

This proof uses repeated `--plugin-dir` with an isolated `COPILOT_HOME`. It does
not install globally, publish a pack, or change marketplace topology.

```text
  root monolith (baseline)       committed, unpublished trees
  agents/ + skills/              packs/kai-core + packs/kai-personal
            |                                  |
            | metadata measure                 | --plugin-dir x2
            v                                  v
      current baseline                  fresh isolated CLI
                                               |
                                               v
                                  kai-personal:persona-self
                                               |
                                    skill lookup across boundary
                                               |
                                               v
                                 kai-core-contract-v1 + core rules
```

The migration doctor cannot inspect transient `--plugin-dir` arguments. Its
real-host uninstall-first arm therefore reads the live host, while its
coexistence arm reads an isolated host inventory materialized from the same
committed manifests. Before/after comparisons prove the doctor remained
read-only.

## Measured evidence

Raw evidence:
`.kai/runs/eng/2026-08-26/01-infra-pack-split-first-department/evidence/`

| Probe | Exact result | Raw record |
| --- | --- | --- |
| Source | Git HEAD `342cd8eb9bacb7bfc8ccd3679f3f09667f1bd246` | `00-git-head.json` |
| Live doctor | exit `2`; `blocked`; codes `legacy-installed`, `workspace-provenance-current` | `20-doctor-live-before-staging.json` |
| Staged coexistence | exit `2`; `blocked`; codes `coexistence`, `legacy-installed`, `workspace-provenance-current`; inventory unchanged `true` | `21-doctor-staged-coexistence.json`, `99-summary.json` |
| Staged clean | exit `0`; `clear`; code `no-workspace`; inventory unchanged `true` | `22-doctor-staged-clean.json`, `99-summary.json` |
| Fresh direct host | exit `0`; `DIRECT_OK`; missing-core refusal absent; contract and inherited core skills observed | `30-core-personal-direct.json`, `31-direct-checks.json` |
| Marketplace safety | plugin count `1`; only plugin `kai`; source `.`; `packPublished: false` | `99-summary.json` |

The clean doctor used
`.kai/runs/eng/2026-08-26/01-infra-pack-split-first-department/staged-clean-workspace`,
which intentionally has no `.kai/manifest.json`. This isolates install-inventory
readiness from the real repository's legacy `plugin: kai` provenance.

The direct session event log under the ignored `copilot-home/session-state/`
confirms the provider boundary rather than relying on the final text alone:

- selected agent: `kai-personal:persona-self`;
- `kai-core-contract-v1` loaded successfully from plugin `kai-core`;
- `kai-core-team-operating-rules` and
  `kai-core-workspace-conventions` loaded successfully from plugin `kai-core`;
- the personal `extract-writing-style` skill loaded from `kai-personal`;
- shutdown was routine with exit `0` and zero modified files.

## Discovery-metadata comparison

Method: Unicode code-point count of agent and skill frontmatter descriptions.
The token figure is the explicit estimate `characters / 4`; plugin
descriptions, bodies, tool schemas, and host framing are excluded.

| Install | Agents | Skills | Descriptions | Characters | Estimated tokens |
| --- | ---: | ---: | ---: | ---: | ---: |
| Monolith `kai` | 56 | 51 | 107 | 20,063 | 5,015.75 |
| `kai-core` | 7 | 24 | 31 | 5,171 | 1,292.75 |
| `kai-personal` | 9 | 7 | 16 | 2,922 | 730.50 |
| Focused core + personal | 16 | 31 | 47 | 8,093 | 2,023.25 |

Focused discovery metadata is 11,970 characters lower than the re-measured
monolith, a **59.66% reduction** and an estimated **2,992.50 fewer tokens** by
this method. These values replace the historical `~13.5k` prose baseline; they
do not credit the split for earlier metadata trimming.

## Execution history

The final rerun replaced the evidence directory, so raw output from the three
pre-proof failures was not retained. The operator supplied this execution
history, recorded here without treating fixture defects as product defects:

1. The prepared `powershell.exe` command failed before testing because Windows
   PowerShell 5.1 lacks `ProcessStartInfo.ArgumentList`.
2. The first PowerShell 7 attempt failed before host proof because function
   parameter `$Home` collided case-insensitively with readonly automatic
   variable `$HOME`.
3. After renaming packet parameters to `$TargetHome`, the staged-clean doctor
   inspected the real repository workspace. It correctly returned
   `workspace-provenance-stale` because that workspace records legacy
   `plugin: kai` while the staged home contains only packs.
4. The fixture boundary was corrected to use the isolated
   `staged-clean-workspace`. The clean doctor then returned
   `clear` / `no-workspace`, and the full rerun passed.

## Reproduction command

The operator's successful command used PowerShell 7:

```powershell
& 'C:\Program Files\PowerShell\7\pwsh.exe' -NoProfile -File `
  'C:\src\kai\.kai\runs\eng\2026-08-26\01-infra-pack-split-first-department\probe.ps1'
```

The packet refuses to overwrite an existing `evidence/` directory. Preserve
this run as evidence; use a new dated run packet for any independent rerun.

## Acceptance status

| Criterion | Status |
| --- | --- |
| Real core + personal staged install; personal preflight and core binding | **PASS** — fresh isolated CLI, provider-qualified personal agent, core contract and inherited core skills observed |
| Doctor uninstall-first and coexistence refusal | **PASS** — coexistence + legacy-installed refusal; clean core+personal inventory clear/no-workspace; both inventories unchanged |
| Current focused cost against re-measured monolith | **PASS** — 8,093 vs 20,063 characters, 59.66% reduction |
| Durable evidence record | **PASS** — this record binds the raw run paths and exact measured values |

## Safety

- Marketplace remained exactly one `kai` entry at `source: "."`.
- Global plugin registry was not mutated.
- Packs remain committed and unpublished.
- No product defect is inferred from the corrected packet/fixture failures.
