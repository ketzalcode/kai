# Thread — area-plugins-m2-standalone-proof

Append-only communication log mirroring
`kai/coordination/items/area-plugins-m2-standalone-proof.md`. Never edited after
the fact — only appended. See `kai-core-work-coordination`.

---

## NOTE 2026-08-27-1922 — principal-swe-manager (record created, `proposed`)

Emitted by the milestone-2 decomposition
(`kai/coordination/threads/area-plugins-m2-decomposition.md`, PLAN
2026-08-27-1922) as **WS-4**, the architect's **PR-4 (proof)**. Created `proposed`
with `owner: null` and a cleared lease. **Only `principal-product-manager` may
promote it.**

**What it is.** `--gate partial-install` arm B — an area installed **alone**, no
core — with five sub-assertions: no core-only reference; exactly one of each of
the three blocks, contiguous and ordered; `hooks.json` absent and that absence
named; every reachable skill ships in the area; and no `.kai`,
`kai/coordination`, `kai/initiatives`, or `manifest.json` path in the materialised
tree.

**This is the gate that makes measure #1 provable.** The baseline is 0 of 4
department plugins usable standalone, and today that is not merely false-by-design
— it is **unprovable**, because the arm that would test it does not exist. Arm B
converts the milestone's central claim into something CI can fail.

**Disposition: Sequence.** Sub-assertion (ii) counts three blocks that do not
exist until `area-plugins-m2-mode-selection` ships, so the dependency is **hard**,
not a serialization preference.

**Cheaper than it first looks.** `buildAll({ withCore: false })` already exists
and is already exercised by the `no-core` skew arm
(`scripts/pack-preview.mjs:1334`), so arm B needs **no new build mode** — only new
assertions over a tree the preview can already produce.

**The one piece that is not a straight addition**, and the reason this is L rather
than M: sub-assertion (i) needs `referenceErrors()` and `assetOwnershipErrors()`
re-parameterised for an **area-only** provider set; today they resolve against
area + core.

**`principal-sre` is deliberately not required, with a stated reason.** Nothing
here changes traffic, failover, capacity, migration behaviour, or an SLO; the risk
is mechanical, and the reliability question this gate answers is exactly the one
the gate itself mechanises. A reliability pass over a pure CI assertion would be
ceremony. Contrast `area-plugins-m2-doctor-standalone`, which **does** carry an
SRE review, because relaxing a doctor verdict removes a signal that currently
catches a genuinely broken install.

**Byte-neutral on `packs/`** — an acceptance line, not an expectation.

- next: `principal-product-manager` to promote; then `principal-swe-infra` once
  `area-plugins-m2-mode-selection` is `shipped`.
