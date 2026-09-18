# Incubator

Nothing under this directory ships.

`incubator/` holds kai source that is deliberately **inactive**: preserved with
its history so re-entry is a move rather than a rewrite, and excluded from
everything that makes a capability real. No plugin manifest, marketplace entry,
generated pack, agent roster, catalog row, or automatic skill route may point
into it. `npm test` enforces that: it rejects any `plugin.json`,
`package.json`, or `package-lock.json` found anywhere in this tree, requires
each incubated package to have exactly one source tree, and fails if a shipped
agent or skill body names an incubated role or method — backticked or not.

Being here is not a queue position and not approval to reintroduce anything.
Re-entry needs an independent review of the component's responsibility,
triggers, inputs, output contract, consumer, stopping point, grounding rules,
and focused evidence, plus operator sign-off.

## Incubated packages

Five capability packages were parked while development returns to core. Their
source, ids, and package notes are unchanged; their generated `plugin.json`,
`package.json`, and `package-lock.json` were removed, because a manifest here
is an installable plugin. Regenerate those on re-entry.

| Package | Agents | Skills | Notes |
| --- | ---: | ---: | --- |
| `kai-assistant` | 2 | 4 | [PACKAGE.md](kai-assistant/PACKAGE.md) |
| `kai-learning` | 5 | 1 | [PACKAGE.md](kai-learning/PACKAGE.md) |
| `kai-marketing` | 4 | 2 | [PACKAGE.md](kai-marketing/PACKAGE.md) |
| `kai-product` | 10 | 1 | [PACKAGE.md](kai-product/PACKAGE.md) |
| `kai-revenue` | 7 | 0 | [PACKAGE.md](kai-revenue/PACKAGE.md) |

These packages were never in the default marketplace index, so incubating them
removes nothing from a host that installed core, engineering, or creative.
Removing an entry from an index does **not** uninstall a previously installed
package; this is a source change only, and it does not edit host settings,
caches, credentials, `.kai` state, or private data.

`.kai/personal/` remains the private data lane and is unrelated to
`kai-assistant` being incubated.

## Incubated components

Individual components of an **active** package live here too, under that
package's directory.

| Package | Contents |
| --- | --- |
| `kai-engineering` | [Ten document-review skills and their workflow](kai-engineering/README.md), tracked in [#211](https://github.com/RubenSaucedo/kai/issues/211) |

## Returning something to the active tree

1. `git mv` the source back under `plugins/`.
2. Restore its pack entry in `scripts/lib/pack-plan.mjs`: remove it from
   `INCUBATED_PACKS`, and give it a runtime-dependency and description entry.
   Add it to `PUBLISHED_PACKS` and to `.github/plugin/marketplace.json` in the
   same step — the active partition and the marketplace index must stay equal,
   and the catalog gate rejects a component whose package is not published.
3. File every agent and skill under a heading in `CATEGORIES` in
   `scripts/generate-catalog.mjs`.
4. Re-establish the package's core-only dependencies: an incubated agent may
   name a role that no longer exists.
5. Regenerate manifests and the catalog
   (`npm run pack-preview -- --write`, `npm run docs:generate`,
   `npm run host-contract:update`), then run `npm test`.
