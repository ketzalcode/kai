[kai](../README.md) / [Docs](README.md) / How kai works

# How kai works

Which role fires when, and how a need travels to production. Every diagram below
is a *scenario*, not a mandatory pipeline. Invoke a capability directly; ask
for coordination only when needed — see [Getting started](getting-started.md).

## Package boundaries

The marketplace surface is **core, engineering, and creative** — the three
packages kai ships. Five earlier capability packages (product, marketing,
revenue, assistant, and learning) are parked in
[`incubator/`](../incubator/README.md); they do not ship, are not
installable, and are not loaded by any host.

| Package | Direct responsibility | Surface |
| --- | --- | --- |
| `kai-core` | Shared contracts, workspace infrastructure and explicitly requested coordination | Marketplace |
| `kai-engineering` | Implementation, architecture, reliability, trust and technical writing | Marketplace |
| `kai-creative` | UI/UX, visual identity, assets and supported media production | Marketplace |

Supplied briefs, factual maps, media and evidence can be direct inputs; their
usual producer is not a mandatory installed sibling. Missing evidence narrows
the answer. It never licenses invented facts or a simulated specialist verdict.
Scope, design acceptance, independent assessment and release approval remain
with their real owners. The shipped surface is 21 agents / 38 skills across
core, engineering, and creative; retired install names have no aliases.

## Schema-5 authority and workspace boundaries

Direction is the root contract for coordinated work. The operator owns the
accepted bytes in `docs/kai/DIRECTION.md`: Vision, Mission, one Current Goal,
and Out of Scope. The runtime hashes that complete revision. Open Epics whose
binding becomes stale derive attention and stop new promotion or grants until
their named authority carries, holds, cancels, or supersedes them.

```text
Direction Current Goal
└─ Epic                         cross-pack outcome
   └─ pack Feature              Core, Engineering, or Creative outcome
      └─ Requirement            verifiable obligation
         └─ Task                executable, leased work
```

`.kai/core/runtime/coordination.sqlite` is the authority for Epic, Feature,
Requirement, Task, events, messages, evidence, grants, and leases. Parent
records use the small `proposed → active → completed` lifecycle and derive
attention; Tasks retain the detailed execution, review, deployment, recovery,
and shipping gates. Child completion never closes a parent automatically.

The filesystem boundary is equally strict:

```text
.kai/<pack>/<type>/<id>/{drafts,evidence,scratch}   private, ignored state
docs/kai/<pack>/<type>/<id>/...                     accepted publication
```

Pack directories appear only on the first valid write. Publication copies one
authority-accepted revision; scratch, unaccepted drafts, and private evidence
cannot publish. Engineering code, tests, configuration, migrations, and normal
repository documentation stay at repository-native paths.

Direct work remains outside this system. A directly authorized answer or code
change reads no Direction, initializes no workspace, creates no hierarchy
record, and claims no lease. If the request expands into durable multi-role
coordination, Kai presents the proposed hierarchy and waits for authority
instead of backfilling records silently.

## Interaction scenarios

These agents are **not a fixed pipeline** — they're a *triggered graph*.
Each fires only when its kind of judgment is needed, and several are
skippable depending on the size and shape of the work. Two kinds of
agent behave differently:

- **Judgment / quality agents** (`eng-lead-architecture`,
  `eng-builder-software` / `eng-builder-platform`) scale *down*
  gracefully — they add signal even on a tiny project. Trigger them on
  need.
- **Coordination agents** (`director-chief-of-staff`) scale *up* —
  their value grows with owners × dependencies × deadline pressure ×
  parallelism. **Skip them on small or already-sequenced work.**

The agents fall into a handful of independent flows. The biggest is
**directed delivery**; the rest are smaller graphs that either feed
into it or stand on their own. Each diagram is a *scenario*, not a
mandatory pipeline.

