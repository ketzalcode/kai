[kai](../README.md) / [Docs](README.md) / Development process

# Development process

Kai uses a fast-ship development profile for a small repository of declarative
agents, skills, and native-JavaScript tools. `AGENTS.md` is the binding
repository instruction. This page explains the operating model.

## Fast-ship profile

- Use TDD for changed runtime behavior and real defect regressions.
- Run the focused test while developing, then the fast repository suite before
  handoff.
- Use a full planning workflow for architecture, risky cross-cutting changes,
  uncertain defects, or an explicit operator request.
- Do not require a workflow framework for prose, metadata, generated refreshes,
  or obvious bounded edits.
- Treat local evidence and the PR description as the review record. Kai has no
  pull-request or push CI.

## Validation agreement

When a structured workflow is used, the operator chooses the validation level
before implementation:

| Level | Evidence |
| --- | --- |
| Strong | TDD for changed logic, focused unit and relevant integration tests, build checks, and the clean-consumer test |
| Lean | TDD where logic changes, targeted checks, `npm test`, and relevant build checks |
| Manual | Named scenarios and observed outcomes |
| None | No validation; the result is explicitly reported as unverified |
| Custom | The exact operator-defined boundary |

Lean is the fast-ship default. The final handoff and PR state the chosen level,
the commands or scenarios actually run, and every material unverified area.

## Local workflow

```text
AGENTS.md profile
      |
      v
targeted local TDD --> npm test
                           |
                           v
                 Linux nightly @ 05:00 UTC
                           |
                           v exact SHA
                 Monday release @ 08:00 UTC
```

The normal commands are:

| Command | Purpose |
| --- | --- |
| `npm test` | Fast behavioral and structural suite; target at most 60 seconds |
| `npm run build` | Validate sources, generate metadata and references, and bundle committed consumer scripts |
| `npm run build:check` | Run the same build calculation without writes and fail on drift |
| `npm run consumer-install:self-test` | Copy the generated packs without `node_modules` and execute every shipped entry point |
| `npm run release-readiness -- --base <ref> --head <ref>` | Check version, changelog, changed files, and generated version agreement |

Run `npm ci` in a clean contributor checkout before a build because esbuild is
development tooling. Installed plugin packages contain no npm manifest or
runtime dependency.

## Nightly validation

`.github/workflows/nightly.yml` runs every day at 05:00 UTC and by manual
dispatch. It uses one Linux runner and Node 24:

```text
npm ci
npm test
npm run build:check
npm run consumer-install:self-test
npm run release-readiness
```

There is no operating-system or Node-version matrix. The target wall time is
five minutes. A failure blocks the next automatic release but does not rewrite
the status of already merged work.

## Version, build, and release

`package.json` is the only edited version source. Prepare a version with:

```powershell
npm version <x.y.z> --no-git-tag-version
npm run build
```

The build writes the version into the root and package manifests, package
locks, generated metadata, and every marketplace entry. `CHANGELOG.md` remains
manually authored and must contain the matching section and comparison link.

```text
package.json version -----> build -----> manifests + marketplace
workspace contract -------> runtime ---> generated consumer scripts
coordination registry ----> store/engine/evidence/views
publication JSON ---------> skills + path validation
```

`.github/workflows/release.yml` runs Mondays at 08:00 UTC and by manual
dispatch. It tags and creates a GitHub release only when:

1. `main` differs from the latest release tag;
2. the latest nightly succeeded for the exact current `main` SHA;
3. `package.json` has an unreleased version;
4. the matching changelog section and comparison link exist; and
5. generated output was clean in that nightly.

If `main` changes after the nightly, the release skips. Contributors do not
manually tag or publish as part of a feature PR.

Release-readiness requires a real, resolvable base. A shallow or incomplete
checkout must fetch tags or use a deterministic merge base; it must not weaken
the check merely because an expected local tag is absent. Changelog links still
compare against the documented previous released version.

## Platform regressions

Linux/Node 24 is the automated confidence boundary. Windows behavior is not
implied by a green nightly. File an issue for a platform-specific regression,
fix it with a focused reproduction, and keep one regression test when it
protects a distinct current failure class.

---

**Related:** [Architecture](architecture.md) ·
[Workspaces](workspaces.md) ·
[Plugin structure](reference/plugin-structure.md)
