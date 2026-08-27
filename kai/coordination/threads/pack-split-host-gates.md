# Thread — pack-split-host-gates

Append-only communication log mirroring
`kai/coordination/items/pack-split-host-gates.md`. See `kai-core-work-coordination`.

## HANDOFF 2026-08-24-2011 — principal-swe-manager -> principal-product-manager

- did:       Created this `proposed` record. Formal host-gate **evidence** (macOS + cloud + install-order + marketplace-vs-direct + fresh-session) on the real core+personal install; closes `completed`. Size L (cost is operator host-time). Owner `principal-swe-infra` designs; **operator** executes; review `principal-sre`/independent-reliability. Depends on `pack-split-first-department` + `pack-split-migration-doctor` (shipped). The hard gate before the `1.0.0` flip.
- state:     proposed
- needs:     Steward decision — confirm **minimal smoke gate**, not full macOS/cloud certification (which the northstar defers). See decomposition Scope negotiations.
- artifacts: kai/coordination/items/pack-split-host-gates.md; decomposition WS#10
- evidence:  northstar `deferred`: "Full macOS and cloud-host certification ... all evidence to date is Windows CLI" — captured 2026-08-24 from C:\src\kai
- questions: host-gate depth (minimal smoke vs full cert) — steward call
- next:      principal-product-manager — decide gate depth; the manager cannot execute external host gates.

## HANDOFF 2026-08-26-1558 — principal-product-manager -> principal-swe-infra

- did:       Reconciled `first-pack-extracted` at 3 of 4 typed requirements met and
             promoted this item `proposed -> ready` (v1 -> v2, priority 20 -> 10).
             Both dependencies are satisfied: `pack-split-first-department` and
             `pack-split-migration-doctor` are `shipped`. Preserved the accepted
             minimal-smoke boundary and folded the already-parked P2-D1 two-block
             exact-reply assertion into acceptance. No lease was taken.
- state:     ready
- needs:     Design the bounded macOS + one-cloud-host evidence packet, record npm
             installation behavior, obtain operator execution evidence, and route
             the exact artifact revision to `principal-sre` for independent reliability
             review. Return an explicit publication go/no-go. Do not publish packs,
             alter marketplace topology, or redesign fleet observation.
- artifacts: kai/coordination/items/pack-split-host-gates.md;
             kai/initiatives/pack-split/artifacts/reliability/pack-split-host-gates.md;
             kai/initiatives/pack-split/artifacts/reliability/pack-split-host-semantics-spike.md;
             kai/initiatives/pack-split/artifacts/reliability/pack-split-first-department-install.md
- evidence:  kai/coordination/items/pack-split-first-department.md (`shipped`, v19);
             kai/coordination/items/pack-split-migration-doctor.md (`shipped`, v5);
             kai/initiatives/pack-split/northstar.md (`scope.current:
             first-pack-extracted`); captured 2026-08-26-1558 from C:\src\kai
- questions: none
- next:      principal-swe-infra — this is the sole executable critical-path item;
             external host actions remain operator-executed.

## QUESTION Q-pack-split-host-gates-01 2026-08-26-1607 — principal-swe-infra -> @operator

- status: open
- kind: action
- blocking: yes
- context: The canonical artifact now contains the bounded macOS identity,
           source-pin, dependency-inventory, core-first/personal-first
           `--plugin-dir`, no-core, and `--contract 2` packets. This Windows
           workspace cannot produce macOS evidence.
- ask: On an authorized macOS host, run
       `git clone https://github.com/RubenSaucedo/kai.git "$HOME/kai-host-gate-9a800"`
       then
       `git -C "$HOME/kai-host-gate-9a800" checkout --detach 9a800e4e76cd6c15b9dfab01a7b1ed99c4285080`,
       change to that directory, and execute the two macOS command blocks in
       `kai/initiatives/pack-split/artifacts/reliability/pack-split-host-gates.md`.
       Stop after capability/partial evidence; do not use the normal Copilot
       home, publish packs, edit the marketplace, or guess persistent-install
       syntax. Return the sanitized transcript tree plus SHA-256 checksums.
- answer_by: next-dispatch

## QUESTION Q-pack-split-host-gates-02 2026-08-26-1607 — principal-swe-infra -> @operator

- status: open
- kind: action
- blocking: yes
- context: A genuine cloud-host run requires managed Agent Plugins sources for
           `kai-core` and `kai-personal`. The current public marketplace lists
           only legacy `kai` from `.`, and this item forbids publishing packs or
           changing marketplace topology. No authorized managed source is
           evidenced in the workspace.
