# Thread — pack-split-onboarding-installer

Append-only communication log mirroring
`kai/coordination/items/pack-split-onboarding-installer.md`. See `kai-core-work-coordination`.

## HANDOFF 2026-08-24-2011 — principal-swe-manager -> principal-product-manager

- did:       Created this `proposed` record. Honest guided installer — core first, verify each step, stop on first failure, never claim unverified rollback, fresh-session caveat. Size M. Owner `principal-swe-infra` (install-order/verify semantics); prose co-authored by `principal-technical-writer`. Reviews `principal-swe-architect`/independent-architecture + `principal-technical-writer`/doc-review (prose honesty). Depends on `pack-split-generated-pack-trees` + `pack-split-migration-doctor` (shipped); parallel with `pack-split-host-gates`.
- state:     proposed
- needs:     Steward grooming + promotion when the milestone is groomed.
- artifacts: kai/coordination/items/pack-split-onboarding-installer.md; decomposition WS#11
- evidence:  docs/proposals/pack-architecture.md "Onboarding" (guided installer, not transactional) — captured 2026-08-24 from C:\src\kai
- questions: none
- next:      principal-product-manager — groom milestone-by-milestone.

## NOTE 2026-08-26-1558 — principal-product-manager (steward)

- did:       Reconciled the accepted post-extraction DAG. Added the typed
             dependency `pack-split-pack-dependency-manifests (requires:
             shipped)` and incremented the item v1 -> v2. The earlier
             parallel-with-host-gates note is superseded: truthful installer
             commands and verification semantics depend on the host-informed
             manifest/runtime contract.
- state:     proposed
- needs:     Stay parked while `scope.current` is `first-pack-extracted`.
             After host gates complete, dependency manifests ship, and the
             steward promotes this item, preserve core-first, stop-on-first-
             failure, exact partial-state, and fresh-session behavior.
- artifacts: kai/coordination/items/pack-split-onboarding-installer.md;
             kai/coordination/items/pack-split-pack-dependency-manifests.md
- evidence:  generated-tree acceptance R11 defers manifests to publication;
             the dependency-manifest item owns verified install semantics.
- questions: none
- next:      principal-product-manager — retain behind the scope valve until
             the current milestone closes.

## HANDOFF 2026-08-27-1155 — principal-product-manager -> principal-swe-infra

- did:       Verified active scope `five-pack-split-shipped` and all three
             typed dependencies at `shipped`: generated pack trees, migration
             doctor, and dependency manifests. Promoted `proposed -> ready`
             without changing acceptance, touches, review requirements, or
             priority.
- state:     ready
- needs:     Implement the smallest honest guided installer: exact pack set
             and commands, explicit confirmation, core first, verify every
             step, stop on first failure, report exact partial state, and
             require a fresh session after core installation.
- artifacts: kai/coordination/items/pack-split-onboarding-installer.md;
             kai/library/releases/2026-08-27/01-ship-pack-split-pack-dependency-manifests/ship-record.md
- evidence:  `pack-split-generated-pack-trees`, `pack-split-migration-doctor`,
             and `pack-split-pack-dependency-manifests` are all `shipped`.
- questions: none
- next:      principal-swe-infra — claim a lease and implement; obtain both
             independent architecture and technical-writing reviews on one
             exact `change_ref`.

## NOTE 2026-08-27-1201 — principal-swe-infra implementation lease

- did:       Claimed `infra-1201-onboarding` against ready item v3. Classified
             the onboarding skill and workflow agent as owned core modules and
             `scripts/validate-plugin.mjs` as a shared contract gate to extend,
             not duplicate. Kept the slice as one prompt-behavior PR with
             generated copies, tests, and the required 0.x release metadata.
- state:     in-progress
- needs:     Add the closed five-pack catalog, migration and availability
             gates, explicit-confirmation plan, core-first install order,
             per-step verification, fail-closed partial-state reporting, and
             fresh-session boundary. Current unpublished packs must fail at the
             browse gate rather than falling back to direct installation.
- artifacts: skills/kai-core-workspace-onboarding/SKILL.md;
             agents/workflow-workspace-init.agent.md;
             scripts/validate-plugin.mjs
- evidence:  Reuses the existing read-only migration doctor and the host's
             `plugin marketplace list/browse` plus `plugin list` commands.
- questions: none
- next:      principal-swe-infra — finish implementation, regenerate core,
             run the full suite, bind an exact change ref, and hand both
             required reviews the same ref.

## NOTE 2026-08-27-1204 — principal-swe-infra implementation complete

- did:       Added the closed pack catalog and fail-closed guided installer to
             the canonical onboarding skill, bound workspace-init to its mode,
             added shared static contract checks, bumped `0.65.0 -> 0.66.0`,
             regenerated core/personal and the public catalog, and completed
             all five acceptance criteria.
- state:     in-progress
- needs:     Mint the implementation commit, clear the lease, bind
             `change_ref`, and request both required independent reviews
             against that exact ref.
- artifacts: skills/kai-core-workspace-onboarding/SKILL.md;
             agents/workflow-workspace-init.agent.md;
             scripts/validate-plugin.mjs;
             packs/kai-core/skills/kai-core-workspace-onboarding/SKILL.md;
             packs/kai-core/agents/workflow-workspace-init.agent.md
