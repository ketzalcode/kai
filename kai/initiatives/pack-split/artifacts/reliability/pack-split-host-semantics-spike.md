# Pack split host-semantics spike

**Status:** completed, conditional extraction GO  
**Recorded:** 2026-08-26  
**Verified host:** Windows 11, Copilot CLI `1.0.80`  
**Source revision:** `v0.63.1` / merge `f112075f3fe63d7d64f0808b7f5cd12ad1f28e87`

## TLDR

Proceed with committed-unpublished `kai-core` + `kai-personal` trees.
Do not publish them yet.

Windows proves cross-plugin skill resolution, fail-closed missing/skewed core,
provider-qualified agent dispatch, and exactly-one hooks ownership. The spike
also found and fixed a real delegated-agent defect: a child custom agent only
receives declared tools, so every canonical Kai agent now declares `skill`
(`v0.63.1`, PR #165).

macOS, cloud, persistent install order, marketplace-vs-direct collision, and
fresh-session activation remain unverified. They block publication through
`pack-split-host-gates`; they do not block committing an unpublished generated
tree.

## Decision

The extraction and publication boundaries are different.

```text
  BEFORE

  one spike gate
       │
       ├─ throwaway --plugin-dir behavior ── verified on Windows
       ├─ macOS persistent install ───────── unverified
       └─ cloud managed install ──────────── unreachable from local paths
                    │
                    └─ blocked even an unpublished tree

  AFTER

  extraction gate                         publication gate
  ┌──────────────────────────┐            ┌─────────────────────────┐
  │ Windows throwaway proof  │            │ macOS real install      │
  │ delegated skill fix      │            │ cloud managed install   │
  │ generated-tree CI        │            │ install order/restart   │
  └────────────┬─────────────┘            └────────────┬────────────┘
               │ GO: commit unpublished               │ required
               ▼                                      ▼
       packs/kai-core + personal               marketplace publication
```

This is a gate relocation, not a reduced standard. A committed tree is inert
until the marketplace lists it. Publication remains blocked on the full host
matrix.

## Verified findings

| Question | Result | Provenance |
| --- | --- | --- |
| Department agent resolves a core skill | **verified** | Direct `kai-personal-preview:persona-self` launch invoked `kai-core-contract-v1` from `kai-core-preview` and continued. |
| Plugin order changes resolution | **verified: no** | Core-first and personal-first `--plugin-dir` order both passed. |
| Missing core | **verified fail-closed** | Returned exactly `KAI-CORE-MISSING`. |
| Contract-skewed core | **verified fail-closed** | A preview generated with contract `2` returned exactly `KAI-CORE-MISSING`. |
| Agent IDs across plugins | **verified provider-qualified** | `kai-personal-preview:persona-self` resolved; unqualified `persona-self` was rejected. |
| Multiple plugins owning hooks | **verified unsafe** | Two hook owners produced `core-start`, `personal-start`, `core-stop`, `personal-stop`. |
| Core-only hook ownership | **verified correct** | Produced exactly `core-start`, `core-stop`. |
| Delegated cross-plugin preflight before `v0.63.1` | **verified failure** | From an empty workspace the child returned `KAI-CORE-MISSING`; JSON events showed no `skill` tool and a filesystem fallback. |
| Delegated cross-plugin preflight after `v0.63.1` | **verified pass** | Fresh generated packs, empty workspace: child tools were exactly `skill`; child returned `CHILD_OK`, parent returned `PARENT_OK`. |

## Unverified findings

| Question | Status | Required evidence |
| --- | --- | --- |
| macOS cross-plugin behavior | **unverified** | Real install of the committed core + personal trees on current macOS CLI. |
| Persistent install order | **unverified** | Install both orders, start a fresh session, and repeat direct + delegated probes. |
| Marketplace-vs-direct collision | **unverified** | Install the same plugin identity from both sources and capture the host's provider result. |
| Fresh-session activation | **unverified** | Show whether a newly installed plugin is invisible until the next session. |
| Cloud agent composition | **unverified** | Installable GitHub source plus managed plugin settings in a cloud-agent run. Local `--plugin-dir` paths cannot enter the cloud sandbox. |

## Reproduction

Generate a clean five-pack preview outside the repository:

```powershell
$out = Join-Path $env:TEMP 'kai-pack-host-probe'
node scripts/pack-preview.mjs --all --out $out
$env:COPILOT_PLUGIN_DIR_ONLY = 'true'
```

Direct cross-plugin preflight:

```powershell
copilot --no-auto-update --no-custom-instructions --no-remote --silent `
  --allow-all-tools --max-ai-credits 30 `
  --plugin-dir "$out\kai-core-preview" `
  --plugin-dir "$out\kai-personal-preview" `
  --agent "kai-personal-preview:persona-self" `
  -p "Obey your mandatory core preflight, then reply exactly DIRECT_OK."
```

Delegated cross-plugin preflight must run from an empty workspace so root
`skills/` cannot hide a missing host tool:

```powershell
$empty = Join-Path $out 'empty-workspace'
New-Item -ItemType Directory -Force $empty | Out-Null
Set-Location $empty

copilot --no-auto-update --no-custom-instructions --no-remote `
  --allow-all --max-ai-credits 60 --output-format json `
  --plugin-dir "$out\kai-core-preview" `
  --plugin-dir "$out\kai-personal-preview" `
  --agent "kai-core-preview:director-chief-of-staff" `
  -p "Use task once with agent_type kai-personal-preview:persona-self. Ask the child to obey its mandatory core preflight and return CHILD_OK. Return PARENT_OK only for CHILD_OK."
```

The accepted event shape is one child `skill` call, no child `glob` or `view`
fallback, `CHILD_OK`, then `PARENT_OK`.

For the hooks arm, temporarily place the same minimal start/stop hook in two
preview plugins, with each command appending its provider and event to one log.
Run one delegated agent and confirm four lines. Remove the department
`hooks.json`, rerun, and confirm only the two core lines. This instrumentation
stays outside the repository because preview generation intentionally does not
yet route non-Markdown assets.

## Architecture implications

1. **Canonical agents own host-tool truth.** `skill` belongs in root agent
   frontmatter, not a generator rewrite. Generated frontmatter stays a
   byte-identical projection.
2. **Cross-plugin referrals use provider-qualified IDs.** Prose or dispatch
   packets must name `kai-<pack>:<agent>` when crossing a plugin boundary.
3. **Core owns hooks exactly once.** Every matching plugin hook runs; the host
   does not deduplicate equivalent hooks.
4. **A1 is deferred, not forgotten.** Core agents need no second refusal based
   on current evidence. Reopen A1 if a core agent reaches coordinated work with
   inherited skills unloaded after explicit `skill` access is present.
5. **Stop if committed trees are ambiently discovered.** The conditional GO
   assumes `packs/` is inert until marketplace publication. The extraction item
   must verify that committing the tree does not load it as an installed plugin.

## Official host constraints

- GitHub documents plugin hooks as additive: matching hooks from each source
  run rather than being globally deduplicated:
  <https://docs.github.com/en/copilot/reference/hooks-reference>.
- Cloud-agent hooks are repository configuration under `.github/hooks`, while
  the cloud run executes in an ephemeral sandbox:
  <https://docs.github.com/en/copilot/how-tos/copilot-on-github/customize-copilot/customize-cloud-agent/use-hooks>.
- Agent Plugins 1.0 managed settings can apply to Copilot cloud agent, but that
  requires an installable plugin source and administrative configuration:
  <https://github.blog/changelog/2026-08-12-agent-plugins-1-0-in-vs-code-copilot-cli-and-the-copilot-app/>.

## Go / no-go

**GO:** generate and commit unpublished `kai-core` + `kai-personal` after
`v0.63.1`, preserving canonical frontmatter, provider-qualified referrals, and
core-only hooks.

**NO-GO:** marketplace publication until `pack-split-host-gates` records macOS,
cloud managed-install, persistent install-order, marketplace/direct collision,
and fresh-session evidence.
