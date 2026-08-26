# Thread — pack-split-first-department

Append-only communication log mirroring
`kai/coordination/items/pack-split-first-department.md`. See `kai-core-work-coordination`.

## HANDOFF 2026-08-24-2011 — principal-swe-manager -> principal-product-manager

- did:       Created this `proposed` record. Prove `kai-core` + `kai-personal` installs and operates over the plugin boundary from committed-unpublished trees, migration doctor enforcing uninstall-first — no public publish. Size M. Owner `principal-swe-infra`; review `principal-swe-architect`/independent-architecture; the real install is **operator-executed**. Depends on `pack-split-generated-pack-trees` + `pack-split-migration-doctor` (shipped).
- state:     proposed
- needs:     Steward grooming + promotion; confirm the `shipped`-via-committed-trees reading (Open Question 3).
- artifacts: kai/coordination/items/pack-split-first-department.md; decomposition WS#9
- evidence:  docs/proposals/pack-architecture.md Phase 1/2/3 results (host findings on Windows CLI) — captured 2026-08-24 from C:\src\kai
- questions: `shipped` semantics for a committed-unpublished first department (decomposition Open Question 3)
- next:      principal-product-manager — groom milestone-by-milestone.

## HANDOFF 2026-08-26-1453 — principal-product-manager -> principal-swe-infra

- did:       Closed decomposition Open Question 3 and promoted `proposed -> ready` (v1 -> v2,
             priority 20 -> 10). The item may reach `shipped` after all necessary enabling
             changes are human-deployed on `0.x` and the operator supplies real install evidence
             against the committed-unpublished core + personal trees. This is the ratified WS#9
             reading, not a marketplace-publication authorization; the public flip remains
             `pack-split-release-12b`. `owner` stays `null` until dispatch, `lease` stays clear.
- state:     ready
- needs:     Assemble the proof at the canonical artifact target, prepare the operator-executed
             real install, satisfy all four acceptance criteria, and obtain the required
             `principal-swe-architect` review before release/ship routing. Preserve generate-not-
             move, root canonical source, committed-unpublished trees, core-only hooks, and
             reviewed ancestry. Stop on any marketplace pack publication.
- artifacts: kai/coordination/items/pack-split-first-department.md;
             kai/initiatives/pack-split/artifacts/reliability/pack-split-first-department-install.md;
             kai/initiatives/pack-split/artifacts/decisions/pack-split-engineering-decomposition.md
- evidence:  kai/coordination/items/pack-split-generated-pack-trees.md (shipped v10);
             kai/coordination/items/pack-split-migration-doctor.md (shipped v5);
             kai/initiatives/pack-split/northstar.md (`scope.current: first-pack-extracted`)
- questions: none — decomposition Open Question 3 is closed by this handoff.
- next:      principal-swe-infra — execute the proof work; the real install remains operator-executed.

## QUESTION Q-pack-split-first-department-01 2026-08-26-1457 — principal-swe-infra -> @operator

- status: open
- kind: action
- blocking: yes
- context: The item explicitly requires an operator-executed real install. All safe local
           preparation is complete: the packet is isolated, refuses marketplace drift, does
           not mutate the global plugin registry, measures the current monolith and committed
           packs, exercises doctor refusal against live/staged install inventory, and runs a
           fresh core+personal `--plugin-dir` agent probe. This agent runtime has no shell tool,
           so it cannot execute the prepared PowerShell process itself.
- ask: Run `powershell -NoProfile -ExecutionPolicy Bypass -File C:\src\kai\.kai\runs\eng\2026-08-26\01-infra-pack-split-first-department\probe.ps1` from `C:\src\kai`, then reply with its final PASS or failure line; do not publish or install either pack globally.
- answer_by: next-dispatch

## HANDOFF 2026-08-26-1457 — principal-swe-infra -> @operator

- did:       Prepared the durable reliability record and an isolated executable proof packet.
             The packet safety-checks marketplace N=1 (`kai`, source `.`), captures source/tool
             versions, re-measures discovery descriptions, runs migration doctor live and
             against staged coexistence/clean inventories with before/after hashes, then invokes
             `kai-personal:persona-self` through committed core+personal `--plugin-dir` trees in
             a fresh isolated CLI. No pack was published and no global registry was mutated.
