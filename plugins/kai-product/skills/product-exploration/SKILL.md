---
name: product-exploration
description: "Use when product, design, QA, domain, or engineering work needs a neutral navigation model from supplied evidence or an authorized live surface."
tools: [playwright, read, edit, ask_user]
---

> Live browser steps require a Playwright MCP server registered as `playwright`
> in the host (see `docs/getting-started.md` → "Browser automation setup").
> Supplied-evidence mapping does not require browser access.

# Product Exploration

Create a factual, reusable map of a product. The map answers:

- Where can a user enter?
- What roles, state, or setup does each journey require?
- Which actions move the user between surfaces?
- What can another agent safely reproduce?
- Which areas remain unknown or blocked?

It does **not** answer whether the experience is good, what should change, or
whether a feature belongs in the product.

## Who uses this method

`workflow-product-explore` executes the full method; the operator may also request
it directly with supplied evidence. Before the first core route, Load
`kai-core-contract-v1` unless already confirmed for this invocation, then Load
`kai-core-operating-rules` to separate observed facts from design/scope authority.
If core is unavailable, only summarize supplied evidence inline, with coverage
limits; write no `.kai` state and tell the operator to install or update
`kai-core` before persistent or coordinated exploration.

For live observation, Load `kai-core-web-evaluation` only for browser safety,
login handling, screenshot naming and the local run folder; do not use its
evaluation scaffold or finding taxonomy. PM, creative, professional personas,
QA and engineering can consume the resulting map without being called to make it.

Use it when:

- an initiative concerns an existing live product or workflow;
- several peers need the same navigation context;
- the target repository is unavailable or insufficient to explain runtime
  journeys;
- a prior map is absent or stale against a known product change.

Skip it for a one-page static target, a code-only change with no user journey,
or when a current map already covers the exact surfaces and state.

## Required inputs

- target URL/environment;
- exploration goal and explicit boundaries;
- supplied evidence with source, date/revision, surface/state and viewport,
  or authorization and access to inspect the live target;
- known roles/personas and whether authentication is expected;
- destructive or irreversible actions that must not be crossed.

An inline supplied-evidence map needs no initiative or work item. Before reading
`.kai` state or saving evidence, Load `kai-core-workspace-paths` for the resolved
workspace and run root. Load `kai-core-workspace-initiative` only when an actual
initiative owns the map; use its supplied item, north star and target.

For a granted item, Load `kai-core-work-acting` before exploration and verify
holder/token/version before each state-changing write; stop on collision.
The acting workflow handles any authorized sole-worker grant and activity
signals; loading this method is not itself a lease.

**Storage boundary:** for initiative work, the canonical product map is
`.kai/state/initiatives/<slug>/artifacts/product-map.md`. The work item's
`artifact_targets` must contain that path unless an operator-approved override is
recorded. Unaffiliated durable publication requires an explicit project-qualified
target such as
`project:<project-id>:docs/kai/reports/investigations/<item-id>.md` when that
project's configured `publication_root` is `docs/kai`;
never infer an initiative or manufacture an item just to return a map. Until
durable placement and acceptance are established, return a direct map inline.

Raw browser evidence uses:
`.kai/runs/qa/<YYYY-MM-DD>/<NN>-explore-<descriptor>/`.

## Hard rules

1. **Factual provenance.** Label every statement `observed`, `inferred`, or
   `provided`. Never turn an assumption into a route or precondition.
   Supplied screenshots and journey notes are `provided`, not a claim that you
   navigated them; preserve their original observation provenance separately.
2. **Neutrality.** Do not score usability, file bugs, propose interactions, or
   make product decisions. Route those to UX, QA, product design, or PM.
3. **Safe navigation.** Never submit payment, delete data, publish, invite,
   message, or perform another irreversible action without explicit
   per-action approval.
4. **No credentials or browser state in the map.** Use the login-pause pattern.
   Keep cookies, tokens, and `storageState*.json` local and unindexed.
   Redact identities and account content; never reset storage, generate charged
   output, or change real user data without explicit authorization.
