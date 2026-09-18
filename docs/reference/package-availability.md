[kai](../../README.md) / [Docs](../README.md) / Package availability

# Package availability

kai ships **three packages**: `kai-core`, `kai-engineering`, and
`kai-creative`. The active source partition, the generated packs, and the
marketplace index are the same three — there is no fourth tier of
"retained but unshipped" packages.

| Package | Availability | Source |
| --- | --- | --- |
| `kai-core` | Marketplace; required foundation | `plugins/kai-core/` |
| `kai-engineering` | Marketplace | `plugins/kai-engineering/` |
| `kai-creative` | Marketplace | `plugins/kai-creative/` |

Core remains under development. A marketplace listing is not a stability,
passing-validation, publication, or live-host compatibility claim.

## What is incubated

Five capability packages were moved to `incubator/` while development returns
to core: `kai-product`, `kai-marketing`, `kai-revenue`, `kai-assistant`, and
`kai-learning`. Individual components of an active package can be incubated
too — ten document-review skills and their workflow sit under
`incubator/kai-engineering/`.

Incubated means genuinely inactive, not merely unlisted:

- not discovered by the source collectors;
- not validated as a pack, and contributing no references to the active corpus;
- absent from the generated pack trees, the catalog, and the CI runtime matrix;
- carrying no `plugin.json`, `package.json`, or `package-lock.json`, because a
  manifest inside `incubator/` is an installable plugin.

`npm test` enforces every one of those, plus the rule that an incubated package
has exactly one source tree. See [`incubator/README.md`](../../incubator/README.md)
for the inventory and the re-entry steps.

Source and ids are preserved with history, so returning a package is a move
rather than a rewrite. Being incubated is not a queue position.

## Where the partition is defined

`scripts/lib/pack-plan.mjs` owns it:

- `INCUBATED_PACKS` — the packages held out of the partition.
- `ACTIVE_PACKS` / `PACK_ORDER` / `COMMITTED_PACKS` — what is discovered,
  validated, and emitted.
- `PUBLISHED_PACKS` — what the marketplace index must carry. It now equals the
  active partition; a package that is not ready is incubated, not half-shipped.
- `INCUBATED_AGENT_IDS` — incubated ids kept in the reference grammar, so a
  stale mention is still *reported* rather than silently becoming prose.

Publication status never suppresses a source, reference, model/tool, or
core-contract failure. Nothing is excluded from validation for being
unfinished — unfinished work is moved out of the active tree instead.

## Installation and existing hosts

Install only the three packages listed above, core first. An unavailable
capability is never a reason to invent another package name, install from the
incubator, or fall back to a different source.

None of the incubated packages was ever in the marketplace index, so incubating
them withdrew nothing from any host. More generally, removing a marketplace
entry does not uninstall or disable a previously installed package, and it does
not guarantee that such an installation can keep updating through an index that
no longer lists it. This is a source change: it edits no host settings, caches,
credentials, `.kai` state, or private data. Any future replacement or removal
needs explicit user authorization.

The incubated sources stay readable for development. That is not a preview
marketplace and not a certified direct-install path.

## Returning a package to the index

Promote its existing id; do not create an alias. The full procedure is in
[`incubator/README.md`](../../incubator/README.md): move the source back,
restore its pack entry, file its components in the catalog, re-establish its
core-only dependencies (an incubated agent may name a role that no longer
exists), regenerate the manifests and catalog, add its marketplace entry, and
run `npm test`.

Establish the package's actual acceptance evidence before making any readiness
claim. A restored listing is not a readiness certification.

---

**Next:** [Agents & skills](agents-and-skills.md) ·
[Plugin structure](plugin-structure.md) · [Incubator](../../incubator/README.md)