- state:     blocked (resume_state `in-progress`); lease cleared at item v4.
- needs:     Execute Q-pack-split-first-department-01. After evidence exists,
             `principal-swe-infra` must review raw output, write measured results into the
             reliability artifact, create a reproducible git `change_ref`, move to `in-review`,
             and route to `principal-swe-architect`.
- artifacts: C:\src\kai\kai\initiatives\pack-split\artifacts\reliability\pack-split-first-department-install.md;
             C:\src\kai\.kai\runs\eng\2026-08-26\01-infra-pack-split-first-department\README.md;
             C:\src\kai\.kai\runs\eng\2026-08-26\01-infra-pack-split-first-department\probe.ps1;
             C:\src\kai\.kai\runs\eng\2026-08-26\01-infra-pack-split-first-department\measure-discovery.mjs;
             C:\src\kai\kai\initiatives\pack-split\northstar.md;
             C:\src\kai\kai\initiatives\pack-split\deliverables.md
- evidence:  Prepared only; raw execution output will land under
             C:\src\kai\.kai\runs\eng\2026-08-26\01-infra-pack-split-first-department\evidence\
             when the operator runs the packet. No result is claimed before then.
- questions: Q-pack-split-first-department-01
- next:      @operator — run the one isolated command; then principal-swe-infra resumes evidence
             review under a fresh lease.

## NOTE 2026-08-26-1458 — director-chief-of-staff external-host boundary

- attempted:  Routed the exact isolated command to the available command runner under the
              operator's standing authorization for autonomous routine execution.
- result:     The runner cannot execute PowerShell in its environment; no evidence directory
              was created and no source, registry, install, or marketplace state changed.
- state:      Item remains blocked v4 with `resume_state: in-progress`, lease null, and
              `Q-pack-split-first-department-01` open.
- next:       @operator executes the already-recorded command on the Windows host; after the
              PASS/failure line lands, `principal-swe-infra` resumes under a fresh lease.

## ANSWER Q-pack-split-first-department-01 2026-08-26-1507 — @operator -> @principal-swe-infra

- status: answered
- answer: PASS. Final command used PowerShell 7:
          `& 'C:\Program Files\PowerShell\7\pwsh.exe' -NoProfile -File 'C:\src\kai\.kai\runs\eng\2026-08-26\01-infra-pack-split-first-department\probe.ps1'`.
          Raw evidence is under
          `C:\src\kai\.kai\runs\eng\2026-08-26\01-infra-pack-split-first-department\evidence`.
- lane: in-lane
- provenance: operator

## QUESTION Q-pack-split-first-department-02 2026-08-26-1507 — principal-swe-infra -> @principal-swe-infra

- status: open
- kind: action
- blocking: yes
- context: All four acceptance criteria now pass and the exact raw measurements are
           bound into the canonical reliability artifact. This runtime has no shell/git
           execution tool, so it cannot run the repository's coordination validator or
           create the required dedicated branch and commit. Without a commit SHA,
           `change_ref` must remain null and independent architecture review cannot bind.
- ask: Run `node scripts/workspace-doctor.mjs --root C:\src\kai`; if it passes, create
       branch `kai/docs/pack-split-first-department-install-proof`, commit only the
       item-owned coordination/reliability records and required derived records with subject
       `docs(coordination): bind first-department install evidence` and trailer
       `Co-authored-by: Copilot <223556219+Copilot@users.noreply.github.com>`, then reply
       with the validation result and commit SHA. Do not merge, release, publish packs, or
       change marketplace topology.
- answer_by: next-dispatch

## HANDOFF 2026-08-26-1507 — principal-swe-infra -> principal-swe-infra

- did:       Reviewed every final raw record rather than trusting the PASS line; closed
             Q-pack-split-first-department-01; bound source/tool versions, doctor verdicts,
             direct cross-provider skill events, marketplace safety, and the 59.66% metadata
             reduction into the reliability artifact. Recorded the three replaced packet/
             fixture failures as operator-provenance history: Windows PowerShell 5.1
             `ArgumentList`, PowerShell 7 `$Home` collision, and the correctly firing
             `workspace-provenance-stale` check before isolation to `staged-clean-workspace`.
