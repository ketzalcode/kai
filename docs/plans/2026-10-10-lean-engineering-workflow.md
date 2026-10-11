# Lean Engineering Workflow Implementation Plan

**Goal:** Ship Kai 22.0.0 with five explicit engineering agents, frontend and
backend coding guidance, a lightweight software-development workflow, selective
review, execution-only PR merges, and no Superpowers dependency.

**Architecture:** Direct work remains with the main agent. Explicit frontend,
backend, lead, reviewer, and technical-writing agents load only the skills
needed for their task. `software-development` scales clarification and
validation to the change; PR merge and review remain separate explicit actions.

**Tech stack:** Markdown agent and skill contracts, Node.js validation and
generation scripts, `node:test`, npm release metadata, GitHub Copilot CLI plugin
management.

**Spec:** `docs/designs/lean-engineering-workflow.md`

## Global constraints

- Kai's approved philosophy must appear near the beginning of `README.md` and
  `AGENTS.md`.
- Active Kai Engineering agents are exactly `eng-builder-frontend`,
  `eng-builder-backend`, `eng-lead-software`, `eng-reviewer-code`, and
  `eng-lead-technical-writing`.
- Every active engineering agent is user-invocable and declares
  `disable-model-invocation: true`.
- `eng-builder-platform` and `workflow-ship` move to incubation.
- The other retired engineering agents are deleted, not aliased.
- `software-development` may trigger for implementation work but must exclude
  merge, review-only, release-only, deployment-only, prose-only, metadata-only,
  and generated-refresh work.
- Review is selective. A merge command performs live repository gate checks
  and does not restart development validation.
- Testing follows the approved Lean TDD model. Detailed frontend, backend, and
  E2E test-craft skills are deferred.
- This breaking shipped-surface change prepares version `22.0.0`.
- Validation agreement: Custom fast-ship. Use focused contract tests during
  development, named manual scenarios, generated artifact checks, and one final
  `npm test` plus `npm run build:check`. Do not add an automatic independent
  review.

---

## Pre-execution: remove the global methodology

- [ ] Uninstall Superpowers:

  ```powershell
  copilot plugin uninstall superpowers@superpowers-marketplace
  ```

- [ ] Confirm it is absent:

  ```powershell
  copilot plugin list
  ```

  Expected: no `superpowers@superpowers-marketplace` entry.

- [ ] Start a fresh Copilot CLI session before implementation.

  The current session retains skills loaded at startup. A fresh session proves
  the development work is running under Kai and repository instructions only.

---

### Task 1: Establish the Kai philosophy and software-development contract

**Files:**

- Modify: `README.md`
- Modify: `AGENTS.md`
- Modify: `src/core/lib/repository-instructions-block.md`
- Create: `plugins/kai-engineering/skills/software-development/SKILL.md`
- Modify: `test/repository-instructions-self-test.mjs`
- Modify: `test/pr-lifecycle-self-test.mjs`

**Produces:**

- The approved Kai philosophy in user-facing and contributor-facing entry
  points.
- One narrow implementation workflow that replaces Superpowers for code
  changes.
- Repository instructions that describe proportionate development and
  validation without naming Superpowers.

- [ ] Add focused assertions before editing the contracts.

  In `test/repository-instructions-self-test.mjs`, assert that:

  - the canonical block contains `Kai keeps direct work direct`;
  - the canonical block contains focused TDD and proportionate validation;
  - the canonical block does not contain `Superpowers`;
  - the root `AGENTS.md` still contains the canonical block byte-for-byte.

  In `test/pr-lifecycle-self-test.mjs`, assert that
  `software-development`:

  - exists and is user-invocable;
  - names features, fixes, refactors, and behavior changes in its trigger;
  - excludes review-only and PR merge work;
  - applies `coding-standards`;
  - distinguishes bounded, ambiguous, architectural, and uncertain-defect
    paths;
  - contains the Lean TDD rules from the approved design;
  - stops at an evidence handoff without starting review, PR delivery, merge,
    release, or deployment.

- [ ] Run the focused tests and confirm the new assertions fail because the
  contracts do not exist yet:

  ```powershell
  node --test test\repository-instructions-self-test.mjs test\pr-lifecycle-self-test.mjs
  ```

