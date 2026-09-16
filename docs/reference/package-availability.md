# Default and pre-release packages

The default marketplace contains **kai-core, kai-engineering and kai-creative**.
The other five capability packages remain **pre-release / in progress** while
development returns to core.

| Package | Availability | Source |
| --- | --- | --- |
| kai-core | Default marketplace; required foundation | `plugins/kai-core/` |
| kai-engineering | Default marketplace | `plugins/kai-engineering/` |
| kai-creative | Default marketplace | `plugins/kai-creative/` |
| kai-assistant | Pre-release / in progress; not in default marketplace | `plugins/kai-assistant/` |
| kai-product | Pre-release / in progress; not in default marketplace | `plugins/kai-product/` |
| kai-marketing | Pre-release / in progress; not in default marketplace | `plugins/kai-marketing/` |
| kai-revenue | Pre-release / in progress; not in default marketplace | `plugins/kai-revenue/` |
| kai-learning | Pre-release / in progress; not in default marketplace | `plugins/kai-learning/` |

The default selection contains **22 agents and 38 skills**. The repository
retains **50 agents and 46 skills**, including pre-release source. Core remains
under development; a default listing is not a stability, passing-validation,
publication, or live-host compatibility claim.

## Identity, version and source preservation

Package IDs and paths do not change. There are no replacement names, runtime
aliases, moved agent bodies or deleted capabilities. The five unfinished
packages receive a `Pre-release (in progress):` prefix in their generated plugin
descriptions and an availability label in the source catalog.

All eight source manifests and locks use prepared `11.0.0` metadata under the
existing lockstep version policy. Pre-release is a source-readiness label, not
a separate `-alpha` version stream or a claim that a prerelease was published.
Only the three default packages appear in `.github/plugin/marketplace.json`.

`PUBLISHED_PACKS` in `scripts/lib/pack-plan.mjs` owns that selection.
`PRERELEASE_PACKS` is its complement in the full source partition.
`COMMITTED_PACKS`, source collectors, generated source artifacts and runtime
validation still cover every retained package. Do not use publication status
to bypass source, reference, model/tool or core-contract failures.

## Installation and existing hosts

Browse the actual marketplace source before installation. Only select core,
engineering and creative from this default index; an unavailable pre-release
package is not a reason to invent another package name or silently fall back
to a different source.

Removing a marketplace entry does not uninstall or disable a previously
installed package. This source change does not edit host settings, caches,
credentials, `.kai` state or private data. It does not guarantee that an
existing installation can continue updating through an index that no longer
lists it. Any future replacement/removal needs explicit user authorization.

The retained pre-release sources remain inspectable for development, but this
change does not introduce a preview marketplace or certify a direct-install
workflow for them.

## Returning a package to the default index

Promote its existing ID rather than creating an alias. Update the publication
selection, remove the generated pre-release description label, restore its
marketplace entry and selected-install guidance, and regenerate the catalog
and package artifacts. Establish the package's actual core-only dependencies
and required acceptance before making readiness claims.

The availability regression test deliberately rejects a default index that
leaks any of the five pre-release packages. Core and fleet wiring failures
remain separate work; this classification does not make them pass.

## Source validation status

The availability test, both engineering guards and all four creative guards
pass. Generated-package parity, catalog parity, host source-inventory checks
and helper syntax checks also pass. Review caught retired-agent first-use
examples; both guides now point to the default software builder and are covered
by the availability regression.

The full `npm test` still stops at 281 source-validator errors across retained
source and references. Later stages in that chain do not run after the failure.
Nothing is excluded from source validation merely because it is pre-release,
and no runtime or publication acceptance is claimed.