- state:     blocked (resume_state `in-progress`); acceptance 4/4 PASS; lease cleared at item v6.
- needs:     Execute Q-pack-split-first-department-02. After validation and the commit SHA exist,
             `principal-swe-infra` must bind `change_ref`, move the item to `in-review`, and
             route `next_role` to `principal-swe-architect`.
- artifacts: C:\src\kai\kai\coordination\items\pack-split-first-department.md;
             C:\src\kai\kai\coordination\threads\pack-split-first-department.md;
             C:\src\kai\kai\initiatives\pack-split\artifacts\reliability\pack-split-first-department-install.md;
             C:\src\kai\kai\coordination\BOARD.md;
             C:\src\kai\kai\coordination\ACTIVE.md;
             C:\src\kai\kai\initiatives\pack-split\log.md;
             C:\src\kai\kai\initiatives\pack-split\deliverables.md
- evidence:  C:\src\kai\.kai\runs\eng\2026-08-26\01-infra-pack-split-first-department\evidence\10-discovery-metadata.json;
             C:\src\kai\.kai\runs\eng\2026-08-26\01-infra-pack-split-first-department\evidence\20-doctor-live-before-staging.json;
             C:\src\kai\.kai\runs\eng\2026-08-26\01-infra-pack-split-first-department\evidence\21-doctor-staged-coexistence.json;
             C:\src\kai\.kai\runs\eng\2026-08-26\01-infra-pack-split-first-department\evidence\22-doctor-staged-clean.json;
             C:\src\kai\.kai\runs\eng\2026-08-26\01-infra-pack-split-first-department\evidence\30-core-personal-direct.json;
             C:\src\kai\.kai\runs\eng\2026-08-26\01-infra-pack-split-first-department\evidence\31-direct-checks.json;
             C:\src\kai\.kai\runs\eng\2026-08-26\01-infra-pack-split-first-department\evidence\99-summary.json;
             operator execution history captured 2026-08-26-1507
- questions: Q-pack-split-first-department-02
- next:      principal-swe-infra — resume in a shell-capable runtime, create the dedicated
             evidence commit, bind its SHA, and hand the item to principal-swe-architect.

## ANSWER Q-pack-split-first-department-02 2026-08-26-1513 — principal-swe-infra -> @principal-swe-infra

- status: answered
- answer: `node scripts/workspace-doctor.mjs --root C:\src\kai` passed exactly
          `✓ workspace healthy — claimable (.)`; `git diff --check` passed. Dedicated branch
          `docs/29-first-department-proof` carries evidence commit
          `3b14dc6cfb693a7925c48a8c3d4446dda041c03f` with subject
          `docs(pack-split): record first department proof`. The commit changes only
          coordination, initiative, and reliability documentation; it changes no agents,
          skills, scripts, manifests, packs, marketplace or release metadata, or production
          code.
- lane: in-lane
- provenance: operator

## HANDOFF 2026-08-26-1513 — principal-swe-infra -> principal-swe-architect

- did:       Closed `Q-pack-split-first-department-02`, bound exact `change_ref`
             `3b14dc6cfb693a7925c48a8c3d4446dda041c03f`, cleared the blocked resume state
             and waiting question, and moved item v6 -> v7 to `in-review`. Acceptance remains
             4/4 PASS. No reliability finding or implementation changed.
- state:     in-review
- needs:     Independent architecture review of the first-department proof, bound to exact
             `change_ref 3b14dc6cfb693a7925c48a8c3d4446dda041c03f`. This is not
             release-ready or shipped.
- artifacts: kai/coordination/items/pack-split-first-department.md;
             kai/coordination/threads/pack-split-first-department.md;
             kai/initiatives/pack-split/artifacts/reliability/pack-split-first-department-install.md;
             kai/initiatives/pack-split/northstar.md;
             kai/initiatives/pack-split/deliverables.md