- ask: Confirm whether an already-authorized managed cloud source exists for
       both pack identities at
       `9a800e4e76cd6c15b9dfab01a7b1ed99c4285080`. If yes, record the managed
       setting identity/revision and run the exact cloud task prompt in
       `kai/initiatives/pack-split/artifacts/reliability/pack-split-host-gates.md`;
       export host-issued run identity and sanitized event transcripts. If no,
       answer `no authorized managed source`; do not create or publish one under
       this item.
- answer_by: next-dispatch

## HANDOFF 2026-08-26-1607 — principal-swe-infra -> @operator

- did:       Prepared the canonical minimal-smoke gate with macOS and genuine
             cloud-host prerequisites, exact safe command/task packets, expected
             evidence files, identity requirements, credential-safe transfer,
             and abort criteria. Recorded current release 12b verdict NO-GO.
- state:     blocked (resume_state `in-progress`); lease cleared at item v4
- needs:     Execute Q-pack-split-host-gates-01 and answer/execute
             Q-pack-split-host-gates-02. Infra then records actual evidence and
             routes an exact committed revision to principal-sre.
- artifacts: kai/initiatives/pack-split/artifacts/reliability/pack-split-host-gates.md;
             kai/coordination/items/pack-split-host-gates.md;
             kai/coordination/threads/pack-split-host-gates.md
- evidence:  Repository inspection at C:\src\kai on 2026-08-26: pack manifests
             exist at `packs/kai-core/plugin.json` and
             `packs/kai-personal/plugin.json`, neither pack root carries
             `package.json`; `.github/plugin/marketplace.json` exposes only
             legacy `kai` at source `.`. No macOS or cloud result is claimed.
- questions: Q-pack-split-host-gates-01; Q-pack-split-host-gates-02
- next:      @operator — external host execution and managed-source fact are
             outside every kai role; principal-swe-infra resumes after answers.

## ANSWER Q-pack-split-host-gates-02 2026-08-26-1646 — principal-swe-architect -> @principal-swe-infra

- status: answered
- answer: The question is withdrawn as posed. Its enterprise-managed-source
          premise is false: official GitHub documentation defines repository
          `.github/copilot/settings.json` `enabledPlugins` as a declarative
          cloud-agent plugin-install path. Replace the unbounded managed-source
          prerequisite with one bounded throwaway-branch spike.
- lane: in-lane
- provenance: durable-thread —
              `kai/initiatives/pack-split/artifacts/decisions/pack-split-host-gates.md`

## AMENDMENT Q-pack-split-host-gates-01 2026-08-26-1646 — principal-swe-infra -> @operator

- status: open
- kind: action
- blocking: yes
- context: The original command packet stopped before persistent install and
           incorrectly pinned a historical commit. The corrected packet uses
           documented direct specs, a run-local directory marketplace, isolated
           homes, and installed-manifest checksum proof against `main` tip
           recorded at run start.
- ask: On an authorized macOS host, execute sections 1–5 of the macOS packet in
       `kai/initiatives/pack-split/artifacts/reliability/pack-split-host-gates.md`.
       Preserve the sanitized transcript tree and checksums. Do not use the
       normal Copilot home, publish a pack, edit the public marketplace, or use
       `--plugin-dir` as persistent-install evidence.
- answer_by: next-dispatch

## QUESTION Q-pack-split-host-gates-03 2026-08-26-1646 — principal-swe-infra -> @operator

- status: open
- kind: action
- blocking: yes
- context: Official documentation says Copilot coding agent installs plugins
           declaratively from repository `.github/copilot/settings.json`; the
           bounded unknown is whether it reads branch-scoped settings and
           accepts direct `OWNER/REPO:PATH` specs as `enabledPlugins` keys.
- ask: Create the never-merged throwaway branch and exact object-form
       `enabledPlugins` file from the cloud packet, then assign exactly one
       Copilot coding-agent task with that branch selected as its base. Preserve
       host-issued task/run identity, branch/head evidence, installed-plugin
       inventory, and plugin/skill provider events. The task must not edit,
       commit, push, install, update, publish, or open a pull request. If the
       result is default-branch-only, stop and return it for steward escalation
       E1 without changing `main` or substituting another host.
- answer_by: next-dispatch

## HANDOFF 2026-08-26-1646 — principal-swe-infra -> @operator

- did:       Applied the host-gate architecture decision without changing item
             Acceptance. Replaced the circular public-marketplace abort with
             persistent direct and run-local directory-marketplace evidence;
             re-pinned macOS to run-start `main` with installed-manifest SHA-256
             verification; replaced the enterprise-only cloud prerequisite with
             a bounded throwaway-branch `enabledPlugins` spike. Answered and
             withdrew Q-02, amended Q-01, and opened Q-03.
- state:     blocked (resume_state `in-progress`); lease cleared at item v8
- needs:     Execute amended Q-pack-split-host-gates-01 and
             Q-pack-split-host-gates-03. Infra then records actual evidence and
             routes an exact committed revision to principal-sre.
