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
with their real owners. The shipped surface is 22 agents / 38 skills across
core, engineering, and creative; retired gtm/personal plugins have no aliases;
private `.kai/personal/` data remains unchanged.

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

**Durable, per-item coordination state.** These agents are single-shot and
stateless, but the coordination they share is not: it must survive sessions and
handoffs, so it lives under the target workspace's `.kai/state/`. In `shared`
mode this surface may be committed. In `repo-local` mode it is durable only
within that checkout, so it does not cross machines, clones, CI, or cloud
agents. In `external` mode it is durable at the registered workspace root and
must not be described as committed unless that directory is actually
version-controlled. A single mutable board is not safe as the authoritative
store: two agents working in parallel would edit the same file and create
conflicts or overwrite each other. Therefore `items/<item-id>.md` is the
**authoritative state** for one work item, `threads/<item-id>.md` is that item's
append-only communication log, and `BOARD.md` is a **derived human index**,
refreshed by the director after reconciliation — agents never treat an
out-of-date board row as authority. Parallel agents normally touch different
item and thread files.

**0 · Onboarding (when durable workspace state is needed)** — `workflow-workspace-init`
validates the full workspace contract for either a repository or a durable
standalone folder and seeds private assistant and identity stubs.

```
 project ──► workflow-workspace-init ──► external | repo-local | shared workspace
                                              │
                                              ├─► .kai/state + runs + review + archive
                                              └─► project publication root (default docs/kai)
```

**0b · North star (optional, spans weeks/months)** — run
`workflow-initiative-init` to turn mission + vision into a proposed north star,
stable milestones, success measures, and initial items. The steward approves
and activates it; later agents load it only when work matches its scope.

```
 mission + vision ──► workflow-initiative-init ──► proposed north star + milestone items
                                                       │
                                      PM/steward approves + activates
                                                       ▼
                                      .kai/state/ACTIVE.md points to the north star
                                                            ▼
   any later agent, before substantial work:  target in scope? ──yes──► load + steer toward it
                                                            └──no──► work context-free (no pollution)
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

**6 · Weekly catch-up** — aggregate the week's signal into a two-page digest you read or hear.

```
 a week of ──► workflow-weekly-pulse ──► pulse.md  ┬─ Page 1 Brief (narratable) ──► kai-core-generate-audio
 messages +    (binds message/doc/code     + brief.md │  Page 2 Board (tables + thread map)   (offer, never auto)
 docs + code    adapters via local config)            └─ (writes via kai-core-pulse-digest; read-only)
```

**Trigger rules of thumb:**

| Situation | Who fires |
|-----------|-----------|
| Install the plugin into a fresh repo / re-assert structure | `workflow-workspace-init` (once) |
| Start a new mission/vision initiative | `workflow-initiative-init`, then steward approval |
| Drive an item or initiative end to end / resume the team | `director-chief-of-staff` |
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
| "What's next on this initiative?" / groom + prioritize the board | `director-chief-of-staff` (as steward, via `kai-core-initiative-stewardship`) |
| Catch up on the week (messages + docs + watched code) | `workflow-weekly-pulse` (writes via `kai-core-pulse-digest`) |
| Audit kai's own plugin surface (inventory, naming, references) | `workflow-self-check` |

`director-chief-of-staff` owns orchestration only. Scope, technical judgment,
implementation, review, and release approval remain with their named roles.

---

**Next:** [Agents & skills](reference/agents-and-skills.md) ·
**Related:** [Workspace model](workspaces.md) · [Getting started](getting-started.md)