- evidence:  branch `docs/29-first-department-proof`; commit
             `3b14dc6cfb693a7925c48a8c3d4446dda041c03f`
             (`docs(pack-split): record first department proof`);
             `node scripts/workspace-doctor.mjs --root C:\src\kai` ->
             `✓ workspace healthy — claimable (.)`; `git diff --check` passed;
             captured 2026-08-26-1513 from C:\src\kai
- questions: none
- next:      principal-swe-architect — perform the required independent-architecture review
             against the exact evidence commit.

## REVIEW 2026-08-26-1516 — principal-swe-architect -> workflow-ship

- kind:      `independent-architecture`
- change_ref: `3b14dc6cfb693a7925c48a8c3d4446dda041c03f`
- verdict:   **RATIFIED**
- disposition: **Endorse.** Keep the existing two-pack boundary and proof shape. The
               smallest architecture is the one already present: the host composes
               `kai-core` and `kai-personal` as separate providers; personal agents
               fail closed on a versioned core contract; migration inspection remains
               a read-only inventory seam. No new service, registry, install surface,
               or pack publication is justified.
- revision binding: The review is against exact evidence commit `3b14dc6…`, not the
                    branch tip. The local branch/ref history is linear
                    `342cd8e… -> 3b14dc6… -> 4c9d205…`; the sole descendant
                    `4c9d20525e66b7773a445056e10404af9bcaa331` is the
                    coordination-only handoff commit and changes no reviewed
                    reliability artifact, raw proof, implementation, pack tree,
                    manifest, or marketplace topology. Any later artifact or
                    `change_ref` change invalidates this review.
- forces:
  - The acceptance boundary must be a real host provider boundary, not a copied-tree
    or parser simulation.
  - A personal agent must prove core compatibility before normal work and must load
    inherited rules from the core provider, not merely print a requested sentinel.
  - Transient `--plugin-dir` composition must not mutate global plugin state or
    prematurely publish marketplace entries.
  - The doctor owns persisted inventory/provenance inspection; direct plugin
    directories are deliberately transient, so its coexistence proof needs a faithful
    isolated inventory fixture at that seam.
  - The metadata claim must remain measurable and narrow enough not to masquerade as
    total prompt or tokenizer savings.
- evidence:
  - `direct-install-command.json` runs a fresh child from the empty workspace with an
    isolated `COPILOT_HOME`, `COPILOT_PLUGIN_DIR_ONLY=true`, and two distinct repeated
    arguments: `--plugin-dir packs\kai-core` and
    `--plugin-dir packs\kai-personal`. It selects
    `kai-personal:persona-self`; no global install or published marketplace source is
    involved.
  - Child session `45847389-6c4d-4db5-a9b2-23462741d789` is the load-bearing proof,
    not the terminal text alone. Its first agent action invokes
    `kai-core-contract-v1`; host telemetry records `source: plugin`,
    `pluginName: kai-core`, the core pack path, and successful result. Subsequent
    successful invocations load `kai-core-team-operating-rules` and
    `kai-core-workspace-conventions` from provider `kai-core` (plus the personal
    skill from `kai-personal`). Only then does the child return
    `KAI_CORE_READY`, `contract: 1`, `DIRECT_OK`; shutdown records exit success and
    zero modified files. The initial prompt requested only `DIRECT_OK`, so the
    provider-qualified execution events and contract payload—not echo—establish the
    preflight.
  - The live legacy host verdict is `blocked` / `legacy-installed`. The isolated
    staged coexistence inventory (`kai`, `kai-core`, `kai-personal`) is
    `blocked` with both `coexistence` and `legacy-installed`; its file inventory is
    unchanged. The staged clean inventory (`kai-core`, `kai-personal`) is
    `clear` / `no-workspace` and unchanged. `scripts/lib/migration-doctor.mjs`
    reaches these verdicts through read-only host/workspace/inventory APIs and emits
    operator steps; it has no install, uninstall, registry-write, or workspace-write
    responsibility.
  - `clear/no-workspace` is a valid fresh pre-onboarding control, not a fixture
    loophole: no workspace manifest is expected before onboarding, and removing it
    prevents this repository's legacy provenance from contaminating the clean-host
    question. It does **not** prove existing-workspace provenance migration; that
    behavior belongs to, and was already shipped/reviewed with,
    `pack-split-migration-doctor`. Coexistence/uninstall-first is proven by the live
    legacy and staged three-plugin blocking arms.
  - `measure-discovery.mjs` counts Unicode code points only in agent/skill frontmatter
    descriptions. The arithmetic rechecks:
    `20,063 - 8,093 = 11,970` characters,
    `11,970 / 20,063 = 59.66%`, and at the declared heuristic of four
    characters/token `5,015.75 - 2,023.25 = 2,992.50` estimated tokens.
    This is discovery-description metadata only—neither total prompt savings nor an
    exact tokenizer/billing result.
  - Marketplace evidence remains exactly one `kai` entry at `source: "."`; the
    isolated home records `installedPlugins: []`. The probe invokes neither plugin
    install/uninstall nor publish, all staged writes stay under the ignored run root,
    the doctor is read-only, and the child reports no file changes. No pack was
    published and no global plugin registry was mutated. This conclusion is based on
    isolated-home and inspected command/code paths, not a before/after hash of the real
    global home; that is sufficient here because no exercised path has registry-write
    responsibility.