- artifacts: kai/initiatives/pack-split/artifacts/reliability/pack-split-host-gates.md;
             kai/initiatives/pack-split/artifacts/decisions/pack-split-host-gates.md;
             kai/coordination/items/pack-split-host-gates.md;
             kai/coordination/threads/pack-split-host-gates.md
- evidence:  Architecture provenance and executable packets are recorded in the
             two artifact paths above; captured 2026-08-26-1646 from C:\src\kai.
             No macOS/cloud result, commit, push, merge, publication, or release
             action is claimed.
- questions: Q-pack-split-host-gates-01; Q-pack-split-host-gates-03
- next:      @operator — execute the two external-host actions; a
             default-branch-only cloud result routes to
             principal-product-manager escalation E1.

## HANDOFF 2026-08-26-1650 — principal-swe-infra -> @operator

- did:       Self-review tightened the macOS packet: the disposable clone now
             refuses a pre-existing path instead of deleting it, and npm /
             `node_modules` inventories are scoped to each discovered installed
             pack root.
- state:     blocked (resume_state `in-progress`); lease cleared at item v10
- needs:     Execute amended Q-pack-split-host-gates-01 and
             Q-pack-split-host-gates-03; all prior handoff boundaries remain.
- artifacts: kai/initiatives/pack-split/artifacts/reliability/pack-split-host-gates.md;
             kai/coordination/items/pack-split-host-gates.md;
             kai/coordination/threads/pack-split-host-gates.md
- evidence:  Static packet review at C:\src\kai on 2026-08-26-1650. No host
             command, commit, push, merge, publication, or release was executed.
- questions: Q-pack-split-host-gates-01; Q-pack-split-host-gates-03
- next:      @operator — external macOS and cloud-spike execution.

## ANSWER Q-pack-split-host-gates-01 2026-08-26-1702 — @operator -> @principal-swe-infra

- status: answered
- answer: The corrected macOS arm passed on genuine GitHub-hosted Apple Silicon
          macOS Actions run `33024791572`, job `98363497414`, at source
          `9a800e4e76cd6c15b9dfab01a7b1ed99c4285080`. Result `PASS`, exit `0`.
          Both direct install orders and the directory marketplace list
          `kai-core` + `kai-personal` `0.64.0`; provider events bind
          `kai-personal:persona-self` to `kai-core-contract-v1` from
          `kai-core`; installed/source manifest checksums match; dependency
          inventories are empty; collision and exact refusal probes pass.
- lane: in-lane
- provenance: operator — host run
              https://github.com/RubenSaucedo/kai/actions/runs/33024791572

## ANSWER Q-pack-split-host-gates-03 2026-08-26-1702 — @operator -> @principal-swe-infra

- status: answered
- answer: The branch-scoped cloud spike is INDETERMINATE, not a pass. Task
          `7160810a-a4e1-43eb-bc97-d6f8e2f53aad` and run `33024086802` resolved
          the selected base/head at
          `fb04975c2969e1aca463d148b6cb1784966e20b9`, but the host made only two
          bash calls and emitted zero plugin discovery/install events, zero
          `skill.invoked` events, and zero `persona-self` dispatches. With no
          positive control or host-side plugin-root evidence, this does not
          prove default-branch-only semantics or direct-spec rejection.
- lane: in-lane
- provenance: operator — task
              https://github.com/RubenSaucedo/kai/tasks/7160810a-a4e1-43eb-bc97-d6f8e2f53aad
              and host run
              https://github.com/RubenSaucedo/kai/actions/runs/33024086802

## HANDOFF 2026-08-26-1702 — principal-swe-architect -> principal-swe-infra

- did:       Read-only Opus 5 consultation classified the branch null as
             indeterminate and selected one smaller discriminating experiment:
             a disposable consumer repository whose default branch declares
             the two direct Kai specs plus a default-marketplace positive
             control. Rejected temporary Kai-main settings, a temporary
             Kai-main marketplace, and premature deferral.
- state:     blocked (unchanged; architecture did not self-clear reliability)
- needs:     Bind the amendment, ask the operator once for the external
             repository authorization boundary, and preserve release 12b
             NO-GO.
- artifacts: kai/initiatives/pack-split/artifacts/decisions/pack-split-host-gates.md;
             kai/initiatives/pack-split/artifacts/reliability/pack-split-host-gates.md
- evidence:  Cloud task/run identity and zero-event counts above; architecture
             amendment captured 2026-08-26-1702 from C:\src\kai.
- questions: Q-pack-split-host-gates-04
- next:      principal-swe-infra — update the canonical evidence and
             coordination records without changing acceptance.

## QUESTION Q-pack-split-host-gates-04 2026-08-26-1702 — principal-swe-infra -> @operator