- [ ] Add the approved philosophy immediately after `# Kai` in `README.md` and
  immediately after the `AGENTS.md` title and scope introduction.

  Use this text without changing its meaning:

  ```text
  Kai is a lean, quality-first suite of specialized agents and skills for
  agent-to-agent software collaboration. It combines repository-native coding
  standards, focused TDD, explicit coordination, and evidence-based handoffs
  without turning routine work into ceremony.

  Kai keeps direct work direct. It adds agents, process, and validation only
  when they materially improve correctness, context isolation, or delivery
  quality. The goal is a high-performing engineering system: small roles,
  relevant context, proportionate confidence, and fast shipping.
  ```

- [ ] Replace the canonical repository development profile with concise rules:

  ```text
  - Keep direct work direct. Add coordination only when specialization,
    isolation, or independent work materially improves the result.
  - For implementation, use the smallest process that resolves real
    uncertainty: direct work for clear changes, one decision for material
    ambiguity, concise design approval for architecture, and root-cause
    investigation for uncertain defects.
  - Use focused TDD for reproduced defects and stable contracts. Stabilize
    uncertain design before expanding tests.
  - Before handoff, run targeted automated checks and named manual scenarios.
    Escalate to broader suites only for cross-cutting risk, repository release
    rules, or an explicit request.
  - Review, PR creation, merge, release, and deployment are separate actions.
    A continuation command does not restart completed lifecycle phases.
  ```

  Copy the exact managed block into `AGENTS.md`; do not independently edit the
  generated copy under `plugins/kai-core`.

- [ ] Create `software-development/SKILL.md` with:

  ```yaml
  ---
  name: software-development
  description: "Use when implementing or modifying product code for a feature, fix, refactor, or behavior change. Do not use for review-only, PR merge, release-only, deployment-only, prose-only, metadata-only, or generated-refresh work."
  tools: [execute, read, edit, search, ask_user, skill]
  user-invocable: true
  argument-hint: "feature, fix, refactor, or behavior change"
  ---
  ```

  Its body must contain these sections:

  - `Choose the smallest useful process`
  - `Apply implementation guidance`
  - `Use Lean TDD and validation`
  - `Return an evidence handoff`

  The four process paths and validation rules must match the design rather than
  the strict Superpowers workflow.

- [ ] Run the focused tests again:

  ```powershell
  node --test test\repository-instructions-self-test.mjs test\pr-lifecycle-self-test.mjs
  ```

  Expected: pass.

- [ ] Commit:

  ```text
  feat: add lean software development workflow
  ```

---

### Task 2: Split frontend and backend implementation guidance

**Files:**

- Modify: `src/core/lib/loader-contract.mjs`
- Create: `test/fixtures/host-loader/invalid/disable-model-invocation-value.agent.md`
- Modify: `plugins/kai-engineering/skills/coding-standards/SKILL.md`
- Create: `plugins/kai-engineering/skills/frontend-coding-standards/SKILL.md`
- Create: `plugins/kai-engineering/skills/backend-coding-standards/SKILL.md`
- Create: `plugins/kai-engineering/agents/eng-builder-frontend.agent.md`
- Create: `plugins/kai-engineering/agents/eng-builder-backend.agent.md`
- Delete: `plugins/kai-engineering/agents/eng-builder-software.agent.md`
- Move: `plugins/kai-engineering/agents/eng-builder-platform.agent.md`
  to `incubator/kai-engineering/agents/eng-builder-platform.agent.md`
- Modify: `plugins/kai-engineering/agents/eng-lead-software.agent.md`
- Modify: `plugins/kai-engineering/agents/eng-reviewer-code.agent.md`
- Modify: `plugins/kai-engineering/agents/eng-lead-technical-writing.agent.md`
- Modify: `incubator/kai-engineering/README.md`
- Modify: `incubator/README.md`
- Modify: `test/pr-lifecycle-self-test.mjs`

**Produces:**

- Two non-overlapping application builders.
- One shared core coding skill and one domain skill per builder.
- Manual-only active engineering agents.
- An incubated platform builder with an explicit re-entry reason.

