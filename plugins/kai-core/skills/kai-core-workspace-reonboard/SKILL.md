---
name: kai-core-workspace-reonboard
description: "Use when reshaping an unsupported Kai workspace into the current schema-6 structure while preserving durable knowledge and artifacts."
tools: [execute, read, edit, search, ask_user]
---

# Workspace re-onboarding

Use this skill for an explicit reshape migration to the current workspace
contract. Preserve useful durable content, rebuild current runtime state, and
finish with only current paths. Do not add runtime compatibility for an old
schema.

Before resolving workspace paths, apply `kai-core-workspace-paths` and use its
current resolution and refusal contract. If that Core skill is unavailable,
ordinary single-shot domain assistance may continue, but do not coordinate
work, alter `.kai` state, or re-onboard. Tell the operator to install or update
`kai-core` before resuming.

## Migration boundary

- Preserve every existing `docs/kai/` file byte-for-byte unless the operator
  separately approves a named public-path reshape.
- Migrate durable knowledge and artifacts into current package-owned private or
  public routes. Use each installed package's publication contract to validate
  its type, subtype, ID, lifecycle, format, privacy, and destination.
- Preserve stable workspace/project IDs, placement, project bindings, and
  publication roots.
- Rebuild current Core runtime state. Initialize Project Management only when
  explicitly requested.
- Do not import historical leases, activity, approvals, messages, and completed
  coordination events. They are transient execution history with no safe
  current semantic equivalent.
- Account for every source path exactly once as an exact move, an explicitly
  approved transform, or an explicitly approved runtime-history discard.
- Block on an ambiguous owner, type, lifecycle, privacy, or destination. Never
  hide uncertainty in a generic archive or compatibility folder.
- A successful migration leaves no temporary staging directory, old manifest,
  old runtime, alias, or obsolete backup directory.

## Inspect

1. Read the unsupported manifest and registry entry only to resolve the exact
   workspace root, placement, stable IDs, project bindings, and publication
   roots. Discover the current `.kai/` plus any existing `.kai-retired-*`
   directories left by the prior reset contract, and include every one as a
   migration input. Never create another retired directory. Inventory source
   paths without executing files or loading an old runtime through current
   commands.
2. Branch on the resolved manifest `placement`:
   - For `repo-local`, the migration source and final private root are
     `<workspace-root>/.kai/`. The temporary staging path is the sibling
     `<workspace-root>/.kai-migration-<UTC-basic-timestamp>/`.
   - For `external`, the source, staging path, and final private root stay under
     the external workspace root. Every target project's `docs/kai/` remains
     in that project, and migration never creates project-local `.kai/` state.
3. Before confirmation, apply the current path-safety contract to source,
   staging, final private destinations, and public destinations. Refuse links,
   junctions, aliases, network paths, nested Git roots, non-canonical paths,
   collisions, escapes, changed project bindings, or overlapping external
   workspace and project roots.
4. For repo-local placement run
   `git ls-files -z -- .kai .kai-retired-* .kai-migration-*` from the exact
   project Git root. Retain the exact tracked paths for the plan. For external
   placement, refuse a source inside any Git work tree and verify each target
   project contains no project-local `.kai/`.
5. Build an inventory table with source path, content class, current owner,
   disposition, exact destination, transform, and verification:
   - keep current `docs/kai/` content in place;
   - treat legacy `.kai/CONVENTIONS.md` as durable candidate content: move
     still-current repository instructions into the project `AGENTS.md`
     outside Kai's managed region, or publish an approved historical decision
     through Core; never discard it as runtime metadata;
   - map legacy initiative artifacts, decisions, briefs, and designs through
     the current owning package's publication contract;
   - map durable private drafts/evidence and accepted knowledge to current
     package publication routes;
   - replace the old manifest with a current manifest preserving stable
     bindings;
   - rebuild Core and requested optional runtime databases instead of copying
     old databases, sidecars, leases, activity, derived boards, or threads; and
   - stop when any remaining path lacks one approved disposition.
6. If package installation state or version alignment is uncertain, update the
   selected active packages, verify them, and start a fresh session before
   continuing.

## Tracked source

Tracked private state requires the guarded force path. `--force` is a request
for that path, not approval. It relaxes only the default refusal for tracked
legacy files and unsupported structure inside the exact migration source. It
does not relax path-safety, privacy, publication, classification, collision, or
verification requirements.

The migration plan must include:

