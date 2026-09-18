[kai](../README.md) / [Docs](README.md) / Getting started

# Getting started

Install kai, initialize a workspace only when you need durable or coordinated
state, and finish one real piece of work. The optional sections at the end only
matter for the handful of agents that need them.

## First five minutes

The shortest path to one real, finished piece of work. Each step is copyable.

**1. Install the default marketplace surface** (details in [Install](#install)).
Browse first; registering the default repository alone does not prove
availability of the default three-package surface:

```text
copilot plugin marketplace add RubenSaucedo/kai
copilot plugin marketplace browse kai-plugins
copilot plugin install kai-core@kai-plugins
copilot plugin install kai-engineering@kai-plugins
copilot plugin install kai-creative@kai-plugins
```

`kai-product`, `kai-marketing`, `kai-revenue`, `kai-assistant`, and
`kai-learning` do **not** ship: their source is parked in `incubator/` and is
not part of the marketplace surface. See
[Package availability](reference/package-availability.md).

Start a **new** session afterwards — plugins load per session.

**2. Initialize the workspace** only when you need durable or coordinated work.
From the repo (or durable folder) you want kai to work in:

```text
Initialize this repository as a kai workspace.
```

`workflow-workspace-init` asks where operational state should live:

- **external** keeps the project free of Kai state and pairs it through the
  machine-local registry;
- **repo-local** uses project `.kai/` but ignores it completely;
- **shared** allows the manifest, conventions, and `.kai/state/` to be tracked.

It also confirms the project publication root, defaulting to `docs/kai`.
Private coordination, drafts, evidence, and personal state remain under
`.kai/`; only accepted project knowledge publishes. See
[Workspace model](workspaces.md) for the full contract.

**3. Ask directly for the capability.** A direct engineering request can use
supplied evidence without installing anything else:

```text
Ask eng-builder-software to implement these supplied requirements as one
coherent change, including the tests for its changed behavior.
```

For explicitly requested coordination across installed specialties,
`director-chief-of-staff` manages work items and handoffs; specialist authority
stays with each owner. Neither it nor workspace init is required for ordinary
direct engineering or creative work.

**4. Check the state is honest** if you initialized a workspace:

```bash
node <path-to-kai>/scripts/workspace-doctor.mjs
```

It reports whether the workspace is claimable, whether the board has drifted
from the authoritative items, and whether any schema migration is due.

**5. See where this ends up.**
[`examples/e2e-feature-delivery/`](../examples/e2e-feature-delivery/) is a
committed, CI-validated workspace showing the same feature carried from brief to
production: the decision with its rejected options, the full handoff thread
including `deploying` and `production-verification`, revision-bound reviews, a
design sign-off on the net-new UI surface, an item correctly stuck at
`in-review`, and one adjacent idea routed to a proposal instead of being built.

### What you can ignore at first

kai ships **22 agents and 38 skills** across three packages — core,
engineering, and creative. Five earlier packages (product, marketing, revenue,
assistant, and learning) are incubated: parked in `incubator/`, not installable,
and tracked on [Package availability](reference/package-availability.md).
You do not need to learn them. You need three things: **ask for outcomes**, **let the
work item be the source of truth**, and **remember that only you ship**.
Everything else is reference material — read it when you hit the thing it
describes.

## Install

### Copilot CLI

**Prerequisite:** the Copilot CLI installed and logged in (`copilot` opens
the interactive prompt). See the
[Copilot CLI docs](https://docs.github.com/copilot/how-tos/use-copilot-agents/use-copilot-cli)
if you don't have it yet.

**Install from kai's marketplace (recommended):**

kai carries a marketplace index in its own repository
(`.github/plugin/marketplace.json`), so it installs the way the host intends to
support long-term. Nobody has to approve a listing for this to work.

kai ships three packages: `kai-core`, `kai-engineering`, and `kai-creative`.
The active source partition, the generated packs, and the marketplace index are
these same three. Use a marketplace source containing this branch and confirm
every selected name/version before installation or removal. A checkout of this
refactor can instead be loaded locally as described below.

1. Register and browse the marketplace, then install the default surface:
   ```powershell
   copilot plugin marketplace add RubenSaucedo/kai
   copilot plugin marketplace browse kai-plugins
   copilot plugin install kai-core@kai-plugins
   copilot plugin install kai-engineering@kai-plugins
   copilot plugin install kai-creative@kai-plugins
   ```
2. Confirm it loaded:
   ```powershell
   copilot plugin list
   ```
   `kai-core@kai-plugins`, `kai-engineering@kai-plugins`, and
   `kai-creative@kai-plugins` should appear at the same version if the default
   surface is available. The agents and skills are available in **new**
   sessions — start a fresh session to use them.

`kai-product`, `kai-marketing`, `kai-revenue`, `kai-assistant`, and
`kai-learning` do not ship. Their source is parked in `incubator/`: not listed
in the marketplace index, not installable, and not loaded by any host. A host
that installed them from an earlier release keeps those files — incubating a
package removes nothing already installed — but it is not an update path either.
See [Package availability](reference/package-availability.md) for the full list
of what is parked and why.

For design and supported demo work, the baseline is core plus creative, not the
whole roster. [Creative's package note](reference/packages/kai-creative.md)
lists direct requests, supplied inputs, outputs, and external-tool prerequisites.

Core carries the shared scripts and fleet hooks. Its provider-root paths are
independent of any companion package's location. Whatever your storage mode,
preserve `.kai/personal/` and all private records; plugin removal is never data
migration.

### Replacing retired packages

Neither retired name is an alias or an automatic update path:

The go-to-market and personal capabilities those buckets carried are now
**incubated** — parked in `incubator/`, not installable — so there is no
shipping replacement to migrate them to. Only core, engineering, and creative
ship. Do not uninstall a working package expecting an equivalent to reinstall;
keep the existing install if you still rely on those capabilities.

| Retired install | Where its capabilities went |
| --- | --- |
| `kai-gtm` | positioning/campaigns/social/search, commercial/customer, and product-led-growth roles are incubated (`incubator/kai-marketing`, `kai-revenue`, `kai-product`) — none ship |
| `kai-personal` | personal-task/voice, teaching/career, and product-audit roles are incubated (`incubator/kai-assistant`, `kai-learning`, `kai-product`); only video/demo ships, in `kai-creative` |

1. Inspect the host's installed list and provenance. Select core and the
   shipping capabilities (engineering, creative) explicitly; do not silently add
   all packages.
2. Verify each selected package exists at one compatible version in a source
   containing this refactor **before** advising or performing uninstall. If it
   is unavailable or unverified, keep the existing install and stop.
3. Confirm the host-plugin removal/install plan. Remove a retired plugin only
   when its shipping replacement loads cleanly: overlapping agent/skill IDs must
   not load twice. End the old session, install/update core first and the
   selected shipping packages from the verified source, then start a fresh
   session and inspect the result.

This is explicit plugin replacement, not an automatic installer or workspace
migration. Preserve `.kai/personal/`, private history and every existing
workspace storage mode. Do not delete data to retire an install name.

### Upgrading from the `kai` monolith

Do not install packs beside legacy `kai`: both provide the operating contract,
and which copy loads first is host-dependent.

Select the default marketplace packs you actually need from the current
marketplace. This checkout replaces the former go-to-market and personal
install buckets; remote availability must be established before removing an
existing install. Use guidance from a source containing the current catalog;
an old installed guide may still list retired names.

1. Update the marketplace catalog.
2. In a session still loaded from legacy `kai`, ask:

   ```text
   Migrate this kai installation to kai-core, kai-engineering, and
   kai-creative.
   ```

3. Follow the displayed plan exactly. The guide proves the shipping surface
   exists at one marketplace version before it tells you to uninstall legacy
   `kai`, then installs core first and stops for a fresh session before
   continuing. There is nothing else to install: product, marketing, revenue,
   assistant, and learning are incubated and do not ship.

This changes only host plugin state. Workspace migration is a separate,
explicit operation because schema 3 may move private state outside the project.

**Check what this host actually has, before you install anything:**

```powershell
node <kai-plugin>/scripts/workspace-doctor.mjs --migration-check
```

(from a clone: `npm run doctor:migration`.) It reads the host's install
metadata and every install tree, then reports one of three verdicts: `clear`
(nothing conflicts), `blocked` (with the exact commands to run first), or
`unknown` (something could not be read, so nothing is claimed). It is
**read-only** — it never uninstalls, deletes, or edits anything; every repair is
a numbered step for you to run. Use it when `plugin list` and what you remember
installing disagree, or after an install or uninstall was interrupted.

Automation can use `npm run doctor:migration -- --json`. The JSON carries the
verdict, finding codes, and a sanitized plugin inventory with version, enabled
state, reconciled presence, and provenance; it does not expose install-cache
paths in that inventory. Exit codes are `0` for `clear`, `2` for `blocked`, and
`3` for `unknown`. A missing config list, install directory, malformed settings
file, or explicit enabled-state disagreement is `unknown`, never evidence that
an install is usable. An absent settings override falls back to the
CLI-managed `config.json` state.

It also answers the question `plugin list` does not: whether a plugin came from
the marketplace or a direct install, and whether the workspace in front of you
was scaffolded by the same plugin the host is loading. It verifies that legacy
`kai` is gone before pack use — the packs and the monolith provide the same
operating contract, so with both installed the host binds whichever it loaded
first.

**Install directly from GitHub (deprecated by the host):** these examples also
require the selected remote source to contain this refactor. They do not pin
this branch or establish availability; never use them to bypass a failed browse.

```text
copilot plugin install RubenSaucedo/kai:plugins/kai-core
copilot plugin install RubenSaucedo/kai:plugins/kai-engineering
copilot plugin install RubenSaucedo/kai:plugins/kai-creative
```

This still works and is a single command, but the CLI prints:

> Direct plugin installs (repos, URLs, local paths) are deprecated. Only
> `plugin@marketplace` installs will be supported in a future release.

No removal date has been announced. Prefer the marketplace form so the switch
never becomes an incident; the warning is expected, not a sign of a broken
install. Tracked in
[#102](https://github.com/RubenSaucedo/kai/issues/102).

**Load from a local checkout** (developing kai itself):

From the root of a checkout that already contains this refactor (a default
clone is not evidence of that), load core plus the selected capabilities:

```powershell
copilot --plugin-dir plugins\kai-core --plugin-dir plugins\kai-engineering --plugin-dir plugins\kai-creative
```

This **loads** the plugin without installing it, so it is the fastest loop when
changing kai — edits show up in the next session with no reinstall. It is not a
persistent install: `--plugin-dir` has to be passed every time you start the
CLI. Confirm the actual provider-qualified agent names in that session.

> Plugins are cached per session — changes appear only in new sessions. Run
> `/plugin` anytime to list, enable, or update plugins.

### Copilot coding agent (cloud)

Configure the repository's coding agent to load core and the selected package
sources from a revision containing this refactor. The root `plugin.json` is
release metadata, not an agent/skill install surface; adding the repository
root alone is not evidence that the default marketplace surface loaded. This
refactor did not verify the cloud configuration syntax, discovery or
effective tools.

The two hosts are not feature-identical — see
[Host capabilities](host-capabilities.md) for what differs and how workflows
degrade when a capability is absent.

## Updating

A marketplace install has **two** caches: the marketplace's catalog, and the
plugin itself. Refresh the catalog first, or the update has nothing new to find.
With a source containing this refactor, update only installed current packages;
retired gtm/personal installs need the explicit replacement procedure above:

```powershell
copilot plugin marketplace update kai-plugins
copilot plugin marketplace browse kai-plugins
copilot plugin update kai-core@kai-plugins
copilot plugin update kai-engineering@kai-plugins
copilot plugin update kai-creative@kai-plugins
```

The five incubated packages are parked in `incubator/` and are not on any
update path; they are tracked on the package-availability page.

Plugins are cached per session — changes only appear in **new** sessions.

The host auto-updates plugins from its own two built-in marketplaces at session
start. A marketplace you added yourself is documented to opt in via
`autoUpdate: true`, but that setting **does not currently work** — it is an open
bug in the CLI, so run the commands above rather than relying on it.

## Upgrading a workspace after a plugin update

A Kai workspace carries its own **`schema_version`** in `.kai/manifest.json`,
independent of plugin `version`. Most plugin updates do not change it. A
workspace-contract change requires a one-time migration.

After updating the plugin, from the workspace root run the **workspace doctor**:

```text
node <kai-plugin>/scripts/workspace-doctor.mjs
```

(`<kai-plugin>` is the plugin's install directory — your clone root, or the
`/plugin` install path.) The doctor is read-only and dependency-free. It:

- verifies `.kai/manifest.json` is present, well-formed, and schema-compatible;
- if `schema_version` is behind, identifies the migration required by
  `kai-core-workspace-onboarding`;
- validates generated coordination state — item schemas, lifecycle states,
  `change_ref`-bound reviews, typed dependencies and cycles, lease shape/expiry,
  path containment, and `BOARD.md` drift.

If it reports **migration required** or errors, run `workflow-workspace-init`
(idempotent) to reconcile, then re-run the doctor until it reports the workspace
healthy. Coordinated agents refuse to claim work in a workspace that fails the
doctor, so the upgrade path is explicit rather than silent. Re-running a
completed migration is a no-op.

The **schema-3 to schema-4** step is the one exception to that flow. Schema 4
moves coordinated work into a SQLite store, so it is a separate, separately
authorized offline migration that `workflow-workspace-init` never chains
automatically. Until it runs, a schema-3 workspace stays **inspect-only**:
`inspect`, `status` and `legacy` read it, and coordinated writes are refused
with `SCHEMA_MISMATCH`. See [workspaces](workspaces.md).

<!-- kai:allow-legacy-roots -->
> **Upgrading from schema 2?** Choose `external`, `repo-local`, or `shared`,
> then classify the former `kai/coordination/`, `kai/initiatives/`,
> `kai/library/`, and `kai/personal/` content. Coordination and initiative work
> become `.kai/state/`; personal state becomes `.kai/personal/`; only accepted
> current project knowledge publishes. The migration never bulk publishes the
> old library and never keeps both layouts.
<!-- /kai:allow-legacy-roots -->

## Audio setup (optional)

Demo narration belongs to `kai-creative`, whose installed files do not imply
that Lectoria is installed. Resolve that provider root from the loaded
`video-create-narration` skill and follow its pinned-dependency, Azure
configuration, and explicit paid-consent instructions; see
[Creative runtime](reference/packages/kai-creative.md#runtime-ownership-and-prerequisites).
Estimation, placement, and mixing do not need Lectoria. Core ships a separate
audio utility, covered below.

For `kai-core-generate-audio` and requested narration, resolve
`<kai-core-plugin>` by going up two directories from that loaded skill's base.
Core's wrapper resolves `LECTORIA_BIN`, the core pack's
`node_modules/.bin/lectoria`, then PATH.

1. For the pack-pinned runtime, run `npm ci --prefix "<kai-core-plugin>"`.
   This downloads the locked public Lectoria release artifact; it does not
   compile a Git checkout. Copilot does not run npm when installing plugins.
   Node must satisfy `^22.22.2 || ^24.15.0 || >=26.0.0`.
2. Configure Azure according to Lectoria's documentation. The wrapper loads
   `<kai-core-plugin>/.env`, not the calling project's `.env`, and preserves
   process environment variables not overwritten there. Do not commit secrets.
   A plugin update may replace local runtime/config files; verify them again.
3. Provide PowerShell 7+ (`pwsh`). Before paid processing, confirm the source,
   languages, cloud transfer and spend with the operator.

A separately authorized no-cost dry run prints the command, not generated
audio or a price quote:

```powershell
pwsh "<kai-core-plugin>\scripts\generate-audio.ps1" -Source "<absolute-source.md>" -Out "<absolute-output-directory>" -DryRun
```

For Kai artifacts, resolve the workspace first and pass absolute source/output
paths. The wrapper's caller-cwd defaults are not workspace resolution. No
installation, dry run, synthesis or playback was performed for this refactor.

## Browser automation setup (optional)

Several agents and skills drive a real browser **via a Playwright MCP server**:
`creative-lead-design` and `eng-reviewer-quality` (plus the
`kai-core-web-evaluation`, `kai-core-web-content-extraction`,
`kai-core-design-grounding`, and `kai-core-pr-delivery` skills).
They declare `tools: [..., playwright]`, but **kai ships no MCP servers** — you
register one in your host. Everything else works without this; only these
browser-driving agents need it.

**Copilot CLI.** Add a `playwright` server to `~/.copilot/mcp-config.json` (the
server key **must** be `playwright` to match the agents' `tools`):

```json
{
  "mcpServers": {
    "playwright": {
      "type": "local",
      "command": "npx",
      "args": ["-y", "@playwright/mcp@latest", "--browser", "chromium"],
      "tools": ["*"]
    }
  }
}
```

Restart the CLI so the server loads, then confirm with `/mcp` (you should see
`playwright` listed). `@playwright/mcp` is fetched on demand by `npx` — no global
install needed.

**Copilot coding agent (cloud).** No setup needed — the
[Playwright MCP server is enabled by default](https://docs.github.com/en/copilot/how-tos/copilot-on-github/customize-copilot/configure-mcp-servers)
for the cloud coding agent (and Copilot code review), so browser-driving agents
work there out of the box.

---

**Next:** [How kai works](how-kai-works.md) ·
**Related:** [Workspace model](workspaces.md) · [Host capabilities](host-capabilities.md)