- [ ] Extend `test/pr-lifecycle-self-test.mjs` to assert:

  - frontend and backend builders exist;
  - general software and active platform builders do not exist;
  - the incubated platform file exists;
  - all five active engineering agents declare
    `disable-model-invocation: true`;
  - both builders apply `software-development` and `coding-standards`;
  - frontend applies only `frontend-coding-standards`;
  - backend applies only `backend-coding-standards`;
  - each builder stops at implementation evidence and never applies PR sizing
    or delivery.

- [ ] Add loader validation for `disable-model-invocation`:

  - agent-only;
  - literal `true` or `false`;
  - invalid on skills.

  Add an invalid host fixture using a non-boolean value so
  `npm run host-contract` proves the validator rejects malformed declarations.

- [ ] Run the focused contract tests and host contract; confirm the new roster
  assertions fail before the files are changed:

  ```powershell
  node --test test\pr-lifecycle-self-test.mjs
  npm run host-contract
  ```

- [ ] Refactor `coding-standards` into the shared core. Keep clarity, naming,
  authoritative definitions, response/error contracts, type ownership,
  explicit error handling, telemetry compatibility, right-sized
  responsibility, YAGNI, and concise comments. Move frontend-only composition,
  accessibility, and localization detail into the frontend skill. Move
  service-specific auth, persistence, logging, and operational behavior into
  the backend skill.

- [ ] Create the domain skills with narrow descriptions:

  ```yaml
  description: "Use with coding-standards when implementing or refactoring frontend UI or client behavior."
  ```

  ```yaml
  description: "Use with coding-standards when implementing or refactoring APIs, services, persistence, jobs, libraries, or server-side behavior."
  ```

  Both skills remain implementation guidance, not workflow gates or exhaustive
  checklists.

- [ ] Create frontend and backend builders from the useful common parts of the
  current software builder:

  - preserve direct-work and Kai coordination boundaries;
  - route `software-development`, then shared and domain standards;
  - retain repository-native patterns and changed-behavior test ownership;
  - keep only the relevant domain obligations;
  - set `disable-model-invocation: true`;
  - never require another package or specialist agent.

- [ ] Set `disable-model-invocation: true` on the software lead, code reviewer,
  and technical-writing lead.

- [ ] Move the platform builder to incubation and add this re-entry condition:

  ```text
  Re-entry requires a repository-learning design that grounds platform behavior
  in the target repository's CI/CD, infrastructure, runtime, identity, and
  observability conventions rather than generic platform advice.
  ```

- [ ] Run:

  ```powershell
  node --test test\pr-lifecycle-self-test.mjs
  npm run host-contract
  ```

  Expected: pass.

- [ ] Commit:

  ```text
  feat: specialize frontend and backend builders
  ```

---

### Task 3: Remove specialist overhead and make review and merge selective

**Files:**

- Delete: `plugins/kai-engineering/agents/eng-advisor-investigation.agent.md`
- Delete: `plugins/kai-engineering/agents/eng-reviewer-privacy-compliance.agent.md`
- Delete: `plugins/kai-engineering/agents/eng-reviewer-quality.agent.md`
- Delete: `plugins/kai-engineering/agents/eng-reviewer-reliability.agent.md`
- Delete: `plugins/kai-engineering/agents/eng-reviewer-security.agent.md`
- Delete: `plugins/kai-engineering/agents/workflow-incident-response.agent.md`
- Move: `plugins/kai-engineering/agents/workflow-ship.agent.md`
  to `incubator/kai-engineering/agents/workflow-ship.agent.md`
- Modify: `plugins/kai-engineering/agents/eng-lead-software.agent.md`
- Modify: `plugins/kai-engineering/agents/eng-reviewer-code.agent.md`
- Modify: `plugins/kai-engineering/skills/pr-review/SKILL.md`
- Modify: `plugins/kai-engineering/skills/pr-delivery/SKILL.md`
- Modify: `tools/validate-plugin.mjs`
- Modify: `incubator/kai-engineering/README.md`
- Modify: `incubator/README.md`
- Modify: `test/pr-lifecycle-self-test.mjs`

**Produces:**

- No permanent specialist-review or incident-response agents.
- One selective general code reviewer.
- A direct merge path that consumes live GitHub gates.
- An incubated release workflow with a named re-entry requirement.

