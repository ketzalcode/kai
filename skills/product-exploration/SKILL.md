---
name: product-exploration
description: "Provides neutral live-product mapping. Use when PM, design, QA, domain, or engineering need an evidence-backed navigation model without UX evaluation."
tools: [playwright, read, edit, ask_user]
---

> **Requires a Playwright MCP server** registered under the key `playwright` in your host's MCP config (see `docs/getting-started.md` → "Browser automation setup"). Without it, the browser steps here cannot run.

# Product Exploration

Create a factual, reusable map of a live product. The map answers:

- Where can a user enter?
- What roles, state, or setup does each journey require?
- Which actions move the user between surfaces?
- What can another agent safely reproduce?
- Which areas remain unknown or blocked?

It does **not** answer whether the experience is good, what should change, or
whether a feature belongs in the product.

## Who uses this method

`workflow-product-explore` executes the full method. It reuses
`kai-core-web-evaluation` only for browser safety, login handling, screenshot naming,
and the local run folder; it does not use an evaluation report scaffold or
finding taxonomy. PM, product design, professional personas, QA, and engineers
consume the resulting map.

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
- resolved `workspace root` and `.kai/runs` root;
- initiative slug and work item;
- known roles/personas and whether authentication is expected;
- destructive or irreversible actions that must not be crossed.

**Storage boundary:** for initiative work, the canonical product map is
`kai/initiatives/<slug>/artifacts/product-map.md`. The work item's
`artifact_targets` must contain that path unless an operator-approved override is
recorded. Unaffiliated exploration requires an explicit target under
`kai/library/investigations/`; never infer an initiative.

Raw browser evidence uses:
`.kai/runs/qa/<YYYY-MM-DD>/<NN>-explore-<descriptor>/`.

## Hard rules

1. **Observed facts only.** Label every statement `observed`, `inferred`, or
   `provided`. Never turn an assumption into a route or precondition.
2. **Neutrality.** Do not score usability, file bugs, propose interactions, or
   make product decisions. Route those to UX, QA, product design, or PM.
3. **Safe navigation.** Never submit payment, delete data, publish, invite,
   message, or perform another irreversible action without explicit
   per-action approval.
4. **No credentials or browser state in the map.** Use the login-pause pattern.
   Keep cookies, tokens, and `storageState*.json` local and unindexed.
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
3. Start from public entry points. Record redirects, route changes, and visible
   navigation controls.
4. Walk each in-scope user job from start state to observable end state.
5. Record required state: account role, seeded data, generated object, feature
   flag, prior step, or viewport.
6. Capture screenshots only when they clarify a surface, branch, or state
   transition. Every screenshot must be indexed.
7. Record alternate paths, responsive differences, dead ends, and permission
   boundaries without judging them.
8. Verify the documented happy-path steps once from the map before handoff.
9. Write freshness and coverage metadata, then leave a HANDOFF with the exact
   map and evidence paths.

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
contradiction. Age alone is not enough to invent a refresh interval.

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
