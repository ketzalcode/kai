# Capability Packages Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement the selected package plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Deliver the approved eight-package structure as small, package-complete units.

**Architecture:** Keep core and engineering signed off, except necessary references to moved package capabilities. Complete each remaining package's agents, methods, companion assets, and installation surface together, continuously on one branch.

**Tech Stack:** Markdown agents and skills, existing Node.js ESM packaging scripts, JSON manifests, existing package-local runtime helpers.

**Spec:** `docs/superpowers/specs/2026-09-12-package-boundaries-design.md`

**Delivery status:** the remaining five package units are source-complete in
[PR #210](https://github.com/RubenSaucedo/kai/pull/210), not merged. All eight
target package directories exist on its branch. Next are the two refinement
passes and deferred safety/runtime/test/CI consolidation, not another
package-creation approval.

## Global Constraints

- Packages describe useful capabilities a user installs, not agent prefixes or an organizational reporting chart.
- There is one owning package for each agent and skill, not duplicate copies.
- The supported baseline for a capability package is **core plus that package**.
- Finish coherent packages with their agents and skills together, before developing more interactions between packages.
- Keep the final safety, behavioral, and test/CI consolidation after the refactor and its two refinement passes. Red intermediate checks are accepted.
- Deferring a safety-review phase does not permit removing consent, privacy, factual-grounding, or authority boundaries.

---

## 1. Delivery order

Core and engineering remain the baseline. Only assistant extraction and its
core references reopen that baseline.

| Order | Package | Deliverable | Why here |
| --- | --- | --- | --- |
| 1 | `kai-assistant` | Two directly invoked agents and four local methods; remove the old executive-assistant router from core | Establishes the new assistance boundary and removes the reverse core dependency |
| 2 | `kai-creative` | Three agents, seven existing local methods, their media helpers and runtime dependencies | Consolidates UI/UX, visual identity, and media production from two old packages |
| 3 | `kai-product` | Ten agents and product exploration, without creative ownership | Completes the product/creative boundary and places product-led growth and domain-audit personas correctly |
| 4 | `kai-marketing` | Four agents and two methods, accepting supplied product evidence without required sibling calls | Makes positioning, campaigns, and distribution independently usable |
| 5 | `kai-revenue` | Six commercial/customer agents with their direct procedures | Separates commercial operations from marketing and empties the remaining go-to-market package |
| 6 | `kai-learning` | Five agents, HTML lesson method, and existing core audio use | Completes the remaining personal-package redistribution |

This order reduces ownership churn, not runtime dependencies. None of these
packages may require the preceding package to be installed for its baseline
direct tasks.

The [assistant plan](2026-09-12-assistant-package.md) is complete at the
committed-source level on `kai/refactor/assistant-package`, through `166cf93`.
It is not runtime-verified or published. Its execution record preserves the
review outcomes, remaining limitations, and all rulings.

**Operator correction, 2026-09-12:** continue through all missing packages
without stopping after one or seeking another package-selection approval.
Create one PR after the complete eight-package source surface exists. Execute
[the remaining-package plan](2026-09-12-remaining-packages.md); package boundaries
are implementation/review units, not pauses in authorization.

## 2. Package checkpoint

For each selected package:

- [ ] Apply the spec's exact agent/skill ownership map.
- [ ] Complete the agents and their required methods in the same unit.
- [ ] Move full skill directories and runtime requirements, not just `SKILL.md`.
- [ ] Update the existing packaging declarations and generate the install files.
- [ ] Document representative direct requests, expected outputs, and actual
  limitations. Mark unexecuted runtime scenarios explicitly.
- [ ] Record moved, redesigned, and retired responsibilities in one package
  note, rather than creating a separate migration dossier for every file.
- [ ] Commit the unit and continue to the next selected package without a
  validation-repair detour.

Source ownership, generation, and focused content inspection are required to
produce usable package files. This is not a requirement to run the full suite,
repair legacy naming policy, or introduce new test infrastructure per package.

Existing `kai-personal` and `kai-gtm` directories remain only while they own
unmoved source. They are not aliases or compatibility packages: each moved
agent/skill has exactly one source. Remove an old package and its marketplace
entry when its last owner has moved.

## 3. Source and generated surfaces

| Surface | Responsibility |
| --- | --- |
| `plugins/<package>/agents/` | Authoritative agent instructions |
| `plugins/<package>/skills/<skill>/` | Authoritative method and companion assets |
| `scripts/lib/pack-plan.mjs` | Existing install ownership and runtime dependency declarations |
| `scripts/generate-catalog.mjs` | Existing editorial category membership and copy |
| `.github/plugin/marketplace.json` | Installable package entries |
| `plugins/<package>/plugin.json`, `package.json`, `package-lock.json`, routed `scripts/` | Generated package surfaces |
| `test/fixtures/inventory.json` | Generated discoverable inventory, not a behavioral test result |
| `docs/reference/packages/<package>.md` | Package responsibility, direct use, changes, limitations |

Do not rewrite the partitioning algorithm or invent an organization-routing
registry. Updating the existing install ownership declarations is necessary
packaging work; it is not task selection for the session.

## 4. End-of-refactor work

After all six package units:

- [ ] First refinement pass: reconcile responsibility boundaries, moved
  obligations, and hidden sibling dependencies across all eight packages.
- [ ] Second refinement pass: improve instruction clarity, task relevance,
  context loading, and quality; remove redundant mediation.
- [ ] Run the consolidated safety and privacy review and the spec's runtime
  scenarios. Preserve source-review versus runtime-evidence distinctions.
- [ ] Reconcile validators, taxonomy rules, fixtures, catalogs, and tests with
  the approved architecture; then run the existing full suite and address
  genuine failures.
- [ ] Review release readiness using that evidence. Do not infer it from
  generated metadata, a merged checkpoint, or prompt-size estimates.

No fleet-observation wiring, new schedulers/connectors, or cross-package
orchestration subsystem is scheduled by this plan.

## 5. Integration and releases

Use one named refactor branch and focused package commits. The operator has
authorized a push and one PR after all remaining packages are complete. Do not
merge that PR, tag, or publish a release without a subsequent request.

Before any requested checkpoint PR, follow root `AGENTS.md` release metadata
requirements once for that PR: synchronized versions, dated changelog entry
and compare link, README stamp, and generated surfaces. Do not perform a
version bump per prompt edit. The prepared `6.0.0` baseline is not a published
release or evidence of quality.

The final test/CI consolidation is deferred by the operator. If an intermediate
merge is requested, explicitly record its accepted failing checks without
weakening branch protections or manufacturing passing results.