**Durable private coordination state.** These agents are single-shot and
stateless, but coordinated work survives sessions in
`.kai/core/runtime/coordination.sqlite`. SQLite is the only coordination
authority. `repo-local` keeps all of `/.kai/` ignored and untracked; `external`
uses a registered durable workspace outside the project. Human-readable
reports are views, never state agents maintain by hand. Parallel commands use
exact versions and leases, so conflicts are refused rather than overwritten.

**0 · Onboarding (when durable workspace state is needed)** —
`workflow-workspace-init` validates the schema-5 workspace contract and creates
only the manifest, coordination database, publication README, Direction, and
managed privacy block.

```
 project ──► workflow-workspace-init ──► external | repo-local workspace
                                              │
                                              ├─► .kai/core/runtime/coordination.sqlite
                                              ├─► typed private artifacts on first write
                                              └─► accepted knowledge under docs/kai
```

**0b · Direction and Epic intake (for coordinated work)** — the operator owns
Vision, Mission, one observable time-bounded Current Goal, and Out of Scope.
`workflow-epic-init` presents one Direction-aligned Epic proposal and creates no
record before named authority approval.

```
 Direction Current Goal ──► workflow-epic-init ──► authority-approved proposed Epic
                                                          │
                                             steward activates approved scope
                                                          ▼
                                 pack Feature ──► Requirement ──► executable Task
```

**1 · Directed delivery** — talk to the Chief of Staff; it
coordinates the triggered graph without taking over specialist decisions.

```
 operator ─► director-chief-of-staff
                  │
                  ├─► eng-advisor-investigation (when evidence is missing)
                  │                 │ cited findings + unknowns
                  ├─► eng-lead-architecture ── only when a decision spans
                  │   (approach / seams / system NFRs)   components or services
                  │                 │ approved approach
                  └─► creative-lead-design
                                    │ design acceptance, or explicit design waiver
                                    ▼
              eng-builder-software / eng-builder-platform   (build the slice)
                                                        │
                                                        ▼
              eng-reviewer-code · eng-reviewer-quality       (review, accept)
                                                       │
                                    findings back to the owner ◄────┤
                                                       ▼
              workflow-pull-request ─► branch, PR narrative, version, merge readiness
                                                       │ human merges
                                                       ▼
              workflow-ship PREPARE ── DoD clear ─► `release-ready` + deploy steps
                                      gap ─────────► bounce to owner
                                                       │ human deploys
                                                       ▼
              workflow-ship CONFIRM-START ─► `deploying`
              workflow-ship CONFIRM-COMPLETE ─► production verification ─► `shipped`
```

The ship workflow never performs deployment. It prepares the release, then a
later confirmation pass records your deployment evidence and verifies
production before using the `shipped` state.

**2 · Investigation → implementation** — turn a bounded question or live-landscape finding into a buildable change, then hand slices to the engineers.

```
 a question ──► eng-advisor-investigation ──► cited findings + unknowns
 or finding      (evidence · options · risk)       │  (pick something worth acting on)
                                                    ▼
            eng-lead-architecture? ──► eng-builder-software / eng-builder-platform
            (only if it spans seams)      (build it, with its tests)
```

**3 · Independent review** — separate judgment on an exact change, design, or supplied evidence; reviewers report findings and never repair the target.

```
 a change / design / evidence
                    │
        ┌───────────┬───────────┬────────────────────┬────────────────┐
        ▼           ▼           ▼                    ▼                ▼
 eng-reviewer-  eng-reviewer- eng-reviewer-      eng-reviewer-    eng-reviewer-
     code         quality      security         privacy-compliance  reliability
        │           │           │                    │                │
        └───────────┴──────────► evidence-based findings ──► owner decides + fixes
```

Reviewers hold no write access to the target and never accept the risk they
assess — the owner remediates and the human decides.

**4 · Incident command → recovery** — one commander coordinates real domain
leads; the operator performs every production action.

```
 telemetry / security report / degradation
                    │
                    ▼
      workflow-incident-response
      (declare · SEV · timeline · decisions)
        │               │                │
        ├─► eng-reviewer-reliability     ├─► eng-reviewer-security
        └─► eng-builder-software / eng-reviewer-quality
                    │                    └─► operator action + unsent update
                    ▼
       recovery evidence ──► resolved/closed + sanitized record
                    │
                    └─► proposed persistent fixes through the normal delivery/ship flow
```