- status: open
- kind: decision
- blocking: yes
- context: The branch-scoped cloud run had no positive control and did not
           provision any plugin. The smallest discriminating experiment needs
           one disposable consumer repository outside `RubenSaucedo/kai`; its
           default branch declares both direct Kai pack specs plus one verified
           default-marketplace control. Creating and deleting that external
           repository crosses an operator authorization boundary.
- ask: Do you authorize a later operator-supervised run to create and, after
       evidence capture, delete exactly one disposable consumer repository for
       this read-only cloud experiment, with no change to Kai `main`, no pack
       publication, and host-side install/provider evidence required?
- answer_by: next-dispatch

## HANDOFF 2026-08-26-1702 — principal-swe-infra -> @operator

- did:       Bound the macOS PASS and cloud INDETERMINATE evidence, copied the
             sanitized macOS artifact and a cloud identity/result summary into
             the ignored canonical run root, amended the architecture and
             reliability records, answered Q-01/Q-03, and opened only Q-04.
- state:     blocked (resume_state `in-progress`); lease clear at item v11;
             `change_ref: null`
- needs:     Answer Q-pack-split-host-gates-04. If authorized, execute the
             default-branch consumer fixture and return host-side installed
             plugin/root/provider evidence. Infra then binds the result and
             routes a committed evidence revision to `principal-sre`.
- artifacts: workspace root C:\src\kai;
             kai/initiatives/pack-split/northstar.md;
             kai/initiatives/pack-split/deliverables.md;
             kai/initiatives/pack-split/artifacts/reliability/pack-split-host-gates.md;
             kai/initiatives/pack-split/artifacts/decisions/pack-split-host-gates.md;
             kai/coordination/items/pack-split-host-gates.md;
             kai/coordination/threads/pack-split-host-gates.md
- evidence:  .kai/runs/eng/2026-08-26/02-infra-pack-split-host-gates/macos/
             from Actions run 33024791572; sanitized
             .kai/runs/eng/2026-08-26/02-infra-pack-split-host-gates/cloud/99-summary.json
             from task 7160810a-a4e1-43eb-bc97-d6f8e2f53aad / run 33024086802;
             captured 2026-08-26-1702
- questions: Q-pack-split-host-gates-04
- next:      @operator — only the operator can authorize the external
             create/delete boundary. Release 12b remains NO-GO.

## ANSWER Q-pack-split-host-gates-04 2026-08-26-1740 — @operator -> @principal-swe-infra

- status: answered
- answer: Authorized one private disposable consumer repository for the
          default-branch cloud experiment, with Kai `main` unchanged, no pack
          publication, and deletion after evidence preservation and review.
- lane: operator authorization
- provenance: operator — direct authorization in the active session

## HANDOFF 2026-08-26-1740 — principal-swe-infra -> principal-swe-infra

- did:       Created `RubenSaucedo/kai-pack-host-gate-consumer` and committed
             the approved default-branch fixture at
             `7d80b4b12942eb0acce972e1e83c36f88023fde6`. The first task
             (`bc62f1d9…`, run `33026579996`, job `98369253049`) resolved and
             loaded `spark`, `kai-core`, and `kai-personal` (`3/3`) and invoked
             `kai-core-contract-v1`. The child task (`7e6cf168…`, run
             `33026682808`, job `98369587097`) recorded
             `task start -> nested kai-core-contract-v1 -> task success`.
             A repeat (`47438e15…`, run `33027220466`, job `98371301103`)
             persisted the exact `kai-personal:persona-self` target and
             no-substitution requirement and produced the same event sequence.
- state:     in-progress; Q-04 answered; no waiting question; lease clear;
             `change_ref: null`
- needs:     Commit the canonical evidence revision, bind its SHA as
             `change_ref`, and route that exact revision to `principal-sre`.
             SRE must explicitly judge the telemetry limitation: Actions logs
             omit task arguments, session storage has no rows, and repository
             `subagentStart` / `preToolUse` hooks did not fire.
- artifacts: kai/initiatives/pack-split/artifacts/reliability/pack-split-host-gates.md;
             kai/initiatives/pack-split/artifacts/decisions/pack-split-host-gates.md;
             `.kai/runs/eng/2026-08-26/02-infra-pack-split-host-gates/cloud/`
- evidence:  Host-issued task/run/job/session identities above; sanitized local
             summaries `10-consumer-provisioning.json`,
             `20-consumer-child.json`, and
             `30-selected-agent-telemetry.json`. No raw Copilot home,
             credential file, session database, or auth header is retained in
             tracked evidence.
- questions: none
- next:      principal-swe-infra — create the evidence commit, then
             principal-sre — independent reliability review. Release 12b
             remains NO-GO.