- [ ] Replace the old specialist-routing tests with assertions that:

  - all removed agent IDs are absent;
  - `workflow-ship` exists only under incubation;
  - the software lead says review is optional unless explicitly requested,
    concretely justified and authorized, or required by repository protection;
  - the software lead does not require fresh review solely because a revision
    changed;
  - `pr-review` contains no specialist-agent routing or specialist-verdict
    dependency;
  - the general reviewer reports relevant defects directly without spawning
    another reviewer;
  - `pr-delivery` defines the execution-only merge steps and explicitly forbids
    rerunning tests, starting review, or planning solely because the operator
    requested merge;
  - a code change needed to clear a blocker returns to
    `software-development`.

- [ ] Run `node --test test\pr-lifecycle-self-test.mjs` and confirm the new
  assertions fail against the old contracts.

- [ ] Simplify the software lead:

  - coordinate only on an explicit multi-builder request;
  - dispatch frontend/backend builders with bounded assignments;
  - ask before selective review unless repository protection already requires
    it;
  - keep PR sizing and PR preparation separate from merge;
  - do not implement, self-approve, merge, deploy, tag, or release.

- [ ] Simplify `eng-reviewer-code` and `pr-review` to one evidence-based general
  review. Keep requirements, correctness, contracts, regressions, testing, and
  relevant coding standards. Remove language that defers judgment to deleted
  specialists.

- [ ] Add the execution-only merge contract to `pr-delivery`:

  ```text
  For an explicit merge instruction on an existing PR, resolve the PR and exact
  head, read live draft/mergeability/check/review/conversation/method gates,
  merge when allowed, and report the merge commit. Do not restart review,
  testing, planning, or PR preparation solely because merge was requested.
  ```

- [ ] Reduce `ASSESSOR_ROLES` in `tools/validate-plugin.mjs` to the active roles
  that still perform independent assessment:

  - `eng-reviewer-code`
  - `eng-lead-technical-writing`

- [ ] Incubate `workflow-ship` with this re-entry condition:

  ```text
  Re-entry requires meaningful release authority or executable release actions
  beyond recording state, plus a measured reason that the capability should be
  an agent rather than an explicit skill or host command.
  ```

- [ ] Run:

  ```powershell
  node --test test\pr-lifecycle-self-test.mjs
  npm run validate
  ```

  Expected: pass.

- [ ] Commit:

  ```text
  refactor: remove automatic engineering review chains
  ```

---

### Task 4: Align coordination fixtures, catalog, documentation, and metadata

**Files:**

- Modify: `test/coordination-core-self-test.mjs`
- Modify: `test/helpers/coordination-cli-native-fixture.mjs`
- Modify: `test/helpers/coordination-report-fixture.mjs`
- Modify: `test/helpers/coordination-runtime-fixture.mjs`
- Modify: `tools/generate-catalog.mjs`
- Modify: `README.md`
- Modify: `plugins/kai-engineering/plugin.json`
- Modify: `plugin.json`
- Modify: `docs/designs/development-system-simplification.md`
- Modify: `test/pr-lifecycle-self-test.mjs`

**Produces:**

- Fixtures use only active roles.
- Catalog categories describe the lean roster and three coding layers.
- README examples and product claims match the approved philosophy.
- Earlier Superpowers guidance is explicitly superseded.

- [ ] Replace fixture roles:

  - use `eng-builder-backend` as the generic producer fixture;
  - include `eng-builder-frontend` where a second implementation role is
    needed;
  - remove `eng-reviewer-quality` and `workflow-ship`;
  - use `eng-lead-technical-writing` only where a distinct active role is
    needed, not as a fake release owner.

- [ ] Update catalog categories:

  - Engineering: software lead, frontend builder, backend builder;
  - Technical writing: technical-writing lead;
  - Implementation review: code reviewer;
  - Engineering craft: add `software-development`,
    `frontend-coding-standards`, and `backend-coding-standards`;
  - remove empty intake/delivery and trust/reliability agent categories.

- [ ] Update README:

  - open with the approved philosophy;
  - describe explicit, proportionate agent-to-agent collaboration;
  - use frontend/backend first-success examples;
  - remove specialist-review, platform, incident, and ship claims;
  - remove `eng-reviewer-quality` from Playwright requirements;
  - show Kai Engineering as 5 agents and 12 skills;
  - show the complete surface as 13 agents and 44 skills;
  - set the prepared status to `v22.0.0`.