**5 · Creative direction & demo** — design and video judgment from supplied
needs, plus bounded demo production from approved direction and existing media.

```
 approved need + positioning ──► creative-lead-design ──► UI/UX or brand-system critique
                                     (revision-bound; no frontend implementation)

 supplied facts + media ──► creative-lead-video ──► direction · script · storyboard
                                     │  approved direction + existing media
                                     ▼
                    workflow-creative-demo-production ──► assembled demo
                                     (no capture, no invented direction, no publish)
```

**6 · Weekly catch-up** — aggregate the week's signal into a two-page digest you read.

```
 a week of ──► workflow-weekly-pulse ──► pulse.md  ┬─ Page 1 Brief (narratable prose)
 messages +    (binds message/doc/code  + brief.md │  Page 2 Board (tables + thread map)
 docs + code    adapters via local config)         └─ (writes via kai-core-pulse-digest; read-only)
```

**Trigger rules of thumb:**

| Situation | Who fires |
|-----------|-----------|
| Install the plugin into a fresh repo / re-assert structure | `workflow-workspace-init` (once) |
| Start a Direction-aligned Epic proposal | `workflow-epic-init`, then named authority approval |
| Grant and reconcile approved executable Tasks | `director-chief-of-staff` |
| Large / parallel / multi-owner / deadline work | `director-chief-of-staff` |
| Small or already-sequenced work | straight to the domain engineer(s) |
| Investigate a bounded issue or option, or "what changed in AI, and does it matter to us?" | `eng-advisor-investigation` |
| A decision spans components or services (boundaries, contracts, system NFRs) | `eng-lead-architecture` |
| Turn a finding into a buildable change; build a feature, fix, refactor, or applied-AI slice with its tests | `eng-builder-software` |
| Build CI/CD, IaC, containers, runtime config, or observability | `eng-builder-platform` |
| Review an exact code change / diff / PR | `eng-reviewer-code` |
| Verify a surface objectively across browser, API, CLI, or system | `eng-reviewer-quality` |
| Threat model, security design/review, or vulnerability triage | `eng-reviewer-security` |
| DPIA, data inventory, data-subject rights, retention/consent policy, or compliance-framework review | `eng-reviewer-privacy-compliance` |
| SLOs, reliability design, service readiness, capacity, or observability review | `eng-reviewer-reliability` |
| Active outage, degradation, security/data event, status update, recovery, or post-incident close | `workflow-incident-response` |
| Structure or audit a README, write technical docs, prep localization, or assess documentation readiness | `eng-lead-technical-writing` |
| Design or critique an interaction, visual hierarchy, applied design system, or visual identity | `creative-lead-design` |
| Turn approved facts and media evidence into proportional video direction, a script, storyboard, or demo screenplay | `creative-lead-video` |
| Produce an authorized demo from approved direction and supplied media | `workflow-creative-demo-production` |
| Open a PR for a finished change (branch, narrative, version, merge readiness) | `workflow-pull-request` |
| Prepare a built slice / record deployment start / confirm production shipment | `workflow-ship` PREPARE / CONFIRM-START / CONFIRM-COMPLETE |
| Get *pushed* updates on a cadence (you host an external runner) | `workflow-proactive-scan` (see `examples/proactive-runner/`) |
| "What's next under this Epic or Feature?" / plan executable Tasks | `director-chief-of-staff` with `kai-core-work-stewardship` |
| Catch up on the week (messages + docs + watched code) | `workflow-weekly-pulse` (writes via `kai-core-pulse-digest`) |

`director-chief-of-staff` owns orchestration only. Scope, technical judgment,
implementation, review, and release approval remain with their named roles.

---

**Next:** [Agents & skills](reference/agents-and-skills.md) ·
**Related:** [Workspace model](workspaces.md) · [Getting started](getting-started.md)