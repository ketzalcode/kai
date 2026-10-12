# Pack Installation

Read this reference only for install, selection, or update requests.

## Catalog and order

The active catalog is closed:

1. `kai-core`
2. `kai-contributor`, when selected
3. `kai-project-management`, when selected
4. `kai-engineering`, when selected
5. `kai-creative`, when selected

Core is required for coordination, Project Management, and departments.
Contributor is standalone. Contributor and Project Management are optional and
agent-free. Never silently add a capability or department. Product, marketing,
revenue, assistant, and learning are incubated and are not install options.
Retired `kai`, `kai-gtm`, and `kai-personal` names are not aliases.

## Inspect

Before showing a plan:

1. Resolve the current plugin directory again before every command.
2. Read `copilot plugin marketplace list` and `copilot plugin list`.
3. Refuse mixed provenance, unreadable state, disabled plugins, or version
   skew.
4. Browse the marketplace and prove all requested packs exist at one version.

Do not infer enabled state from `plugin list`. Never substitute a direct
repository install.

## Plan and confirm

Show only the exact commands needed:

```text
copilot plugin marketplace add ketzalcode/kai
copilot plugin marketplace update kai-plugins
copilot plugin marketplace browse kai-plugins
copilot plugin install kai-core@kai-plugins
copilot plugin update kai-core@kai-plugins
copilot plugin install kai-contributor@kai-plugins
copilot plugin install kai-project-management@kai-plugins
copilot plugin install kai-engineering@kai-plugins
copilot plugin install kai-creative@kai-plugins
```

Use `update` for an installed older pack. Obtain confirmation for the displayed
plan before changing marketplace or plugin state.

## Execute

Run one command at a time and verify its result. Stop on the first failure.
Install/update Core before Project Management or departments. Contributor has
no ordering dependency. If a pack is disabled, tell the operator to enable it
through `/plugin` and start a fresh session; do not invent an enable command.

After any install or update, require a fresh session. Do not uninstall earlier
successful steps to manufacture rollback.

## Report

Return:

```text
Pack install: complete | partial | blocked | unknown
Requested: <packs>
Verified installed: <name@version rows or none>
Failed: <command/check or none>
Not attempted: <packs or none>
Rollback: not attempted or verified
Session: fresh session required | no pack change
Next: <ready or one blocker>
```