- every tracked source path;
- the exact
  `git rm --cached -r --ignore-unmatch -- .kai .kai-retired-*` index command;
- the expected staged deletion of each tracked legacy path;
- the exact managed `.gitignore` change;
- the source-to-staging rename and final staging deletion; and
- the final Git status commands for human review.

Obtain explicit operator approval for force re-onboarding after showing the
complete migration plan. Approval must unambiguously accept the tracked paths,
index removal, path dispositions, runtime-history discard, temporary staging,
and final staging deletion. The earlier `--force` request is not approval.

## Confirm

Show one complete plan before mutation:

- placement, source, temporary staging path, and final private root;
- every existing retired-directory input that will be reconciled and deleted;
- preserved workspace/project identities and every `docs/kai/` root;
- the path inventory and every exact move, transform, or discard;
- current Core initialization and optional Project Management initialization;
- repository-visible changes and commands; and
- proof that successful completion leaves no compatibility or staging path.

Continue only after explicit operator confirmation of this exact plan.

## Migrate

Use a UTC basic timestamp in `YYYYMMDDTHHMMSSZ` form.

1. Immediately before mutation, repeat the same path-safety, tracking,
   placement, binding, collision, inventory, and destination checks. In force
   mode, require the tracked path set to match the approved preview exactly.
   Stop on any drift.
2. For repo-local placement, ensure Kai's managed ignore block contains
   `/.kai/` and `/.kai-migration-*/`. If a `.kai-retired-*` input exists, keep
   its existing ignore rule until that exact input is reconciled and deleted;
   removing the rule early could expose private bytes. The final managed block
   is:

   ```gitignore
   /.kai/
   /.kai-migration-*/
   **/storageState*.json
   ```

   Verify the private and staging rules with `git check-ignore --no-index`.
   For external placement, change no project ignore block.
3. Rename the exact source `.kai/` atomically to the approved staging path.
4. In force mode, run
   `git rm --cached -r --ignore-unmatch -- .kai .kai-retired-*` from the exact
   project Git root. Verify `git ls-files -- .kai .kai-retired-*` is empty
   before initialization; the verification is authoritative even when a
   pathspec matched nothing.
5. Run `kai-core-workspace-onboarding` with the preserved placement, IDs,
   bindings, and publication roots to initialize the current Core workspace.
6. Initialize Project Management only when the operator explicitly requested
   current planning state:

   ```text
   node "<kai-project-management-plugin>/scripts/project.mjs" init \
     --root "<workspace-root>"
   ```

   Never infer optional package state from the source workspace.
7. Apply the approved durable-content map one path at a time. Refuse destination
   collisions. For exact moves, verify destination bytes against the source
   digest. For transforms, verify the approved output and provenance. Do not
   copy old runtime or derived coordination state into either current database.
8. Reconcile the original inventory. Require every path to have its one
   approved destination or runtime-history discard and require every expected
   destination to exist with verified content.
9. Verify the current workspace:

   ```text
   node "<kai-core-plugin>/scripts/workspace-doctor.mjs" \
     --root "<workspace-root>"
   node "<kai-core-plugin>/scripts/coordinate.mjs" inspect \
     --root "<workspace-root>"
   ```

   If Project Management was initialized, also run its `inspect` command.
10. For repo-local placement, run `git status --short`,
    `git diff --cached --name-status -- .kai .kai-retired-*`, and
    `git diff -- .gitignore docs/kai`. Report every repository-visible change
    for human review. Apart from the approved index removal, never stage
    changes. Never commit, push, or rewrite history.
11. Only after every reconciliation and verification succeeds, delete the exact
    temporary staging directory and every exact `.kai-retired-*` input named in
    the approved plan. Then install the final managed ignore block without the
    retired-path rule. Verify the deleted directories are absent and that only
    the current `.kai/` root remains.

If any step fails, stop and preserve the exact staging and current partial
state for recovery. Report the failed step and unresolved inventory; do not
call the migration complete or delete staging until reconciliation succeeds.

## Result

```text
Workspace re-onboarding: complete | blocked | partial
Current workspace: schema 6 | absent
Durable paths migrated: <count and destinations>
Runtime state: rebuilt | absent
Historical coordination imported: no
Temporary staging: removed | <exact recovery path>
Public docs: preserved | approved changes listed
Git changes: <reviewable paths or none>
Next: <ready or one exact blocking action>
```