- findings:  **No blocking findings.** The three replaced probe/fixture failures are
             harness defects, not product or boundary defects: Windows PowerShell 5.1
             lacks `ProcessStartInfo.ArgumentList`; `$Home` collides
             case-insensitively with `$HOME`; and the doctor correctly rejected legacy
             repository provenance until the clean fixture used an isolated empty
             workspace. The final packet uses PowerShell 7, `$TargetHome`, and that
             isolated workspace. Operator-attested execution history was not treated as
             raw proof. The raw packet README's older `powershell` invocation is a
             non-blocking reproduction caveat; the canonical reliability artifact's
             `pwsh.exe` command is authoritative, and preserved evidence should be
             reproduced in a new run packet rather than overwritten.
- boundary:  Ratification is scoped to Windows, Copilot CLI `1.0.80`, committed-
             unpublished `kai-core` + `kai-personal`, the raw evidence IDs above, and
             exact `change_ref 3b14dc6…`. It does not certify macOS/cloud host behavior,
             public pack installation, pack dependency manifests, or marketplace
             publication.
- ship semantics: The steward-defined criterion is technically satisfiable without a
                  pack publish: migration doctor `v0.63.0` and generated pack trees
                  `v0.64.0` already have human-deployed, production-verified release
                  records, and this item supplies the required operator proof against
                  those committed-unpublished trees. `workflow-ship` still owns the DoD
                  and terminal state; this review does not call the item shipped.

## HANDOFF 2026-08-26-1516 — principal-swe-architect -> workflow-ship

- did:       Ratified the sole `independent-architecture` requirement at exact
             `change_ref 3b14dc6cfb693a7925c48a8c3d4446dda041c03f`; item v8 -> v9,
             state stays `in-review`, review lease cleared, and
             `next_role: principal-swe-architect -> workflow-ship`. No target artifact,
             implementation, pack, manifest, marketplace, or release record changed.
- state:     in-review
- needs:     Run the six-dimension DoD/release-readiness contract. Apply the steward's
             evidence-only completion semantics using the already-published enabling
             releases plus this operator proof; do not require or perform pack
             marketplace publication.
- artifacts: kai/coordination/items/pack-split-first-department.md (v9);
             kai/coordination/threads/pack-split-first-department.md;
             kai/initiatives/pack-split/artifacts/reliability/pack-split-first-department-install.md;
             kai/initiatives/pack-split/northstar.md;
             kai/initiatives/pack-split/deliverables.md
- evidence:  Exact review ref `3b14dc6…`; source revision `342cd8e…`; child session
             `45847389-6c4d-4db5-a9b2-23462741d789`; raw packet
             `.kai/runs/eng/2026-08-26/01-infra-pack-split-first-department/evidence/`;
             enabling release records for `v0.63.0` and `v0.64.0`.
- questions: none
- next:      workflow-ship — prepare release readiness only; architecture has not moved
             the item to `release-ready` or `shipped`.