- evidence:  Full `npm test` passed at `0.66.0`. The initial full run exposed
             only a stale generated catalog after the changed agent
             description; `npm run docs:generate` corrected it and the full
             rerun passed. Generated packs match the generator.
- questions: none
- next:      principal-swe-infra — commit the implementation and perform the
             revision-bound review handoff.

## HANDOFF 2026-08-27-1204 — principal-swe-infra -> principal-swe-architect

- did:       Committed the completed `0.66.0` guided installer as
             `34e7f7d435a12b123ccd6f9bbd6c66e53f31afcb`, moved
             `in-progress -> in-review`, bound `change_ref`, and cleared the
             implementation lease.
- state:     in-review
- needs:     Review install-order correctness, migration and publication
             gates, current-session behavior, partial-state semantics, and
             whether the static pin covers every load-bearing claim. The
             technical-writing review runs independently against the same ref.
- artifacts: skills/kai-core-workspace-onboarding/SKILL.md;
             agents/workflow-workspace-init.agent.md;
             scripts/validate-plugin.mjs;
             docs/reference/agents-and-skills.md
- evidence:  Full `npm test` passed; release is lockstep `0.66.0`; generated
             packs match; marketplace remains monolith-only.
- questions: none
- next:      principal-swe-architect — return a revision-bound verdict at
             `34e7f7d435a12b123ccd6f9bbd6c66e53f31afcb`.

## REVIEW 2026-08-27-1218 — principal-swe-architect

- change_ref: 34e7f7d435a12b123ccd6f9bbd6c66e53f31afcb
- verdict:    changes-required
- findings:   P0: one provider-root lifetime defect. The legacy migration gate
              requires uninstalling the same tree later doctor commands reused,
              and no safe fresh-session re-entry was defined. P1: verify kept
              core against the browsed marketplace version before installing a
              department; derive installer commands from `PACK_ORDER` instead
              of restating the roster; pin browse-before-install and report
              keys. P2: preserve `unknown`, include marketplace add in the
              confirmation boundary, distinguish selectable departments from
              mandatory core, and restore workspace routing nouns in the agent
              description. Suggested `--json` was checked against Copilot CLI
              1.0.79 and is unavailable for `marketplace browse` or
              `plugin list`, so that optional robustness suggestion is not
              adopted.
- evidence:   Exact source and parent diff; full line-level review returned to
              the session. No files edited.
- next:       principal-swe-infra — correct on a new ref and re-request both
              reviews.

## REVIEW 2026-08-27-1218 — principal-technical-writer

- change_ref: 34e7f7d435a12b123ccd6f9bbd6c66e53f31afcb
- verdict:    changes-required
- findings:   P1: make the fresh-session statement conditional on actual pack
              mutation; align the skill and agent on the `unknown` result; do
              not imply release 12b publishes departments reserved for 12c.
              P2: include marketplace add in the confirmation boundary and use
              `or`, not `then`, in the pack-vs-workspace description.
- evidence:   Exact source, release 12b/12c item boundaries, generated catalog,
              README, and CHANGELOG. No files edited.
- next:       principal-swe-infra — apply the minimal wording corrections and
              regenerate affected outputs.

## NOTE 2026-08-27-1218 — principal-swe-infra correction pass

- did:       Accepted every P0/P1 and the applicable P2 findings. Defined a
             fresh-session re-entry that never reuses an uninstalled provider
             tree; added pre-mutation marketplace/version checks and exact
             update action; derived the command set from `PACK_ORDER` and
             `MARKETPLACE`; pinned browse ordering and report keys; preserved
             `unknown`; clarified selectable rows, confirmation, descriptions,
             and release-neutral availability wording. Rejected only the
             optional `--json` suggestion after the installed Copilot CLI
             1.0.79 help proved neither relevant command supports it.
- state:     in-review
- needs:     Regenerate generated outputs, rerun all tests, commit a new
             implementation ref, and re-request both reviews at that ref.
- artifacts: skills/kai-core-workspace-onboarding/SKILL.md;
             agents/workflow-workspace-init.agent.md;
             scripts/validate-plugin.mjs
- evidence:  `copilot plugin marketplace browse --help` and
             `copilot plugin list --help` expose no `--json`; `copilot plugin
             update <name>@<marketplace>` is supported.
- questions: none
- next:      principal-swe-infra — verify and bind the corrected ref.

## HANDOFF 2026-08-27-1221 — principal-swe-infra -> principal-swe-architect

- did:       Committed the complete correction pass as
             `a3d1383e316f5528c412698424b63acf1bc0f2c1`, rebound `change_ref`, and
             kept the item in review. No prior review satisfies this ref.
- state:     in-review
- needs:     Re-review the corrected provider lifetime/re-entry, pre-mutation
             version invariant, derived command set, browse ordering, result
             schema, conditional session language, and release-neutral
             availability statement. The technical-writing review runs
             independently at the same ref.
- artifacts: skills/kai-core-workspace-onboarding/SKILL.md;
             agents/workflow-workspace-init.agent.md;
             scripts/validate-plugin.mjs
- evidence:  Full `npm test` passed after regenerated catalog and packs;
             generated trees match; `0.66.0` remains coherent.
- questions: none
- next:      principal-swe-architect — return the architecture verdict for
             exact ref `a3d1383e316f5528c412698424b63acf1bc0f2c1`.
