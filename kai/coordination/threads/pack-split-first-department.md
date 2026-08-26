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