- [ ] Update package descriptions and root keywords so they no longer advertise
  platform implementation, technical investigation, privacy/compliance,
  specialist security/reliability review, or incident response.

- [ ] Add a short note near the Superpowers methodology section in
  `development-system-simplification.md`:

  ```text
  Superseded on 2026-10-10 by lean-engineering-workflow.md. Kai now owns a
  lightweight implementation workflow and does not require Superpowers.
  ```

- [ ] Update README-focused assertions in `test/pr-lifecycle-self-test.mjs` for
  the approved philosophy and new counts.

- [ ] Run:

  ```powershell
  node --test test\coordination-core-self-test.mjs test\pr-lifecycle-self-test.mjs
  npm run validate
  ```

  Expected: pass.

- [ ] Commit:

  ```text
  docs: align Kai with the lean engineering vision
  ```

---

### Task 5: Prepare 22.0.0 and run Custom fast-ship validation

**Files:**

- Modify: `package.json`
- Modify: `package-lock.json`
- Modify: `CHANGELOG.md`
- Generated by `npm run build`:
  - `plugin.json`
  - `.github/plugin/marketplace.json`
  - `plugins/*/plugin.json`
  - `plugins/kai-core/scripts/lib/repository-instructions-block.md`
  - `docs/reference/agents-and-skills.md`
- Generated by `npm run host-contract:update`:
  - `test/fixtures/inventory.json`

**Produces:**

- Honest 22.0.0 metadata.
- Generated packages with exactly 13 agents and 44 skills.
- Final repository evidence without an automatic independent review.

- [ ] Set the version through the repository authority:

  ```powershell
  npm version 22.0.0 --no-git-tag-version
  ```

- [ ] Add `CHANGELOG.md` entry `22.0.0 - 2026-10-10`:

  - **Added:** frontend/backend builders, domain coding standards,
    `software-development`, Kai philosophy.
  - **Changed:** selective review, direct merge behavior, repository
    development profile.
  - **Removed:** investigation, general software builder, specialist reviewers,
    incident response, and Superpowers methodology.
  - **Incubated:** platform builder and ship workflow.
  - Add `[22.0.0]` comparison link from `v21.0.0`.

- [ ] Generate all package and documentation outputs:

  ```powershell
  npm run build
  npm run host-contract:update
  ```

- [ ] Run focused contract verification:

  ```powershell
  node --test test\repository-instructions-self-test.mjs test\pr-lifecycle-self-test.mjs test\coordination-core-self-test.mjs
  npm run host-contract
  ```

- [ ] Run the named manual scenarios:

  1. Inspect the generated Kai Engineering pack and confirm only the five
     approved agents are present.
  2. Confirm every active engineering agent declares
     `disable-model-invocation: true`.
  3. Confirm `software-development` excludes PR merge and review-only work.
  4. Confirm `pr-delivery` treats merge as a live-gate execution action.
  5. Run `copilot plugin list` in a fresh session and confirm Superpowers is
     absent.

- [ ] Run the final repository validation once:

  ```powershell
  npm test
  npm run build:check
  git diff --check origin/main...HEAD
  ```

  If the installed Node version is below the repository engine floor, run npm
  through Node 24.15.0:

  ```powershell
  $npmCli = 'C:\Program Files\nodejs\node_modules\npm\bin\npm-cli.js'
  npx -y node@24.15.0 $npmCli test
  npx -y node@24.15.0 $npmCli run build:check
  ```

- [ ] Record actual evidence and unverified areas. Do not start an independent
  code review unless the operator explicitly requests it or a concrete material
  uncertainty remains.

- [ ] Commit:

  ```text
  chore: prepare Kai 22.0.0
  ```

## Completion

The branch is ready for PR delivery when:

- the active roster is exactly five engineering agents;
- generated inventory reports 13 agents and 44 skills;
- focused tests, `npm test`, and `npm run build:check` pass;
- Superpowers is absent in a fresh CLI session;
- README, AGENTS.md, catalog, changelog, and package metadata agree;
- no automatic review was added or run merely because implementation ended.
