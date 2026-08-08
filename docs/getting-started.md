[kai](../README.md) / [Docs](README.md) / Getting started

# Getting started

Install kai, initialize a workspace, and finish one real piece of work. The
optional sections at the end only matter for the handful of agents that need
them.

## First five minutes

The shortest path to one real, finished piece of work. Each step is copyable.

**1. Install the plugin** (details in [Install](#install)):

```text
copilot
/plugin install RubenSaucedo/kai
```

Start a **new** session afterwards — plugins load per session.

**2. Initialize the workspace.** From the repo (or durable folder) you want kai
to work in:

```text
Initialize this repository as a kai workspace.
```

`workflow-workspace-init` seeds about ten tracked files: `.kai/manifest.json`,
`.kai/CONVENTIONS.md`, the coordination registries, the initiative index, the
library README — plus the gitignored `kai/personal/` lane, so the personal
agents find their own state on first run. It does **not** pre-create run areas
or library types; those two output-only lanes appear when something first writes
to them, so your tree only ever contains lanes you actually used. See
[Workspace model](workspaces.md) for the full contract.

If you would rather see the whole vocabulary on disk up front, ask for it:

```text
Initialize this repository as a kai workspace, and materialize every run area
and library type now so I can see the full layout.
```

That is a **local convenience, not a different mode**. The extra directories are
empty, and git cannot track an empty directory, so they will not survive a clone
— the durable footprint is identical either way.

**3. Ask for the work, not for a role.** The front door routes it:

```text
I need users to be able to export a saved report as CSV.
```

`director-chief-of-staff` takes it to the PM for a brief, the architect for a
decision, and engineering for implementation — creating a work item, a durable
thread, and initiative artifacts as it goes. For a personal or unclear request,
start with `director-executive-assistant` instead.

**4. Check the state is honest** at any point:

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

kai ships 54 agents and 40 skills, and you do not need to learn them. You need
three things: **ask a front door for outcomes**, **let the work item be the
source of truth**, and **remember that only you ship**. Everything else is
reference material — read it when you hit the thing it describes.

## Install

### Copilot CLI

**Prerequisite:** the Copilot CLI installed and logged in (`copilot` opens
the interactive prompt). See the
[Copilot CLI docs](https://docs.github.com/copilot/how-tos/use-copilot-agents/use-copilot-cli)
if you don't have it yet.

**Install from GitHub (recommended):**

1. Start the CLI:
   ```powershell
   copilot
   ```
2. Add this repo as a plugin and install it:
   ```text
   /plugin install RubenSaucedo/kai
   ```
3. Confirm it loaded:
   ```text
   /plugin
   ```
   `kai` should appear in the list. The agents and skills are available in
   **new** sessions — start a fresh session to use them.

**Install from a local checkout** (development or offline):

```powershell
git clone https://github.com/RubenSaucedo/kai.git
cd kai
copilot
```
Then inside the CLI: `/plugin install .`

> Plugins are cached per session — changes appear only in new sessions. Run
> `/plugin` anytime to list, enable, or update plugins.

### Copilot coding agent (cloud)

Add `RubenSaucedo/kai` to the repository's coding-agent plugin configuration
so its skills and agents load into cloud sessions. The plugin is
framework-agnostic and ships no employer-specific services, so it works
against any repo.

The two hosts are not feature-identical — see
[Host capabilities](host-capabilities.md) for what differs and how workflows
degrade when a capability is absent.

## Updating

After editing any file in the plugin, or to pull a new release, reload from
inside the CLI:

```text
/plugin update kai
```

Plugins are cached per session — changes only appear in **new** sessions.

## Upgrading a workspace after a plugin update

A kai *workspace* (the `.kai/`, `kai/coordination/`, `kai/initiatives/`,
`kai/library/`, and `kai/personal/` state a repo or folder gets when onboarded)
carries its own **`schema_version`** in `.kai/manifest.json`, independent of the
plugin `version`. Most `/plugin update kai` releases don't change it; when one
does, an existing workspace needs a one-time migration.

After updating the plugin, from the workspace root run the **workspace doctor**:

```text
node <kai-plugin>/scripts/workspace-doctor.mjs
```

(`<kai-plugin>` is the plugin's install directory — your clone root, or the
`/plugin` install path.) The doctor is read-only and dependency-free. It:

- verifies `.kai/manifest.json` is present, well-formed, and schema-compatible;
- if `schema_version` is behind, prints the **deterministic migration ladder**
  to apply (defined in `workspace-onboarding`);
- validates generated coordination state — item schemas, lifecycle states,
  `change_ref`-bound reviews, typed dependencies and cycles, lease shape/expiry,
  path containment, and `BOARD.md` drift.

If it reports **migration required** or errors, run `workflow-workspace-init`
(idempotent) to reconcile, then re-run the doctor until it reports the workspace
healthy. Coordinated agents refuse to claim work in a workspace that fails the
doctor, so the upgrade path is explicit rather than silent. Re-running a
completed migration is a no-op.

<!-- kai:allow-legacy-roots -->
> **Upgrading from schema 1?** Workspaces onboarded before v0.27.0 keep
> `coordination/`, `initiatives/`, `library/`, and `personal/` at the workspace
> root. Run the doctor from the workspace root — it detects the old schema,
> prints the migration plan, and blocks coordinated work until the four roots
> move under `kai/`. `.kai/` stays where it is. Never leave both layouts in
> place: that is a split-brain workspace and the doctor refuses it.
<!-- /kai:allow-legacy-roots -->

## Audio setup (optional)

Only for the `generate-audio` skill and the `instructor-*` learning agents,
which narrate markdown into MP3s via
[lectoria](https://github.com/RubenSaucedo/lectoria). Everything else works
without this. To enable audio, do this **once** at the plugin root (the folder
that contains `agents/`, `skills/`, `scripts/`):

1. Build the audio engine — pulls and compiles lectoria via its `prepare` hook:
   ```bash
   npm install
   ```
   This creates `node_modules/.bin/lectoria`; no global install is needed.
2. Add Azure credentials — the wrapper loads them from `.env`:
   ```bash
   cp .env.example .env
   # then edit .env with your Azure Speech + OpenAI values
   ```
   (Or sign in with `az login` instead of setting `AZURE_SPEECH_KEY`.)
3. Install **PowerShell 7+** (`pwsh`) if you don't have it — the wrapper
   `scripts/generate-audio.ps1` runs on `pwsh` (Windows, macOS, and Linux).

Verify with a no-cost dry run (prints the command without spending money):

```bash
pwsh scripts/generate-audio.ps1 -Source ./README.md -DryRun
```

## Browser automation setup (optional)

Several agents and skills drive a real browser **via a Playwright MCP server**:
`principal-qa-ui`, `persona-ux-first-time-user`, `persona-professional-trainer`,
`persona-professional-nutritionist`, `principal-product-designer`,
`principal-product-marketing`, `principal-seo`, `workflow-product-explore`, and
`workflow-course-to-audio` (plus the `web-evaluation`, `web-content-extraction`,
`product-exploration`, `product-marketing-intelligence`, and `ui-mockup` skills).
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
