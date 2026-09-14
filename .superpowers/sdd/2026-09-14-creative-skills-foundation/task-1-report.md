# Task 1 report: preserve source and establish migration guards

## Outcome

Task 1 is complete in the isolated `creative-skills-foundation` worktree at
base `d95b45035afdd847d25f255f4642a53ce87a9c9c`.

- `creative` is a current `ROLE_FAMILY_PACK` family owned by `kai-creative`.
- Only `principal` and `director` remain migration-only families.
- The exact legacy `creative-video-director` baseline identity remains accepted
  until its replacement task, without exempting new malformed `creative-*`
  identities from posture, scope, placement, profile, or model checks.
- Incubated component discovery now covers all `incubator\kai-*` owners while
  active source collectors remain limited to `plugins\`.
- Historical reference handling retains the existing prefixes and adds only
  the creative baseline document and immutable diagram guide sample.
- The three old creative agents and six replaced creative skill definitions
  are preserved byte-identically under `incubator\kai-creative\`.
- Active creative sources and the demo helper/module closure remain present
  until later replacement tasks.

## Changed files

- `.superpowers\sdd\2026-09-14-creative-skills-foundation\task-1-report.md`
- `test\creative-foundation-self-test.mjs`
- `scripts\lib\incubation-contract.mjs`
- `scripts\lib\pack-plan.mjs`
- `plugins\kai-core\skills\kai-core-create-agent\references\taxonomy.md`
- `incubator\kai-creative\README.md`
- `incubator\kai-creative\agents\creative-video-director.agent.md`
- `incubator\kai-creative\agents\principal-brand-designer.agent.md`
- `incubator\kai-creative\agents\principal-product-designer.agent.md`
- `incubator\kai-creative\skills\create-product-demo\SKILL.md`
- `incubator\kai-creative\skills\demo-capture\SKILL.md`
- `incubator\kai-creative\skills\demo-narrate\SKILL.md`
- `incubator\kai-creative\skills\demo-zoom\SKILL.md`
- `incubator\kai-creative\skills\ui-mockup\SKILL.md`
- `incubator\kai-creative\skills\video-direction\SKILL.md`

No generated script copy was edited. The root helpers remain canonical.

## Deterministic RED/GREEN evidence

All commands used the required Node executable:

`C:\src\kai\.worktrees\engineering-coding-foundation\.superpowers\sdd\2026-09-13-engineering-coding-foundation\npm-cache\_npx\1c56de6e9acc34f8\node_modules\node\bin\node.exe`

### Initial RED

Command:

```powershell
& 'C:\src\kai\.worktrees\engineering-coding-foundation\.superpowers\sdd\2026-09-13-engineering-coding-foundation\npm-cache\_npx\1c56de6e9acc34f8\node_modules\node\bin\node.exe' 'test\creative-foundation-self-test.mjs'
```

Result: exit 1 on Node `v24.15.0`.

```text
AssertionError [ERR_ASSERTION]: Expected values to be strictly deep-equal:
+ [
+   'agent family `creative-*` is migration-only; new agents must use a provider-family posture or a supported kind prefix'
+ ]
- []
```

This failed for the intended missing behavior: `creative-lead-design` was not
accepted as a current creative durable role.

### Initial GREEN

Same command after the minimal taxonomy, incubation, evidence-path, reference,
and preservation changes.

Result: exit 0.

```text
creative foundation migration guard assertions passed
```

### Task-coupled regression RED

The first validator run exposed one new error beyond the known baseline:
`creative-video-director` was incorrectly required to declare a new-role
primary profile merely because `creative` became current. A focused regression
assertion was added before changing that behavior.

Command:

```powershell
& 'C:\src\kai\.worktrees\engineering-coding-foundation\.superpowers\sdd\2026-09-13-engineering-coding-foundation\npm-cache\_npx\1c56de6e9acc34f8\node_modules\node\bin\node.exe' 'test\creative-foundation-self-test.mjs'
```

Result: exit 1.

```text
AssertionError [ERR_ASSERTION]: Expected values to be strictly deep-equal:
+ [
+   'new agent must declare exactly one `**Primary profile:** <profile>` line (found 0)'
+ ]
- []
```

### Final GREEN

The exact migration-baseline ID is now exempt from new-role profile enforcement;
new creative identities remain subject to the existing profile/model mapping.

Command:

```powershell
& 'C:\src\kai\.worktrees\engineering-coding-foundation\.superpowers\sdd\2026-09-13-engineering-coding-foundation\npm-cache\_npx\1c56de6e9acc34f8\node_modules\node\bin\node.exe' 'test\creative-foundation-self-test.mjs'
```

Result: exit 0.

```text
creative foundation migration guard assertions passed
```

## Regression verification

Command:

```powershell
& 'C:\src\kai\.worktrees\engineering-coding-foundation\.superpowers\sdd\2026-09-13-engineering-coding-foundation\npm-cache\_npx\1c56de6e9acc34f8\node_modules\node\bin\node.exe' 'test\engineering-foundation-self-test.mjs'
```

Result: exit 0.

```text
engineering foundation active-surface assertions passed
```

Command:

```powershell
& 'C:\src\kai\.worktrees\engineering-coding-foundation\.superpowers\sdd\2026-09-13-engineering-coding-foundation\npm-cache\_npx\1c56de6e9acc34f8\node_modules\node\bin\node.exe' 'scripts\validate-plugin.mjs'
```

Final result: exit 1 with the known baseline:

```text
✗ kai plugin contract: 53 error(s) (55 agents, 47 skills)
```

The first post-change run reported 54 errors and identified the task-coupled
legacy-profile regression described above. After the focused fix, the count
returned to the supplied 53-error baseline.

Command:

```powershell
git diff --check
```

Result: exit 0 with no output.

## Preserved source SHA-256 hashes

Each destination file has the same SHA-256 hash as its active source.

| Source | SHA-256 |
| --- | --- |
| `plugins/kai-creative/agents/creative-video-director.agent.md` | `45053c55a874213b3382ae36155c004a7e017a394400265392f7310a9ae22420` |
| `plugins/kai-creative/agents/principal-brand-designer.agent.md` | `f88e8ac47cc899b39ed78eadb06a657afcccc08ba770704c89f57a304ef70471` |
| `plugins/kai-creative/agents/principal-product-designer.agent.md` | `797e6ea9e081f7587fa93272819d3bdfb323154361c8aa299c4264105d2fe8dc` |
| `plugins/kai-creative/skills/create-product-demo/SKILL.md` | `ad068fd1fa2b16f4d4c5e5b68302dc7cb816f844b87280c723408a22c7b8f484` |
| `plugins/kai-creative/skills/demo-capture/SKILL.md` | `1ad844256efbf8ae6f20ca02ca5f77f909489b84c981b9551e84320c58f8fae8` |
| `plugins/kai-creative/skills/demo-narrate/SKILL.md` | `6e2c320b319b2d42475caeaf1b00e4193ebab184f7c31201dff85c6afdc4295f` |
| `plugins/kai-creative/skills/demo-zoom/SKILL.md` | `6c05d7bd85fb7f285db2311a798cb901d274e30c1c7e00e7b9670637247068eb` |
| `plugins/kai-creative/skills/ui-mockup/SKILL.md` | `a7e38df6f0ba2d8c84301cb86750a633a371f6b2e185aafb8b0e16dce3f57bdd` |
| `plugins/kai-creative/skills/video-direction/SKILL.md` | `b3b0bdb7d4e3395e18944354315af12c4b5e89633e20ecd5ec9f170ba26d5fda` |

## Self-review

- Confirmed the public export names and argument signatures remain unchanged.
- Confirmed `sourceAgentFiles` and `sourceSkillFiles` were not modified and do
  not discover incubator files.
- Confirmed temporary fixtures cover two incubator owners, malformed/missing
  inactive entries, unknown component kinds, active-only source discovery,
  exact historical exceptions, broad-exemption rejection, and unknown IDs.
- Confirmed generated creative materialization retains `demo-capture.mjs`,
  `demo-format.mjs`, `demo-narrate.mjs`, `demo-zoom.mjs`, and
  `scripts/lib/cursor-png.mjs` with source-identical normalized content.
- Confirmed `personal`, `prod`, and `gtm` mappings and their pre-existing
  taxonomy-reference mismatches were not changed.

## Concerns and deferred failures

- The full validator intentionally remains red with the supplied 53 unrelated
  baseline errors. Task 1 does not waive or repair them.
- The known pack-preview self-test and all-gates/version-skew obsolete-personal
  crashes were not changed or rerun because the Task 1 brief requires the
  focused creative guard and engineering foundation guard only.
- Release metadata, generated packs, active identity replacement, and catalog
  regeneration belong to later tasks in the approved plan and are not included
  in this commit.