5. **One workspace.** Use the packet's paths verbatim. All textual output and
   cited evidence must remain under the recorded target workspace.
6. **Reproducible steps.** A peer unfamiliar with the app should be able to
   follow a journey using only the map and operator-provided access.
7. **Honest coverage.** Record inaccessible, role-gated, ambiguous, and
   destructive boundaries instead of silently skipping them.

## Exploration procedure

1. Confirm target, goal, roles, state, viewports, and stop boundaries.
2. Check for an existing map. Reuse confirmed facts and identify what needs
   refresh; do not blindly repeat the whole product.
3. Use supplied evidence first. If it covers the question adequately, map it
   without another producer call or live pass. For authorized live exploration,
   start from public entry points. Record redirects, route changes, and visible
   navigation controls.
4. For a live run, walk each in-scope user job from start state to observable end
   state. For supplied evidence, reconstruct only the documented steps and
   mark missing transitions unknown.
5. Record required state: account role, seeded data, generated object, feature
   flag, prior step, or viewport.
6. Cite supplied screenshots or capture new ones in an authorized live run only
   when they clarify a surface, branch, or state transition. Index every one.
7. Record alternate paths, responsive differences, dead ends, and permission
   boundaries without judging them.
8. Replay documented happy paths once when authorized live access is available.
   Otherwise mark them provided/unverified and name what was not replayed.
9. Load `kai-core-asset-producing` when writing a durable map for its evidence,
   revision, disposition and validity metadata. Apply `kai-core-asset-closing`
   before calling it accepted/current: the commissioning authority accepts the
   exact revision, with explicit scope, grounding, disposition, validity owner
   and revalidation trigger. A direct inline map asserts no durable acceptance.
10. For a granted item, Load `kai-core-work-item` to update evidence, version,
    next role and lease, then
    leave a HANDOFF with exact map/evidence paths. Direct work returns coverage
    and freshness without inventing those records.

## Product-map schema

```markdown
# Product Surface Map — <target>

## Scope and freshness
- target:
- environment:
- explored:
- freshness basis:
- artifact provenance:
- in scope:
- excluded:

## Access and state
| role/persona | auth required | starting state | setup/data | provenance |

## Entry points
| id | URL/surface | reached from | visible purpose | provenance | evidence |

## Journey catalog
| id | user job | start | preconditions | steps | observable end | variants | stop boundary | evidence |

## Surface and route inventory
| surface | route/identifier | key actions | enters from | exits to | role/state | provenance |

## Interaction contracts
| control/action | current behavior | resulting state/surface | viewport/role differences | evidence |

## Reusable setup notes
<Non-secret fixtures, public generation steps, feature state, and reset notes.>

## Unknowns and blocked coverage
| area | reason | role/access needed | consequence for peers |

## Evidence index
| id | workspace-relative path | source/tool | captured | supports |

## Peer handoff
- PM:
- product design:
- domain reviewers:
- QA:
- engineering:
```

Use concise steps with the exact visible label a peer should click. Do not use
selectors as the only instruction; selectors are supporting evidence, not a
human navigation model.

## Freshness

A map is stale when a known release changed a covered journey, the target
environment differs, required state no longer reproduces, or a peer finds a
contradiction. For maintained assets use the revalidation policy in
`kai-core-asset-closing` (90 days and basis change by default); a longer or absent
deadline needs a recorded reason. Never relabel old evidence as newly observed.

The director may dispatch a focused refresh item rather than a complete
re-exploration. Preserve prior maps as history; never silently rewrite evidence
from a different product version.

## Handoff

The explorer records:

- exact `artifact_targets`;
- exact evidence paths;
- journeys verified;
- blocked/unknown areas;
- roles or state still needed;
- whether the map is sufficient for the next named peers.

The map becoming available satisfies a factual dependency only. It does not
approve product scope, interaction design, engineering, or release.
