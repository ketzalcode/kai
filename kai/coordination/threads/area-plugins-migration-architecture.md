# Thread — area-plugins-migration-architecture

Append-only communication log mirroring
`kai/coordination/items/area-plugins-migration-architecture.md`. Never edited
after the fact — only appended. See `kai-core-work-coordination`.

**Environment limit (2026-08-27-1922):** no agent in this session has a shell,
so `kai/initiatives/area-plugins/` cannot be created and the canonical
`artifact_target`
(`kai/initiatives/area-plugins/artifacts/decisions/area-plugins-migration-architecture.md`)
cannot yet be written. That target is recorded and unchanged. Until one operator
`mkdir` runs, **this thread is the durable record of the migration decision** — a
real canonical coordination path, not a substitute workspace. When the
initiative directory exists, the decision artifact is transcribed from the
DECISION packet below without re-litigation.

---

## DECISION 2026-08-27-1922 — principal-swe-architect

**initiative:** area-plugins · **milestone:** decisions-locked (ships in
`surface-rename`, with two consequences landing in `area-taxonomy-split`)

# Architecture Decision — the marketplace rename, `packs/` → `plugins/`, and the `1.0.4` migration

**Source:** `kai/coordination/items/area-plugins-migration-architecture.md`
(state `ready`, version 4, lease `apx-mig-20260827-1915-d1`), under the binding
product scope in `kai/coordination/threads/area-plugins-scope-brief.md`
(`BRIEF 2026-08-27-1839` + `STEWARD AMENDMENT 2026-08-27-1906`, A1–A4), with
`area-plugins-taxonomy-decision` and `area-plugins-optional-core-architecture`
as completed binding inputs.
**Date:** 2026-08-27 19:22 local
**Run:** principal-swe-architect

**Decision (one line):** Both renames are **source-layer and tree-layer**, not
identity-layer — so the marketplace is a **renamed index with no dual-publish
and no coexistence window**, the tree move and the marketplace move ship as
**two releases, folder first**, `kai-personal` is **retired** through the
`legacy-rollback` machinery widened from a scalar to an append-only
`RETIRED_PACK_PLUGINS` list, and one **derived literal-ban check** closes the
`kai-personal`-survives-a-green-build hole for all five sites at once.

---

## Context

Read from `C:\src\kai` on 2026-08-27, by file:

- `.github/plugin/marketplace.json` — `"name": "kai-plugins"`,
  `metadata.installSurface: "packs"`, five plugins each with
  `"source": "./packs/kai-<x>"`, all at `1.0.4`.
- `scripts/lib/migration-doctor.mjs:51-61` — `LEGACY_PLUGIN = 'kai'` (a
  **scalar**), `MARKETPLACE = 'kai-plugins'` (a **scalar used for two different
  jobs**), `KAI_PLUGINS` and `PACK_PLUGINS` **derived** from `PACK_ORDER`,
  `WORKSPACE_PROVENANCE = {kai, kai-core}`.
- `scripts/lib/migration-doctor.mjs:203-218` — `entryProvenance()` reads
  `config.json`'s `marketplace` field when recorded, and otherwise **infers**
  `marketplace:<bucket>` from the first path segment under
  `installed-plugins/`. The marketplace name is therefore baked into a host in
  **three** places: the `marketplace` field, the `settings.json` key
  `<plugin>@<marketplace>` (`:20`), and the cache-path bucket.
- `scripts/lib/migration-doctor.mjs:867-871` — `finish()` maps
  `refusal → blocked`, `unverified → unknown`, else `clear`. `clear` is the only
  success state and `unknown` is explicitly not a softer `clear`.
- `scripts/lib/pack-plan.mjs:49` — `PACKS_DIR = 'packs'`;
  `:794-825` — `marketplaceSurfacePolicy()` derives both the required and
  forbidden name sets from `PACK_ORDER`/`COMMITTED_PACKS`, with a comment at
  `:788-793` stating exactly why a literal there would be a defect.
- `scripts/release-guard.mjs:20` — `BEHAVIOR_PREFIXES` hard-codes `'packs/'`;
  `:52-72` — every behaviour PR must carry a forward version bump **and**
  `CHANGELOG.md` **and** `README.md`.
- `scripts/validate-plugin.mjs:715` — a **second** hard-coded
  `MARKETPLACE_NAME = 'kai-plugins'`, beside the `MARKETPLACE` it already
  imports at `:48`; `:860-899` — the guided installer, `marketplace browse`
  line, and `/plugin` enable lines are all **derived** from
  `PACK_ORDER × packPluginName() × MARKETPLACE`.
- `.github/workflows/validate.yml:108,115,121` — three hard-coded `packs/…`
  paths that do not follow `PACKS_DIR`.

The blocked decision: `1.0.4` is live on five identities under `kai-plugins`
with `installSurface: packs`. Milestone 3 must move the marketplace name and the
tree name against that shipped set, and milestone 4 must retire `kai-personal`,
with non-negotiable #9 — no silent stranding, no coexisting identities — holding
throughout. Nothing in this repo can observe how the Copilot CLI host reacts to
a marketplace index changing its own `name`.

---

## Diagram

### 1. What a rename actually moves — the three layers

This is the whole decision. Non-negotiable #9 binds **one** of these layers, and
neither of this record's renames touches it.

```
  ┌──────────────────────────────────────────────────────────────────────────┐
  │ LAYER 3 · SOURCE — the marketplace a plugin was fetched from             │
  │   repo : .github/plugin/marketplace.json  "name"                        │
  │   host : config.json   .installedPlugins[].marketplace                  │
  │          settings.json .enabledPlugins["<plugin>@<marketplace>"]        │
  │          installed-plugins/<marketplace>/<plugin>/                      │
  │                                                                          │
  │      kai-plugins ───────────────────────► kai      ◄── THIS RECORD (M3) │
  ├──────────────────────────────────────────────────────────────────────────┤
  │ LAYER 2 · IDENTITY — the plugin a user installs; where an agent ships    │
  │   kai-core   kai-engineering   kai-product   kai-gtm   kai-personal     │
  │                                                                          │
  │      UNCHANGED by the marketplace rename ─► the same five names         │
  │      kai-personal ──────────────────────► RETIRED  ◄── M4, not M3       │
  ├──────────────────────────────────────────────────────────────────────────┤
  │ LAYER 1 · TREE — the directory the generator writes, in THIS repo only  │
  │   repo : PACKS_DIR ; marketplace.json "source": "./packs/kai-core"      │
  │   host : (nothing — no host path ever contains this name)               │
  │                                                                          │
  │      packs/ ────────────────────────────► plugins/ ◄── THIS RECORD (M3) │
  └──────────────────────────────────────────────────────────────────────────┘

  #9 "old and new plugin identities never coexist"  binds  LAYER 2.
  This record's two renames are  LAYER 3  and  LAYER 1.
  => no coexistence window is required, and dual-publish would CREATE one.
```

### 2. The doctor seam this decision reshapes

One string does two jobs today. The change is to split the jobs, not to add a
component.

```
  BEFORE  (1.0.4)                          AFTER  (1.0.6, transition open)

  MARKETPLACE = 'kai-plugins'              MARKETPLACE        = 'kai'
        │                                  MARKETPLACE_ALIASES= ['kai-plugins']
        ├── used to INSTRUCT               MARKETPLACE_NAMES  = {kai, kai-plugins}
        │   step(`install kai-core@…`)           │
        └── used to RECOGNISE                    ├── INSTRUCT ─► MARKETPLACE
            provenance 'marketplace:…'           │   (exactly one name, always
                                                 │    the new one)
   one name, two jobs, no seam                   └── RECOGNISE ─► MARKETPLACE_NAMES
   ⇒ flipping it strands every                       (both, for the whole
     un-re-pointed 1.0.4 host                         transition)

  ┌── host states and how they classify ──────────────────────────────────┐
  │ marketplace:kai            → recognised, current        → clear       │
  │ marketplace:kai-plugins    → recognised, STALE SOURCE   → clear+note  │
  │                              + a re-point step                        │
  │ same plugin from BOTH      → provenance-collision       → BLOCKED     │
  │                              (already exists, keyed by plugin NAME,   │
  │                               therefore marketplace-independent)      │
  │ retired identity installed → legacy-installed           → BLOCKED     │
  │ retired + successor        → coexistence                → BLOCKED     │
  │ marketplace:<anything else>→ unknown-provenance         → unknown     │
  └───────────────────────────────────────────────────────────────────────┘
```

### 3. Release shape and the single irreversible point

```
 release 1.0.5 — "make the constants load-bearing, then move the tree"
   PR-1 derive tree name    (release-guard, validate.yml)     byte-neutral ✔
   PR-2 one marketplace name, one retired list (both EMPTY)   byte-neutral ✔
   PR-3 the two derived checks (banning NOTHING yet)          lands green  ✔
   PR-4 PACKS_DIR='plugins' + git mv + index "source" ×5      ATOMIC, pure rename
   PR-5 docs/README tree paths + ARM the tree-prefix ban      completeness proof
        ── all reversible: revert, regenerate, --check byte-parity restores ──

 release 1.0.6 — "the marketplace name"
   PR-6 alias plumbing + stale-source finding (alias list []) byte-neutral ✔
   PR-7 marketplace.json "name":"kai" + MARKETPLACE='kai'
        + ALIASES=['kai-plugins'] + the sweep the ban turns red
        ▲
        └── the ONLY irreversible byte in the initiative is one JSON field,
            and even it is revertible in git. THE IRREVERSIBLE ACT IS THE
            OPERATOR PUBLISHING THAT INDEX — not any merge. PROBE-M gates
            the publish, not the merge.

 release 1.0.7+ — milestone 4 (area-taxonomy-split), not this record:
   RETIRED_PACK_PLUGINS gains 'kai-personal' → three guarantees arm at once
   (doctor refusal · rollback forbidden set · literal ban).
```

---

## Forces

1. **A marketplace name is baked into a host in three places and none of them
   are ours.** `config.json`'s `marketplace` field, `settings.json`'s
   `<plugin>@<marketplace>` key, and the `installed-plugins/<marketplace>/`
   bucket. We can *read* all three; we can *write* none of them. Any mechanism
   that requires us to mutate a host is not available.
2. **`clear` is the doctor's only success state, and `unknown` is not a softer
   `clear`** (`migration-doctor.mjs:864-869`). Any recognition rule that files
   a healthy, un-re-pointed `1.0.4` host under `unverified` makes `clear`
   unreachable for the entire installed base — turning a working install into a
   permanent "unknown" and blocking the guided installer.
3. **`release-guard.mjs:20` hard-codes `'packs/'`.** If the tree moves and that
   literal does not, every file under `plugins/` silently stops being
   behaviour-sensitive and the whole generated surface can ship with no version
   bump and no release notes. This is the sharpest single failure in the rename
   and it fails *green*.
4. **The derived forbidden set covers current names, not retired ones.**
   `marketplaceSurfacePolicy()` derives `forbiddenPluginNames` from
   `PACK_ORDER`. When `personal` leaves `PACKS` at milestone 4, `kai-personal`
   **drops out of the forbidden set** — a rollback index would then be permitted
   to list it. That is precisely the failure the code's own comment at
   `:788-793` says a literal would cause, arriving instead through a deletion.
5. **The string `kai-personal` survives a fully green build.** Five sites, not
   the two enumerated: two skill bodies, one more skill body nobody has named,
   and two sites in a shipped script including a **runtime user-facing error
   message**. No gate reads any of them.
6. **`source:` in the published index points into the repo tree.** The index at
   any published ref must name a directory that exists at that ref, so the
   directory move and the five `source:` edits are coupled — atomically.
7. **Attribution under CI.** The tree move is a several-hundred-file diff; the
   marketplace rename is a one-field diff with host-side consequences. Landed
   together, a broken install cannot be attributed to either. This is the same
   discipline the BRIEF's ordering ruling and amendment A3/S2 already enforce
   one level up.
8. **Reversibility is asymmetric between the two renames.** The tree move is
   fully reversible in-repo and provably so (`--check` byte-parity). The
   marketplace rename is irreversible the moment a real host re-keys.
9. **Host rename semantics are unobservable from here.** No host, no shell, no
   upstream source in this repo. Guessing is the one thing the record must not
   do.

---

## Options considered

### The marketplace rename mechanism

| option | shape | forces satisfied | forces violated |
|---|---|---|---|
| **Do nothing** | keep `kai-plugins` | 1, 8, 9 | fails settled direction #2 and #12 — the three new areas would be born into a dying name and re-point one release later |
| **New index** (publish a second `kai` marketplace, retire `kai-plugins`) | two indexes, both live for a window | — | violates #9 at layer 3 in the worst way: the *same five plugin names* served by two sources ⇒ guaranteed `provenance-collision` for anyone who installs from the new one before removing the old |
| **Dual-publish window** | old index kept in step with the new one | superficially 1 | same collision as above, **plus** a second index to keep in step, **plus** it is the mechanism boundary #4 exists to catch. It buys nothing: it prevents a stranding that does not occur, because no identity changes |
| **Renamed index** ✅ | one field: `"name": "kai-plugins" → "kai"`; one index, always | 1, 2, 8, 9 | none. Residual: the host's reaction is unverified — which is a **probe**, not a design fork |

**Why dual-publish is not the safe option it looks like.** Stranding at layer 3
is *not* loss of function. A `1.0.4` user who never re-points keeps five
working, enabled plugins; what they lose is the ability to see updates. Layer-3
stranding is therefore **degraded and detectable**, whereas a dual-publish
window manufactures a layer-2-shaped failure (`kai-core` installed from two
sources) that the doctor already refuses as `provenance-collision`. Dual-publish
trades a detectable, recoverable degradation for an actual refusal state.

### Sequencing the two renames

| option | forces satisfied | forces violated |
|---|---|---|
| One release, both renames | fewer publish events | 6, 7, 8 — couples a reversible whole-tree diff to an irreversible one-field change, and destroys attribution |
| Marketplace first, folder second | — | 8 — users re-point, then immediately receive a tree-move release; a defect in the second is diagnosed on a host that just changed |
| **Folder first, marketplace second** ✅ | 6, 7, 8 | none. Cheap-to-reverse change proves the generate/validate/release chain under the new dir name while the marketplace name is still the one users hold |

### `kai-personal`'s fate

| option | shape | verdict |
|---|---|---|
| **Redirected** | host-level alias `kai-personal → kai-assistant` | **Not available.** Requires an upstream host capability, and `out_of_scope` bars changing the host to add plugin-level declarations. There is no evidence in this repo that such a mechanism exists |
| **Superseded** | keep publishing `kai-personal` as a shim that points at successors | **Rejected.** Mints a *live* identity that installs beside its own successors — a layer-2 coexistence by construction, violating #9 and milestone 5's "no old identity remains installable". Also requires a pack with zero agents through `planManifests()` |
| **Retired** ✅ | delisted from the index at the taxonomy release; existing installs keep working, frozen; the doctor detects the installed retired identity and refuses `clear` with uninstall-first steps | **Chosen.** Reuses the `LEGACY_PLUGIN` machinery that already implements uninstall-first and coexistence-refused for the monolith. Widening a scalar to a set is the smallest change that covers it |

---

## Decision

### D0 — Host syntax and naming · **Endorse** (settled; restated so it is checkable)

`<plugin>@<marketplace>` is fixed. Exactly one marketplace, named `kai`,
yielding `kai-engineering@kai`. No marketplace is named after an area. **No
plugin named `kai` is created** — and note that `LEGACY_PLUGIN = 'kai'` is a
*retired plugin identity*, not a new one; the rename does not resurrect it. See
D4's namespace-hazard note, which is the one place this coincidence could bite.

---

### D1 — Marketplace rename mechanism · **Reshape**, with an operator-run **Spike** gating publication

**Mechanism: a renamed index. One field, one source of truth, no second index,
no dual-publish window.**

`.github/plugin/marketplace.json:2` changes `"name": "kai-plugins"` to
`"name": "kai"`. Nothing else about the index's identity changes: the same five
plugin names, the same owner, the same repository.

**How a `1.0.4` user reaches `kai`.** The user's *plugins* need no action — the
five identities are unchanged and keep working. Only the **marketplace
registration** must be re-pointed:

1. `copilot plugin marketplace update kai-plugins` — the host re-reads the index
   from the repository.
2. `copilot plugin marketplace list` — the user (or the doctor) reads back which
   marketplace names the host now holds.
3. **If the host re-keyed** the registration to `kai`: done. `copilot plugin
   list` shows the same five plugins; only their recorded source moves.
4. **If the host did not re-key**: `copilot plugin marketplace remove
   kai-plugins` then `copilot plugin marketplace add <repo>`. **Removing a
   marketplace registration does not uninstall plugins** — the installed
   identities are untouched, so this branch neither strands nor duplicates.
5. `node "<kai-plugin>/scripts/workspace-doctor.mjs" --migration-check` — the
   doctor reports the recorded provenance, so the re-point is **verifiable**,
   not asserted.

**Does the host treat a renamed marketplace as the same source or a new one?
This is UNVERIFIABLE from this repository, and I am not assuming it.** There is
no host, no shell, and no upstream source here. What the repo *does* prove is
where the name is bound host-side: the `marketplace` field, the
`<plugin>@<marketplace>` settings key, and the cache-path bucket
(`migration-doctor.mjs:20, 203-218`). Which of those the host rewrites on a
marketplace update is exactly the unknown.

**PROBE-M — named, time-boxed, operator-executed.** Precedent exists and is not
new scope: `kai/coordination/threads/pack-split-host-semantics-spike.md` ran the
same shape (infra designs the probe and the evidence template, the operator runs
the host session, the result lands as a reliability artifact). PROBE-M reuses it.

> **PROBE-M.** On a throwaway `COPILOT_HOME`:
> 1. At the `1.0.4` ref: add the marketplace, install `kai-core` and one
>    department. Capture `config.json`, `settings.json`, and
>    `ls installed-plugins/`.
> 2. Point the same home at a branch whose **only** delta is
>    `marketplace.json`'s `name: kai`. Run `copilot plugin marketplace update
>    kai-plugins`, then `marketplace list` and `marketplace browse`.
> 3. Record five answers: (a) how many marketplaces the host now lists and under
>    which names; (b) whether `copilot plugin update kai-core@kai-plugins` still
>    resolves; (c) whether `kai-core@kai` resolves without a fresh install;
>    (d) whether `config.json`'s `marketplace` field changed; (e) whether the
>    `installed-plugins/kai-plugins/` bucket moved to `installed-plugins/kai/`.
> 4. Repeat step 2 with `marketplace remove` + `marketplace add` and record the
>    same five, plus: whether any plugin was uninstalled by the remove.

**The architecture is the same under every probe outcome, by construction.**
That is the point of choosing recognise-many/instruct-one (D4): whether the host
re-keys in place (A), registers a new source (B), or wedges on a stale cached
index (C), the repo-side artifact is one renamed index and the doctor recognises
both provenance strings either way. **The probe decides the wording of one
branch in the onboarding skill's re-point step — not the shape of anything.**
Because of that, PROBE-M gates the **publish** of the renamed index, not the
merge of PR-7, and it is not an operator *decision* — it is an operator *action*
on a host only they have.

**Consequence if the probe answer is (C) — the host wedges.** That, and only
that, would be an escalation: it would mean re-pointing requires a manual action
we cannot verify, which is boundary #5. I judge it unlikely (the host already
supports `marketplace update`, `remove`, and `add` as first-class operations,
all three named in the onboarding skill at `:86-114`) but I am naming the
trigger rather than assuming it away.

---

### D2 — Non-stranding vs no-coexistence · **Endorse the invariants; the tension is between layers, not between goals**

**These two do not actually pull against each other, and the reason is the
layer separation in Diagram 1.**

- **No-coexistence wins absolutely at LAYER 2, and is untouched here.**
  Non-negotiable #9 says old and new *plugin identities* never coexist. The
  marketplace rename changes **zero plugin identities** — `kai-core` before is
  `kai-core` after. There is nothing to coexist, so no window is needed, so
  **critical boundary #4 is not reached.** It would be reached only by
  dual-publish, which is why dual-publish is rejected rather than merely
  disfavoured.
- **Non-stranding is satisfied at LAYER 3 by detection plus instruction, not by
  a window.** A user who has not re-pointed holds five working, enabled plugins
  from a source that no longer serves updates. That is **degraded, detectable,
  and recoverable** — the doctor reads the stale source out of `config.json` and
  the cache-path bucket and emits the re-point step, and re-running the doctor
  verifies the fix. **Critical boundary #5 is not reached**: the manual action is
  both detectable *and* verifiable, which is the exact test that boundary sets.

**The one residual, and why it is already refused.** If PROBE-M returns (B) and
a user adds the new marketplace *without* removing the old registration, then
installs `kai-core@kai` on a host that already has `kai-core@kai-plugins`, they
get two copies of one plugin from two sources. `migration-doctor.mjs:624-635`
already refuses that as `provenance-collision`, and it does so **keyed by plugin
name, not by marketplace** — so the refusal is marketplace-independent and
survives the rename untouched. The guarantee is pre-existing and mechanical; my
only obligation is not to disable it, which D4 explicitly does not.

**Precedence, stated plainly:** at layer 2, no-coexistence is absolute and
non-stranding yields to it (this is why `kai-personal` is retired with
uninstall-first rather than allowed to linger). At layer 3, non-stranding
governs and is discharged by recognition, because there is no coexistence
question to lose to.

---

### D3 — `kai-personal`'s fate · **Retired** (disposition: **Reshape** — scalar → append-only set)

**`kai-personal` is retired, not superseded and not redirected.** At the
taxonomy release it is removed from `.github/plugin/marketplace.json` and never
published again. Existing installs are not broken by the delisting; they are
**detected and refused**, with uninstall-first steps, exactly as the monolith is
today.

**The mechanism is the existing one, widened from one name to N.** Today
`LEGACY_PLUGIN` is a scalar driving two refusals — `legacy-installed`
(uninstall-first, `:716-723`) and `coexistence` (`:710-715`). Both invariants are
preserved verbatim by replacing the scalar with a derived set:

- `RETIRED_PACK_PLUGINS` — one **append-only** array beside `PACKS` in
  `scripts/lib/pack-plan.mjs`. Empty at milestone 3; gains `'kai-personal'` at
  milestone 4.
- `RETIRED_PLUGINS = new Set([LEGACY_PLUGIN, ...RETIRED_PACK_PLUGINS])` in the
  doctor. `legacy-installed` and `coexistence` iterate the set instead of testing
  one name. `LEGACY_PLUGIN` stays a distinct export because `--rollback` is
  specific to the monolith and must not become a general "restore any retired
  plugin" mode.

**Two different reasons for the same refusal, and both must be said.** The
monolith `kai` coexisting with a pack is a **contract** collision — both provide
the core operating contract. `kai-personal` coexisting with its successors is an
**agent-identity** collision: the last published `kai-personal` still contains
`persona-self`, and `kai-assistant` contains it too, so two installed plugins
emit the same agent id. CI cannot see this — it is a collision *across versions
on a host*, not within one generated tree — which is why it must live in the
doctor.

**The sharpest case, and it is the only merge in the split.** The taxonomy
record established that `creative-video-director` moves into `kai-gtm`, a plugin
a user may already have installed for unrelated reasons. A user holding
`kai-personal` **and** `kai-gtm` who updates `kai-gtm` to the split version
without uninstalling `kai-personal` gets `creative-video-director` from both.
"Uninstall old, install new" is therefore not a complete instruction for that
user — the doctor's `coexistence` refusal is what makes it complete, because it
names the leftover and refuses to report `clear` until it is gone.

**Where this lands.** The mechanism (`RETIRED_PACK_PLUGINS`, empty) ships in
milestone 3, PR-2, provably byte-neutral. The data edit (`+ 'kai-personal'`)
ships in milestone 4 and arms three guarantees at once — see D5 and R2.

---

### D4 — Doctor changes · **Reshape: one name to instruct, many to recognise**

The defect is that `MARKETPLACE` is a single scalar doing two incompatible jobs.
Splitting them is the whole change; no component is added.

**Constants (`scripts/lib/migration-doctor.mjs`).**

```
export const MARKETPLACE         = 'kai';                 // INSTRUCT — always one
export const MARKETPLACE_ALIASES = ['kai-plugins'];       // RECOGNISE — append-only
export const MARKETPLACE_NAMES   = new Set([MARKETPLACE, ...MARKETPLACE_ALIASES]);
export const isKaiMarketplace = (provenance) =>
  provenance.startsWith('marketplace:') &&
  MARKETPLACE_NAMES.has(provenance.slice('marketplace:'.length));
```

**Rule: every `step(...)` uses `MARKETPLACE`. Every recognition predicate uses
`MARKETPLACE_NAMES`.** No site may use the wrong one, and the two names exist
precisely so a reviewer can see which job a call site is doing.

**Recognition rules, and the severity each maps to.**

| host evidence | classification | severity | resulting status | why |
|---|---|---|---|---|
| provenance `marketplace:kai` | recognised, current | — | `clear` | the new source |
| provenance `marketplace:kai-plugins` | recognised, **`stale-source`** | **`note`** + a re-point `step` | **`clear`** | the install is genuine and functional; only updates are unavailable |
| provenance inferred from cache bucket `kai-plugins/` or `kai/` | same as above, `basis: 'inferred'` | existing `unknown-provenance` note about inference | unchanged | inference is already labelled as inference; the alias only widens which buckets read as kai |
| one plugin name from **two** provenances | `provenance-collision` | `refusal` | `blocked` | unchanged code — keyed by plugin name, marketplace-independent |
| a name in `RETIRED_PLUGINS` installed | `legacy-installed` | `refusal` + uninstall steps | `blocked` | uninstall-first preserved |
| retired name + any successor installed | `coexistence` | `refusal` | `blocked` | no-coexistence preserved |
| provenance `marketplace:<anything else>` | `unknown-provenance` | `unverified` | `unknown` | unchanged |

**Why `stale-source` is a `note` and not `unverified`.** `finish()` maps any
`unverified` to `unknown`, and `unknown` is documented as never reporting
success. Filing every un-re-pointed `1.0.4` host under `unverified` would make
`clear` unreachable for the entire installed base on hosts that are, in fact,
healthy — and the guided installer keys off `clear`. The honest severity for
"this works, and here is the one thing to change" is a `note` with a `step`, and
`out.step()` is independent of `out.add()`, so the instruction is still emitted.
**This is the single most load-bearing severity choice in the record**: get it
wrong in the other direction and the migration doctor becomes the stranding
mechanism.

**Provenance inference.** `entryProvenance()` needs no structural change — it
already yields `marketplace:<bucket>`. What changes is every *consumer* that
compares that string, which must route through `isKaiMarketplace()` /
`MARKETPLACE_NAMES` rather than an equality test.

**`WORKSPACE_PROVENANCE` is deliberately NOT touched.** `.kai/manifest.json`
records `plugin: "kai"` or `"kai-core"`. The marketplace rename changes neither
value, so `assessWorkspace()`'s whole ladder — `workspace-provenance-current`,
`-stale`, `-ahead`, `-migrated`, `-unconfirmed` — is correct as written. Naming
this explicitly matters: it is the boundary a well-meaning sweep would most
easily cross.

**Namespace hazard, named because it is now real.** After the rename,
`LEGACY_PLUGIN === 'kai'` and `MARKETPLACE === 'kai'` are the same string in the
same module. They do not collide functionally — `records` is keyed by plugin
name and provenance strings are always `marketplace:`-prefixed — but a future
edit that compares an unprefixed provenance against a plugin name would now
match silently where it previously could not. **Rule: the `marketplace:` prefix
is mandatory at every comparison; never compare a bare name against a bare
provenance.** `isKaiMarketplace()` exists partly to make that unavoidable.

**Test surface — and one rule about it.** `test/fixtures/host-installs.json` (43
`kai-plugins` sites) records **observed host layouts**. Rewriting them to `kai/`
would destroy the only evidence that the doctor handles a real `1.0.4` host.
**Fixtures are append-only here: old-bucket arms stay as evidence, new-bucket
arms are added alongside.** This is the test-side mirror of D7's history rule.
Concretely: `scripts/workspace-doctor.mjs:894-895` (cache-path normalisation
fixtures) gains a `kai/`-bucket arm and derives its strings from
`MARKETPLACE_NAMES`; `:953` (`provenances.includes('marketplace:kai-plugins')`)
must derive rather than hard-code, or it asserts the old world forever;
`scripts/pack-preview.mjs:632,665` likewise.

**When does the old identity stop being recognised? · Defer, with a trigger.**
Not in this initiative, and not on a schedule. `MARKETPLACE_ALIASES` costs one
string in a set; removing it early makes a real user's healthy install read as
foreign provenance. The asymmetry is total, so the entry stays. **Trigger to
reopen:** `migration-complete` has closed, the operator has confirmed `clear`
with no `stale-source` note on their own hosts, and one full release cycle has
passed with the renamed index published. Removal is then its own reversible PR
with its own version bump — and it is a decision for that release, not this one.
The same rule applies to `RETIRED_PACK_PLUGINS`, with one difference: that list
is **append-only and never pruned**, because a name that was once publishable
can always turn up on someone's disk.

---

### D5 — Derived `legacy-rollback` coverage · **Reshape — the derived set has a retirement hole**

**Confirmed, not re-derived, as the steward asked.** `marketplaceSurfacePolicy()`
defaults `publishablePackNames = PACK_ORDER.map(packPluginName)` and
`PACK_ORDER` derives from `PACKS`. The three new identities — `kai-learning`,
`kai-assistant`, `kai-wellness` — therefore enter both the required and
forbidden sets **for free** the moment they enter `PACKS`. No edit is needed for
them and none should be made.

**But the acceptance line says "old and new", and the derived set covers only
*current* names.** After the split, `personal` leaves `PACKS`, so
`kai-personal` leaves `PACK_ORDER`, so it leaves `publishablePackNames`, so it
**leaves `forbiddenPluginNames` for both surfaces**. Consequences:

- a `legacy-rollback` index published after the split would be **permitted** to
  list `kai-personal` beside the restored monolith — the exact failure the
  comment at `pack-plan.mjs:788-793` was written to prevent, arriving through a
  *deletion* rather than a literal;
- a `packs` index would be permitted to keep listing `kai-personal`, because the
  `packs`-surface forbidden set is `[monolithName, ...unpublished]` and a
  retired name is neither.

**The fix, derived and minimal — one list, three consumers:**

```
// pack-plan.mjs, beside PACKS
export const RETIRED_PACK_PLUGINS = [];        // M3: empty.  M4: ['kai-personal']

// marketplaceSurfacePolicy(), both branches
forbiddenPluginNames: legacyRollback
  ? [...publishablePackNames,        ...RETIRED_PACK_PLUGINS]
  : [monolithName, ...unpublished,   ...RETIRED_PACK_PLUGINS]
```

The same constant feeds `RETIRED_PLUGINS` in the doctor (D3) and the literal ban
(R2). **Three guarantees, one append-only list, no second list to keep in step**
— which is the property `pack-plan.mjs` already values everywhere else.

**Sequencing note.** The empty list lands in milestone 3 (PR-2) where the empty
spread is provably byte-neutral, so milestone 4's change is a one-line data edit
against a mechanism that already exists and is already green. This is amendment
A3's discipline applied one level down, and for the same reason: a red gate
inside the eight-plugin diff could not tell you which change broke it.

**The marketplace rename itself changes no plugin name**, so `legacy-rollback`
coverage is unaffected by milestone 3's rename. The hole opens in milestone 4;
the mechanism must be in place before it does.

---

### D6 — `PACKS_DIR` as single source of truth, and `installSurface` · **Reshape**

**`installSurface: "packs"` is an independent enum value, NOT a directory
reference.** The proof is in the same validation: the permitted values are
`['packs', 'legacy-rollback']` (`pack-plan.mjs:815`), and `legacy-rollback` is
obviously not a directory. The field names a **publication mode** — "the
partitioned set is the install surface" versus "the monolith is".

**Ruling: `installSurface` keeps the value `packs`. Do not rename it.**
It is machine-read metadata in a published index, not a path and not user copy;
renaming it would be an irreversible public-metadata change riding in the same
PR as the marketplace rename, for a vocabulary nicety, and would break
`marketplaceSurfacePolicy()` for any consumer pinned to the published value.
**Defer, with a trigger:** rename it if and when a third surface value is ever
needed, inside that release's own decision. A pleasant consequence falls out of
R2's ban design: because the ban is on **path-shaped** and **identity-shaped**
literals, `installSurface: "packs"` — having no trailing slash — is not matched.
The enum survives precisely because it is not a path.

**The literals that do not follow `PACKS_DIR` — complete enumeration.** The
BRIEF named five. There are more; enumerating them is this record's acceptance
line, so here is the full set with its provenance.

| # | site | literal | in BRIEF `targets`? | fix |
|---|---|---|---|---|
| 1 | `scripts/release-guard.mjs:20` `BEHAVIOR_PREFIXES` | `'packs/'` | **yes** | import `PACKS_DIR`, use `` `${PACKS_DIR}/` ``. **Highest-risk item in the rename** — missing it silently un-gates the whole generated tree from version + release-note enforcement |
| 2 | `scripts/release-guard.mjs:136,158` self-test fixtures | `packs/kai-…` | yes | derive from `PACKS_DIR`, which then *proves* the derived prefix classifies |
| 3 | `.github/workflows/validate.yml:108` `npm ci --prefix` | `packs/` | **yes** | consume a new `packsDir` output from the existing `contract` job |
| 4 | `.github/workflows/validate.yml:115` binary probe path | `packs/` | yes | same output |
| 5 | `.github/workflows/validate.yml:121` `Resolve-Path` | `packs/kai-core/…` | yes | same output |
| 6 | `docs/getting-started.md` (29 sites incl. `RubenSaucedo/kai:packs/…` and `--plugin-dir packs/…`) | both | **yes** | swept in PR-5 / PR-7 |
| 7 | `docs/reference/plugin-structure.md` (8 sites) | both | **yes** | swept |
| 8 | `AGENTS.md` (5 sites) | both | **yes** | swept |
| 9 | **`README.md` (21 `kai-plugins`, plus `packs` prose)** | both | **NO — the BRIEF's list is incomplete** | swept. Note `release-guard.evaluate()` **already requires `README.md` in every behaviour PR's diff**, so README is in every one of these PRs regardless. Fixing its install commands is *forced by the existing gate*, not added scope |
| 10 | `scripts/validate-plugin.mjs:715` `MARKETPLACE_NAME` | `'kai-plugins'` | yes | delete; use the `MARKETPLACE` already imported at `:48`. A second source of truth for one string, in a file that imports the first |
| 11 | `scripts/pack-preview.mjs:632,665` self-test literals | `'kai-plugins'` | yes | derive from `MARKETPLACE` |
| 12 | `scripts/workspace-doctor.mjs:894,895,953` | `kai-plugins` paths + provenance | yes | derive from `MARKETPLACE_NAMES`; add a new-bucket arm |
| 13 | `test/fixtures/host-installs.json` (43 sites) | `kai-plugins` | yes (`context_artifacts`) | **append-only — kept as `1.0.4` evidence**, new-bucket arms added |
| 14 | `skills/kai-core-workspace-onboarding/SKILL.md` (17+2) | both | A1 exempt, (ii) **satisfied** | regenerated; deriving check `validate-plugin.mjs:860+` |
| 15 | `skills/demo-narrate/SKILL.md` (8+1) | A1 (ii) **not satisfied** | → **R1** | see R1 |
| 16 | **`skills/kai-core-fleet-observation/SKILL.md:94`** — `kai-plugins/kai` as an example host path | **not enumerated by anyone before this record** | A1 (i) and (iii) hold, (ii) fails | closed by the same check as R1/R2 |
| 17 | **`scripts/demo-narrate.mjs:307` (comment) and `:326`** — `"this kai-personal plugin's node_modules/.bin"` in the **shipped `LECTORIA_MISSING` runtime error text** | **not enumerated by anyone before this record** | not a `skills/**` body, so A1 as written does not reach it | see the NOTE in *Open questions* |
| 18 | `docs/proposals/pack-architecture.md` (3+3) | design record | — | proposed as **exempt history**; see D7 and the NOTE |

**`PACKS_DIR` stays the single source of truth, and PR-1 makes that true before
PR-4 relies on it.** Note the ordering trap: if `BEHAVIOR_PREFIXES` were changed
to `plugins/` while the tree is still `packs/`, a `packs/`-only change would stop
classifying as behaviour — a silent hole. Deriving from `PACKS_DIR` and flipping
`PACKS_DIR` in the *same commit* as the tree move removes the trap entirely, and
`git diff --no-renames` (`release-guard.mjs:74-79`) keeps both sides of the move
in the changed set so the flip commit still classifies.

---

### D7 — Historical records · **Mechanically out of reach, not carefully avoided**

Two mechanisms, neither of which asks a human to remember anything.

**(a) The checker never looks at history.** One exported constant beside
`PACKS_DIR`:

```
export const RENAME_EXEMPT_PREFIXES = [
  'CHANGELOG.md',
  'kai/',                       // library/releases, coordination, initiatives — all of it
  'docs/proposals/',            // design records: what was proposed, not what is true
  'test/',                      // observed host layouts are evidence
  'scripts/lib/pack-plan.mjs',        // owns PACKS_DIR + RETIRED_PACK_PLUGINS
  'scripts/lib/migration-doctor.mjs', // owns MARKETPLACE + MARKETPLACE_ALIASES
];
```

The literal-ban check (R2) scans only paths **outside** this list. Since the
checker is the only thing that turns a stale literal red, and it cannot see
history, **history is structurally outside the sweep's reach**. The two
source-of-truth modules are exempt for the same reason a dictionary may contain
the word it defines: they are where the retired names are *declared*. Nothing
else may name them.

**(b) A PR-level negative assertion.** The rename PRs assert
`git diff --name-only --no-renames base...head` ∩ `RENAME_EXEMPT_PREFIXES` = ∅.
A PR that touches history fails, regardless of intent. This is one line in the
same `contract` job, and it is the mechanical form of critical boundary #8.

**Nobody runs a global find-and-replace.** Each PR fixes exactly the files the
checker names, and the checker names only non-exempt files. That is the entire
procedure.

`kai/initiatives/pack-split/**` is covered by the `kai/` prefix and is never
touched.

---

### D8 — Sequencing · **Separately. Folder first, marketplace second. Two releases.**

**Why separate.**

1. **Different reversibility classes (force 8).** The tree move is fully
   reversible in-repo and *provably* so: revert, regenerate, `--check`
   byte-parity restores the tree exactly. It touches **nothing on any host** —
   no host path contains the repo's tree name. The marketplace rename is
   irreversible the moment a real host re-keys. Rule: never put a cheap-to-
   reverse change in the same release as an expensive-to-reverse one, or you
   lose the ability to revert the cheap one on its own.
2. **Attribution (force 7).** A several-hundred-file rename plus a one-field
   host-visible change, landed together, means a broken install cannot be
   attributed. Same discipline as the BRIEF's ordering ruling and A3/S2.
3. **They touch the same file in one direction only.**
   `.github/plugin/marketplace.json` carries both `"source": "./packs/…"` (×5,
   tree) and `"name"` (×1, marketplace). Independent edits, so they must be
   *ordered*, not merged.

**Why folder first.** The reversible change goes first, so the generate →
validate → release-guard → index chain is proven under the new directory name
while the marketplace name is still the one users hold. The reverse order would
have users re-point and *then* receive a whole-tree release — two disruptions
in a row, with the second one diagnosed on a host that just changed.

**Hard constraint.** `PACKS_DIR`, the `git mv`, and the five `source:` edits are
**atomic — one commit**. The published index at any ref must name a directory
that exists at that ref; split them and HEAD's index dangles.

**The PR sequence.** `release-guard` requires a forward version bump +
`CHANGELOG.md` + `README.md` on every behaviour PR, so each PR below carries its
own patch version; **lockstep** means every manifest moves together, and which
of those versions is *published* is release-packing, which belongs to
`principal-swe-manager`, not to me.

**Release A — the tree name**

| PR | content | why it is safe | revert |
|---|---|---|---|
| **A-1** | `release-guard.mjs` imports `PACKS_DIR` (incl. its self-test fixtures); `pack-preview.mjs` gains a `--packs-dir` emitter mirroring `--ci-matrix`; `validate.yml`'s `contract` job publishes a `packsDir` output and the three literals consume it | `PACKS_DIR`'s **value is unchanged** — byte-neutral by construction. `--check` byte-parity and `release-guard --self-test` are the proof | revert |
| **A-2** | `validate-plugin.mjs` drops `MARKETPLACE_NAME` for the import; `migration-doctor.mjs` gains `MARKETPLACE_ALIASES = []` + `MARKETPLACE_NAMES` + `isKaiMarketplace()` and routes recognition through them; `pack-plan.mjs` gains `RETIRED_PACK_PLUGINS = []` spread into both forbidden sets | every new collection is **empty** ⇒ identical behaviour ⇒ byte-neutral | revert |
| **A-3** | the two derived checks (R1's placeholder rule + R2's literal ban) with `RENAME_EXEMPT_PREFIXES` | the ban set is derived from three sources that are all **empty**, so it bans nothing and lands green; the placeholder rule asserts a property that **already holds** | revert the checks |
| **A-4** | `PACKS_DIR = 'plugins'` + `git mv packs plugins` + regenerate + `marketplace.json` `source:` ×5. **Nothing else.** | a machine-verifiable **pure rename**: `git diff -M --stat` is 100% renames plus ~6 files. Reviewable precisely because it contains no prose | revert; regenerate; `--check` proves restoration |
| **A-5** | `docs/getting-started.md`, `docs/reference/plugin-structure.md`, `AGENTS.md`, `README.md` tree paths; **arm the tree-prefix ban** | arming the ban in the same PR is what makes A-5's completeness **provable** rather than asserted | revert |

**Release B — the marketplace name**

| PR | content | why it is safe | revert |
|---|---|---|---|
| **B-1** | the `stale-source` finding + re-point step implemented; `workspace-doctor` / `pack-preview` self-test literals derived; new-bucket fixture arms **added** (old ones kept) | alias list is still `[]` ⇒ `MARKETPLACE_NAMES == {MARKETPLACE}` ⇒ behaviour identical; the new finding is unreachable | revert |
| **B-2** | **the irreversible one.** `marketplace.json` `"name": "kai"`; `MARKETPLACE = 'kai'`; `MARKETPLACE_ALIASES = ['kai-plugins']`; the regenerated `kai-core-workspace-onboarding` installer (forced by `validate-plugin.mjs:860`, A1-exempt, deriving check named); the `@kai-plugins → @kai` sweep across docs/README/skills that **the ban turns red the instant the alias is added** | the ban **arms itself**: adding a name to `MARKETPLACE_ALIASES` is what makes every stale mention fail. Completeness is mechanical, not reviewed by eye | revert restores the index name; **but see below** |

**Which single PR carries the irreversible action: B-2 — and precisely one byte
of it.** `.github/plugin/marketplace.json:2`. Everything else in B-2 is
repo-side and revertible. And the honest statement is sharper still: **merging
B-2 is reversible; the operator publishing that index is not.** Once a real
host has re-keyed you cannot un-ring it from this repo. That is why **PROBE-M
gates the publish, not the merge** — and why B-2 should merge, sit, and publish
only after PROBE-M's evidence lands.

**Constraint honoured:** the folder move (A-4) and the per-agent contract
rewrite (milestone 2's PR-3) are in different milestones, let alone different
PRs.

---

### D9 — Critical-boundary call · **Not critical. Reversible engineering calls, made.**

Tested against all eight boundaries in the BRIEF:

- **#4 — coexistence window: NOT reached.** The marketplace rename changes zero
  plugin identities, so no window in which old and new identities are both
  installed is required. The one collision shape that could arise (one plugin
  from two sources) is already a `refusal` in shipped code, keyed by plugin name
  and therefore marketplace-independent.
- **#5 — undetectable stranding: NOT reached.** The stale source is detectable
  from `config.json`'s `marketplace` field *and* the cache-path bucket, and the
  fix is verifiable by re-running the doctor and reading the provenance back.
  Detectable **and** verifiable is exactly the test this boundary sets.
- **#8 — historical records / `pack-split`: NOT reached.** D7 puts history
  structurally out of the checker's reach and adds a PR-level assertion.
- **#1, #2, #3, #6, #7 —** not in this record's territory; none engaged.

**The one operator dependency is an action, not a decision.** PROBE-M requires a
host only the operator has. It does not fork the architecture — the design is
identical under every outcome — so it is a **Spike** on the publish step, with
established precedent in `pack-split-host-semantics-spike`. **No pause is
requested.** If PROBE-M returns outcome (C) — the host wedges and re-pointing
cannot be verified — *that* becomes a boundary #5 escalation, and the trigger is
named above.

---

## R1 — `skills/demo-narrate/SKILL.md` and A1 criterion (ii) · **Satisfy (ii). With a derived rule, not a pinned literal.**

**Answer: satisfy criterion (ii) — but do not pin `demo-narrate`'s literals.
Pin the *rule* that generates them.**

Pinning six `<kai-personal-plugin>` strings would satisfy (ii) for one file and
leave the class of defect intact. The derived rule is smaller and permanent:

> **Provider-root placeholder rule.** In any root `skills/**/SKILL.md`, a
> **provider-qualified** placeholder of the form `<kai-<x>-plugin>` must equal
> `` `<${packPluginName(providerOf(<that skill>))}-plugin>` ``, where
> `providerOf` is the partition's own provider map from `planPacks()`. The
> **unqualified** form `<kai-plugin>` is unconstrained — it deliberately means
> "whichever kai plugin is loaded" and is used correctly today in four core
> skills.

Grounded, not assumed. Exactly two files carry the qualified form:
`skills/kai-core-generate-audio/SKILL.md` (`<kai-core-plugin>`, provider `core`
— **already correct**) and `skills/demo-narrate/SKILL.md`
(`<kai-personal-plugin>`, provider `personal` — **correct today**, and it becomes
`<kai-gtm-plugin>` the instant `demo-narrate`'s provider moves with
`creative-video-director`). The four `<kai-plugin>` users are untouched.

Why this is the right shape:

- **It lands green today**, asserting a property that already holds — the exact
  A3/PR-2 character the steward has already endorsed twice in this initiative.
- **It satisfies (ii) literally**: the expected literal is derived from
  `packPluginName()` over the partition, which is one of the four constants A1
  names.
- **It is stronger than pinning.** A pinned literal breaks when the taxonomy
  moves and must be re-pinned by hand; a derived rule *follows* the taxonomy
  forever, and catches the same drift in any skill written later.
- With it in place, `demo-narrate` satisfies (i), (ii) and (iii) and is
  **exempt** under A1. `:65-68` and `:76/86/136/147` are provider-root
  placeholders; `:121-122`'s `npm ci --prefix "<kai-personal-plugin>"` is the
  same placeholder. No instruction, judgment, persona, capability, procedure, or
  example semantics changes — only which plugin root the reader resolves.

**One span in that file is NOT a placeholder** and must be named separately:
`:121`'s prose *"Copilot installs kai-personal's files but does not run npm"*
carries a bare identity string. It is covered by R2's ban, not by the placeholder
rule, and the edit is the same word.

**Scope classification.** This is `Apply`, not an expansion: the steward
explicitly routed the choice here ("either satisfy (ii) with a deriving check or
explicitly accept the unpinned literals"), the rule lives inside the existing
`validate-plugin.mjs` invocation in the existing `contract` job, and it adds no
gate arm (`GATES` stays `partition|collision|partial-install|version-skew`), no
workflow step, no surface, and no capability.

**I did not choose "accept the unpinned literals with a stated detection path."**
Detection-only would leave a false provider root in a shipped skill body that
tells a reader to run a script from a plugin they do not have — an instruction
that fails at the user's machine, not in CI. Given that the deriving rule is
~15 lines and green on arrival, accepting the residual would be choosing the
weaker option for no saving.

---

## R2 — The `kai-personal` string surviving a green build · **One derived literal ban, in the contract job**

**What closes it:** a **literal-ban check** whose banned set is *derived from the
same append-only lists that drive the doctor and the rollback policy*, scanning
the shipping surface minus `RENAME_EXEMPT_PREFIXES`.

**Where it lives:** inside `scripts/validate-plugin.mjs`, which already runs in
the required `contract` job of `.github/workflows/validate.yml`. **Not** a new
gate arm, **not** a new workflow step, **not** a new job.

```
banned identity strings = RETIRED_PACK_PLUGINS ∪ MARKETPLACE_ALIASES
banned path prefixes    = LEGACY_TREE_DIRS            // ['packs'] once PACKS_DIR flips
scanned surface         = agents/** skills/** scripts/** docs/** .github/**
                          README.md AGENTS.md   minus RENAME_EXEMPT_PREFIXES
match shapes            = identity: word-bounded exact name
                          path:     (^|[\s"'(`])<dir>/
```

**Why it closes the hole at the exact place the string survives.** No gate reads
prose today — the asset regex matches `scripts/demo-narrate.mjs` regardless of
the plugin prefix in front of it. This check reads prose, and only prose that
ships.

**It arms itself, and that is the design.** A name enters the banned set by
being **retired**, which is the same edit that makes the doctor refuse it and
the rollback policy forbid it. Retiring `kai-personal` in milestone 4 is one
line and it lights up all three guarantees simultaneously. Correspondingly, the
ban cannot fire *early*: while `kai-personal` is a live identity the list is
empty and the string is legal, which is correct.

**It catches five sites, not the two routed to me.** Verified by reading:

| site | what would have shipped |
|---|---|
| `skills/kai-core-workspace-onboarding/SKILL.md:29,94` | already caught by `validate-plugin.mjs:860` — the ban is redundant here, which is fine |
| `skills/demo-narrate/SKILL.md:121` | prose naming a retired plugin |
| **`skills/kai-core-fleet-observation/SKILL.md:94`** | `kai-plugins/kai` as the documented example of a marketplace install path — **named by nobody before this record**; wrong the day the marketplace is renamed |
| **`scripts/demo-narrate.mjs:326`** | `LECTORIA_MISSING`: *"this **kai-personal** plugin's node_modules/.bin"* — a **shipped runtime error message** telling a user to look inside a plugin that no longer exists. The actionable half is derived (`npm ci --prefix "${PLUGIN_ROOT}"`); only the noun is false, which is exactly why no test catches it |
| `README.md`, `docs/getting-started.md`, `docs/reference/plugin-structure.md`, `AGENTS.md` | stale `@kai-plugins` install commands — the first thing a new user copies |

**Scope classification.** `Apply`. Adds no gate, step, surface, or capability;
enforces success measure #5 ("silent stranding paths: 0") and non-negotiable #9,
both already committed. The steward routed the choice to me and explicitly
declined to legislate it, which is the delegation this uses.

---

## What stays the same

Named deliberately, because these are the boundaries a sweep would cross by
accident:

- **`WORKSPACE_PROVENANCE` and the whole `assessWorkspace()` ladder.**
  `.kai/manifest.json` records `kai` or `kai-core`; neither value moves.
- **`LEGACY_PLUGIN` stays its own export.** `--rollback` is monolith-specific and
  must not generalise into "restore any retired plugin."
- **`provenance-collision`, `identity-mismatch`, `incomplete-install`,
  `stale-install`, `partial-pack-set` and the whole severity ladder.** Unchanged
  code; they are marketplace-independent already.
- **`installSurface: "packs"`.** Enum, not path. D6.
- **`metadata.version` / lockstep semver.** No per-plugin versioning appears
  anywhere in this record.
- **`test/fixtures/host-installs.json`'s existing arms.** Evidence of the `1.0.4`
  world; append-only.
- **Every plugin identity, across milestone 3.** The renames mint, retire, and
  re-point exactly zero identities. The only identity event in the initiative is
  `kai-personal`'s retirement, and it belongs to milestone 4.

**Reversibility summary.** Release A: fully reversible in-repo, provable by
`--check` byte-parity. Release B PR-1: fully reversible. Release B PR-2: the
commit is revertible; **the publish is not**. If the renamed index is published
and proves wrong, recovery is not a revert — it is re-publishing under the old
name and instructing every re-pointed user back, which is why PROBE-M gates it.

---

## Open questions / escalations

**None blocking. Nothing is routed to `@operator` as a decision.**

1. **PROBE-M is an operator *action*, not a decision.** Named, time-boxed and
   scripted in D1, with precedent in `pack-split-host-semantics-spike`. It gates
   the **publish** of B-2, not its merge. Only outcome (C) — the host wedges and
   re-pointing cannot be verified — escalates, under boundary #5.
2. **NOTE to the steward (non-blocking) — the BRIEF's literal list is
   incomplete, and `README.md` is the omission that matters.** It carries 21
   `@kai-plugins` install commands and is not in `targets`. I did **not** treat
   this as an expansion, because `release-guard.evaluate()` already **requires**
   `README.md` in the diff of every behaviour PR — it is in these PRs whether we
   plan for it or not, and leaving it stale while editing it is the worse
   outcome. Recommend `targets` gains `README.md` at the next steward pass.
3. **NOTE to the steward (non-blocking) — A1's exception is written for
   `agents/**` and `skills/**`; the identical defect exists in a shipped
   `scripts/**` string.** `scripts/demo-narrate.mjs:326` names `kai-personal` in
   the `LECTORIA_MISSING` runtime message. My reading is that A1's three criteria
   describe a **character of span** (a generator-derived identity string), not a
   directory, and the same deriving check (R2) satisfies (ii) for it — so I have
   planned the one-word fix. If the steward reads A1 as directory-scoped, the
   alternative is shipping a false plugin identity in a user-facing error, which
   I do not recommend. Flagged rather than absorbed silently.
4. **NOTE to the steward (non-blocking) — `docs/proposals/**` proposed as a
   fifth exempt path** in D7. It carries the retired literals and is a record of
   *what was proposed*; rewriting it to match a later decision destroys that
   record. This **narrows** the sweep rather than widening scope, and it is
   consistent with #7's intent, but the exclusion list is the steward's.
5. **Deferred, with triggers** (both restated in D4/D6): removal of
   `MARKETPLACE_ALIASES` entries — after `migration-complete` + one published
   release cycle + operator-confirmed `clear`; renaming `installSurface` — only
   if a third surface value is ever needed. `RETIRED_PACK_PLUGINS` is
   append-only and is never pruned.
6. **To `principal-swe-manager`** (already the owner per A3/S2): sizing and
   release-packing of the seven PRs, including which patch versions are actually
   published. I have specified order and atomicity, not packaging.
7. **To `principal-sre`** (this item's declared reviewer): the two claims most
   worth independent challenge are (a) that `stale-source` as a `note` keeping
   status at `clear` is the correct reliability trade rather than a masked
   failure, and (b) that a `1.0.4` user who never re-points is genuinely
   *degraded and detectable* rather than *stranded*.

---

## Scope-discipline self-check

`kai-core-scope-discipline`, run on the decision itself rather than on the
prose.

- **Within scope — `Apply`.** The `MARKETPLACE`/`MARKETPLACE_ALIASES` split,
  `RETIRED_PACK_PLUGINS` and its three consumers, the `PACKS_DIR` derivations,
  the `stale-source` finding, the two derived checks (R1, R2),
  `RENAME_EXEMPT_PREFIXES`, and the doc/README/skill sweeps. Every one lands in a
  file the BRIEF lists as a `target` (plus `README.md`, per NOTE 2), and every
  one serves an acceptance line or a success measure that is already committed.
- **Adds no step, gate, surface, or capability.** The two new checks run inside
  the existing `validate-plugin.mjs` invocation in the existing required
  `contract` job. `GATES` stays `partition | collision | partial-install |
  version-skew`. No new workflow job, no new CLI flag on the doctor, no new
  user-facing surface. `pack-preview.mjs --packs-dir` is a one-line emitter
  mirroring the existing `--ci-matrix`, added so a YAML file can consume a
  constant it cannot import.
- **Violates no `non_negotiable`.** #1 (`plugins/` is the directory; "areas"
  names nothing), #2 (one marketplace, `kai`; no plugin named `kai`), #3
  (`kai-personal` dissolved, and here *retired*, not renamed), #9 (no silent
  stranding; no coexisting identities; derived rollback set covers old **and**
  new), #10 (small reviewable PRs, lockstep, each release revertible on its own),
  #11 (root is the source of truth; trees stay generated), #12 (no new identity
  published under a name already decided to change — the renames land ahead of
  the split), #13 (`pack-split` and history untouched, mechanically).
- **Deferred rather than absorbed:** `installSurface` renaming, alias removal,
  per-area versioning (never raised), any richer re-point UX.
- **Routed rather than decided:** three NOTEs to the steward (list extensions and
  one A1 reading), release-packing to `principal-swe-manager`, reliability
  acceptance to `principal-sre`.
- **Nothing was written outside `touches`.** No production code, no `scripts/`,
  no `packs/`, no `plugin.json`, no `agents/`, no `skills/`, nothing under
  `kai/initiatives/**`. `kai/initiatives/area-plugins/` was not created.

---

## HANDOFF 2026-08-27-1922 — principal-swe-architect -> principal-sre

- did:       Authored the migration architecture decision (DECISION packet above) against all eight acceptance lines and the nine questions in the dispatch packet. **Core disposition: Reshape.** Established the layer separation that the whole record turns on — the marketplace rename is **source-layer**, the tree rename is **repo-layer**, and non-negotiable #9 binds the **identity layer**, which neither touches — and used it to resolve the non-stranding/no-coexistence tension without either invariant bending. Ruled the mechanism a **renamed index**, rejecting dual-publish on the ground that it would *manufacture* the `provenance-collision` it claims to prevent. Split `MARKETPLACE` from one scalar doing two jobs into **instruct-one / recognise-many** (`MARKETPLACE` + `MARKETPLACE_ALIASES`), and ruled `stale-source` a **`note`** so status stays `clear` — because `finish()` never reports `unverified` as success and filing every healthy un-re-pointed `1.0.4` host under `unknown` would make the doctor the stranding mechanism. Ruled `kai-personal` **retired** via `LEGACY_PLUGIN` widened from a scalar to an append-only `RETIRED_PACK_PLUGINS`, preserving uninstall-first and coexistence-refused verbatim. **Found a hole in the derived `legacy-rollback` set that nobody had named**: it covers *current* publishable names, so `kai-personal` silently drops out of `forbiddenPluginNames` for **both** surfaces when `personal` leaves `PACKS` — fixed by one append-only list feeding three consumers. Ruled `installSurface` an **enum, not a directory** (`legacy-rollback` is not a path), and left it alone. Enumerated **18** literal sites against the BRIEF's five, including three nobody had named. Made history **mechanically** unreachable via `RENAME_EXEMPT_PREFIXES` + a PR-level diff-intersection assertion. Sequenced **two releases, folder first, seven PRs**, and identified `.github/plugin/marketplace.json:2` in PR B-2 as the only irreversible byte — while stating that the irreversible **act** is the operator's publish, not the merge. Three ASCII diagrams (layer boundary, doctor seam before/after, release sequence). Wrote no production code and touched nothing under `scripts/`, `packs/`, `plugin.json`, `agents/`, `skills/`, or `kai/initiatives/**`.
- state:     in-review
- needs:     `principal-sre` independent-reliability review per the item's `review_requirements`. Two claims most worth independent challenge: (a) `stale-source` classified as a `note` keeps `--migration-check` at **`clear`** for an un-re-pointed `1.0.4` host — is that the correct reliability trade, or a masked failure? My argument is that `unverified` would make `clear` unreachable for the entire installed base on hosts that are demonstrably healthy, and that a `note` plus an emitted step is the honest severity. (b) A `1.0.4` user who never re-points is **degraded and detectable**, not stranded — they keep five working, enabled plugins and lose only update visibility, and both the condition and its fix are readable from `config.json` and the cache bucket. If either claim fails review, the affected decision is D4 and the sequencing in D8 is unaffected.
- artifacts: kai/coordination/threads/area-plugins-migration-architecture.md (this record — durable decision while `kai/initiatives/area-plugins/` cannot be created); kai/coordination/items/area-plugins-migration-architecture.md (version 5, `in-review`, lease null, `next_role: principal-sre`)
- evidence:  `.github/plugin/marketplace.json:2,10,15,38,60,82,104` (`name`, `installSurface`, five `source:` paths, all at `1.0.4`); `scripts/lib/migration-doctor.mjs:20` (`settings.json` key shape `<plugin>@<marketplace>`), `:51-61` (`LEGACY_PLUGIN` scalar, `MARKETPLACE` scalar, `KAI_PLUGINS`/`PACK_PLUGINS` derived, `WORKSPACE_PROVENANCE`), `:203-218` (`entryProvenance` — recorded field, else inferred from the cache-path bucket), `:624-635` (`provenance-collision`, keyed by plugin name), `:710-723` (`coexistence` + `legacy-installed` uninstall-first), `:864-871` (`finish()` — refusal→blocked, unverified→unknown, else clear; "`unknown` is not a softer `clear`"); `scripts/lib/pack-plan.mjs:49` (`PACKS_DIR`), `:151` (`packPluginName`), `:788-825` (`marketplaceSurfacePolicy` — derived required/forbidden sets, `installSurface ∈ {packs, legacy-rollback}`, `forbidden = publishablePackNames` on rollback); `scripts/release-guard.mjs:20` (`BEHAVIOR_PREFIXES` hard-codes `'packs/'`), `:52-72` (every behaviour PR needs a forward bump **and** `CHANGELOG.md` **and** `README.md`), `:74-79` (`--no-renames` keeps both sides of a move), `:136,158` (self-test fixtures hard-code `packs/`); `scripts/validate-plugin.mjs:48` (imports `MARKETPLACE`) vs `:715` (**second** hard-coded `MARKETPLACE_NAME`), `:860-899` (installer/browse/enable lines derived from `PACK_ORDER × packPluginName × MARKETPLACE`); `.github/workflows/validate.yml:78-79` (`--ci-matrix` output pattern to mirror), `:108,115,121` (three hard-coded `packs/` paths); `scripts/pack-preview.mjs:1391-1400` (`--ci-matrix` / `--ci-runtime-binaries` emitters), `:632,665` (`kai-plugins` literals); `scripts/workspace-doctor.mjs:894-895` (cache-path fixtures), `:953` (`provenances.includes('marketplace:kai-plugins')`), `:1036-1049` (`--migration-check` entry); `test/fixtures/host-installs.json` (43 `kai-plugins` sites — observed layouts); `skills/demo-narrate/SKILL.md:65-68,76,86,121-122,136,147` (8 `<kai-personal-plugin>` + 1 bare `kai-personal`); `skills/kai-core-generate-audio/SKILL.md:44-48` (the qualified placeholder that is already correct); `skills/kai-core-fleet-observation/SKILL.md:94` (`kai-plugins/kai` — previously unnamed); `scripts/demo-narrate.mjs:307,326` (`kai-personal` in a comment and in the shipped `LECTORIA_MISSING` text — previously unnamed); `skills/kai-core-work-activity/SKILL.md:63-82` + three others (the unqualified `<kai-plugin>` form, deliberately unconstrained); `README.md:13-17,79-83,136-140,221-226` (21 `@kai-plugins`, not in BRIEF `targets`); `kai/coordination/threads/pack-split-host-semantics-spike.md:40-72` (precedent for an operator-run host probe). All read 2026-08-27 from `C:\src\kai` by file.
- questions: none blocking. Three non-blocking NOTEs to `principal-product-manager` (steward): (1) `README.md` should join `targets` — `release-guard` already forces it into every behaviour PR; (2) A1's exception should be read as scoped to a *span character*, not a directory, so the identical defect in `scripts/demo-narrate.mjs:326` is covered — otherwise a false plugin identity ships in a runtime error message; (3) `docs/proposals/**` proposed as a fifth history-exempt path. One operator **action** (PROBE-M) gates the publish of PR B-2, with precedent; it is not a decision and no pause is requested.
- next:      `principal-sre` — `area-plugins-migration-architecture` (`in-review`, version 5, lease clear, `next_role: principal-sre`) for `independent-reliability` review. On approval this is the third and last typed required item in `decisions-locked`, and the steward advances `scope.current` to `optional-core-contract`. Dispatch is `director-chief-of-staff`'s.

---

## REVIEW 2026-08-27-1944 — principal-sre · independent-reliability

**Verdict: `changes-requested`** · **P0: 0 · P1: 4 · P2: 6**

**Mode:** CHANGE-REVIEW (knowledge item — no code)
**Bound to:** `change_ref: null`. This item is `delivery_class: knowledge`; there
is no commit to bind. This review is bound to the **`DECISION 2026-08-27-1922`
thread entry** above, at **item record version 6**. A subsequent DECISION entry
or any edit to the reviewed packet requires a new review (no self-review, no
carry-forward).
**Lease verified before any write:** holder `principal-sre`, token
`apx-mig-sre-20260827-1930-f1`, `version_at_grant` 5, record at version 6,
expires 2026-08-27-2230 — matched the dispatch packet exactly. No collision.
**Environment:** no shell. `kai/initiatives/area-plugins/` not created; no
`.kai/runs/**` subdirectory could be created without `mkdir`, so the full
assessment is inline here rather than in a separate run directory. This thread
is the durable record, per the environment limit recorded at its head.
**Evidence basis:** every claim below is `observed` (read by file from
`C:\src\kai` on 2026-08-27) unless explicitly marked `inferred` or `reported`.

---

### Verdict rationale in one paragraph

The **architecture is sound and I am not asking for a redesign.** The layer
separation holds under challenge, the renamed-index mechanism is right,
dual-publish is correctly rejected, `stale-source`-as-`note` is the correct
severity call, the `legacy-rollback` retirement hole is real and correctly
closed, and R1/R2 are genuinely derived and land where claimed. What fails
review is the **operability wrapper around the one irreversible act**. The
record places its only safety gate (`PROBE-M`) on a step that **does not exist
in this repository's publication model** — the marketplace serves the default
branch, so merging PR B-2 *is* the publish — and it ships no recovery runbook
for that act while treating the existing one as sweep collateral. Three of the
four P1s trace to a single root cause: **`docs/reference/plugin-structure.md` is
absent from the record's evidence register**, and that file defines both the
publication model and the emergency rollback runbook.

---

### What I independently verified and affirm

These were the two claims the architect asked be challenged, plus the record's
load-bearing structural claim. All three **hold**.

**1. "The renames are not identity-layer changes." — UPHELD.**
`kai-core` before is `kai-core` after; the index's `plugins[].name` values are
untouched by a `metadata`-level `name` edit
(`.github/plugin/marketplace.json:2` vs `:14,37,60,83,106`). More importantly
the guarantee that non-negotiable #9 rests on is **structurally
marketplace-independent**: `provenance-collision` is raised from
`hasProvenanceCollision = target.entries.length > 1 || target.trees.length > 1`
over a `records` map keyed by **plugin name**
(`scripts/lib/migration-doctor.mjs:622-631`). It cannot be weakened by renaming
a marketplace, because it never reads one. The record's reasoning is correct and
its conclusion that **dual-publish would manufacture a refusal state** is
correct — I tested the inverse and agree: two sources serving the same five
names is exactly the input that trips that predicate.

**2. "`stale-source` as a `note` keeping status `clear`." — UPHELD, and it is
the right call.** Verified the mechanics the argument depends on:
`finish()` maps `refusal → blocked`, `unverified → unknown`, else `clear`, with
the comment "`unknown` is not a softer `clear` … never reported as success"
(`scripts/lib/migration-doctor.mjs:864-871`);
`skills/kai-core-workspace-onboarding/SKILL.md:53` installs **nothing** on
`blocked` or `unknown`; `:145` requires `clear` for completion. Filing every
healthy un-re-pointed `1.0.4` host under `unverified` would therefore make
`clear` unreachable for the **entire installed base** and turn the migration
doctor itself into the stranding mechanism. A `note` plus an emitted `step` is
the honest severity. I would have made the same call.

**3. "Degraded and detectable, not stranded." — UPHELD at the doctor layer,
with a bound (see P1-4).** It is genuinely **not silent**: the condition is
readable from the recorded `marketplace` field and the cache bucket
(`migration-doctor.mjs:203-218`), and the design emits a `note` **and** a `step`
**and** a machine-readable entry in `report.codes` (`finish()`). Function is
preserved; only update visibility is lost. That is a fair characterisation.

**Also verified and correct:**

- **D5's retirement hole is real.** `forbiddenPluginNames: legacyRollback ?
  publishablePackNames : [monolithName, ...unpublished]` with
  `publishablePackNames = PACK_ORDER.map(packPluginName)`
  (`scripts/lib/pack-plan.mjs:794-825`) — when `personal` leaves `PACKS`,
  `kai-personal` leaves **both** forbidden sets. Arriving via a deletion, as the
  record says. Genuinely previously unnamed. **Good catch.**
- **The one-list/three-consumer fix does feed all three consumers as claimed.**
  `RETIRED_PLUGINS` in the doctor (D3), both `forbiddenPluginNames` branches
  (D5), and R2's banned set — all from one export beside `PACKS`. Confirmed
  against the call sites. The claim is true.
- **R1 is genuinely derived and green on today's tree.** Exactly two files carry
  a provider-qualified placeholder: `skills/kai-core-generate-audio/SKILL.md`
  (provider `core` → `kai-core` ✔) and `skills/demo-narrate/SKILL.md` (provider
  `personal` via `SKILL_OWNER_OVERRIDES` in `pack-plan.mjs` → `kai-personal` ✔).
  Four files use the unqualified `<kai-plugin>` and are correctly left
  unconstrained. The rule follows the taxonomy instead of being re-pinned —
  which is the right shape and stronger than pinning literals.
- **R2's five sites are real, at the exact lines claimed.**
  `skills/kai-core-fleet-observation/SKILL.md:94` (`kai-plugins/kai`) and
  `scripts/demo-narrate.mjs:326` (`"this kai-personal plugin's
  node_modules/.bin,"` inside the shipped `LECTORIA_MISSING` array) both verified
  verbatim. A false plugin identity in a user-facing runtime error is a genuine
  operability defect and no existing gate reads it. **Good catch.**
- **Detection runs where claimed.** `node scripts/validate-plugin.mjs` is the
  first step of job `contract` in `.github/workflows/validate.yml`, on both
  `pull_request` and `push: main`. R1 and R2 do land in that job with no new
  gate arm, step, or job. (Whether `contract` is *required* — see P2-3.)
- **Force 3 is the sharpest risk and is correctly handled.**
  `scripts/release-guard.mjs:20` really is
  `BEHAVIOR_PREFIXES = ['agents/', 'skills/', 'scripts/', 'packs/']`. Deriving
  it from `PACKS_DIR` and flipping the constant **in the same commit** as the
  `git mv` (A-4) removes the ordering trap completely. That is the right fix and
  the right commit boundary.
- **Sequencing (steward's M3-before-M4 order) is lower risk. Confirmed.** Three
  independent reliability reasons: the derived `legacy-rollback` surface stays at
  five names instead of eight during the riskiest change; attribution is
  single-variable (identity set frozen while the source name moves); and
  `kai-learning` / `kai-assistant` / `kai-wellness` are born at `@kai` and never
  re-point, so no *new* population inherits a re-point event. **Milestone-2
  interaction checked and clean:** `BEHAVIOR_PREFIXES` already covers `scripts/`
  and `BEHAVIOR_FILES` already covers `.github/plugin/marketplace.json`
  (`release-guard.mjs:20-26`), so both renames are behaviour-sensitive and carry
  the bump + `CHANGELOG.md` + `README.md` gate without any new enforcement. The
  A-4 / M2-PR-3 separation constraint is honoured — different milestones, not
  merely different PRs. No missed interaction.

---

### P1 findings — must be resolved before this record is locked

#### P1-1 · `PROBE-M` gates a step that does not exist: for this repo, **merging B-2 is publishing**

The record's central operability claim is that the irreversible act is separable
from the merge, and that B-2 can "**merge, sit, and publish**" once PROBE-M's
evidence lands (D8, "Which single PR carries the irreversible action"; restated
in D1, D9, and *Open questions* 1). **This repository does not work that way.**

Three independent statements, none cited by the record:

- `docs/reference/plugin-structure.md:208` — "**The marketplace serves the
  default branch**, so a broken pack flip must be restorable through an ordinary
  reviewed PR rather than an undocumented direct push."
- `docs/reference/plugin-structure.md:124-126` and `AGENTS.md:101-103` —
  "**Copilot loads the plugin from the repo**, so the version is descriptive
  metadata, **not** an update gate."
- `docs/reference/plugin-structure.md:191-193` — release step 4 runs the install
  probe "**On the exact merge commit** … browse `kai-plugins`, **install every
  newly published pack**", i.e. packs are already *published* at the merge
  commit; tagging (`:204`, `AGENTS.md:131-132`) is later bookkeeping.

**Consequence.** The moment B-2 lands on `main`, `.github/plugin/marketplace.json`
serves `"name": "kai"` to every host that runs `marketplace update`. There is no
"sit" state. As written, an operator would merge B-2 believing the irreversible
act is still ahead of them, with PROBE-M unrun.

This also **inverts the boundary-#5 protection the BRIEF mandates.** D9 says
outcome (C) — the host wedges — "becomes a boundary #5 escalation". But if merge
is publish, then merging before PROBE-M means the wedge is discovered *after*
the irreversible act, which is precisely the ordering boundary #5 exists to
prevent.

**Required change.** Re-rule the gate: **PROBE-M is a merge prerequisite for
B-2**, its evidence landing before B-2 merges, not before a separate publish. If
a genuine hold state is wanted, it must be named as *unmerged on a branch* with
an owner. D1, D8 and D9 must be amended together, and D9's "Not critical" call
re-tested against the corrected model. I am **not** disputing the conclusion that
no coexistence window is needed — only where the gate sits.

#### P1-2 · No recovery runbook for the one irreversible act, and the existing runbook is treated as sweep collateral

The dispatch packet asked me to confirm the `pack-split` equivalent exists here.
**It does not.** The record's entire recovery statement for the irreversible act
is one sentence (D8, *Reversibility summary*): "recovery is not a revert — it is
re-publishing under the old name and instructing every re-pointed user back."
That names a strategy. It is not a runbook: **no detection signal, no ordered
steps, no owner, no verification, no time bound.**

Compare the standard this initiative inherits —
`docs/reference/plugin-structure.md:206-243`, *Emergency rollback of the pack
marketplace*: operator authorization, a forward-patch `legacy-rollback` index, a
**derived** forbidden set, an explicit **uninstall order** (`kai-personal`,
`kai-product`, `kai-engineering`, `kai-gtm` **first**, `kai-core` **last**,
`:228-229`), an absence proof, reinstall, fresh session, and a workspace
provenance reversal with its own verification command (`:234-243`).

Worse, the record lists that same file only as a **sweep target** (D6 table row
7, and again in R2's site table) with no acknowledgement that it *is* the
recovery artifact. That produces a concrete defect: `:227` and `:231` instruct
`install kai@kai-plugins`. After B-2 the correct marketplace token in a recovery
command is **provenance-dependent** — `@kai` for a re-pointed host, `@kai-plugins`
for the un-re-pointed population the record deliberately supports via
`MARKETPLACE_ALIASES`. A blanket `@kai-plugins → @kai` sweep breaks recovery for
exactly the population the non-stranding argument is about.

**Required change.** (a) A rename-specific recovery runbook: detection signal,
ordered steps, owner, verification, and the wedged-host branch. (b) A ruling on
how recovery commands express the marketplace token for a two-population world —
this is the recovery-side instance of D4's instruct-one/recognise-many split and
should be decided the same way.

#### P1-3 · R2's literal ban will strip `kai-personal` from the rollback runbook's uninstall order at milestone 4 — detection degrading recovery

`RENAME_EXEMPT_PREFIXES` (D7) exempts `docs/proposals/` but **not**
`docs/reference/`. R2's scanned surface explicitly includes `docs/**`. So when
`RETIRED_PACK_PLUGINS` gains `'kai-personal'` at milestone 4, R2 turns **red** on
`docs/reference/plugin-structure.md:228` — a line whose entire purpose is to tell
a recovering operator to uninstall `kai-personal` **before** `kai-core`.

The ban cannot distinguish "**this name must never be published again**" from
"**this name must still be named in recovery prose, because it is still on
people's disks**". D5 correctly keeps `kai-personal` *forbidden in the index*;
R2 would simultaneously force its *deletion from the recovery instruction*. Those
two requirements are in direct conflict and the record does not see it.

This is the same class of defect the record itself discovered in D5 — a
guarantee weakened through a deletion — appearing in R2's own design.

**Required change.** Rule explicitly on the recovery-prose carve-out: exempt the
runbook section, allowlist retired names inside a marked recovery block, or state
another mechanism. It fires at milestone 4, so it does not block M3 sequencing,
but it must be decided **before** `RETIRED_PACK_PLUGINS` gains its first entry.

#### P1-4 · The guided installer's provenance assertion is an unpinned recognition predicate that D4's rule does not reach

D4's rule — "every `step(...)` uses `MARKETPLACE`; every recognition predicate
uses `MARKETPLACE_NAMES`" — is scoped to call sites inside
`scripts/lib/migration-doctor.mjs`. But the guided installer contains a
**recognition predicate executed by an agent**, in prose:

- `skills/kai-core-workspace-onboarding/SKILL.md:123` — "Its only provenance must
  be `marketplace:kai-plugins`; a direct install, mixed provenance, or unknown
  enabled state is **not verified**."
- `skills/kai-core-workspace-onboarding/SKILL.md:144` — same assertion for
  departments.

Both are **underived literals**. The deriving check pins only four spans —
`install …@${MARKETPLACE}` (`scripts/validate-plugin.mjs:861`), `marketplace
browse ${MARKETPLACE}` (`:878`), and the two `/plugin` enable lines (`:898-899`).
The required-text list (`:884-907`) contains **no** provenance string. The
record's D6 table row 14 therefore claims A1 criterion (ii) is "**satisfied**"
for that whole file; for these two spans it is **not**.

**The failure this produces.** R2 will force these lines to change at B-2 (they
match the banned identity `kai-plugins`), but R2 only forces an edit — it does
not determine the target. Swept to the single value `marketplace:kai`, an
un-re-pointed `1.0.4` host that the **doctor** classifies `clear` (the record's
own design) is classified "**not verified**" by the **installer**, which then
returns `blocked` per `:53` and `:197`. The doctor layer and the agent-procedure
layer disagree about the same healthy host — and the agent layer is the one the
user experiences.

This is the bound on affirmation 3 above: detection at the doctor layer does not
imply correct behaviour at the layer that consumes it. The record's three-layer
model (source / identity / tree) has no **agent-procedure layer**, which is why
this span fell through.

**Required change.** Extend D4's instruct-one/recognise-many rule to prose
recognition predicates, rule that the recognise-many form is what belongs at
`SKILL.md:123,144`, and pin that form in the deriving check so criterion (ii) is
actually satisfied rather than asserted.

---

### P2 findings

**P2-1 · R2's path match shape under-matches literals the record itself
enumerates.** The specified shape is `` path: (^|[\s"'(`])<dir>/ ``. The
character preceding `packs/` is `:` in `docs/getting-started.md:180-184`
(`copilot plugin install RubenSaucedo/kai:packs/kai-core`, ×5 — a shape the
record names in D6 row 6) and `/` in `.github/plugin/marketplace.json:15,38,61,84,107`
(`"./packs/kai-core"`). Neither matches. A-5's justification — "arming the ban in
the same PR is what makes A-5's completeness **provable** rather than asserted" —
is therefore not established by the check as written. Broaden the preceding-char
class (or use a non-word-character boundary) and re-state the proof claim.

**P2-2 · `RETIRED_PACK_PLUGINS` "append-only" has no mechanical enforcement.**
D3, D4 and D5 all rely on the list never losing an entry, but append-only is
stated discipline only — unlike every other mechanism in this record. Deleting
one entry silently un-arms **all three** guarantees at once (doctor refusal,
rollback forbidden set, literal ban). This is the record's own failure-by-deletion
class applied to its own fix. Either add a check that the list is a superset of
its previous value, or state plainly that this is an accepted unenforced
discipline.

**P2-3 · "the existing required `contract` job" is `reported`, not `observed`.**
That `validate-plugin.mjs` runs in job `contract` is observed. That `contract` is
a **required status check** is branch-protection configuration and is **not
observable from this repository**; the only in-repo support is the workflow's own
comment above the `runtime-matrix` step. The entire detection argument — R1, R2,
and D7's PR-level diff-intersection assertion — rests on it. Name it as an
assumption with a one-command operator verification, or stop asserting it as
established fact.

**P2-4 · PROBE-M is executable but its result is not machine-decidable.** The
five recorded answers (a)–(e) are precise and an operator can run them. But there
is **no decision rule** mapping those five answers onto outcomes (A) / (B) / (C),
so an agent reading the evidence cannot reliably tell pass from fail; there is no
time box despite the probe being called "time-boxed"; and outcome (C) names
boundary #5 but **no escalation owner** and no defined state for B-2. Add the
answer→outcome truth table, the box, and the route.

**P2-5 · Enumeration incompleteness: a 19th site.**
`scripts/workspace-doctor.mjs:665` —
`steps: [/copilot plugin install kai-core@kai-plugins/]`, a self-test expectation
— is not in D6 table row 12 (`:894,895,953`) nor in the evidence register.
Mitigated and low risk: it fails **red** in the required `Workspace-doctor
self-test` step, and R2's identity ban would catch it. Noted because the
acceptance line asks for enumeration, and because it is a fair illustration of
why the record's "completeness is mechanical, not reviewed by eye" principle is
the right one.

**P2-6 · Compound state unanalysed — routed to `area-taxonomy-split`, not
blocking here.** A user who never re-points and *then* meets milestone 4's
`kai-personal` retirement receives `legacy-installed` (`refusal` → `blocked`)
with uninstall-first steps, while the successor install instructs `@kai` on a
host registered only to `kai-plugins`. Destruction-before-a-viable-install is
prevented today by a pre-existing guard the record does not cite:
`skills/kai-core-workspace-onboarding/SKILL.md:61-64` — "If availability cannot be
proved, report `unknown` and **leave the monolith installed**." That guard is
load-bearing for the compound path and should be named and pinned by the M4
record rather than relied on implicitly. Related: the record should state that
the `stale-source` re-point `step` is emitted **before** any
`install …@${MARKETPLACE}` step, since `out.step()` ordering is emission order.

---

### Reliability assessment summary

| Area | Finding |
|---|---|
| **Recovery & rollback** | Release A (A-1…A-5) and B-1: real, machine-proved reverts via `pack-preview.mjs --check` byte-parity, which runs in `contract`. **B-2 correctly identified as the sole carrier of the irreversible action** — but its gate is misplaced (P1-1) and it has no recovery runbook (P1-2). |
| **Failure modes of the rename** | "Not an identity change" **holds**. Un-re-pointed `1.0.4` user: keeps working, loses update visibility, classified `clear` + `note` + `step` + `code` — **detectable, not silent**. Correct. Bound at the agent-procedure layer (P1-4). |
| **Fail-closed preservation** | Derived forbidden set, uninstall-first and coexistence refusal all preserved; the deletion path is found and closed; all three consumers genuinely fed. Enforcement of append-only is unmechanised (P2-2); recovery prose conflicts with the ban (P1-3). |
| **Detection** | R1 and R2 are **genuinely derived**, not hand-pinned, and follow the taxonomy without re-pinning. They run in `contract` alongside `validate-plugin.mjs`. Job-required status unverified (P2-3); one match shape under-matches (P2-1). |
| **Operator-action honesty** | Probe steps are concrete and honest about what this repo cannot know — that judgement is right. Gate placement is wrong (P1-1); pass/fail rule, time box and escalation owner are missing (P2-4). |
| **Sequencing** | M3-before-M4 **confirmed lower risk**, for three independent reasons. No missed milestone-2 interaction. |

**Not reached / out of my lane:** release packing and which patch versions
publish (`principal-swe-manager`, already routed); the three steward NOTEs
(`README.md` in `targets`, A1 span-character reading, `docs/proposals/**`
exemption) — I have no reliability objection to any of the three, and note that
the A1 span-character reading is the one that keeps a false plugin identity out
of `LECTORIA_MISSING`, which I support on operability grounds.

**No operator decision is required by this review.** PROBE-M remains an operator
*action*; P1-1 changes **when** it must run, not who runs it or whether it forks
the architecture. It does not.

---

### Handoff

- did:       Ran `independent-reliability` review of the `DECISION 2026-08-27-1922` packet at item version 6, bound to the thread entry rather than a commit (`change_ref: null`, knowledge item). Verified every load-bearing claim against source by file rather than accepting the summary. **Upheld** the layer-separation ruling, the renamed-index mechanism, the dual-publish rejection, `stale-source`-as-`note`, the "degraded and detectable" characterisation, the D5 retirement hole and its one-list/three-consumer fix, R1's derived placeholder rule (green on today's tree — both qualified placeholders confirmed correct against `SKILL_OWNER_OVERRIDES`), R2's five sites (both previously-unnamed ones verified verbatim, including the shipped `LECTORIA_MISSING` runtime string), and the M3-before-M4 sequencing. **Verdict `changes-requested` on 4 P1 findings, all in the operability wrapper rather than the architecture.** The decisive one: the record gates the irreversible act on an operator publish that is separable from the merge, but `docs/reference/plugin-structure.md:208` states the marketplace **serves the default branch**, corroborated by `:124-126`, `AGENTS.md:101-103`, and release step 4 probing "every newly published pack" **on the merge commit** — so merging B-2 *is* publishing, and PROBE-M as placed would run after the point of no return, inverting boundary #5. Three of four P1s share one root cause: `docs/reference/plugin-structure.md` — which defines both the publication model and the emergency rollback runbook — is absent from the record's evidence register. No production code written; nothing under `scripts/`, `packs/`, `plugin.json`, `agents/`, `skills/`, or `kai/initiatives/**` touched; `kai/initiatives/area-plugins/` not created.
- state:     ready
- needs:     `principal-swe-architect` to resolve 4 P1 findings in a new DECISION entry: (P1-1) re-rule PROBE-M as a **merge** prerequisite for B-2 and re-test D9's boundary call against merge-is-publish; (P1-2) author a rename-specific recovery runbook and rule how recovery commands express the marketplace token for the two-population world; (P1-3) rule on the recovery-prose carve-out before `RETIRED_PACK_PLUGINS` gains its first entry; (P1-4) extend D4's instruct-one/recognise-many rule to prose recognition predicates and pin the recognise-many form at `skills/kai-core-workspace-onboarding/SKILL.md:123,144`. The 6 P2s should be answered or explicitly accepted in the same pass. A re-review by `principal-sre` is required — this review does not carry forward to an amended packet.
- artifacts: kai/coordination/threads/area-plugins-migration-architecture.md (this REVIEW entry — the durable reliability artifact while `kai/initiatives/area-plugins/` cannot be created); kai/coordination/items/area-plugins-migration-architecture.md (version 7, `ready`, lease null, `next_role: principal-swe-architect`, one entry in `completed_reviews`)
- evidence:  `docs/reference/plugin-structure.md:208` ("the marketplace serves the default branch"), `:124-126` ("Copilot loads the plugin from the repo … not an update gate"), `:191-193` (release step 4 — install probe on the exact merge commit, "every newly published pack"), `:204` (tag after), `:206-243` (Emergency rollback runbook — derived forbidden set, uninstall order `kai-personal`/`kai-product`/`kai-engineering`/`kai-gtm` first then `kai-core` last at `:228-229`, `kai@kai-plugins` recovery commands at `:227,231`, provenance reversal at `:234-243`); `AGENTS.md:101-103`, `:131-132`; `scripts/lib/migration-doctor.mjs:51,56` (`LEGACY_PLUGIN`/`MARKETPLACE` scalars), `:53-55,61` (derived pack names, `WORKSPACE_PROVENANCE`), `:203-218` (`entryProvenance` recorded-then-inferred), `:622-631` (`provenance-collision` keyed by plugin name — marketplace-independent), `:710-723` (`coexistence` + `legacy-installed` uninstall-first), `:864-871` (`finish()`, "`unknown` is not a softer `clear`"); `scripts/lib/pack-plan.mjs:49` (`PACKS_DIR`), `:63-99` (`PACKS`/`PACK_ORDER`), `:122` (`COMMITTED_PACKS`), `:151` (`packPluginName`), `SKILL_OWNER_OVERRIDES` (`demo-narrate` → `personal`), `:794-825` (`marketplaceSurfacePolicy` — the deletion hole, confirmed); `scripts/release-guard.mjs:20-26` (`BEHAVIOR_PREFIXES` hard-codes `'packs/'`; `BEHAVIOR_FILES` covers `.github/plugin/marketplace.json`); `scripts/validate-plugin.mjs:48` vs `:715` (second `MARKETPLACE_NAME`), `:861,878,898-899` (the four derived spans), `:884-907` (required-text list — **no provenance string pinned**); `scripts/workspace-doctor.mjs:665` (**19th `kai-plugins` site, unenumerated**), `:894-895`, `:953`; `skills/kai-core-workspace-onboarding/SKILL.md:53` (install nothing on `blocked`/`unknown`), `:61-64` (availability-before-mutation guard), `:123,144` (**unpinned provenance predicate**), `:145` (completion requires `clear`), `:197`; `skills/kai-core-fleet-observation/SKILL.md:94`; `scripts/demo-narrate.mjs:307,326`; `skills/kai-core-generate-audio/SKILL.md` + `skills/demo-narrate/SKILL.md` (the only two qualified placeholders; four unqualified `<kai-plugin>` users); `docs/getting-started.md:180-184` (`RubenSaucedo/kai:packs/…`), `:202` (`--plugin-dir packs/…`); `.github/plugin/marketplace.json:2,10,14-15,37-38,60-61,83-84,106-107`; `.github/workflows/validate.yml` (job `contract`, step `Validate plugin contract`; three `packs/` literals in `runtime-dependencies`). All read 2026-08-27 from `C:\src\kai` by file.
- questions: none blocking, and **nothing routed to `@operator` as a decision**. One operator *verification* is recommended when convenient (P2-3): confirm `contract` is a required status check on `main`, since R1, R2 and D7's PR-level assertion all depend on it. PROBE-M remains an operator action, unchanged in substance — P1-1 changes only when it must run.
- next:      `principal-swe-architect` — `area-plugins-migration-architecture` (`ready`, version 7, lease clear, `next_role: principal-swe-architect`) to resolve 4 P1 findings and answer or explicitly accept 6 P2s in a new DECISION entry, then return to `principal-sre` for re-review. Milestone `decisions-locked` stays **open**: this item's `independent-reliability` requirement is **not** discharged. Dispatch is `director-chief-of-staff`'s.

---

## DECISION 2026-08-27-2001 — principal-swe-architect (revision 2, resolving REVIEW 2026-08-27-1944)

**initiative:** area-plugins · **milestone:** decisions-locked

# Architecture Decision, revision 2 — the publication boundary, recovery, and the agent-procedure layer

**Source:** `REVIEW 2026-08-27-1944 — principal-sre` in this thread
(`changes-requested`, P0 0 / P1 4 / P2 6), against the `DECISION 2026-08-27-1922`
packet above. Item record `kai/coordination/items/area-plugins-migration-architecture.md`
at `ready` / version 8, lease `apx-mig-fix-20260827-1952-g1`,
`version_at_grant` 7 — re-read and matched immediately before this write. No
collision.
**Date:** 2026-08-27 20:01 local
**Run:** principal-swe-architect

**Decision (one line):** **Merging B-2 *is* publishing** — so PROBE-M moves from
gating a publish step that does not exist to being a **merge prerequisite of
B-2**, run against a scratch remote's default branch; the one irreversible act
gains a real recovery runbook (`RECOVERY-M`) that inverts `MARKETPLACE_ALIASES`
rather than restoring the monolith; R2's identity ban gains a marker-delimited
**retired-identity block** so detection cannot delete the recovery instruction it
protects; and D4's instruct-one/recognise-many rule is extended to the
**agent-procedure layer**, where the guided installer's prose provenance
predicate is relocated to the doctor and pinned.

**This entry is additive and corrective. Nothing above is rewritten.** Every
ruling the review upheld stands verbatim; the amendments index at the end names
exactly which spans of the 1922 packet this entry supersedes.

---

## What this revision does not touch

The review upheld these under independent verification and I am not reopening
them. They are load-bearing for everything below:

- **Layer separation** (source / identity / tree) and the finding that
  non-negotiable **#9 binds layer 2**, which neither rename touches.
- **Renamed index; dual-publish rejected** — confirmed structurally
  marketplace-independent, because `provenance-collision` fires from
  `target.entries.length > 1` over a map keyed by **plugin name**
  (`scripts/lib/migration-doctor.mjs:622-631`). Dual-publish would manufacture
  the refusal it claims to prevent.
- **`stale-source` is a `note`, status stays `clear`** — `finish()` maps
  `unverified → unknown` and `skills/kai-core-workspace-onboarding/SKILL.md:53`
  installs nothing on `unknown`, so the alternative makes `clear` unreachable for
  the entire installed base.
- **D5's retirement hole and its one-list/three-consumer fix**
  (`RETIRED_PACK_PLUGINS`).
- **R1's derived provider-root placeholder rule**, green on today's tree.
- **R2's five sites**, both previously-unnamed ones verified verbatim.
- **Sequencing:** `surface-rename` before `area-taxonomy-split`; folder release
  before marketplace release; A-4 and milestone 2's PR-3 in different milestones.
- **D3's `kai-personal` retirement**, uninstall-first and coexistence-refused
  preserved.

---

## Root cause, stated plainly

Three of the four P1s trace to one omission: **`docs/reference/plugin-structure.md`
was absent from the 1922 packet's evidence register.** That file defines both the
publication model and the emergency rollback runbook — the two things the record's
operability wrapper is built on. I read the shipped tree and the scripts and
treated the release process as procedure rather than as architecture. It is
architecture: it is where the irreversible act lives.

**Evidence register, additions** (all read by file from `C:\src\kai` on
2026-08-27, `observed` unless marked):

- `docs/reference/plugin-structure.md:208` — "The marketplace serves the default
  branch, so a broken pack flip must be restorable through an ordinary reviewed
  PR rather than an undocumented direct push."
- `:126` — "…plugin from the repo, so the version is descriptive metadata,
  **not** an update gate."
- `:192` — release step 4: on the exact merge commit, "browse `kai-plugins`,
  install every newly published pack".
- `:204` — tag is step 5, *after* the merge-commit probe.
- `:206-243` — *Emergency rollback of the pack marketplace*: `:212` operator
  authorization + branch from `main`; `:219` the **derived** forbidden set;
  `:227,231` `install kai@kai-plugins`; `:228-229` the uninstall order —
  departments first, `kai-core` last; `:234-243` workspace provenance reversal
  via `workspace-doctor.mjs --migration-check --rollback`.
- `AGENTS.md:101-103` — "Users pull updates with `copilot plugin update
  <pack>@kai-plugins`, so the version is descriptive metadata, not an update
  gate."; `:131` — "After it merges to `main`, tag `vX.Y.Z`".
- `scripts/validate-plugin.mjs:930-933` — `managedBlock()`, the existing
  marker-delimited managed-span convention (`# >>> kai workspace` /
  `# <<< kai workspace`).
- `scripts/lib/migration-doctor.mjs:633,655,719,720` — **every uninstall step is
  marketplace-free**; `:740` — the **only** `step()` carrying a token
  (`install ${CORE_PLUGIN}@${MARKETPLACE}`); `:854` — the one tokened notice.
- `scripts/workspace-doctor.mjs:665` — `steps: [/copilot plugin install
  kai-core@kai-plugins/]`, the 19th site (P2-5), confirmed verbatim.
- `.github/workflows/validate.yml:31,42` — job `contract`, step `Validate plugin
  contract`; `:71-72` — the comment asserting "the existing required `contract`
  job"; `.github/CODEOWNERS:2` — "Enforced by branch protection on main". Both
  are **in-repo assertions about configuration held outside the repo** (P2-3).

---

## Diagram — where the gate sits relative to the point of no return

The whole of P1-1 is this shape. The dashed region in the "before" model does not
exist in this repository.

```
  BEFORE — DECISION 2026-08-27-1922 assumed a publish event separable from merge

     B-1 ──► merge ──► [ B-2 merge ] ┈┈► ( sit ) ┈┈► [ PROBE-M ] ┈┈► ( publish )
                             │                            │               ▲
                             │                            └─── gate ──────┘
                             ▼
                      ✗  NO SUCH STATE.  `.github/plugin/marketplace.json` on
                         the default branch IS the served index
                         (plugin-structure.md:208; corroborated :126, :192, :204,
                         AGENTS.md:101-103, :131).  The gate ran AFTER the act.

  AFTER — this entry.  The gate moves ahead of the only irreversible act.

   Release A ──► B-1 ──► merge ──► ( B-1 MAY sit: MARKETPLACE_ALIASES == []
        (5 PRs)                      ⇒ MARKETPLACE_NAMES == {MARKETPLACE}
                                     ⇒ behaviour identical ⇒ publishes nothing new )
                                          │
      ┌───────────────────────────────────┘
      │
      ▼
  ┌────────────────────┐   evidence lands   ┌──────────────────────────────────┐
  │  PROBE-M′          │   on THIS thread   │  B-2 merge  ≡  PUBLISH           │
  │  scratch remote,   │ ─────────────────► │  marketplace.json:2  "kai"       │
  │  its OWN default   │  A or B ⇒ merge    │  ◄──── POINT OF NO RETURN ────►  │
  │  branch, isolated  │  C      ⇒ HOLD     │  (one byte; everything else in   │
  │  COPILOT_HOME      │  unmapped ⇒ C      │   B-2 is repo-side + revertible) │
  └────────────────────┘                    └──────────────────────────────────┘
      ▲                                                      │
      │  HOLD STATE = B-2 unmerged on its branch             │ defect detected
      │  owner: principal-swe-manager                        ▼
      │  outcome C ⇒ boundary #5 escalation        ┌────────────────────────────┐
      └──────────── re-plan ◄──────────────────────│  RECOVERY-M  (D11)         │
                                                   │  forward PATCH through     │
                                                   │  branch protection;        │
                                                   │  invert MARKETPLACE_ALIASES│
                                                   │  NO uninstall, NO monolith │
                                                   └────────────────────────────┘

  Layer note, because the reachable mistake is running the wrong runbook:
    RECOVERY-M is a LAYER 3 repair (a source name).  The emergency rollback at
    plugin-structure.md:206-243 is a LAYER 2 event (restore the monolith).
    Zero identities move in RECOVERY-M.  `installSurface` stays `packs`.
```

---

## D10 — P1-1 · `PROBE-M` is a **merge prerequisite of B-2** · **Reshape (gate placement), Accept in full**

**The finding is correct and I accept it without qualification.** The 1922 packet
said "B-2 should merge, sit, and publish only after PROBE-M's evidence lands"
(D8), and restated it in D1, D9 and *Open questions* 1. There is no sit state.

**Which of the two offered remedies I take, and why not the other.** The packet
offered: re-place PROBE-M before the irreversible act, **or** restructure B-2 so
the irreversible act is separable. **I take the first.** The second is not
available and pursuing it would be worse than the defect: the host reads the
index from the default branch, there is no staging surface, and manufacturing one
— a publication flag in the index, a second serving ref, a release pipeline —
would be a new capability and a new operating surface for an initiative whose
committed scope is a rename. That is the scope-expansion the classify gate
exists to stop, and it would add exactly the kind of machinery boundary #4/#5 are
meant to keep out. **Merge is the publish event, and this repo cannot make it not
be.**

**Ruling.** `PROBE-M`'s evidence must be appended to this thread **before PR B-2
is merged**. It gates nothing else: Release A (A-1…A-5) and B-1 are unaffected
and may ship while the probe is pending.

**The re-placement exposes a second defect the old placement concealed, and it
must be fixed in the same breath.** PROBE-M step 2 as written says "point the
same home at a **branch** whose only delta is `marketplace.json`'s `name: kai`."
If the marketplace serves the default branch — the very fact that produces P1-1 —
then a branch of `RubenSaucedo/kai` **is not a probe surface at all**. The probe
was not executable as specified. The corrected probe therefore needs a surface
whose *own default branch* can carry the two states in sequence.

> ### PROBE-M′ (supersedes PROBE-M in D1; same operator action, executable target)
>
> **Surface.** A throwaway **scratch remote** — a fork of `RubenSaucedo/kai`, or a
> scratch repo carrying a copy of `.github/plugin/marketplace.json` and the pack
> trees it points at. The probe is run against **that repo's default branch**,
> never against `RubenSaucedo/kai`. This reproduces the real event — *the default
> branch's index changed its own `name`* — with no effect on the live index.
> **Nothing about `RubenSaucedo/kai` changes during the probe.**
>
> **Steps.**
> 1. Scratch remote's default branch carries the index at the `1.0.4` shape, name
>    `kai-plugins`. In an isolated `COPILOT_HOME`: `marketplace add <scratch>`,
>    install `kai-core` and one department. Capture `config.json`,
>    `settings.json`, `ls installed-plugins/`.
> 2. Push **one** commit to the scratch default branch: `"name": "kai"`, nothing
>    else. Then, in the same home: `copilot plugin marketplace update kai-plugins`
>    → `marketplace list` → `marketplace browse`.
> 3. Record the five answers, unchanged from D1: (a) how many marketplaces the
>    host lists and under which names; (b) whether `copilot plugin update
>    kai-core@kai-plugins` still resolves; (c) whether `kai-core@kai` resolves
>    without a fresh install; (d) whether `config.json`'s `marketplace` field
>    changed; (e) whether `installed-plugins/kai-plugins/` moved to
>    `installed-plugins/kai/`.
> 4. Repeat step 2 with `marketplace remove` + `marketplace add` and record the
>    same five, **plus** whether the remove uninstalled any plugin.
> 5. Run `node "<kai-plugin>/scripts/workspace-doctor.mjs" --migration-check
>    --json` in the probe home and capture the reported provenance.
>
> ### Decision rule — answers → outcome → B-2 (this answers **P2-4**)
>
> | # | observation after the prescribed re-point | outcome | B-2 |
> |---|---|---|---|
> | 1 | `marketplace list` shows exactly one entry named `kai`; `browse` lists every published name at one common version; `update <name>@kai` resolves; the doctor reads a recognised provenance | **A** — re-key in place | **merge** |
> | 2 | `list` shows both names, or one `kai-plugins` serving the new content; at least one token resolves; `remove` + `add` reaches state 1 **and uninstalled no plugin** | **B** — re-register | **merge**, and D1 step 4's instructed `remove`+`add` becomes the primary re-point path — with "removing a registration does not uninstall plugins" now **observed** rather than asserted |
> | 3 | neither token resolves after both `update` and `remove`+`add`; **or** a plugin row disappears; **or** `browse` lists a name the host cannot install; **or** the doctor cannot read provenance from either surface | **C** — wedge | **DO NOT MERGE** — boundary #5 escalation |
>
> **Any observation that does not map cleanly onto row 1 or row 2 is outcome C.**
> The rule fails closed; ambiguity is a wedge, not a pass. This is what makes the
> probe machine-decidable — the gap the review named.
>
> **Time box.** One operator host session. The probe is **not run** until its
> evidence is on this thread; B-2 does not merge on a remembered or verbal
> result. If evidence has not landed within **5 working days of B-1 merging**,
> `principal-swe-manager` re-plans Release B rather than leaving B-2 dangling —
> a long-lived branch carrying a whole-tree-adjacent diff is its own risk.
>
> **Hold state, named with an owner.** B-2 sits **unmerged on its branch**, owned
> by `principal-swe-manager` (release packing is already theirs per A3/S2), with
> Release A shipped and B-1 merged. That is the "sit" the 1922 packet wanted; it
> exists for B-1 (behaviour-identical by construction) and for an unmerged B-2 —
> it never existed for a merged one.
>
> **Escalation route for outcome C.** Evidence on this thread →
> `principal-product-manager` (steward) holds the boundary #5 call as initiative
> scope owner → `@operator` for the boundary decision → `principal-sre` re-engaged
> on the re-planned approach. This is the *conditional trigger already recorded in
> the 1922 packet*, now given a route and an owner. **It is not live and I am not
> raising it.**

**One thing PROBE-M′ does not buy, stated so nobody over-reads it.** A green probe
on a scratch remote reduces uncertainty about host semantics; it does **not** make
B-2's merge reversible. The scratch host is not the installed base. That is
precisely why D11's recovery runbook is required rather than optional, and why the
review was right to treat a one-sentence recovery strategy as insufficient.

**D9 re-tested against merge-is-publish, as required.**

- **#5 — undetectable stranding: still NOT reached, but now for a stated reason.**
  Under the 1922 placement it **would have been reached**: the wedge (outcome C)
  would have been discovered *after* the point of no return, which is the exact
  ordering inversion boundary #5 exists to prevent. Under D10 the evidence
  precedes the irreversible act, so outcome C is discovered while B-2 is still a
  branch and no revert is needed because nothing was published. The detectability
  and verifiability arguments (`config.json`'s `marketplace` field, the cache
  bucket, doctor re-run) are unchanged and were upheld.
- **#4 — coexistence window: NOT reached, unchanged.** That argument never
  depended on gate placement; it rests on zero identities moving.
- **#8 — historical records: NOT reached, unchanged** (D7, plus D12 below which
  narrows rather than widens the sweep).

**Amends:** D1 (probe surface + gate placement), D8 ("merge, sit, and publish" —
struck), D9 (#5 rationale), *Open questions* 1.

---

## D11 — P1-2 · `RECOVERY-M`, and how recovery commands express the marketplace token · **Accept in full**

The review is right that "recovery is not a revert — it is re-publishing under
the old name and instructing every re-pointed user back" names a strategy and is
not a runbook. Here is the runbook, built to the same seven properties as
`plugin-structure.md:206-243`.

### (a) The runbook

**First line of it, because the reachable mistake is running the wrong one.**
`RECOVERY-M` is a **layer-3** repair: it restores a *source name*. The emergency
rollback at `:206-243` is a **layer-2** event: it restores the *monolith*.
`RECOVERY-M` moves **zero plugin identities**, keeps `installSurface: "packs"`,
uninstalls nothing, and **never runs `workspace-doctor.mjs --migration-check
--rollback`** — that mode's explicit intent is monolith restoration
(`migration-doctor.mjs:706-730, 805-810`) and `WORKSPACE_PROVENANCE` is untouched
by a marketplace rename (D4). Applying the layer-2 remedy to a layer-3 fault
would uninstall a healthy installed base to fix a name.

**Detection signal — what invokes it.** Any one of these, on any *real* host
after B-2 merges:

1. `copilot plugin marketplace browse kai` does not list every published name at
   one common version;
2. `copilot plugin update <name>@kai` fails to resolve on a host whose
   registration the doctor reports as `marketplace:kai`;
3. `--migration-check` reports `provenance-collision` or `unknown-provenance`
   where the same host previously read `clear`.

**Threshold: the first host on which the re-point cannot be verified by the
doctor.** Not "several". Boundary #5's test is verifiability, so one
unverifiable host is the signal.

**Ordered steps.**

| # | step | why |
|---|---|---|
| 1 | Operator authorization; branch from current `main`. | Mirrors `:212`. Recovery is a reviewed PR, never a direct push (`:208`). |
| 2 | Forward **patch** release. `.github/plugin/marketplace.json:2` → `"kai-plugins"`. In the **same commit**, invert the alias direction: `MARKETPLACE = 'kai-plugins'`, `MARKETPLACE_ALIASES = ['kai']`. `installSurface` stays `packs`; no `plugins[]` entry, no `source:` path, no plugin name changes. Changelog + README per `release-guard`. | **This is what recognise-many was for.** The alias set is not merely forward-migration machinery — it is the mechanism that makes the rename recoverable. Inverting one array restores recognition for **both** populations without touching a single host. |
| 3 | `npm test` + the exact release guard; merge through normal branch protection. **Merging is the republish** — same property as B-2, so if the failure mode is not understood, PROBE-M′ is re-run on the scratch remote against the inverted state first. | Same point of no return, same discipline. Recovery must not be the one act performed without the gate. |
| 4 | Verify from **two** isolated homes: one never re-pointed (registered `kai-plugins`), one re-pointed (registered `kai`). On both: `browse` lists every name at one version, and `--migration-check` returns `clear`. | The two-population world is the thing being recovered; verifying one population proves nothing about the other. |
| 5 | Re-point the re-pointed population **back**: `copilot plugin marketplace update kai`; if the host does not re-key, `marketplace remove kai` then `marketplace add RubenSaucedo/kai`. | Removing a registration does not uninstall plugins (D1 step 4; **upgraded to observed** by PROBE-M′ row 2). No identity is disturbed, so no uninstall order exists here. |
| 6 | **No uninstall order. No `--rollback` run. No monolith.** State it as a prohibition, not an omission. | The adjacent runbook has all three, three screens away in the same file. |
| 7 | Verification & exit: both homes report `clear`; the previously-re-pointed home reports either no `stale-source` or `stale-source` against `kai` — which is now the alias, and is the **expected, correct** reading. | The exit condition is a doctor result, not an assertion. |

**Owner and time bound.** `principal-swe-manager` packs and ships the patch;
`@operator` authorizes and runs the host steps; `principal-sre` verifies step 4
and the exit condition. **Recovery decision within one working day of the
detection signal** — every additional day of the wrong index adds hosts to the
re-pointed population, which is the only thing that makes this expensive.

**Wedged-host branch.** If a host reaches a state where neither token resolves and
`remove`+`add` does not repair it, the *release* still ships (it repairs the
population), but that host is a **boundary #5** matter — a manual action we cannot
verify — and takes the same route as PROBE-M′ outcome C.

**Where the runbook lands: `docs/reference/plugin-structure.md`, in PR B-1** — a
new subsection beside the existing *Emergency rollback*, explicitly distinguished
from it. **Before the irreversible act, not with it.** B-1 is the last PR before
the point of no return, and recovery documentation that ships with the thing it
recovers is documentation nobody read in time.

**Correction to D6 row 7.** `docs/reference/plugin-structure.md` was listed only
as a sweep target. It is **the recovery artifact and the statement of the
publication model**, and is re-classified as such: it is swept *and* extended, and
its recovery spans are governed by D12.

### (b) How recovery commands express the marketplace token — the recovery-side instance of D4

**Observed, and it settles most of the question by itself.** In
`scripts/lib/migration-doctor.mjs`, **every uninstall / list / confirm step is
marketplace-free** (`:633`, `:655`, `:719`, `:720` — bare plugin name), and
**exactly one `step()` carries a token**: `:740`,
`install ${CORE_PLUGIN}@${MARKETPLACE}` (plus one notice at `:854`). The shipped
code already has the right shape; it was never written down as a rule.

**Ruling — recovery commands normalise; they never branch on population.**

1. **Uninstall, list, and verification commands carry no marketplace token**, and
   are therefore correct for both populations unchanged. This becomes an explicit
   third clause of D4's rule, so a future edit cannot "helpfully" add one.
2. **Install and update commands instruct exactly one token (`MARKETPLACE`)**, and
   are always preceded *in the same command block* by the conditional
   registration step — `marketplace add RubenSaucedo/kai` when absent,
   `marketplace update <name>` when present. The guided installer already has
   exactly this conditional shape (`skills/kai-core-workspace-onboarding/SKILL.md:86-114`),
   so recovery prose reuses it rather than inventing a fork.
3. **No prose branches on which population a host is in.** Recognising that is the
   **doctor's** job (`MARKETPLACE_NAMES`) and it reports it. That is
   instruct-one / recognise-many applied to recovery, decided the same way as D4
   because it is the same seam.

**This resolves the concrete defect the review named.**
`plugin-structure.md:227,231`'s `install kai@kai-plugins` **is** swept to `@kai`,
and is correct for the un-re-pointed population too, because the registration step
precedes it and makes the token true. What must **not** be swept is `:228-229`'s
uninstall order — and that is D12.

---

## D12 — P1-3 · The retired-identity carve-out · **Decouple the ban into two banned sets, marker-delimited**

The conflict is real, and the review is right that it is R2's own instance of the
failure-by-deletion class D5 found. `RENAME_EXEMPT_PREFIXES` exempts
`docs/proposals/` but not `docs/reference/`, and R2 scans `docs/**`; so at
milestone 4, `RETIRED_PACK_PLUGINS` gaining `'kai-personal'` turns R2 **red** on
`plugin-structure.md:228` — the line telling a recovering operator to uninstall
`kai-personal` first. Detection would delete the recovery instruction.

**Rejected, with reasons:**

- **Exempt `docs/reference/` or the whole file.** Worse than the disease. The same
  file carries `install kai@kai-plugins` at `:227,231` and eight `packs/` paths
  that **must** be swept, plus (per D11) the new recovery runbook. A file-level
  exemption strands precisely the lines the sweep exists for.
- **Heading- or section-scoped exemption.** Heading text is prose and drifts; a
  renamed heading silently un-exempts or over-exempts, with no failure signal.

**Ruling — split the ban into two banned sets with two different carve-out
policies, and delimit the carve-out explicitly.**

```
  banned identity strings   = RETIRED_PACK_PLUGINS
      → LEGAL inside a marked retired-identity block; banned everywhere else
  banned marketplace names  = MARKETPLACE_ALIASES
      → banned everywhere outside RENAME_EXEMPT_PREFIXES.  NO block exemption.
  banned path prefixes      = LEGACY_TREE_DIRS
      → banned everywhere outside RENAME_EXEMPT_PREFIXES.  NO block exemption.

  <!-- >>> kai retired-identity block: these names are on hosts, not in the index -->
     ... recovery prose that must name a retired identity ...
  <!-- <<< kai retired-identity block -->
```

**Why a marker and not a new mechanism.** This repo already uses marker-delimited
managed spans and already validates them: `scripts/validate-plugin.mjs:930-933`
(`# >>> kai workspace` / `# <<< kai workspace`). Same shape, same validator, same
`contract` job. Nothing is invented.

**Two properties keep it from becoming a loophole:**

1. **The block exempts retired *identities* only.** `MARKETPLACE_ALIASES` and the
   tree-prefix ban still apply *inside* it — so `:227,231`'s `@kai-plugins` still
   turns red inside the block and is still swept, exactly as D11(b) requires. The
   carve-out is as wide as the requirement and no wider.
2. **The block cannot rot into a general silencer.** An unbalanced marker is an
   error, and **a marked block containing no retired identity is an error** — a
   dead exemption cannot lie around waiting to be reused for something else. Both
   are mechanical, both cost one condition each.

**R2 is not weakened.** `kai-personal` remains banned in the other eight files and
everywhere else in this one; it remains forbidden in the index by D5's derived
set; the doctor still refuses it (D3). The only thing that changed is that R2 can
now express the distinction it previously could not: *this name must never be
**published** again* versus *this name must still be **named**, because it is on
people's disks*.

**Timing.** Marker support ships with the check in **A-3**, where the ban lands
green and empty. The block is *placed* around `plugin-structure.md:228-229` in
**milestone 4's** PR, in the same one-line edit that adds `'kai-personal'` to
`RETIRED_PACK_PLUGINS`. The review's requirement — decided before the list gains
its first entry — is met with a milestone to spare.

---

## D13 — P1-4 · The agent-procedure layer · **Relocate the predicate to the doctor, then pin it**

**Accepted in full, including the model gap, which I am naming rather than
patching around.** The 1922 packet's three layers (source / identity / tree)
describe **artifacts**, not **readers**. Recognition is executed in two places:
the doctor (code) and the guided installer (**prose executed by an agent**). D4's
rule bound the first and never looked at the second. That is why these two spans
fell through, and a fix that only edits two lines would leave the class open.

**Verified at source:**

- `skills/kai-core-workspace-onboarding/SKILL.md:123` — "Its only provenance must
  be `marketplace:kai-plugins`; a direct install, mixed provenance, or unknown
  enabled state is not verified." `:144` — same assertion for departments.
- `scripts/validate-plugin.mjs:884-907` — the required-text list pins 22 spans and
  **contains no provenance string**. Read in full; confirmed.

So A1 criterion (ii) is genuinely **unsatisfied** for those two spans, and **D6
row 14's blanket "satisfied" is wrong as written.** Corrected below.

**Ruling — the predicate does not belong in prose at all.**

The installer already consumes the doctor's `--json` `plugins` inventory for
enabled state and provenance — and that consumption is *already pinned*
(`validate-plugin.mjs` required text: "use its `plugins` inventory for enabled
state and provenance"). Restating **which** provenance strings count is a second
source of truth for a recognition rule the doctor owns: the same defect as the
duplicate `MARKETPLACE_NAME` at `validate-plugin.mjs:715` (D6 row 10), one layer
up. So:

1. **D4's rule gains a third clause.** *Every recognition predicate uses
   `MARKETPLACE_NAMES` — **including one written in prose and executed by an
   agent**. A prose predicate must not restate the recognised set; it names the
   doctor field that carries the classification.* (Alongside D11(b)'s clause:
   *uninstall / list / verify commands carry no marketplace token.*)
2. **The two spans become** — the row's provenance must be a **single recognised
   kai marketplace** as classified by the migration report; a direct install,
   mixed provenance, or unknown enabled state is not verified. **A `stale-source`
   note is a recognised provenance and does not make the row unverified.**
3. **Pinned in the deriving check** — three entries in the **existing**
   required/forbidden text loop at `validate-plugin.mjs:884-907`. No new gate, no
   new step, no new job:
   - **required (contract text):** `a single recognised kai marketplace`
   - **required (derived):** `` marketplace:${MARKETPLACE} `` — the instruct-one
     name is present and moves with the constant.
   - **forbidden (derived, per alias):** the phrase *only provenance must be*
     `` `marketplace:<alias>` `` must not appear. An alias may be named as
     recognised; it may never be asserted as **the** required value. **This is the
     clause that makes the defect unrepeatable rather than merely fixed.**

**The failure the review predicted is closed, and here is where.** A `1.0.4` host
that the doctor calls `clear` with a `stale-source` note now passes `:123`/`:144`
(recognised provenance), and `:145`'s completion test already requires `clear`
plus "no unverified host or workspace finding" — a `note` is neither `unverified`
nor a refusal, so completion passes. **The doctor layer and the agent-procedure
layer now agree by construction, not by coincidence.**

**Step ordering is already correct — observed, not asserted** (this answers the
second half of **P2-6**): `stale-source` is emitted inside the per-entry
provenance pass (`migration-doctor.mjs:622-670`); the only tokened install step is
`:740`, in the later pack-set pass. `out.step()` preserves emission order, so the
re-point step **necessarily precedes** any `install …@${MARKETPLACE}`. The
installer reports "its exact findings and exact suggested steps" (`SKILL.md:54-55`),
so re-point-before-install requires no new instruction.

**Correction to D6 row 14.** `skills/kai-core-workspace-onboarding/SKILL.md`: A1
criterion (ii) is **satisfied for the install / browse / enable command spans**
(`validate-plugin.mjs:861,878,898-899`) and was **NOT satisfied for the two
provenance spans** (`:123,144`). The file satisfies (ii) as a whole only once the
three pins above land.

**Placement: B-1, not B-2.** The delegating prose is behaviour-neutral today — a
host's only provenance today *is* `kai-plugins`, which is a recognised name — so
it lands green in B-1, and the forbidden-alias clause is vacuous while
`MARKETPLACE_ALIASES == []` and **arms itself** when B-2 adds the alias. Same
self-arming property as R2, same A3/PR-2 discipline used throughout this record:
mechanism first and neutral, data edit later. This is a small improvement on the
1922 sequencing, which had the installer edit riding in B-2.

---

## P2 dispositions — all six answered, none silently accepted

**P2-1 · Path match under-matches. ACCEPTED — broadened.**
The shape becomes `` (^|[^A-Za-z0-9_-])<dir>/ ``. Checked against every literal
the record enumerates: `RubenSaucedo/kai:packs/kai-core`
(`docs/getting-started.md:180-184`, preceding char `:`) ✔ matches;
`"./packs/kai-core"` (`.github/plugin/marketplace.json:15,38,61,84,107`,
preceding char `.`) ✔ matches; `installSurface: "packs"` ✔ still **not** matched
(no trailing slash — D6's enum survives for the stated reason); a hypothetical
`mypacks/` ✔ still not matched (preceding char is a word character).
**A-5's proof claim is corrected, not restated:** under the 1922 shape "arming the
ban in the same PR makes A-5's completeness provable" was **overstated** — the
check did not cover two of the shapes the record itself enumerated. Under the
broadened shape the claim holds.

**P2-2 · `RETIRED_PACK_PLUGINS` append-only is unenforced. ACCEPTED — minimal
mechanism, not an accepted residual.**
One **witness arm per retired name** in the existing pack-plan / marketplace-policy
self-test, asserting that the name is forbidden under **both** surfaces. Deleting
the constant entry turns the self-test red, so the deletion path that silently
un-arms all three guarantees is closed. This is not a second source of truth — it
is a **regression witness**, which is how this repo already proves derived sets
("each failure proven by a mutation", `plugin-structure.md`'s
`pack-preview:self-test` row). The mechanism ships empty with A-2/A-3; the arm is
added in the same one-line edit as the name at milestone 4.

**P2-3 · "required `contract` job" is `reported`, not `observed`. ACCEPTED —
downgraded everywhere.**
*Observed:* `validate-plugin.mjs` runs as the first step of job `contract`, on
`pull_request` and `push: main` (`.github/workflows/validate.yml:31,42`).
*Not observed:* that `contract` is a **required status check**. The only in-repo
support is the workflow's own comment (`:71-72`, "the existing required `contract`
job") and `.github/CODEOWNERS:2` ("Enforced by branch protection on main") — both
are assertions **inside** the repo about configuration held **outside** it.
**Reclassified `reported` in R1, R2, and D7's PR-level diff-intersection
assertion.** **Operator verification, named and non-blocking:**
`gh api repos/RubenSaucedo/kai/branches/main/protection --jq '.required_status_checks.contexts'`
must contain `contract`. **I did not run it — this session has no shell.**
*Consequence if it is not required:* R1, R2 and D7 degrade from "cannot merge" to
"red but bypassable" — detection survives, enforcement does not. Worth knowing
before B-2, which is the merge that publishes.

**P2-4 · PROBE-M not machine-decidable. ACCEPTED —** answer→outcome truth table,
fail-closed default (unmapped ⇒ C), one-session time box with a 5-working-day
calendar bound, named hold state for B-2, and a named escalation route. All in
D10.

**P2-5 · 19th site. ACCEPTED —** `scripts/workspace-doctor.mjs:665`,
`steps: [/copilot plugin install kai-core@kai-plugins/]`, verified verbatim and
added to D6's enumeration as **row 19**. Derives from `MARKETPLACE`; lands in B-1
with the other self-test literals. Caught twice: red in the workspace-doctor
self-test, **and** by R2 (`scripts/**` is scanned; only `scripts/lib/pack-plan.mjs`
and `scripts/lib/migration-doctor.mjs` are exempt). The enumeration is now **19
sites against the BRIEF's five**. The reviewer's point stands and is the reason
the mechanical rule is the right one: I missed one by eye, twice.

**P2-6 · Compound state. ACCEPTED, split.**
*Ordering half:* resolved as **observed** in D13 — emission order already puts the
re-point step before any tokened install step.
*Compound half:* remains routed to `area-taxonomy-split`'s record (milestone 4),
**with an added requirement I am handing over rather than deciding here**: that
record must **name and pin** `skills/kai-core-workspace-onboarding/SKILL.md:61-64`
— "If availability cannot be proved, report `unknown` and leave the monolith
installed" — because it is load-bearing for the
destruction-before-a-viable-install path and is currently relied on implicitly.
Pinning it is the same one-line mechanism as D13's pins, in the same existing
required-text list.

---

## Amendments index — what this entry changes in the 1922 packet

| 1922 section | status after this entry |
|---|---|
| D1 — PROBE-M | **Amended.** Probe surface: scratch remote's default branch, not a branch of this repo. Gate: **merge prerequisite of B-2**. Decision rule, time box, hold state, escalation route added (D10). |
| D4 — instruct-one / recognise-many | **Extended**, not changed. Two clauses added: prose recognition predicates (D13); uninstall/list/verify commands carry no token (D11b). |
| D6 row 7 — `docs/reference/plugin-structure.md` | **Re-classified.** Not merely a sweep target — it is the recovery artifact and the statement of the publication model. Swept *and* extended (D11). |
| D6 row 14 — `kai-core-workspace-onboarding` | **Corrected.** A1 (ii) was satisfied for the command spans, **not** for the two provenance spans. Satisfied file-wide only once D13's three pins land. |
| D6 enumeration | **Extended** to **19 sites** (row 19: `scripts/workspace-doctor.mjs:665`). |
| D8 — sequencing | **One clause struck:** "B-2 should merge, sit, and publish only after PROBE-M's evidence lands." Merge is publish. Order, atomicity, folder-first and the seven PRs are unchanged. B-1 gains the recovery runbook (D11), D13's pins, and the 19th literal. |
| D8 — *Reversibility summary* | **Superseded** for Release B PR-2 by `RECOVERY-M` (D11). |
| D9 — boundary call | **Re-tested and re-argued.** #5 still NOT reached — now *because* the gate precedes the irreversible act, where before it followed it. #4 and #8 unchanged. |
| R2 — literal ban | **Reshaped:** two banned sets with different carve-out policies (D12); path match broadened (P2-1). Banned identity/alias sources unchanged. |
| R1 | **Unchanged.** Upheld and independently verified. |
| D0, D2, D3, D5, D7, *What stays the same* | **Unchanged.** |
| *Open questions* 1 | **Amended** by D10. Items 2–7 unchanged. |

---

## Scope-discipline self-check (run on this revision)

- **`Apply`, not expansion.** Every change lands in a file the BRIEF lists as a
  `target` (plus `README.md` per NOTE 2 and `docs/reference/plugin-structure.md`,
  already a target), and every one serves an acceptance line or a committed
  success measure — non-stranding (#9) and silent-stranding-paths-zero (#5).
- **Adds no gate, step, surface, job, flag, or capability.** D13's pins are three
  entries in the **existing** required/forbidden text loop; D12's marker reuses
  the **existing** `managedBlock` convention in the **same** validator; P2-1 is a
  regex character class; P2-2 is a fixture arm in an **existing** self-test.
  `GATES` stays `partition | collision | partial-install | version-skew`.
- **The one thing I explicitly refused to build.** A staging or publication
  surface that would make B-2's merge separable from publishing (P1-1 option two).
  That is a new capability, and the cheaper correct answer — move the gate — was
  available.
- **Prose added to a shipped doc, named honestly.** `RECOVERY-M` adds a subsection
  to `docs/reference/plugin-structure.md`. It documents recovery for a change
  already in scope, in a file already in `targets`, and adds no mechanism. Landing
  it in B-1 rather than B-2 is a placement choice, not a scope choice.
- **Violates no `non_negotiable`.** #9 strengthened (recovery now exists for the
  one irreversible act; the retired-identity ban no longer deletes its own
  recovery instruction); #12, #13 unchanged; #10 preserved — every PR stays small
  and independently revertible, and B-2 is now gated rather than enlarged.
- **Deferred rather than absorbed:** `installSurface` rename; `MARKETPLACE_ALIASES`
  pruning; per-area versioning. Triggers unchanged.
- **Routed rather than decided:** P2-6's compound-state requirement →
  `area-taxonomy-split`'s record; release packing and the B-2 hold state →
  `principal-swe-manager`; the three 1922 NOTEs → steward, unchanged; reliability
  acceptance → `principal-sre`.
- **Nothing written outside `touches`.** No production code. Nothing under
  `scripts/`, `packs/`, `plugin.json`, `agents/`, `skills/`, `docs/` — including
  `docs/reference/plugin-structure.md`, which was **read as evidence and not
  edited**. `kai/initiatives/area-plugins/` not created; no `mkdir` attempted.
  Milestone 1's acceptance holds: **no production code, manifest, or marketplace
  change has been made.**

---

## Open questions / escalations

**None blocking. No operator *decision* is required — and I am not manufacturing
one the reviewer explicitly did not raise.**

1. **PROBE-M′ remains an operator *action*.** P1-1 changed **when** it runs
   (before B-2 merges, not after a publish that does not exist) and **what it
   points at** (a scratch remote's default branch, because a branch of this repo
   is not a probe surface). Who runs it and whether it forks the architecture are
   unchanged: the operator runs it, and it does not fork. Precedent stands
   (`pack-split-host-semantics-spike`).
2. **One operator *verification*, non-blocking (P2-3):** confirm `contract` is a
   required status check on `main`. Command named above; not run — no shell in
   this session. R1, R2 and D7 depend on it for *enforcement*, not for detection.
3. **Outcome C remains a conditional trigger, not a live escalation.** It now has
   a route and an owner (D10). It fires only if the probe wedges.
4. **1922 items 2–7 stand unchanged** — three NOTEs to the steward, release
   packing to `principal-swe-manager`, and the two claims put to `principal-sre`,
   both of which were upheld.

---

## HANDOFF 2026-08-27-2001 — principal-swe-architect -> principal-sre

- did:       Resolved all 4 P1 findings from `REVIEW 2026-08-27-1944` and answered all 6 P2s in this appended DECISION entry; nothing above was rewritten and every upheld ruling stands verbatim. **Read the missing evidence first**: `docs/reference/plugin-structure.md`, the root cause of three of four P1s, is now in the register with the publication model and the emergency rollback runbook cited by line. **P1-1:** accepted in full — **merging B-2 is publishing** (`:208`, `:126`, `:192`, `:204`, `AGENTS.md:101-103,131`), so "merge, sit, publish" is struck and **PROBE-M is re-placed as a merge prerequisite of B-2**. I took the re-place option, not the restructure option, because making the merge separable would require a staging surface this repo does not have and would be a new capability. Re-placing exposed a second defect the old placement hid — the probe as written targeted a *branch* of this repo, which by the very fact that produces P1-1 is not a probe surface — so **PROBE-M′ runs against a throwaway scratch remote's own default branch**, same operator action, now executable. **D9 re-tested**: #5 still NOT reached, but now *because* the gate precedes the irreversible act where before it followed it. **P1-2:** authored **`RECOVERY-M`** — detection signal and threshold (the first host whose re-point the doctor cannot verify), seven ordered steps, owner, one-working-day bound, verification from **two** homes (re-pointed and not), the wedged-host branch, and an explicit prohibition on the adjacent layer-2 runbook (no uninstall order, no monolith, no `--rollback`; `WORKSPACE_PROVENANCE` is untouched by a source rename). Recovery works by **inverting `MARKETPLACE_ALIASES`** — recognise-many turns out to be the mechanism that makes the rename recoverable at all. Ruled the token question the same way as D4, grounded in shipped code: every uninstall/list step is marketplace-free (`migration-doctor.mjs:633,655,719,720`) and exactly one step carries a token (`:740`), so **recovery commands normalise (conditional registration, then one token) and never branch on population**. Runbook lands in **B-1**, before the point of no return. **P1-3:** split R2 into **two banned sets with two carve-out policies** — retired identities legal inside a marker-delimited block reusing the existing `managedBlock` convention (`validate-plugin.mjs:930-933`), while `MARKETPLACE_ALIASES` and the tree-prefix ban still apply **inside** the block, so `:227,231`'s `@kai-plugins` is still swept while `:228-229`'s uninstall order survives. Guarded against loophole drift: unbalanced marker is an error, and an empty marked block is an error. **P1-4:** named the missing **agent-procedure layer** — the three-layer model described artifacts, not readers — extended D4's rule to prose predicates, and **relocated** the predicate to the doctor rather than re-pinning a literal, with three entries in the existing required/forbidden text loop including a **derived forbidden clause** that makes the defect unrepeatable. Corrected D6 row 14's false "(ii) satisfied" and moved the installer edit from B-2 to **B-1**, where it is behaviour-neutral and self-arming. **P2s:** all six accepted with mechanisms, none waved through — path match broadened to `(^|[^A-Za-z0-9_-])<dir>/` and A-5's proof claim **corrected as previously overstated**; append-only enforced by a mutation-proved witness arm; `required contract` **downgraded to `reported`** everywhere with an operator verification command and the stated consequence; PROBE-M given a fail-closed truth table, time box, hold state and escalation owner; the 19th site added; the compound-state guard routed to M4 with a pinning requirement, and its ordering half resolved as **observed**. No production code written. Nothing under `scripts/`, `packs/`, `plugin.json`, `agents/`, `skills/`, or `docs/` touched — `docs/reference/plugin-structure.md` was read as evidence and **not edited**. `kai/initiatives/area-plugins/` not created; no `mkdir` attempted.
- state:     in-review
- needs:     `principal-sre` **re-review** of `independent-reliability` — the requirement is **not** discharged (`satisfies_requirement: false` on the existing `completed_reviews` entry, which is left in place). This review binds to **`DECISION 2026-08-27-2001`** at item version **9**, read together with the 1922 packet it amends; the amendments index names every superseded span so the delta is reviewable without re-reading the whole record. Sharpest things to challenge: (1) that PROBE-M′ on a **scratch remote** is a sound proxy for the real index — it is deliberately *not* the installed base, which is why `RECOVERY-M` is required rather than optional; (2) that `RECOVERY-M`'s alias inversion genuinely repairs **both** populations without touching a host, and that its explicit prohibition on the layer-2 runbook is stated strongly enough that the wrong runbook is not reachable under pressure; (3) that D12's marked block is narrow enough — retired identities only, aliases and tree prefixes still banned inside it — that detection is not weakened; (4) that D13's forbidden-alias clause actually closes the class rather than the two spans.
- artifacts: kai/coordination/threads/area-plugins-migration-architecture.md (this DECISION entry — the durable record while `kai/initiatives/area-plugins/` cannot be created); kai/coordination/items/area-plugins-migration-architecture.md (version 9, `in-review`, lease cleared to null on all five fields, `next_role: principal-sre`, `completed_reviews` entry preserved, `docs/reference/plugin-structure.md` added to `context_artifacts`)
- evidence:  `docs/reference/plugin-structure.md:126` ("plugin from the repo … **not** an update gate"), `:192` (release step 4 — probe on the exact merge commit, "every newly published pack"), `:204` (tag is step 5), `:206` (Emergency rollback heading), `:208` ("**The marketplace serves the default branch**"), `:212` (operator authorization + branch from `main`), `:219` (derived forbidden set), `:227,231` (`install kai@kai-plugins`), `:228-229` (uninstall order — departments first, `kai-core` last), `:234-243` (provenance reversal via `--rollback`); `AGENTS.md:101-103` ("Users pull updates with `copilot plugin update <pack>@kai-plugins` … not an update gate"), `:131` ("After it merges to `main`, tag `vX.Y.Z`"); `scripts/lib/migration-doctor.mjs:622-631` (`provenance-collision` keyed by plugin name), `:633,655,719,720` (**every uninstall step marketplace-free**), `:706-730` (`rollbackReady`, `legacy-rollback-restored`/`-unverified` — monolith-specific), `:740` (**the only tokened `step()`**), `:805-810` (`workspace-provenance-ahead` reverse edit), `:854` (the one tokened notice), `:864-871` (`finish()`); `scripts/lib/pack-plan.mjs:788-825` (`marketplaceSurfacePolicy` — derived required/forbidden sets, `installSurface ∈ {packs, legacy-rollback}`); `scripts/validate-plugin.mjs:861,878,898-899` (the four derived spans), `:884-907` (required-text list read in full — **no provenance string pinned**), `:930-933` (`managedBlock`, the `# >>> kai workspace` / `# <<< kai workspace` marker convention); `scripts/workspace-doctor.mjs:665` (**19th site**, verbatim); `skills/kai-core-workspace-onboarding/SKILL.md:53` (install nothing on `blocked`/`unknown`), `:64` (availability-before-mutation guard), `:86-114` (conditional marketplace add/update shape), `:123,144` (**unpinned provenance predicates**, verbatim), `:145` (completion requires `clear`); `docs/getting-started.md:180-184` (`RubenSaucedo/kai:packs/…`, preceding char `:`); `.github/plugin/marketplace.json:15,38,61,84,107` (`"./packs/…"`, preceding char `.`); `.github/workflows/validate.yml:31,42` (job `contract`, first step), `:71-72` (the in-repo comment asserting `contract` is required); `.github/CODEOWNERS:2` ("Enforced by branch protection on main"). All read 2026-08-27 from `C:\src\kai` by file. No shell in this session; nothing was executed.
- questions: none blocking, and **nothing routed to `@operator` as a decision** — the reviewer recorded that none was required and this revision does not create one. PROBE-M′ remains an operator **action** (P1-1 changed only when it runs and what it points at). One operator **verification** stands from P2-3: `gh api repos/RubenSaucedo/kai/branches/main/protection --jq '.required_status_checks.contexts'` must contain `contract`; not run here (no shell), and named as `reported` throughout rather than asserted as fact.
- next:      `principal-sre` — `area-plugins-migration-architecture` (`in-review`, version 9, lease clear, `next_role: principal-sre`) for **re-review** of the `independent-reliability` requirement against `DECISION 2026-08-27-2001`. Milestone `decisions-locked` stays **open** until that verdict lands; on approval this is the third and last typed required item in milestone 1, the steward advances `scope.current` to `optional-core-contract`, and the milestone-2 code chain gated on this item's `completed` state (`area-plugins-m2-planpacks-prefix`) unblocks. Dispatch is `director-chief-of-staff`'s. **Not touched:** `area-plugins-m2-standalone-copy` or any other `area-plugins-m2-*` record — a parallel sibling holds that lane.

---

## REVIEW 2026-08-27-2015 — principal-sre · independent-reliability (re-review)

**Verdict: `changes-requested`** · **P0: 0 · P1: 1 · P2: 5**
**`satisfies_requirement: false`**

**Mode:** CHANGE-REVIEW (knowledge item — no code)
**Bound to:** `change_ref: null`. This item is `delivery_class: knowledge`; there
is no commit to bind. **This review is bound to the `DECISION 2026-08-27-2001`
thread entry — the architect's new dated revision appended after my
`REVIEW 2026-08-27-1944` — at item record version 10**, read together with the
`DECISION 2026-08-27-1922` packet it amends via its amendments index. Stating
that explicitly, as the packet requires. A further DECISION entry or any edit to
the reviewed revision requires a new review (no self-review, no carry-forward).
**Lease verified before any write:** holder `principal-sre`, token
`apx-mig-sre2-20260827-2005-h1`, `version_at_grant` 9, record at version 10,
expires 2026-08-27-2305 — matched the dispatch packet exactly. No collision.
**Environment:** no shell. `kai/initiatives/area-plugins/` not created, no
`mkdir` attempted, no `.kai/runs/**` directory created; this thread is the
durable reliability artifact per the environment limit at its head. Nothing was
executed — every claim requiring execution is marked `reported`.
**Evidence basis:** `observed` (read by file from `C:\src\kai` on 2026-08-27)
unless marked otherwise.

---

### Verdict rationale in one paragraph

**All four prior P1s are genuinely discharged at the evidence level, and the
citation discipline this pass was tested on is now sound** — I checked roughly
twenty new line citations against source and every one resolves to what the
record says it does, including the five that P1-2's ruling rests on. The
architect's self-corrections are the right ones and are made in the open: A-5's
proof claim retracted as overstated, D6 row 14's "(ii) satisfied" corrected to
false, and the 19th site conceded with "I missed one by eye, twice." I am not
reopening anything. **The single P1 is a defect in the material this revision
added**, and it is exactly the risk class the packet asked me to assess:
`MARKETPLACE_ALIASES` now serves as both the forward-migration mechanism and the
recovery mechanism, and **inverting it in `RECOVERY-M` step 2 arms R2's
marketplace-name ban on the string `kai`** — a string that is simultaneously the
monolith's plugin identity (`migration-doctor.mjs:51`), the repo slug, and the
~19 `@kai` tokens B-2 deliberately creates. The recovery patch therefore turns
its own required gate red, at the one moment it must merge inside a
one-working-day bound. The runbook is well built; as written it cannot be run.

---

### Citation audit — the thing under test

The prior pass missed `docs/reference/plugin-structure.md` entirely. I therefore
re-derived every new citation rather than trusting it. **All resolve.**

| cited | claim | result |
|---|---|---|
| `migration-doctor.mjs:633,655,719,720` | uninstall/list steps are marketplace-free | ✔ verbatim, all four |
| `migration-doctor.mjs:740` | the **only** token-carrying `step()` | ✔ **and stronger than claimed** — see below |
| `migration-doctor.mjs:854` | the one tokened notice | ✔ |
| `validate-plugin.mjs:930-933` | `managedBlock()` + `# >>> kai workspace` / `# <<< kai workspace` | ✔ function `:930`, markers `:932-933` |
| `validate-plugin.mjs:884-907` | required-text list contains **no** provenance string | ✔ read in full; confirmed |
| `validate-plugin.mjs:897` | doctor-inventory consumption **already pinned** | ✔ `'use its \`plugins\` inventory for enabled state and provenance'` |
| `plugin-structure.md:208,212,227,228-229,231` | serves default branch; authorization; recovery commands; uninstall order | ✔ all exact |
| `plugin-structure.md:126,191-192,204,206,233` | not an update gate; probe on merge commit; tag is step 5 | ✔ (`:219`→`:220` for "derived from `PACKS`", off by one, immaterial) |
| `AGENTS.md:102-103,131` | update gate; tag after merge | ✔ |
| `SKILL.md:64,74,123,144` | availability guard; inventory use; the two provenance predicates | ✔ verbatim |
| `workspace-doctor.mjs:665` | 19th site | ✔ verbatim |
| `validate.yml:31,42,71`; `CODEOWNERS:2` | job `contract`; the in-repo "required" assertion | ✔ — and correctly `reported`, not `observed` |

**One claim is stronger than the architect argued, and I am recording it because
it is load-bearing for `RECOVERY-M`.** `MARKETPLACE` occurs in exactly **three**
places in the whole of `scripts/lib/migration-doctor.mjs` — `:56` (the
constant), `:740` (one step), `:854` (one notice). So "exactly one token-carrying
step" is not a sample, it is a **complete enumeration** of the file. D11(b)'s
"recovery commands normalise rather than branch on population" is therefore
grounded in a closed set, not an inspection.

---

### The four prior P1s — all discharged

**P1-1 · gate placement — DISCHARGED.** "Merge, sit, publish" is struck, PROBE-M′
is a merge prerequisite of B-2, D8/D9/D1/*Open questions* 1 are amended together,
and D9's #5 call is genuinely re-tested rather than restated. Taking the re-place
option over the restructure option is the **right reliability call**: a
publication flag, a second serving ref, or a release pipeline would be new
production surface built to make one rename observable, and new surface is new
failure modes.

**On the question I was asked to answer — does a scratch-host result generalize?
Partly, and the record's framing survives it.** It generalizes **on the axis it
tests**: the stimulus is "an index changed its own `name` on the default branch
its subscribers read", and a scratch remote reproduces that stimulus exactly. It
does **not** generalize to the installed base's accumulated state — cache-bucket
history, version drift, direct installs, populated `settings.json` override maps.
A green PROBE-M′ is `observed` evidence about **host resolution semantics** and
`inferred`, low-confidence evidence about **the real population**. That is
precisely the architect's own statement ("the scratch host is not the installed
base"), and refusing to claim reversibility from it is correct. It also matches
this repo's established practice of naming unexercised host semantics rather than
pretending: `plugin-structure.md:194-203` already documents that the bare-`name`
override key "has never been exercised on a real host … documented as inferred,
not gated." **The probe is sound for what it is used for, and the record does not
over-read it.** Because it does not generalize to the population, `RECOVERY-M`
must actually work — which is P1-5.

**P1-2 · recovery runbook — DISCHARGED as a runbook.** All seven properties are
present and real: detection signal with three concrete triggers; a threshold that
is defensible rather than arbitrary (**the first** host whose re-point the doctor
cannot verify — correct, because boundary #5's test is verifiability, not
volume); seven ordered steps; named owners split across pack/authorize/verify;
a one-working-day decision bound; verification from **two** homes; and an
explicit **prohibition** on the adjacent layer-2 runbook. The layer-3/layer-2
distinction is stated in the runbook's first line, which is the right place —
the reachable mistake under stress is running the wrong runbook from the same
file, and this pre-empts it. D11(b)'s token ruling is grounded in the closed
enumeration above. **The runbook exists and is well built. It is its mechanism
that fails — P1-5.**

**P1-3 · retired-identity carve-out — DISCHARGED, and R2 is not weakened.**
Verified directly: the carve-out admits `RETIRED_PACK_PLUGINS` only;
`MARKETPLACE_ALIASES` and `LEGACY_TREE_DIRS` still ban **inside** the block, so
`plugin-structure.md:227,231`'s `@kai-plugins` is still swept while `:228-229`'s
uninstall order survives. R2's five sites are all outside any block and remain
covered. The two anti-rot guards (unbalanced marker = error; marked block
containing no retired identity = error) close the silencer path. Timing meets my
requirement with a milestone to spare.

**P1-4 · agent-procedure layer — DISCHARGED for the two spans.** Naming the
missing layer (artifacts vs **readers**) rather than patching two lines is the
better fix, and **relocating** the predicate to the doctor instead of re-pinning
a literal removes a second source of truth rather than updating it — the same
defect shape as the duplicate `MARKETPLACE_NAME` at `validate-plugin.mjs:715`.
The claim that the doctor-inventory consumption is *already* pinned is verified
(`:897`), so the relocation lands on an existing pin rather than inventing one.
The doctor/installer disagreement I predicted is closed: a `stale-source` host
reads `clear`, counts as recognised provenance, and `:145`'s completion test
passes. The class-closure claim is over-stated, but only in a bounded way — P2-2.

---

### P1 findings

#### P1-5 · `MARKETPLACE_ALIASES` inverted arms R2's ban on `kai`, so the recovery PR cannot pass the gate it must merge through

This is the concentration risk in concrete form. Five record/source facts, each
verified:

1. **D12 (this entry):** `banned marketplace names = MARKETPLACE_ALIASES` →
   "banned everywhere outside `RENAME_EXEMPT_PREFIXES`. **NO block exemption.**"
2. **R2 (1922 packet):** match shape for identities is a **word-bounded exact
   name**.
3. **D11 `RECOVERY-M` step 2:** recovery sets `MARKETPLACE = 'kai-plugins'`,
   **`MARKETPLACE_ALIASES = ['kai']`**, in the same commit as the index rename.
4. **D11 step 3:** that commit runs `npm test` + the release guard and "**merge[s]
   through normal branch protection**" — i.e. through the `contract` job, which
   is where R2 lives by R2's own placement ruling.
5. **`scripts/lib/migration-doctor.mjs:51` — `export const LEGACY_PLUGIN = 'kai'`.**
   The banned string is simultaneously a live plugin identity.

**Consequence.** At the moment `RECOVERY-M` is invoked, the banned-marketplace-name
set becomes `{'kai'}` and is enforced across `agents/** skills/** scripts/**
docs/** .github/** README.md AGENTS.md`. The shipping surface at that moment
contains, **by design**, the ~19 `@kai` tokens B-2 swept in, plus
`RubenSaucedo/kai`, `.kai/`, `browse kai`, `<kai-plugin>`, and
`plugin-structure.md:227,231`'s `install kai@…` — where `kai` is the *monolith
identity*, not a marketplace. The recovery commit turns its own gate red.

**The finding is robust to the one ambiguity in the match shape.** Under a
regex-`\b` reading it is worse (`\bkai\b` matches the `kai` inside `kai-core`,
because `-` is a non-word character). Under the stricter
`[^A-Za-z0-9_-]` boundary that P2-1 just adopted for paths, `kai-core` is spared
— but `@kai`, `RubenSaucedo/kai`, `.kai/`, `browse kai` and `install kai@kai`
still match. **There is no reading under which the recovery PR is green.** Nor
does D12's marked block help: it carves out retired *identities* only, and
explicitly does not exempt marketplace names inside it.

**Why this is P1 and not P2.** The operator's options at that moment are (a) a
mass re-sweep far beyond step 2's stated scope ("no plugin name changes"), or
(b) editing the safety check itself during an incident. Both inside a
one-working-day bound, on the only recovery path for the only irreversible act.
A recovery capability that cannot pass its own gate is not a recovery
capability, and D11 correctly lands the runbook in **B-1 precisely so recovery
exists before the point of no return** — that property is not met if the runbook
does not work.

**It also creates a perverse dependency on P2-3's unverified fact.** If
`contract` **is** a required check, the recovery PR is blocked. If it is **not**,
the recovery PR merges red — recovery would depend on the gate *not* being
enforced. Either way the operator verification named in P2-3 stops being
"non-blocking, when convenient" (P2-5 below).

**The record never reconciles these two rulings.** D4's namespace hazard
(thread `:489-490`, "`LEGACY_PLUGIN === 'kai'` and `MARKETPLACE === 'kai'` are
the same string") names this collision for **code comparisons** and mandates the
`marketplace:` prefix at every comparison — but that reasoning is never carried
into R2's **prose** ban, where a bare banned name has no prefix to disambiguate
it. The hazard was found and then not followed one layer up.

**Required change.** Rule on how the banned-marketplace-name set behaves under
inversion. The remedy is an architecture call and I am not making it, but the
shape of the space is small: derive the ban from an **append-only retired
marketplace names** list decoupled from the live alias array (mirroring
`RETIRED_PACK_PLUGINS`, and consistent with this record's own append-only
discipline); **or** shape-anchor the match to token contexts (`@<name>`,
`browse <name>`, `marketplace:<name>`) so a bare identity cannot collide; **or**
state that `RECOVERY-M` re-sweeps the surface and carry that work explicitly in
step 2 with its effect on the one-working-day bound. Whichever is chosen, D11
step 2, D12's box, and R2's match shape must end up consistent with each other,
and `RECOVERY-M` must be shown green.

---

### P2 findings

**P2-1 · PROBE-M′ does not say which doctor build runs at step 5, and the default
reading produces a false wedge.** Step 5 runs `workspace-doctor.mjs
--migration-check --json` in the probe home. If that is the **B-1** build
(`MARKETPLACE = 'kai-plugins'`, `MARKETPLACE_ALIASES == []`), then a host
re-keyed to `kai` reads as unrecognised provenance, row 1's "the doctor reads a
recognised provenance" fails, row 2 does not fit, and the fail-closed default
("any observation that does not map cleanly onto row 1 or row 2 is outcome C")
scores **C — wedge** *by construction*, blocking B-2 and firing a spurious
boundary #5 escalation. Fails safe, so P2 not P1 — it cannot cause a bad merge,
only a false hold that burns the 5-working-day box. Specify that step 5 runs the
**B-2 candidate build**.

**P2-2 · D13's forbidden clause closes the alias-shaped repetition, not the
class.** The clause forbids the phrase *only provenance must be*
`` `marketplace:<alias>` ``, derived per alias. A future edit asserting the
**instruct-one** name — "its only provenance must be `marketplace:kai`" — is
caught by neither that clause (`kai` is not an alias) nor R2's alias ban, and
`` marketplace:${MARKETPLACE} `` is separately *required* to be present, so the
required and forbidden pins can coexist with contradictory prose (the pins are
whole-file `includes()` checks and cannot see predicate role). That is the same
defect one phrasing over. "Makes the defect unrepeatable" should be downgraded
the way A-5's proof claim was — the honest claim is "makes the observed phrasing
unrepeatable." Low probability, cheap to state.

**P2-3 · `managedBlock()` is a convention to extend, not a function to reuse.**
`validate-plugin.mjs:930-933` locates **one** block via `indexOf` and is written
for `#`-comment markers in `.gitignore`. D12 needs **multiple** blocks per file
with **HTML-comment** markers in Markdown, plus balance and non-emptiness
checks. "Same shape, same validator, same `contract` job" is fair; "nothing is
invented" is slightly overstated — a generalization of that helper is real work
and should be named so the implementer scopes it.

**P2-4 · `RECOVERY-M` bounds the decision but not the restoration.** "Recovery
decision within one working day" is the right lever and correctly justified
(every extra day grows the re-pointed population). But steps 2–7 then pass
through authoring, code-owner review and branch protection with **no stated
target**, and the exit condition is two-home verification with no bound. Under
stress the number an operator needs is time-to-restore. Either state a target or
state plainly that restoration latency is bounded by review turnaround and
accepted. Related: step 3's "if the failure mode is not understood, PROBE-M′ is
re-run … first" is discretionary — *understood by whom, decided when?* Under a
one-day bound a discretionary re-probe is where the day goes.

**P2-5 · P2-3's operator verification should move ahead of B-2.** Previously
recommended "when convenient." Given P1-5, whether `contract` is a required check
now determines whether the recovery path is *blocked* or *merges red*, so it
should be confirmed **before B-2 merges**, alongside PROBE-M′'s evidence. Command
already named by the architect; **not run — no shell in this session**, so this
remains `reported`.

**P2-6 (carried, unchanged) · none.** The six P2s from `REVIEW 2026-08-27-1944`
are all answered with mechanisms and I accept every disposition, including the
two self-corrections. No prior P2 is re-raised.

---

### Confirmations the packet asked for

**Nothing upheld was weakened.** Checked span by span against the amendments
index: D0, D2, D3, D5, D7 and *What stays the same* are untouched; R1 is
unchanged and still green on today's tree; R2's five sites remain covered (the
carve-out cannot reach them); `stale-source`-as-`note` is preserved and is what
makes D13's installer/doctor agreement work; the D5 one-list/three-consumer fix
is intact; M3-before-M4 sequencing is unchanged. D13's relocation keeps "a
**single** recognised kai marketplace" and the mixed-provenance/unknown-enabled
refusals, so no fail-closed property is relaxed. Moving the installer edit from
B-2 to B-1 does not weaken B-2's mechanical-completeness claim — it removes a
literal from the sweep set rather than exempting one.

**No production code, manifest, or marketplace change has been made — confirmed
by inspection.** None of the design's constructs (`MARKETPLACE_ALIASES`,
`RETIRED_PACK_PLUGINS`, `isKaiMarketplace`, `LEGACY_TREE_DIRS`,
`RENAME_EXEMPT_PREFIXES`, retired-identity block, `RECOVERY-M`, `stale-source`)
appears anywhere outside the two coordination files. `.github/plugin/marketplace.json:2`
is still `"kai-plugins"`, `:10` still `"installSurface": "packs"`, `:15` still
`"./packs/kai-core"`; `pack-plan.mjs:49` is still `PACKS_DIR = 'packs'`;
`plugin-structure.md` is unedited. **Milestone 1's acceptance line holds.**
*Limit, stated honestly:* with no shell I cannot run `git status`, so "no
uncommitted change anywhere in the tree" is `reported`; what is `observed` is
that no file outside `kai/coordination/**` contains any part of this design.

---

### Reliability assessment summary

| Area | Finding |
|---|---|
| **Gate placement** | **Resolved.** Gate precedes the only irreversible act; D9 re-tested rather than restated; hold state, owner, time box, fail-closed truth table and escalation route all present. |
| **Probe validity** | **Sound for its purpose, correctly not over-read.** Generalizes to host resolution semantics; does **not** generalize to the installed base — which the record states itself. One build-selection gap (P2-1) that fails safe. |
| **Recovery & rollback** | **Runbook now real — detection, threshold, seven steps, owners, two-home verification, layer-2 prohibition — but not executable as written (P1-5).** Its mechanism is blocked by the record's own detection check. |
| **Concentration risk** | **Material and now demonstrated.** One construct serves forward migration and rollback. Recognition itself is safe under inversion — `MARKETPLACE_NAMES` is the *same set* either way, so `isKaiMarketplace()` cannot regress in recovery, and B-2 pre-exercises it via the append-only fixtures. The coupling that bites is not recognition but **enforcement**: the ban derived from the same array. |
| **Detection** | Not weakened. Carve-out is exactly as wide as the requirement; two anti-rot guards. Class closure over-claimed in one bounded way (P2-2). |
| **Enforcement status** | Still `reported`, correctly downgraded everywhere. Now load-bearing for recovery, so it should precede B-2 (P2-5). |

**No operator decision is required by this review.** PROBE-M′ remains an operator
*action*; P2-5 is an operator *verification*, not a decision. I am assigning no
human on-call obligation — `RECOVERY-M`'s owners are role assignments within a
procedure, not a rota, and that is appropriate.

**Not reached / out of my lane:** release packing and which patch versions
publish (`principal-swe-manager`); the three steward NOTEs; the M4 compound-state
requirement routed to `area-taxonomy-split`. No reliability objection to any.

---

### Handoff

- did:       Re-ran `independent-reliability` review, bound to the **`DECISION 2026-08-27-2001`** revision entry at item version 10 (`change_ref: null`, knowledge item), read with the 1922 packet it amends. Re-derived ~20 new line citations against source rather than trusting the summary — **all resolve**, including the five `migration-doctor.mjs` citations P1-2's ruling rests on, and `MARKETPLACE` proved to occur in only three places in that file, making "exactly one token-carrying step" a complete enumeration rather than a sample. **All four prior P1s discharged:** gate re-placed ahead of the irreversible act with D9 genuinely re-tested; `RECOVERY-M` authored with all seven properties; the carve-out split two ways with R2 verified not weakened; the agent-procedure layer named and the predicate relocated to the doctor onto an existing pin (`validate-plugin.mjs:897`). Answered the generalization question put to me: PROBE-M′ generalizes to **host resolution semantics** and not to the **installed base**, which is what the record itself says, so its framing survives. **Verdict `changes-requested` on one NEW P1 in the material this revision added** — the concentration risk the packet asked me to assess, in concrete form: `RECOVERY-M` step 2 inverts `MARKETPLACE_ALIASES` to `['kai']`, which by D12's own derivation arms R2's marketplace-name ban on a string that is simultaneously the monolith identity (`migration-doctor.mjs:51`), the repo slug, and the ~19 `@kai` tokens B-2 creates by design — so the recovery patch turns red the gate it must merge through, inside a one-working-day bound. Confirmed nothing upheld was weakened, and confirmed by inspection that **no production code, manifest, or marketplace change has been made**. No production code written; nothing under `scripts/`, `packs/`, `plugin.json`, `agents/`, `skills/`, or `docs/` touched; `kai/initiatives/area-plugins/` not created, no `mkdir` attempted; `area-plugins-m2-standalone-copy` and its thread not touched.
- state:     ready
- needs:     `principal-swe-architect` to resolve **one P1** in a new DECISION entry: (P1-5) reconcile D11 step 2, D12's `banned marketplace names = MARKETPLACE_ALIASES` box, and R2's word-bounded match shape so that `RECOVERY-M` is demonstrably green — via an append-only retired-marketplace-names list, a token-shape-anchored match, or an explicit re-sweep carried in step 2 with its cost against the one-day bound. The five P2s should be answered or explicitly accepted in the same pass; P2-1 (name the B-2 candidate build in PROBE-M′ step 5) and P2-5 (move the `contract` verification ahead of B-2) are the two with operational consequence. A re-review by `principal-sre` is required — this review does not carry forward.
- artifacts: kai/coordination/threads/area-plugins-migration-architecture.md (this REVIEW entry — the durable reliability artifact while `kai/initiatives/area-plugins/` cannot be created); kai/coordination/items/area-plugins-migration-architecture.md (version 11, `ready`, lease null, `next_role: principal-swe-architect`, two entries in `completed_reviews`)
- evidence:  `scripts/lib/migration-doctor.mjs:51` (`LEGACY_PLUGIN = 'kai'` — the banned string is a live plugin identity), `:56` (`MARKETPLACE`), `:633,655,719,720` (uninstall/list steps marketplace-free — verbatim), `:740` (the only tokened `step()`), `:854` (the only tokened notice; `MARKETPLACE` occurs at `:56,740,854` **only** — complete enumeration), `:622-631` (`provenance-collision` keyed by plugin name), `:864-871` (`finish()`); `scripts/validate-plugin.mjs:715` (duplicate `MARKETPLACE_NAME`), `:884-907` (required-text list read in full — no provenance string), `:897` (`use its \`plugins\` inventory for enabled state and provenance` — the pin D13 relocates onto), `:930-933` (`managedBlock`, single-block `indexOf`, `#`-marker syntax); `scripts/workspace-doctor.mjs:665` (19th site, verbatim), `:953` (`provenances.includes('marketplace:kai-plugins')` — already ruled on by D4's derive requirement); `scripts/lib/pack-plan.mjs:49` (`PACKS_DIR = 'packs'`, unchanged); `docs/reference/plugin-structure.md:126,191-192,204,206,208,212,220,227,228-229,231,233` (publication model + emergency rollback runbook, all verified), `:194-203` (the precedent for naming unexercised host semantics as inferred, not gated); `AGENTS.md:102-103,131`; `skills/kai-core-workspace-onboarding/SKILL.md:64,74,123,144`; `.github/plugin/marketplace.json:2,10,15` (still `kai-plugins` / `packs`, unchanged); `.github/workflows/validate.yml:31,42,71`, `.github/CODEOWNERS:2` (in-repo assertions about out-of-repo config — `reported`); thread `:489-490` (D4's namespace hazard, not carried into R2's prose ban), `:834` (R2 match shape), `:1658-1659` (`RECOVERY-M` steps 2-3), `:1744` (D12's banned-set box). All read 2026-08-27 from `C:\src\kai` by file. No shell; nothing executed.
- questions: none blocking, and **nothing routed to `@operator` as a decision** — no decision is required and I am not manufacturing one. One operator **verification** is now recommended **before B-2** rather than when convenient (P2-5): confirm `contract` is a required status check on `main`, because P1-5 makes recovery's behaviour depend on it. Command already named in the revision; not run here.
- next:      `principal-swe-architect` — `area-plugins-migration-architecture` (`ready`, version 11, lease clear, `next_role: principal-swe-architect`) to resolve P1-5 and answer the five P2s in a new DECISION entry, then return to `principal-sre` for re-review. Milestone `decisions-locked` stays **open**: this item's `independent-reliability` requirement is **not** discharged (`satisfies_requirement: false`). `area-plugins-m2-planpacks-prefix` and the milestone-2 code chain remain gated. Dispatch is `director-chief-of-staff`'s.

---

## DECISION 2026-08-27-2028 — principal-swe-architect (revision 3, resolving REVIEW 2026-08-27-2015)

**initiative:** area-plugins · **milestone:** decisions-locked

# Architecture Decision, revision 3 — enforcement is not the inverse of recognition

**Source:** `REVIEW 2026-08-27-2015 — principal-sre` in this thread
(`changes-requested`, P0 0 / P1 1 / P2 5), against the `DECISION 2026-08-27-2001`
revision. Item record at `ready` / version 12, lease
`apx-mig-fix2-20260827-2020-i1`, `version_at_grant` 11, expires
2026-08-27-2320 — re-read and matched immediately before this write. No
collision.
**Date:** 2026-08-27 20:28 local
**Run:** principal-swe-architect

**Decision (one line):** `MARKETPLACE_ALIASES` is a **recognition** set and must
never again be an **enforcement** source — R2's prose ban is re-derived from an
explicit `RETIRED_MARKETPLACE_NAMES` list minus the live `MARKETPLACE`, so
`RECOVERY-M`'s inversion cannot arm a ban on `kai`, and the recovery patch is
green through its own gate.

**Narrow corrective pass. This entry is additive; nothing above is rewritten.**
It touches exactly three things: D12's banned-set box, `RECOVERY-M` steps 2/3/7,
and PROBE-M′ step 5. Everything the reviewer upheld across both reviews — layer
separation, renamed index, dual-publish rejection, `stale-source` as a `note`,
D5's one-list/three-consumer fix, D10's gate placement, D11's runbook shape,
D12's retired-identity block, D13's relocation, R1, R2's five sites, M3-before-M4
— stands verbatim and is not reopened.

---

## Evidence register — additions, all re-read by file this session

Read from `C:\src\kai` on 2026-08-27. `observed` unless marked. No shell;
nothing executed.

- `scripts/lib/migration-doctor.mjs:44` — `import { PACK_ORDER, packPluginName }
  from './pack-plan.mjs'`; `:51` — `export const LEGACY_PLUGIN = 'kai';`;
  `:52-54` — `CORE_PLUGIN` / `PACK_PLUGINS` / `DEPARTMENT_PLUGINS`, all derived
  from `packPluginName`; **`:55` — `export const KAI_PLUGINS = new
  Set([LEGACY_PLUGIN, ...PACK_PLUGINS]);`**; `:56` — `export const MARKETPLACE =
  'kai-plugins';`.
- `scripts/lib/migration-doctor.mjs:357,363,364,463,485,487` — the five existing
  `KAI_PLUGINS` consumers (`looksKaiName`, `looksKai`, and the two entry/tree
  name resolutions). It is a live, load-bearing set, not a dormant export.
- **`MARKETPLACE` re-derived independently this session: `:56`, `:740`, `:854` —
  three occurrences, whole file.** Confirms the reviewer's complete enumeration
  rather than restating it.
- `scripts/lib/pack-plan.mjs:49` — `PACKS_DIR = 'packs'` (unchanged); `:63` —
  `export const PACKS = {`; `:99` — `PACK_ORDER = Object.keys(PACKS)`; `:151` —
  `packPluginName = (pack) => (pack === 'core' ? 'kai-core' : \`kai-${pack}\`)`.
- **`scripts/validate-plugin.mjs:48` — `import { MARKETPLACE } from
  './lib/migration-doctor.mjs';`** The import edge D14 needs **already exists**.
- `scripts/validate-plugin.mjs:860-862` — `guidedInstallCommands` built as
  `` `copilot plugin install ${packPluginName(pack)}@${MARKETPLACE}` ``; `:878` —
  `` `copilot plugin marketplace browse ${MARKETPLACE}` ``; `:898-899` — two
  `enable` spans interpolating `${MARKETPLACE}`. **These are the required pins
  that flip with the constant** — load-bearing for the recovery ruling below.
- `scripts/validate-plugin.mjs:884-907` — the required-text loop; `:930-933` —
  `managedBlock()`, `indexOf`-based single block, `# >>> kai workspace` /
  `# <<< kai workspace` markers; `:714-715` — `MARKETPLACE_REL` and the duplicate
  `const MARKETPLACE_NAME = 'kai-plugins'`, consumed at `:792`.
- `skills/kai-core-fleet-observation/SKILL.md:90` — "the user is working inside
  the **kai** repo"; `:94` — "`kai-plugins/kai` for a marketplace install and
  `_direct/RubenSaucedo--kai`". **Both readings of `kai` in one file: a bare word
  and a plugin name inside a path.**
- `docs/reference/plugin-structure.md:206,208,212,220,227,228-229,231,233` —
  re-verified verbatim, including the reviewer's `:220` correction for "derived
  from `PACKS`". `:227` and `:231` are `install kai@kai-plugins`, where **`kai` is
  the plugin name, not the marketplace**.
- `scripts/workspace-doctor.mjs:665` — `steps: [/copilot plugin install
  kai-core@kai-plugins/]`, re-verified verbatim.

---

## Diagram — the seam: one array was carrying two responsibilities

```
  BEFORE  (D12's box) — recognition and enforcement share one source

                      ┌─────────────────────────────────┐
                      │      MARKETPLACE_ALIASES        │
                      │      (live recognition set)     │
                      └────────┬───────────────┬────────┘
             recognition ──────┘               └────── enforcement
                   │                                        │
                   ▼                                        ▼
      MARKETPLACE_NAMES = {MARKETPLACE} ∪ ALIASES   banned marketplace names
      isKaiMarketplace() — doctor, layer 3          R2 prose ban — contract job
                   │                                        │
      SYMMETRIC under inversion:                  ANTISYMMETRIC under inversion:
      the set is {kai, kai-plugins} either        forward bans `kai-plugins`
      way, so recognition cannot regress          RECOVERY bans `kai`
                                                            │
                                                            ▼
                                    `kai` is also LEGACY_PLUGIN (mig-doctor:51),
                                    the repo slug, `.kai/`, `kai-plugins/kai`
                                    (fleet-observation:94), `install kai@…`
                                    (plugin-structure:227,231), and every
                                    marketplace token B-2 swept to `@kai`
                                                            │
                                                            ▼
                                    ✗  RECOVERY-M step 2 turns its own gate RED

  AFTER  (D14) — the two responsibilities no longer share a source

    MARKETPLACE ─────────────┬──────────────────────────────────┐
      (instruct-one)         │                                  │
                             ▼                                  ▼
    MARKETPLACE_ALIASES ► MARKETPLACE_NAMES            banned marketplace names
      (recognise-many)      = {MARKETPLACE} ∪ ALIASES    = RETIRED_MARKETPLACE_NAMES
      RECOGNITION ONLY.     doctor + installer                \ { MARKETPLACE }
      No enforcement        (layer-3 recognition,                      ▲
      surface may derive     unchanged)                                │
      from it.                                          RETIRED_MARKETPLACE_NAMES
                                                        explicit reviewed entry,
                                                        never derived from ALIASES
                                                        guard: ∩ KAI_PLUGINS = ∅
                                                               (mig-doctor:55)

  The subtraction is the whole trick:

    B-2      MARKETPLACE='kai'          RETIRED=['kai-plugins']  ⇒ ban {kai-plugins}
    RECOVERY MARKETPLACE='kai-plugins'  RETIRED=['kai-plugins']  ⇒ ban {}          ✔
    RE-TRY   MARKETPLACE='kai'          RETIRED=['kai-plugins']  ⇒ ban {kai-plugins}

  Nobody edits a list under stress. The ban follows the constant, in both
  directions, and `kai` never enters the set in any direction.
```

---

## D14 — P1-5 · `MARKETPLACE_ALIASES` is recognition-only; the ban is derived from retirement · **Decouple. Accept in full.**

**The finding is correct, and it is my defect, in exactly the place the reviewer
names it.** D4 found the namespace hazard — `LEGACY_PLUGIN === 'kai'` and
`MARKETPLACE === 'kai'` are the same string in the same module — and ruled *"the
`marketplace:` prefix is mandatory at every comparison; never compare a bare name
against a bare provenance."* I bound that rule to **code** comparisons and never
carried it into R2's **prose** ban, where the match is a bare name with no prefix
to disambiguate it. Then D11 inverted the array the ban derives from. The two
rulings were never put in the same room.

**Root cause, in one sentence:** I derived a **historical** fact ("this name is no
longer the source of truth") from a **current** array ("these names are still
recognised") — which is precisely the D5 defect this record already found once,
one layer up. D5's fix was an explicit append-only list; so is this one.

### The ruling

```
  banned identity strings   = RETIRED_PACK_PLUGINS                    [unchanged]
      → LEGAL inside a marked retired-identity block; banned everywhere else
      → match: word-bounded exact name                                [unchanged]

  banned marketplace names  = RETIRED_MARKETPLACE_NAMES \ { MARKETPLACE }   [D14]
      → banned everywhere outside RENAME_EXEMPT_PREFIXES.  NO block exemption.
      → match: word-bounded exact name                                [unchanged]
      → entry guard: RETIRED_MARKETPLACE_NAMES ∩ KAI_PLUGINS = ∅      [D14]

  banned path prefixes      = LEGACY_TREE_DIRS                        [unchanged]
      → banned everywhere outside RENAME_EXEMPT_PREFIXES.  NO block exemption.
      → match: (^|[^A-Za-z0-9_-])<dir>/                               [unchanged]

  NEGATIVE RULE (the class closure):
      No enforcement surface derives from MARKETPLACE_ALIASES.
      It is a recognition set. It answers "does the doctor accept this
      provenance", never "may this string appear in shipping prose".
```

**Four properties, each doing one job:**

1. **`RETIRED_MARKETPLACE_NAMES` lives beside `MARKETPLACE` in
   `scripts/lib/migration-doctor.mjs:56`** — same module as the guard set it is
   checked against (`KAI_PLUGINS`, `:55`), and reachable by the ban check over the
   import edge that **already exists** at `scripts/validate-plugin.mjs:48`. No new
   import, no new module, no new file. It ships **empty** in **A-2** beside
   `MARKETPLACE_ALIASES = []` and `RETIRED_PACK_PLUGINS = []` — byte-neutral by the
   same argument A-2 already makes — and A-3's check still lands green on an empty
   source. The entry `'kai-plugins'` is added in **B-2**, the same one-line-per-
   constant PR that flips `marketplace.json:2` and `MARKETPLACE`. Same self-arming
   discipline used everywhere else in this record: mechanism first and empty, data
   edit later.
2. **The subtraction `\ { MARKETPLACE }` is what makes recovery green without an
   edit.** A name that is currently *served* can never be banned in prose that
   *instructs* it, whichever direction the rename is pointing. Under recovery
   `MARKETPLACE` becomes `kai-plugins`, the subtraction empties the ban, and the
   operator does not have to remember to prune a list while an incident is running.
   It also re-arms automatically if the rename is re-attempted. **This is the
   property that answers "executable under stress": the correct behaviour is the
   default, not a step.**
3. **The entry guard is the mechanical form of D4's namespace hazard, one layer
   up.** `RETIRED_MARKETPLACE_NAMES ∩ KAI_PLUGINS = ∅` — one condition, checked
   against an **existing exported set** (`migration-doctor.mjs:55`) that already
   contains `kai` via `LEGACY_PLUGIN` (`:51`) and every `packPluginName()` output
   (`:52-53`, `pack-plan.mjs:151`). A future engineer who "helpfully" inverts the
   retired list during an incident gets a **red self-test naming the collision**,
   not a red whole-tree ban with a page of hits. Same mechanism class as P2-2's
   witness arm from the previous pass — a regression witness in an existing
   self-test, not a second source of truth. `kai-plugins` passes the guard today
   (no pack is named `plugins`); if one ever were, the guard firing would be
   correct.
4. **`MARKETPLACE` may itself appear in `RETIRED_MARKETPLACE_NAMES`** — that is
   the recovery state, and it is legal precisely because the subtraction, not an
   error, is what handles it. The guard deliberately does **not** test against
   `MARKETPLACE`, or it would fire during recovery and re-create the P1 in a new
   shape.

### Why not the other two shapes the reviewer named

- **Token-shape anchoring alone (`@<name>`, `browse <name>`,
  `marketplace:<name>`) — rejected as the primary remedy.** It does not resolve
  the force: under inversion `@kai` is exactly the shape B-2 creates by design, so
  the recovery patch is still red — the reviewer verified this. It would also
  require re-proving R2's five sites under a new match shape (
  `kai-plugins/kai` at `fleet-observation/SKILL.md:94` is *not* in any of those
  token contexts and would fall out of coverage), and it collides with D13, which
  deliberately permits `marketplace:<alias>` to be **named as recognised**. More
  change, more risk, and the force survives it.
- **An explicit re-sweep carried in step 2 — rejected as the mechanism, adopted
  as a *consequence*.** Making the ban's inversion legal by paying for it in
  incident time is backwards: it puts a whole-tree diff on the critical path to
  satisfy a check that should not have fired. The prose sweep-back is still
  required for correctness, and it is carried in step 2 below — but because the
  *served token changed*, not because a ban demands it.

**Reversibility.** Cheap. `RETIRED_MARKETPLACE_NAMES` is one exported constant
and one set expression in a check that has not shipped yet; A-2/A-3 land it empty
and green. If the positive form is ever wanted instead (below), it replaces this
at the same seam.

---

## `RECOVERY-M` shown green — the check the reviewer required

Evaluated against the shipping surface at the moment the recovery commit reaches
the `contract` job, i.e. after B-2 and at or after milestone 4 (the worst case,
because `RETIRED_PACK_PLUGINS` is non-empty by then).

| gate arm | state at recovery | result |
|---|---|---|
| **banned marketplace names** | `RETIRED_MARKETPLACE_NAMES=['kai-plugins']`, `MARKETPLACE='kai-plugins'` ⇒ `{} ` | **green.** `kai` is not in the set and cannot be — the guard forbids it and nothing derives the set from `MARKETPLACE_ALIASES` |
| **banned identity strings** | `RETIRED_PACK_PLUGINS=['kai-personal']`; its only shipping occurrence is `plugin-structure.md:228-229`, inside D12's marked block; `RECOVERY-M`'s own prose names **no** retired identity (step 6 prohibits uninstall order and the monolith) | **green** |
| **banned path prefixes** | `LEGACY_TREE_DIRS=['packs']`; the recovery commit introduces no `packs/` string — it is a layer-3 change and does not touch the tree | **green** |
| **required derived pins** (`validate-plugin.mjs:861,878,898-899`, and D13's `` marketplace:${MARKETPLACE} ``) | interpolate `MARKETPLACE`, which the commit flips ⇒ **red until `skills/kai-core-workspace-onboarding/SKILL.md` is re-derived in the same commit** | **green once step 2 includes it** — one file, and the check names every failing span |
| **R1** (derived provider-root placeholder rule) | unaffected by a marketplace name | **green** |
| **D7** (PR diff ∩ `RENAME_EXEMPT_PREFIXES` = ∅) | recovery touches `.github/plugin/marketplace.json`, `scripts/**`, `skills/**`, `docs/**`, `README.md`, `CHANGELOG.md` — and `CHANGELOG.md` **is** exempt-listed | **needs the release-notes carve-out already in D7**: the changelog entry is an append, which `release-guard` requires and D7's assertion must not forbid. Flagged for the implementer as the one interaction to get right; it is the same interaction every release PR already has |

**So the recovery patch is green, and the one thing it must not forget is
mechanical and enumerated by the check itself.** That is the difference between a
runbook that works and one that reads well.

---

## Amendments to `RECOVERY-M` — steps 2, 3 and 7

Superseding the corresponding rows of D11's table. Every other row, the detection
signal, the threshold, the owners, the wedged-host branch and the layer-2
prohibition are **unchanged**.

> **Step 2 (replaces D11 step 2) — forward patch release. Start from the revert,
> not from a hand-authored diff.**
>
> `git revert <B-2 merge commit>`, then set `MARKETPLACE_ALIASES = ['kai']`.
> That is the whole edit.
>
> - The revert restores `.github/plugin/marketplace.json:2` to `"kai-plugins"`,
>   `MARKETPLACE` to `'kai-plugins'`, `RETIRED_MARKETPLACE_NAMES` to `[]`, **and
>   every prose marketplace token B-2 swept to `@kai`** — in one mechanical
>   operation, with no site list to remember and no judgment calls. The recovery
>   diff is B-2's diff read backwards, which is the cheapest possible review under
>   stress and the only form of this change a reviewer can check by eye at speed.
> - **The prose sweep-back is required for correctness, not by a ban.** After
>   recovery the served index name is `kai-plugins`; prose still instructing
>   `@kai` would send a *new* installer to a marketplace token their host does not
>   have. The gate catches the installer-skill subset by itself
>   (`validate-plugin.mjs:861,878,898-899` interpolate `MARKETPLACE`); the revert
>   catches the rest.
> - **Within A1's exception.** The installer-skill spans are generator-derived
>   (i), pinned by a check that derives them from `MARKETPLACE` (ii), and change
>   no instruction, judgment, persona, capability, procedure or example semantics
>   (iii).
> - **Still zero identity movement.** B-2 is the marketplace release; the folder
>   rename shipped in Release A and is not reverted. `installSurface` stays
>   `packs`. No plugin name changes. The layer-3 property D11 rests on is
>   preserved by construction.
> - **`RETIRED_MARKETPLACE_NAMES` needs no attention either way.** Reverted to
>   `[]` by the revert, or left at `['kai-plugins']` if the operator patches by
>   hand — the subtraction makes both green. The operator cannot get this wrong.
> - Changelog and README notice per `release-guard`, as in D11.

> **Step 3 (replaces D11 step 3) — gate, and the re-probe is no longer
> discretionary.** (P2-4)
>
> `npm test` + the exact release guard; merge through normal branch protection.
> Merging is the republish, same as B-2.
>
> - **Default: PROBE-M′ is NOT re-run.** Recovery restores the state the installed
>   base was already in — `kai-plugins` served — which is the *known-good* state.
>   The probe exists to reduce uncertainty about a **novel** state, and there is
>   none here.
> - **Exception, decided at step 1 by the decision owner and never later:** if the
>   detection signal was #1 or #2 (host resolution — `browse` incomplete, or
>   `update <name>@kai` failing on a host the doctor reports as `marketplace:kai`),
>   the fault may be in host resolution rather than in the index name; then
>   PROBE-M′ is re-run against the inverted state **in parallel with packing the
>   patch, never ahead of it**. If the signal was #3 (doctor-reported collision or
>   unknown provenance), no probe — the evidence is already in hand.
> - **If `contract` is not a required status check** (the P2-5 verification),
>   this step gains one line: the operator reads the `contract` job's output by
>   eye before merging, because red will not stop the merge. The runbook is
>   correct under **both** answers; the verification informs the procedure rather
>   than blocking it.

> **Step 7 (extends D11 step 7) — exit condition.** Unchanged, plus: **no
> shipping prose instructs a marketplace token other than `MARKETPLACE`** —
> satisfied by construction when step 2 is a revert, and re-checked by the
> installer pins in the same `contract` run.

**Time bounds — decision *and* restoration.** (P2-4)

| bound | target | lever if it slips |
|---|---|---|
| detection signal → recovery **decision** | **1 working day** (unchanged) | the decision owner; every extra day grows the re-pointed population |
| decision → recovery commit **merged** | **1 working day** | code-owner review turnaround — a **human dependency, not a mechanism**; `@operator` is the escalation because the lever is review attention |
| merge → **both-home verification** complete (steps 4–5) | **1 working day** | `principal-sre` verifies; the exit condition is a doctor result, not an assertion |

**Worst case: three working days from detection to verified restoration**, stated
as a target and not as a guarantee, because two of the three legs are bounded by
human review. No rota and no on-call obligation is created — the owner is a
procedure, as the reviewer noted, and that is unchanged.

---

## P2 dispositions — all five, from `REVIEW 2026-08-27-2015`

**P2-1 · PROBE-M′ step 5 does not name the doctor build. ACCEPTED — fixed, plus
one clause the reviewer did not ask for.**
Step 5 becomes: *run the **B-2 candidate build** — the exact commit proposed for
B-2 (`MARKETPLACE='kai'`, `MARKETPLACE_ALIASES=['kai-plugins']`,
`RETIRED_MARKETPLACE_NAMES=['kai-plugins']`) — invoked by path from that
checkout:* `node "<b2-candidate-checkout>/scripts/workspace-doctor.mjs"
--migration-check --json`. Row 1's clause "the doctor reads a recognised
provenance" is evaluated **only** under that build. The reviewer is right that the
B-1 build (aliases empty) reads a re-keyed host as unrecognised and scores C by
construction.
**The added clause:** a step-5 run under any build other than the B-2 candidate is
**void, not outcome C** — it is re-run, not scored. Without this, the fail-closed
default converts an operator's build slip into a spurious boundary-#5 escalation.
Fail-closed must mean *ambiguous observations are wedges*, not *invalid
observations are wedges*.

**P2-2 · D13's forbidden clause closes the phrasing, not the class. ACCEPTED —
claim downgraded, and the counterexample closed for one word's cost.**
- **Downgraded, in the same terms as A-5's proof claim:** the honest claim is
  *"makes the observed phrasing unrepeatable for every recognised name"* — **not**
  "makes the defect unrepeatable". A paraphrase escapes a literal pin, and no
  `includes()` check can see predicate role. That sentence in D13 is superseded by
  this one.
- **The counterexample is closed:** the forbidden phrase derives over
  **`MARKETPLACE_NAMES`** (instruct-one ∪ aliases), not over aliases alone. So
  *"its only provenance must be `marketplace:kai`"* is now caught as well as the
  alias form. No contradiction with the required pin: the *required* text is the
  string `` marketplace:${MARKETPLACE} `` appearing somewhere; the *forbidden*
  text is the assertion of **exclusivity** around any recognised name. Different
  spans, and a file can name a marketplace without declaring it the only one.
- **Where the class actually closes:** D13's **relocation** — the predicate is not
  in prose at all any more. The pin is a backstop against reintroduction, not the
  primary control. Stating that plainly is what the reviewer asked for.

**P2-3 · `managedBlock()` is a convention to extend, not a function to reuse.
ACCEPTED — claim corrected, work named.**
"Nothing is invented" was overstated. **Corrected:** the *convention* (marker-
delimited managed spans), its *validator home* and its *`contract` job* are
reused; the *helper is generalized*. Verified at `validate-plugin.mjs:930-933`:
it finds **one** block by `indexOf`, keyed to `# >>> kai workspace` /
`# <<< kai workspace`. D12 needs three things it does not do — (a) every block in
a file, not the first; (b) HTML-comment markers for Markdown alongside the
`#` markers for `.gitignore`; (c) balance and non-emptiness errors. That is
bounded, single-function work and it is named in the **A-3** PR description so the
implementer scopes it rather than discovering it. It does not change A-3's
green-on-arrival property: the generalized helper finds zero blocks on today's
tree, which is not an error.

**P2-4 · `RECOVERY-M` bounds the decision, not the restoration; step 3's re-probe
is discretionary. ACCEPTED — both fixed above.** Restoration target table added
(1 + 1 + 1 working days, with the honest note that two legs are review-bound and
the lever is `@operator`'s attention, not engineering); step 3's discretion
removed and replaced with a default of *no re-probe* plus a signal-keyed
exception decided at step 1. The reviewer's diagnosis — "under a one-day bound a
discretionary re-probe is where the day goes" — is exactly right, and the deeper
fix is that recovery restores a **known-good** state, so the probe has nothing to
learn.

**P2-5 · The `contract` required-check verification moves ahead of B-2. ACCEPTED —
promoted from "when convenient" to a named merge prerequisite.**
It joins PROBE-M′'s evidence on B-2's merge checklist:
`gh api repos/RubenSaucedo/kai/branches/main/protection --jq
'.required_status_checks.contexts'` must contain `contract`.
**Not run — this session has no shell. It is `reported`, never `observed`**, here
and everywhere else in this record.
- **If `contract` is required:** D14 is load-bearing — without it the recovery PR
  would be *blocked*, and recovery would not exist.
- **If it is not required:** R1, R2 and D7 degrade from "cannot merge" to "red but
  bypassable" — detection survives, enforcement does not — and the recovery PR
  could merge red. Step 3 above already carries the one line that makes the
  runbook correct in that world.
- **Still an operator *verification*, not a decision.** It reads existing
  configuration; nobody chooses anything. It adds no gate, job or step — the
  `contract` job already exists (`.github/workflows/validate.yml:31,42`).

---

## Re-verification the packet demanded: R2 is not weakened, and the stranding class stays closed

**1 · The forward ban set is byte-identical, so R2's coverage is unchanged.**
At B-2 the old derivation gave `MARKETPLACE_ALIASES = ['kai-plugins']` ⇒
`{kai-plugins}`. The new derivation gives `RETIRED_MARKETPLACE_NAMES
= ['kai-plugins']` minus `MARKETPLACE = 'kai'` ⇒ `{kai-plugins}`. **Same set,
same word-bounded match shape, same scanned surface, same
`RENAME_EXEMPT_PREFIXES`, same no-block-exemption policy.** Nothing about how a
site is matched changed, so no site can fall out of coverage — which is why I did
not take the shape-anchoring remedy.

**2 · Spot-checked against the two sites that would break first**, re-read this
session: `skills/kai-core-fleet-observation/SKILL.md:94` (`kai-plugins/kai`) is
still matched by the exact-name rule — it is not in any command-token context and
would have been **lost** under shape anchoring; `docs/reference/plugin-structure.md:227,231`
(`install kai@kai-plugins`) is still swept on `kai-plugins` while its `kai` — a
**plugin** name — stays untouched, which is the distinction the whole finding
turns on.

**3 · The two sets can now diverge only by an explicit reviewed edit**, guarded by
`∩ KAI_PLUGINS = ∅`. Before, they diverged silently whenever anyone changed an
alias for a recognition reason. That is a strictly tighter regime, not a looser
one.

**4 · The silent-stranding class R2 exists to close.** The class is: *a shipping
prose literal names a source that is no longer served, and no gate reads prose.*
- **Forward direction (`kai-plugins` stale after B-2): fully covered, unchanged.**
- **Reverse direction (`@kai` stale after recovery):** the ban **cannot** cover
  it, because the string is unbannable — that is the finding, not a gap I chose.
  It is covered instead by (a) the **required derived pins** at
  `validate-plugin.mjs:861,878,898-899`, which flip with `MARKETPLACE` and go red
  until the installer skill is re-derived — gate-enforced, and it is the guided
  installer, the highest-traffic path; and (b) **step 2 being a revert**, which
  sweeps the rest mechanically, plus step 7's exit condition.
- **Residual, named honestly:** the docs/README half of the reverse sweep is
  **runbook-enforced, not gate-enforced**. If an operator hand-authored the
  recovery patch instead of reverting and skipped a doc, stale prose would ship
  with nothing red. Its blast radius is a **new** installer hitting an
  unresolvable token — a loud failure at first use, not a silent stranding of an
  existing install, and it is repairable by an ordinary PR.
- **Why I accept that residual rather than build the symmetric control.** The
  gate-enforced form is a **positive** rule — *every marketplace token in shipping
  prose names `MARKETPLACE`* — which is inversion-symmetric by construction and is
  the right long-term mechanism. It is not the right change *in a narrow
  corrective pass*: it replaces the match shape for a set whose five sites are
  proven under the current shape, it must be reconciled with D13's deliberate
  permission to name an alias as recognised, and it would need its own review.
  **Trigger to reopen (Defer, with the signal named):** the first time `RECOVERY-M`
  is actually invoked, **or** a second marketplace rename is proposed, the
  positive rule replaces the negative one at this same seam, deriving from the
  same constant.

---

## Amendments index — what this entry changes

| target | status after this entry |
|---|---|
| D12 — banned-set box | **Amended.** `banned marketplace names = RETIRED_MARKETPLACE_NAMES \ { MARKETPLACE }`, with the entry guard and the negative rule. Match shapes, carve-out policies and the retired-identity block are **unchanged**. |
| D11 `RECOVERY-M` step 2 | **Replaced.** Start from `git revert <B-2 merge>`; set `MARKETPLACE_ALIASES = ['kai']`; installer-skill pins re-derive in the same commit. |
| D11 `RECOVERY-M` step 3 | **Replaced.** Re-probe default is *no*, exception keyed to the detection signal and decided at step 1; the `contract`-not-required branch stated. |
| D11 `RECOVERY-M` step 7 | **Extended.** Exit condition adds "no shipping prose instructs a token other than `MARKETPLACE`". |
| D11 — time bound | **Extended.** Restoration targets added beside the decision bound. |
| D10 `PROBE-M′` step 5 | **Amended.** Runs the **B-2 candidate build**; a run under any other build is **void**, not outcome C. |
| D13 — forbidden clause | **Corrected and widened.** "Unrepeatable" downgraded to "the observed phrasing, for every recognised name"; derivation moves from `MARKETPLACE_ALIASES` to `MARKETPLACE_NAMES`. |
| D12 — "nothing is invented" | **Corrected.** Convention and validator home reused; the helper is generalized — named work in A-3. |
| A-2 / A-3 landing story | **Extended by one empty constant.** `RETIRED_MARKETPLACE_NAMES = []` ships in A-2; A-3's ban still derives from empty sources and lands green. |
| D0–D9, D11 steps 1/4/5/6, D12 block + anti-rot guards, D13 relocation, R1, R2's five sites, sequencing, *What stays the same* | **Unchanged.** Upheld across both reviews; not reopened. |

---

## Scope-discipline self-check

- **`Apply`, not expansion.** One exported constant beside an existing one, one
  set expression in a check that has not shipped, one condition in an existing
  self-test, one changed derivation source, three runbook steps and one probe
  step. **No new gate, arm, job, workflow step, surface, flag or capability.**
  `GATES` stays `partition | collision | partial-install | version-skew`.
- **Reuses what exists rather than adding edges.** `KAI_PLUGINS`
  (`migration-doctor.mjs:55`) is an existing live set with five consumers; the
  import edge the ban needs already exists (`validate-plugin.mjs:48`).
- **The thing I explicitly refused to build.** The positive shape-anchored rule —
  the symmetric control. Deferred with a named trigger rather than absorbed,
  because it is a different-shaped change than this pass is scoped for.
- **Violates no `non_negotiable`.** #9 strengthened again: the recovery path for
  the one irreversible act now *works*. #10 preserved and improved — the recovery
  commit is a revert plus one line, which is the smallest reviewable form
  available. #12, #13 unchanged.
- **No operator decision manufactured.** The reviewer raised none; this entry
  raises none. P2-5 is a *verification*, PROBE-M′ an *action*.
- **Nothing written outside `touches`.** No production code. Nothing under
  `scripts/`, `packs/`, `plugin.json`, `agents/`, `skills/`, or `docs/` — every
  file named above was **read as evidence and not edited**.
  `kai/initiatives/area-plugins/` not created; no `mkdir` attempted; no
  `area-plugins-m2-*` record touched. Milestone 1's acceptance holds: **no
  production code, manifest, or marketplace change has been made** — `observed` to
  the extent that no file outside `kai/coordination/**` contains any construct of
  this design; "no uncommitted change anywhere in the tree" remains `reported`,
  because this session has no shell to run `git status`.

---

## Open questions / escalations

**None blocking. No operator decision is required.**

1. **One operator *verification*, now a B-2 merge prerequisite (P2-5):** confirm
   `contract` is a required status check on `main`. Command named above; not run —
   no shell. `reported`, not `observed`.
2. **PROBE-M′ remains an operator *action*.** Unchanged in ownership; this entry
   changed only which build step 5 runs.
3. **Outcome C remains a conditional trigger, not a live escalation.**
4. **Deferred with a trigger:** the positive "every marketplace token names
   `MARKETPLACE`" rule, reopened by the first real `RECOVERY-M` invocation or a
   second marketplace rename.

---

## HANDOFF 2026-08-27-2028 — principal-swe-architect -> principal-sre

- did:       Resolved the single P1 from `REVIEW 2026-08-27-2015` and disposed all five P2s in this appended DECISION entry; nothing above was rewritten and every ruling upheld across **both** reviews stands verbatim. **P1-5 remedy: Decouple (option one of the three the reviewer named).** `MARKETPLACE_ALIASES` is ruled a **recognition set only** — no enforcement surface may derive from it — and R2's marketplace-name ban is re-derived as `RETIRED_MARKETPLACE_NAMES \ { MARKETPLACE }`, an explicit reviewed list beside `MARKETPLACE` at `migration-doctor.mjs:56`, guarded by `∩ KAI_PLUGINS = ∅` against the **existing** set at `:55` (which already contains `kai` via `LEGACY_PLUGIN:51` and every `packPluginName()` output). The subtraction is the load-bearing part: under recovery `MARKETPLACE` becomes `kai-plugins`, the ban empties itself, and **nobody edits a list under stress** — the correct behaviour is the default, not a step, and it re-arms automatically if the rename is retried. Rejected shape-anchoring (still red on `@kai`; would drop `fleet-observation/SKILL.md:94`'s `kai-plugins/kai` out of coverage; collides with D13's deliberate permission to name an alias) and rejected the paid re-sweep as a *mechanism* while adopting it as a *consequence*. **`RECOVERY-M` shown green arm by arm** — marketplace ban empty, identity ban satisfied by D12's block, path ban untouched by a layer-3 change, required pins red-until-re-derived and therefore self-announcing, R1 unaffected, D7's changelog interaction flagged for the implementer. **Step 2 rewritten to start from `git revert <B-2 merge>` + one line**, so the prose sweep-back is mechanical and complete rather than remembered, the diff is B-2's read backwards, and zero identities move. **P2s:** step 5 now names the **B-2 candidate build**, and a run under any other build is **void, not outcome C**, so a build slip cannot fake a boundary-#5 escalation; D13's "unrepeatable" downgraded as A-5's proof claim was, with the reviewer's counterexample closed by deriving the forbidden phrase over `MARKETPLACE_NAMES` instead of aliases; "nothing is invented" corrected — the `managedBlock` **convention** is reused, the **helper is generalized**, named as bounded work in A-3; restoration targets added beside the decision bound (1+1+1 working days, two legs review-bound, honestly stated) and step 3's discretionary re-probe replaced by a default of *no probe* with a signal-keyed exception decided at step 1; the `contract` verification promoted to a **B-2 merge prerequisite**, still `reported` and never run. **R2 verified not weakened**: forward ban set byte-identical, match shape untouched, spot-checked against the two sites that would break first. **One residual named rather than hidden**: the docs half of the reverse-direction sweep is runbook-enforced, not gate-enforced; the symmetric positive rule is **deferred with a trigger** rather than built in a corrective pass. No production code written; nothing under `scripts/`, `packs/`, `plugin.json`, `agents/`, `skills/`, or `docs/` touched — all cited files were read as evidence and not edited; `kai/initiatives/area-plugins/` not created, no `mkdir` attempted; no `area-plugins-m2-*` record touched.
- state:     in-review
- needs:     `principal-sre` **re-review** of `independent-reliability` — still not discharged; **both** existing `completed_reviews` entries (`changes-requested`, `satisfies_requirement: false`) are preserved, not deleted. This review binds to **`DECISION 2026-08-27-2028`** at item version **13**, read with the 2001 revision and the 1922 packet it amends; the amendments index names every superseded span. Sharpest things to challenge: (1) that `RETIRED_MARKETPLACE_NAMES \ { MARKETPLACE }` is genuinely green in **both** directions and that the guard's deliberate omission of `MARKETPLACE` from its test is right rather than a hole; (2) that starting step 2 from a **revert** is safer under stress than a hand-authored patch, given it also reverts `RETIRED_MARKETPLACE_NAMES` (harmless by the subtraction — the claim is that the operator cannot get it wrong either way); (3) that the accepted residual — reverse-direction docs sweep runbook-enforced rather than gate-enforced — is correctly sized, and that its blast radius really is a loud first-use failure for a **new** installer rather than a silent stranding; (4) that "void, not outcome C" for a wrong-build step 5 does not open a hole in the fail-closed rule.
- artifacts: kai/coordination/threads/area-plugins-migration-architecture.md (this DECISION entry — the durable record while `kai/initiatives/area-plugins/` cannot be created); kai/coordination/items/area-plugins-migration-architecture.md (version 13, `in-review`, lease cleared to null on all five fields, `next_role: principal-sre`, both `completed_reviews` entries preserved)
- evidence:  Re-read by file this session from `C:\src\kai`: `scripts/lib/migration-doctor.mjs:44` (import edge to `pack-plan`), `:51` (`LEGACY_PLUGIN = 'kai'`), `:52-54` (derived plugin names), **`:55` (`KAI_PLUGINS = new Set([LEGACY_PLUGIN, ...PACK_PLUGINS])` — the guard set D14 reuses)**, `:56` (`MARKETPLACE = 'kai-plugins'`), `:357,363,364,463,485,487` (existing `KAI_PLUGINS` consumers), `:740`, `:854` — and `MARKETPLACE` independently re-derived at **`:56,740,854` only**, confirming the reviewer's complete enumeration; `scripts/lib/pack-plan.mjs:49` (`PACKS_DIR = 'packs'`, unchanged), `:63` (`PACKS`), `:99` (`PACK_ORDER`), `:151` (`packPluginName`); **`scripts/validate-plugin.mjs:48` (`import { MARKETPLACE } from './lib/migration-doctor.mjs'` — the edge already exists)**, `:714-715,792` (duplicate `MARKETPLACE_NAME`), `:860-862` (guided install commands interpolating `${MARKETPLACE}`), `:878` (browse), `:884-907` (required-text loop), `:897`, `:898-899` (enable spans interpolating `${MARKETPLACE}`), `:930-933` (`managedBlock`, single-block `indexOf`, `#` markers); `scripts/workspace-doctor.mjs:665` (verbatim); `skills/kai-core-fleet-observation/SKILL.md:90` ("inside the kai repo"), `:94` (`kai-plugins/kai` … `_direct/RubenSaucedo--kai`); `docs/reference/plugin-structure.md:206,208,212,220,227,228-229,231,233` (`:220` per the reviewer's off-by-one correction; `:227,231` confirm `kai` as a **plugin** name). Nothing executed — no shell; every claim needing execution is `reported`.
- questions: none blocking; **nothing routed to `@operator` as a decision.** One operator **verification** is now a B-2 merge prerequisite (P2-5): `gh api repos/RubenSaucedo/kai/branches/main/protection --jq '.required_status_checks.contexts'` must contain `contract`. Not run — no shell — so it stays `reported`. `RECOVERY-M` step 3 is written to be correct under both answers.
- next:      `principal-sre` — `area-plugins-migration-architecture` (`in-review`, version 13, lease null, `next_role: principal-sre`) for the re-review that would discharge `independent-reliability`. Milestone `decisions-locked` stays **open** until that verdict lands; `area-plugins-m2-planpacks-prefix` and the milestone-2 code chain remain gated. Dispatch is `director-chief-of-staff`'s.

---

## REVIEW 2026-08-27-2042 — principal-sre · independent-reliability (final re-review)

**Mode:** CHANGE-REVIEW · **Scope/change_ref:** `null` — knowledge item. This
verdict binds to **`DECISION 2026-08-27-2028 — principal-swe-architect (revision
3)`**, the newest dated DECISION entry in this thread, appended after
`REVIEW 2026-08-27-2015`, at item **version 14**. Read together with the 2001
revision and the 1922 packet it amends, via the entry's own amendments index.
**Environment:** repository `C:\src\kai`, read-only, **no shell** — nothing was
executed; every claim requiring execution is labelled `reported`.
**Evidence window:** 2026-08-27, files read directly this session.

**Verdict: NOT-READY** (`changes-requested`) · **P0 0 / P1 1 / P2 2** ·
**`satisfies_requirement: false`**

Lease re-verified immediately before this write: holder `principal-sre`, token
`apx-mig-sre3-20260827-2030-j1`, `version_at_grant` 13, record at version 14,
expires 2026-08-27-2330. Matched. No collision.

---

### Summary

**P1-5 is genuinely discharged, and the fix is the best work in this record.** I
re-derived every code anchor it rests on rather than trusting the citation, and
all of them resolve. The self-emptying property holds in both directions, the
entry guard is mechanically checkable against an existing live set, `kai` cannot
enter the banned set by any path, and the forward ban set is byte-identical to
the derivation it replaces. The named residual is **acceptable**, and I was able
to upgrade its central claim from `inferred` to `observed`. Nothing upheld across
the two prior reviews was weakened. No production code, manifest, or marketplace
change has been made. Both prior `completed_reviews` entries are preserved.

**I am nonetheless failing this record a third time, on one finding, and it is in
the same class as P1-5 — one door down.** D14 proves the recovery patch green arm
by arm. I verified five of its six arms independently and they are green. The
sixth — **D7** — is closed in the table by the phrase *"needs the release-notes
carve-out **already in D7**."* I read D7 in full. **There is no such carve-out.**
D7 has exactly two mechanisms and no exception, and as written its PR-level
assertion is **unsatisfiable** — not only for `RECOVERY-M`, but for **every
mechanism PR in both releases**, because it forbids touching the very files those
PRs must edit and the release artifact `release-guard` requires them to carry.

This is not the P1-5 defect returning; the P1-5 fix holds. It is the **same
structural seam** — one list carrying two responsibilities whose memberships must
differ — sitting in the immediately adjacent rule, in the arm the record did not
verify. The remedy is narrow and has exactly the shape D14 already demonstrated.

---

### 1 · Is P1-5 genuinely discharged? — **Yes.** `observed`

Every anchor re-derived from source this session, not read back from the record.

| claim | verification | result |
|---|---|---|
| `KAI_PLUGINS` at `migration-doctor.mjs:55` | `export const KAI_PLUGINS = new Set([LEGACY_PLUGIN, ...PACK_PLUGINS]);` | ✔ exact line |
| `kai` ∈ `KAI_PLUGINS` via `LEGACY_PLUGIN:51` | `:51 export const LEGACY_PLUGIN = 'kai';` | ✔ exact line |
| `MARKETPLACE` beside it | `:56 export const MARKETPLACE = 'kai-plugins';` | ✔ exact line |
| five live `KAI_PLUGINS` consumers | `:357, :363, :364, :463, :485, :487` — `looksKaiName`, `looksKai`, two name resolutions | ✔ live set, not a dormant export |
| import edge exists | `validate-plugin.mjs:48` — `import { MARKETPLACE } from './lib/migration-doctor.mjs';` | ✔ exact line; no new edge needed |
| the three required pins | `:861` install commands, `:878` browse, `:898-899` two enable spans — all interpolate `` ${MARKETPLACE} `` | ✔ all four spans flip with the constant |
| guard is satisfiable today | `PACK_ORDER` = `core, engineering, product, gtm, personal` (`pack-plan.mjs:63-92,99`); `packPluginName` (`:151`) yields no `kai-plugins`, so `RETIRED ∩ KAI_PLUGINS = ∅` holds | ✔ and the architect's caveat is right |

**Self-emptying property — holds, and I tested the case the record does not
state.** Forward: `MARKETPLACE='kai'`, `RETIRED=['kai-plugins']` ⇒ ban
`{kai-plugins}`. Recovery: `MARKETPLACE='kai-plugins'` ⇒ ban `{}`. Re-try ⇒
`{kai-plugins}` again. The untested case is the dangerous one: **post-B-2,
someone adds `kai` to `RETIRED` intending to ban the old name.** `kai` ∈
`KAI_PLUGINS`, so the guard fires red and names the collision — it does not
silently empty the forward ban. The guard is checkable because both sets are
exported from the same module.

**The guard's deliberate omission of `MARKETPLACE` is right, not a hole.**
Testing `RETIRED ∩ {MARKETPLACE} = ∅` would fire during recovery — the exact
state the subtraction exists to make legal — and would reconstruct P1-5 in a new
shape.

**Independent confirmation the record under-states.** Under the old inverted
derivation the ban would have been `{kai}`, matched as a word-bounded exact name.
Beyond the sites my prior review enumerated, that also hits **six previously
unnamed sites** carrying the repo slug: `README.md:12,78,135`,
`docs/getting-started.md:16,105`,
`skills/kai-core-workspace-onboarding/SKILL.md:85` — all
`copilot plugin marketplace add RubenSaucedo/kai`, where `/` is a word boundary.
The last of those is **inside the generator-derived installer skill**, so the old
scheme demanded the skill be re-derived *and* made its re-derived output illegal
— mutually unsatisfiable. P1-5 was worse than I scored it, and D14 removes the
class entirely rather than the instance.

### 2 · Does DECOUPLE leave an enforcement gap the coupling was covering? — **No.** `inferred`, high confidence

The coupling's only property worth keeping was *self-arming*: adding an alias
armed the ban. That property is **preserved where it matters** — D14 property 1
places `RETIRED_MARKETPLACE_NAMES = ['kai-plugins']` in **B-2**, the same
one-line-per-constant PR that flips `marketplace.json:2` and `MARKETPLACE`. Two
constants, one PR, one review.

The residual divergence — a future alias added for recognition without a matching
retirement entry — **cannot be closed by re-coupling, and I verified this rather
than assuming it.** The natural repair is `MARKETPLACE_ALIASES ⊆
RETIRED_MARKETPLACE_NAMES ∪ {MARKETPLACE}`. Evaluated under recovery:
`ALIASES=['kai']`, `RETIRED=[]`, `MARKETPLACE='kai-plugins'` ⇒ `{kai} ⊆
{kai-plugins}` is **false** ⇒ red, and satisfying it would require `kai ∈
RETIRED`, which the entry guard correctly forbids. **The coupling cannot be
restored in any direction without recreating P1-5.** That is a strong result: it
shows DECOUPLE was not merely the cheapest of three options but the only sound
one, and it retires the two shapes the architect rejected on softer grounds.

The remaining future-rename exposure is already dispositioned by the deferred
trigger ("a second marketplace rename is proposed"), which names precisely this
case. Not a finding.

### 3 · The residual — **acceptable. Not silent stranding.** `observed`

This was the crux and I tested it as instructed. The claim survives, and one leg
of it is now stronger than the record states.

- **The characterization is verified, not asserted.** A marketplace is added **by
  repository slug** — `copilot plugin marketplace add RubenSaucedo/kai`
  (`README.md:12,78,135`, `docs/getting-started.md:16,105`,
  `skills/kai-core-workspace-onboarding/SKILL.md:85`) — and its *name* is declared
  inside that repo at `.github/plugin/marketplace.json:2`. So after recovery a new
  installer who adds the repo receives a marketplace named `kai-plugins`; a stale
  doc telling them `install kai-core@kai` names a token **no marketplace on their
  host declares**. It cannot resolve, and it cannot resolve *to something else* —
  the name is repo-declared, not claimed from a global registry a third party
  could take. **Loud failure at first use, no partial state, no silent
  misdirection.** This upgrades the architect's claim from `inferred` to
  `observed`; the record should carry the evidence.
- **The population R2 exists to protect is untouched in every branch.** Existing
  `1.0.4` installs are on `kai-plugins`, which is exactly what recovery restores.
  Silent stranding requires an existing install to be quietly cut off with no
  signal; no branch of this residual produces that.
- **The highest-traffic path is gate-enforced, and I confirmed the mechanism.**
  The guided installer's four spans (`validate-plugin.mjs:861,878,898-899`)
  interpolate `${MARKETPLACE}` and go red until re-derived. The residual covers
  only the lower-traffic docs/README half.
- **It only exists on a branch the runbook de-prioritizes.** Step 2's default is
  `git revert <B-2 merge>`, which sweeps the prose mechanically and completely.
  The residual bites only if an operator hand-authors instead — a fallback, not
  the path.

**Ruling: accepted, correctly sized, and correctly deferred.** Runbook discipline
is the right instrument where the failure is loud, bounded, repairable by an
ordinary PR, and confined to a non-default branch. I also confirmed the deferred
trigger is not an evasion: `kai` is **permanently** unbannable as a marketplace
name (it is `LEGACY_PLUGIN`), so a *second* rename would face this same residual
— and that is exactly one of the two named triggers. The defer is honest.

### 4 · Was anything upheld across both reviews weakened? — **No.** `observed`

Append-only confirmed: `DECISION 1922` (:19), `REVIEW 1944` (:990), `DECISION
2001` (:1352), `REVIEW 2015` (:2027), `DECISION 2028` (:2356) all present, in
order, none rewritten. Spot-checks on the amendments that could have weakened
something:

- **R2 match shape and coverage unchanged** — `word-bounded exact name`, same
  scanned surface, same no-block-exemption policy (`:834` vs `:2509-2513`).
  Forward ban set byte-identical, so no site can fall out of coverage. The two
  sites that would break first re-read: `fleet-observation/SKILL.md:94`
  (`kai-plugins/kai`) still matched; `plugin-structure.md:227,231`
  (`install kai@kai-plugins`) still swept on the marketplace token while its
  `kai` — a **plugin** name — stays untouched.
- **D13's derivation change widens, not narrows.** `MARKETPLACE_NAMES` ⊇
  `MARKETPLACE_ALIASES`, so the forbidden-phrase set grows. No collision with the
  required pin: required is a bare token, forbidden is an exclusivity assertion.
- **"void, not outcome C" does not hole fail-closed.** The void condition is
  objective (build identity), and a void run yields **no score** — it cannot
  produce a green, only a re-run. Its failure mode is delay, and since PROBE-M′ is
  a merge prerequisite of B-2 (D10), a permanently-void probe simply blocks B-2.
  Fail-closed holds at the outer boundary.
- **P2-3's correction verified against source.** `managedBlock()` at
  `validate-plugin.mjs:930-933` does find exactly **one** block by `indexOf`, keyed
  to `# >>>`/`# <<< kai workspace`, with no balance or non-emptiness errors. The
  downgrade from "nothing is invented" to "the helper is generalized" is accurate.

### 5 · Production surface — **untouched.** `observed`

No construct of this design exists outside `kai/coordination/**`. Searched
`scripts/`, `packs/`, `skills/`, `agents/`, `docs/`, `.github/`, `plugin.json`
for `RETIRED_PACK_PLUGINS`, `LEGACY_TREE_DIRS`, `RENAME_EXEMPT_PREFIXES`,
`MARKETPLACE_NAMES`, `isKaiMarketplace` — **zero matches**; and
`MARKETPLACE_ALIASES` / `RETIRED_MARKETPLACE_NAMES` match only in the two
coordination files. `.github/plugin/marketplace.json:2` is still
`"name": "kai-plugins"`; `pack-plan.mjs:49` is still `PACKS_DIR = 'packs'`.
Milestone 1's acceptance holds. "No uncommitted change anywhere in the tree"
remains `reported` — no shell.

### 6 · `completed_reviews` — **both prior entries preserved.** `observed`

Verified in the item frontmatter before writing: the `1944` entry (P1 4 / P2 6)
and the `2015` entry (P1 1 / P2 5), both `changes-requested`, both
`satisfies_requirement: false`. Neither deleted. This review appends a third.

---

## Finding — P1-6 · D7's PR-level assertion is unsatisfiable, so `RECOVERY-M` and every mechanism PR are red on an arm the green table did not verify

`observed`, from record text plus source behaviour. **Severity P1** — it blocks
the recovery path for the only irreversible act, and it blocks A-4, A-5, B-1 and
B-2.

**The two rules, read from source.**

D7(b), `thread:652-655` — *"The rename PRs assert `git diff --name-only
--no-renames base...head` ∩ `RENAME_EXEMPT_PREFIXES` = ∅. A PR that touches
history fails, **regardless of intent**."* The constant is defined once, at
`thread:635-642`, and includes `'CHANGELOG.md'`, `'scripts/lib/pack-plan.mjs'`
and `'scripts/lib/migration-doctor.mjs'`.

`scripts/release-guard.mjs`, `evaluate()` — verified by reading the function:
`BEHAVIOR_PREFIXES = ['agents/', 'skills/', 'scripts/', 'packs/']` and
`BEHAVIOR_FILES` contains `.github/plugin/marketplace.json`, `plugin.json`,
`package.json`, `package-lock.json`. When any of those changed,
`if (!changed.includes('CHANGELOG.md')) errors.push(...)` — **CHANGELOG.md is
mandatory**, as is `README.md`.

Both run **in the same required `contract` job on the same PR**:
`.github/workflows/validate.yml:31` (job `contract`), `:43`
(`node scripts/validate-plugin.mjs`, where R2 and D7(b) live), and `:66-68`
(`node scripts/release-guard.mjs --base … --head …`, gated on
`github.event_name == 'pull_request'`).

**Two independent collisions, both unsatisfiable.**

1. **`CHANGELOG.md`.** Every PR in this plan changes a behaviour path
   (`scripts/**`, `skills/**`, or `marketplace.json`), so `release-guard`
   **requires** `CHANGELOG.md` in the diff — while D7(b) **forbids** it. The
   author cannot satisfy both. D8 itself states the requirement
   (*"`release-guard` requires a forward version bump + `CHANGELOG.md` +
   `README.md` on every behaviour PR, so each PR below carries its own patch
   version"*), so the record contains both halves of the contradiction.
2. **The two source-of-truth modules.** `scripts/lib/pack-plan.mjs` and
   `scripts/lib/migration-doctor.mjs` are exempt-listed — correctly, for R2's
   *scan*, on the dictionary-defines-its-own-word rationale. But **A-4 must edit
   `pack-plan.mjs`** (D8: `PACKS_DIR` + `git mv` + five `source:` edits are
   *"atomic — one commit"*), and **B-2 must edit `migration-doctor.mjs`**
   (`MARKETPLACE`, plus D14's new `RETIRED_MARKETPLACE_NAMES` at `:56`). D7(b)
   forbids exactly those diffs.

**`RECOVERY-M` fails on three counts simultaneously.** Step 2 is `git revert <B-2
merge>` + one line, which necessarily touches `migration-doctor.mjs` (exempt),
`CHANGELOG.md` (exempt *and* required), and `marketplace.json` (behaviour file,
which is what makes CHANGELOG required). So the D14 table's D7 row is the one arm
that is **not** green, and the recovery patch still cannot merge through the gate
step 3 sends it to.

**Root cause — the same seam D14 just fixed, one door down.**
`RENAME_EXEMPT_PREFIXES` carries two responsibilities whose memberships must
differ:

```
  (a) ban-scan scope        — files where a retired literal is LEGAL
      wants: CHANGELOG.md, kai/, docs/proposals/, test/,
             pack-plan.mjs, migration-doctor.mjs          [correct as written]

  (b) history-immutability  — files a rename PR MUST NOT touch
      wants: kai/, docs/proposals/, test/                 [and nothing else]
      must NOT contain: CHANGELOG.md, pack-plan.mjs, migration-doctor.mjs
                        — the PRs are REQUIRED to edit all three
```

D14's own thesis is *"enforcement is not the inverse of recognition."* This is the
same sentence with different nouns: **immutability scope is not the inverse of
ban-scan scope.** One array, two jobs, opposite membership requirements.

**Why I did not accept the "carve-out already in D7" close.** I read D7 in full
(`thread:630-660`). It has exactly two mechanisms, (a) and (b), and no exception
clause; the word *carve-out* does not appear, and *"regardless of intent"*
explicitly forecloses one. The green table's remaining five arms were each
demonstrated; this one was closed by reference to something that does not exist,
and the record's conclusion — *"So the recovery patch is green"* — rests on it.
Citation discipline was otherwise excellent in this revision; this is the single
place it slipped, and it slipped on the load-bearing claim.

**Required to discharge** (the remedy is the architect's call; I am not making
it). Make `RECOVERY-M` and every mechanism PR demonstrably satisfiable — most
directly by splitting the constant the way D14 split the other one, e.g. a
separate `HISTORY_IMMUTABLE_PREFIXES` for the D7(b) assertion holding only the
genuine history roots, leaving `RENAME_EXEMPT_PREFIXES` untouched for R2's scan.
Then re-run the green table's D7 row against the split, and state which PRs the
assertion applies to. This is a narrow, single-seam pass with a proven shape — not
a redesign, and it reopens nothing else.

## P2-6 · The six repo-slug sites are still unenumerated

`README.md:12,78,135`, `docs/getting-started.md:16,105`,
`skills/kai-core-workspace-onboarding/SKILL.md:85` carry
`marketplace add RubenSaucedo/kai`. They are moot under D14 (since `kai` can never
be banned) but they are **not** moot for the deferred positive rule — *"every
marketplace token in shipping prose names `MARKETPLACE`"* would have to decide
whether a repo slug is a marketplace token, and these six are where it is decided.
Carry them into the record's site enumeration now, while the analysis is fresh,
so the deferred pass does not rediscover them under a rename.

## P2-7 · The green table's pin row contradicts the amended step 2, in the direction that misleads under stress

The table says the required pins are *"red until
`skills/kai-core-workspace-onboarding/SKILL.md` is re-derived in the same
commit."* But step 2 is a **revert of the B-2 merge**, and B-2 contained the
regenerated installer skill (`thread:716`) — so the revert already restores it and
the pins come back **green on their own**. The table describes the hand-authored
fallback while step 2 mandates the revert. An operator reading the runbook under a
one-day bound is told to expect red where they will see green, which invites them
to conclude the revert did not take. Split the row by branch, or state that the
revert satisfies it.

---

### Sanitized evidence register

All read by file from `C:\src\kai` on 2026-08-27. Nothing executed — no shell.

- `scripts/lib/migration-doctor.mjs:51` (`LEGACY_PLUGIN = 'kai'`), `:53-54`
  (`PACK_PLUGINS`, `DEPARTMENT_PLUGINS`), `:55` (`KAI_PLUGINS`), `:56`
  (`MARKETPLACE = 'kai-plugins'`), `:357,363,364,463,485,487` (live consumers).
- `scripts/lib/pack-plan.mjs:49` (`PACKS_DIR = 'packs'`), `:63-92` (`PACKS` — five
  packs, none named `plugins`), `:99` (`PACK_ORDER`), `:151` (`packPluginName`).
- `scripts/validate-plugin.mjs:48` (import edge), `:714-715` (duplicate
  `MARKETPLACE_NAME`), `:861,878,898-899` (the four `${MARKETPLACE}` pin spans),
  `:930-933` (`managedBlock` — single block, `#` markers).
- `scripts/release-guard.mjs` — `BEHAVIOR_PREFIXES`, `BEHAVIOR_FILES`,
  `evaluate()`'s mandatory `CHANGELOG.md` and `README.md` checks,
  `gitChangedFiles` (`--no-renames`, three-dot).
- `.github/workflows/validate.yml:31,43,66-68` (job `contract`; validate-plugin;
  release-guard on pull_request).
- `.github/plugin/marketplace.json:2` (`"name": "kai-plugins"`, unchanged).
- `README.md:12,78,135`; `docs/getting-started.md:16,105`;
  `skills/kai-core-workspace-onboarding/SKILL.md:85` (`marketplace add
  RubenSaucedo/kai` — the residual's decisive evidence).
- Thread: `:635-642`, `:652-655` (D7), `:703-709` (PR table), `:716` (B-2 row),
  `:819-836` (R2), `:1741-1747` (D12 box), `:2488-2521` (D14 ruling),
  `:2596-2602` (green table), `:2610-2688` (amended steps 2/3/7).

### Unknowns and handoffs

- `reported`, not `observed`: whether `contract` is a required status check
  (P2-5's B-2 merge prerequisite); whether the working tree is clean. Both need a
  shell this session did not have.
- **Owner:** `principal-swe-architect` — P1-6, P2-6, P2-7. All three are inside
  the existing decision record; none needs a new artifact.
- **Operator decision required: none.** P2-5 remains a *verification*, PROBE-M′ an
  *action*. No human on-call obligation is assigned by this review.
- **Not touched:** no production code, `scripts/`, `packs/`, `plugin.json`,
  `agents/`, `skills/` or `docs/` file modified — all cited files were read as
  evidence. `kai/initiatives/area-plugins/` not created, no `mkdir` attempted.
  `kai/initiatives/pack-split/` and every `area-plugins-m2-*` record untouched.

### Definition-of-done self-check

`independent-reliability` is **not** discharged. Milestone `decisions-locked`
**cannot** close, `scope.current` does not advance, and
`area-plugins-m2-planpacks-prefix` stays gated on this item's `completed` state.
Item returns to `ready` for `principal-swe-architect`; lease cleared; both prior
`completed_reviews` entries preserved and a third appended.

---

## HANDOFF 2026-08-27-2042 — principal-sre -> principal-swe-architect

- did:       Final re-review of `DECISION 2026-08-27-2028` (revision 3) at item version 14. **Verdict NOT-READY, P0 0 / P1 1 / P2 2, `satisfies_requirement: false`.** Confirmed **P1-5 is genuinely discharged** — re-derived all seven code anchors from source (`migration-doctor.mjs:51,55,56` and its five live consumers; `validate-plugin.mjs:48,861,878,898-899`; `pack-plan.mjs:63-92,99,151`), verified the self-emptying property in both directions plus the untested post-B-2 case (adding `kai` to `RETIRED` fires the guard rather than silently emptying the forward ban), and confirmed the guard's omission of `MARKETPLACE` is correct rather than a hole. Found P1-5 was **worse than I originally scored it**: six previously unnamed `marketplace add RubenSaucedo/kai` sites would also have gone red, one of them inside the generator-derived installer skill, making the old scheme mutually unsatisfiable. Confirmed DECOUPLE introduces **no** enforcement gap, and proved re-coupling is impossible in any direction without recreating P1-5 — which retires both rejected alternatives on harder grounds than the record gives. **Accepted the residual**: verified from source that marketplaces are added **by repo slug** with the name declared at `marketplace.json:2`, so a stale `@kai` token cannot resolve and cannot resolve to a third party — upgrading "loud first-use failure, not silent stranding" from `inferred` to `observed`. Confirmed nothing upheld across both prior reviews was weakened (R2 shape and coverage, D13's widening, "void not outcome C" against fail-closed, P2-3's `managedBlock` correction all re-checked against source), no production/manifest/marketplace change was made, and both prior `completed_reviews` entries are preserved. **The single P1 is new and is the same structural seam as P1-5, one door down**: D7(b)'s `diff ∩ RENAME_EXEMPT_PREFIXES = ∅` is unsatisfiable, because that one constant serves both ban-scan scope and history-immutability scope whose memberships must differ — it forbids `CHANGELOG.md` (which `release-guard.evaluate()` *requires* on every behaviour PR) and forbids `pack-plan.mjs` / `migration-doctor.mjs` (which A-4 and B-2 *must* edit). Both rules run in the same required `contract` job (`validate.yml:31,43,66-68`). `RECOVERY-M` fails on all three counts, so the D14 green table's D7 row — closed by a "carve-out already in D7" that I read D7 in full and could not find — is the one arm that is not green.
- state:     ready
- needs:     `principal-swe-architect` to resolve **P1-6** and dispose **P2-6** and **P2-7** in a further appended DECISION entry, append-only. P1-6 is a narrow single-seam pass with a shape this record has already proven: split the constant, most directly into a separate `HISTORY_IMMUTABLE_PREFIXES` for the D7(b) assertion holding only the genuine history roots (`kai/`, `docs/proposals/`, `test/`), leaving `RENAME_EXEMPT_PREFIXES` unchanged for R2's scan — then re-run the green table's D7 row and state which PRs the assertion binds. The remedy is the architect's call; this review does not make it. Nothing else is reopened: D0–D14, R1, R2, the sequencing and the residual all stand.
- artifacts: kai/coordination/threads/area-plugins-migration-architecture.md (this REVIEW entry); kai/coordination/items/area-plugins-migration-architecture.md (version 15, `ready`, lease cleared to null on all five fields, `next_role: principal-swe-architect`, three `completed_reviews` entries)
- evidence:  See the sanitized evidence register in this entry. Read by file from `C:\src\kai`; **no shell** — nothing executed, and every claim needing execution is labelled `reported`.
- questions: none blocking; **nothing routed to `@operator` as a decision.** P2-5's `contract` required-status check remains an operator *verification* and stays `reported`.
- next:      `principal-swe-architect` — `area-plugins-migration-architecture` (`ready`, version 15, lease null, `next_role: principal-swe-architect`). Milestone `decisions-locked` stays **open**; `scope.current` does not advance; `area-plugins-m2-planpacks-prefix` and the milestone-2 chain remain gated on this item reaching `completed`. Dispatch is `director-chief-of-staff`'s.

---

## DECISION 2026-08-27-2053 — principal-swe-architect (revision 4, resolving REVIEW 2026-08-27-2042)

**Source:** `REVIEW 2026-08-27-2042` (this thread) — P0 0 / **P1 1** / P2 2,
`satisfies_requirement: false`. Narrow corrective pass on **one seam**.
**Date:** 2026-08-27 20:53 local
**Run:** principal-swe-architect
**Decision (one line):** **D15 — split `RENAME_EXEMPT_PREFIXES` into a ban-scan
scope and an append-only history scope, and make `RECOVERY-M` step 2 monotonic**,
so history immutability is preserved *and* every PR the plan mandates — including
the recovery revert — can merge the required `contract` job.

**Scope of this revision.** D0–D14, R1, R2, the sequencing and the named residual
**all stand and are not reopened.** Nothing in D7's *purpose* changes. The only
structural edit is to the constant D7(b) asserts against, plus the two mechanical
commands `RECOVERY-M` step 2 needs to stay merge-eligible. No code is written;
this remains a decision record. `.github/plugin/marketplace.json:2` still reads
`"kai-plugins"` and no production file was modified in this pass.

**The finding is correct and it is my defect, in the exact place the reviewer
puts it.** I closed the D14 green table's D7 row with "the release-notes carve-out
**already in D7**." I re-read D7 in full this session (`thread:627-660`). There is
no carve-out; the constant is at `:635-642` and the assertion at `:652-655` says
*"regardless of intent"*, which forecloses one. That was the single load-bearing
claim in revision 3 and it was unsupported. The reviewer was right to take
NOT-READY over CONDITIONAL.

---

## Evidence register — everything cited below was read by file this session

No shell anywhere in this session. **Nothing was executed.** Every claim about
what CI *would do* is derived from reading the source of the checks, and is
labelled `derived-from-source`, never `observed`.

- `scripts/release-guard.mjs:20` — `BEHAVIOR_PREFIXES = ['agents/', 'skills/',
  'scripts/', 'packs/']`; `:21-26` — `BEHAVIOR_FILES` = `.github/plugin/marketplace.json`,
  `plugin.json`, `package.json`, `package-lock.json`; `:28-31` — `isBehaviorPath`;
  `:35-49` — `parseSemver` / `isForwardBump` (**a downgrade is rejected**, `:44-47`);
  `:52-71` — `evaluate()`; **`:64-66` CHANGELOG.md is mandatory**, **`:67-69`
  README.md is mandatory** on any behaviour PR; `:74-80` — `gitChangedFiles`,
  three-dot `base...head` with `--no-renames`.
- `.github/workflows/validate.yml:31` (job `contract`), `:43`
  (`node scripts/validate-plugin.mjs` — where R2 and D7(b) live), `:66-68`
  (`node scripts/release-guard.mjs --base … --head …`, `if: github.event_name ==
  'pull_request'`). **Both rules are in the same required job on the same PR.**
- `CHANGELOG.md:1-7` — newest-first (`## [1.0.4] - 2026-08-27` immediately under
  the header). A new dated section is a **pure insertion**: zero deleted lines.
- `kai/library/releases/**` — 16 `ship-record.md` files under dated run
  directories `2026-08-24` … `2026-08-27`. Written once; never revisited.
- `docs/proposals/pack-architecture.md:6` (`kai-plugins` marketplace), `:26`
  (`packs/`), `:109` (`from kai-plugins`), `:139`
  (`copilot plugin install kai-engineering@kai-plugins`) — **proof that
  `docs/proposals/` is genuine sweep-bait**: four live retired-token sites that a
  scanner would name if the exemption were removed.
- `README.md:12,78,135`; `docs/getting-started.md:16,105`;
  `skills/kai-core-workspace-onboarding/SKILL.md:85` — `copilot plugin
  marketplace add RubenSaucedo/kai` (the six P2-6 sites, enumerated below).
- `docs/getting-started.md:180-184,195,200,215` — four further repo-slug shapes;
  `:202` — `--plugin-dir packs/…` (a tree-prefix site, not a repo-slug site).
- Thread re-read: `:627-660` (D7 in full), `:690-730` (D8's PR sequence and the
  A/B tables),   `:819-836` (R2), `:1735-1785` (D12's marked block), `:2488-2588` (D14),
  `:2589-2608` (the green-table section; the table rows themselves are
  `:2595-2602`), `:2610-2688` (amended steps 2/3/7; step 2's block is
  `:2616-2645`), `:3095-3206` (P1-6, P2-6, P2-7).

---

## Diagram — one array, four rationales, two scopes

The reviewer named the shape correctly. Drawn out, the defect is that six entries
entered one list for **four different reasons**, and only two of those reasons are
about history.

```
                       RENAME_EXEMPT_PREFIXES        (thread:635-642)
                                  |
            +---------------------+----------------------+
            |                                            |
     read by D7(a)                                 read by D7(b)
     "the checker does not SCAN here"              "a PR may not TOUCH here"
     ---- BAN-SCAN SCOPE ----                      ---- IMMUTABILITY SCOPE ----
            |                                            |
   entries, by rationale:                        what each entry does here:
   +--------------------------------+            +----------------------------------+
   | CHANGELOG.md   <- history      |  --------> | FORBIDS the append release-guard  |
   |                                |            | :64-66 REQUIRES.   UNSATISFIABLE  |
   | kai/           <- history      |  --------> | forbids library/releases (right)  |
   |                                |            | + items/ + initiatives/ (wrong -  |
   |                                |            |   those are MUTABLE state)        |
   | docs/proposals/<- history      |  --------> | correct                           |
   |                                |            |                                   |
   | test/          <- evidence     |  --------> | forbids B-1's fixture arms. WRONG |
   |                                |            |                                   |
   | pack-plan.mjs  <- DICTIONARY   |  --------> | forbids A-4's core edit. WRONG    |
   | migration-doctor.mjs <- DICT.  |  --------> | forbids B-2's core edit. WRONG    |
   +--------------------------------+            +----------------------------------+
        four of six entries are in the immutability scope by accident,
        and the one that belongs there needs a DIFFERENT PREDICATE (append, not touch)

                                  ||
                                  ||  D15
                                  \/

   RENAME_EXEMPT_PREFIXES                    HISTORY_APPEND_ONLY_PATHS
   [ UNCHANGED - all six entries ]           [ 'CHANGELOG.md',
        |                                      'kai/library/releases/',
   predicate: the ban check                    'docs/proposals/',
   never READS these paths                     'test/fixtures/host-installs.json' ]
        |                                        |
   consumer: validate-plugin.mjs             predicate: for each path in the PR diff,
   (R2 / D12 / D14 bans)                     DELETED-LINE COUNT == 0  -> may GROW,
        |                                    may not be REWRITTEN
   lives in: scripts/lib/pack-plan.mjs           |
                                             consumer: release-guard.mjs, beside
                                             evaluate() - the function that already
                                             owns "what may a PR contain" and already
                                             has base/head (:74-80). NO new job,
                                             NO new workflow step, NO new script.
```

---

## D15 — P1-6 · The immutability scope is not the inverse of the ban-scan scope · **Decouple. Accept in full.**

### The defect, stated at full strength — it is worse than scored

The reviewer scored P1-6 as blocking `RECOVERY-M`, A-4, A-5, B-1 and B-2. Working
it through against `evaluate()` (`release-guard.mjs:52-71`), it is **universal**:

> **Every behaviour PR in this repository requires `CHANGELOG.md` in its diff
> (`:64-66`). D7(b) forbids `CHANGELOG.md`. Every PR in the plan touches
> `scripts/`, `skills/`, `packs/` or `marketplace.json` (`:20`, `:21-26`), so
> every PR in the plan is a behaviour PR. D7(b) as written is unsatisfiable for
> A-1, A-2, A-3, A-4, A-5, B-1, B-2 and the recovery patch — all eight, without
> exception.**

Three further collisions the review did not enumerate, all the same root cause:

1. **A-2 and A-3 are blocked too**, not just A-4/B-2 — A-2 edits both
   `migration-doctor.mjs` and `pack-plan.mjs` (`thread:706`), and D7(a)'s constant
   is itself declared *in* `pack-plan.mjs`, so **A-3 cannot even land the rule**.
2. **B-1 is blocked by `test/`, a distinct arm.** B-1's content is *"new-bucket
   fixture arms **added** (old ones kept)"* (`thread:715`) — those arms live in
   `test/fixtures/host-installs.json`, and `test/` is exempt-listed. The review
   listed B-1 as blocked but attributed it to `CHANGELOG.md` alone.
3. **`RECOVERY-M` step 2 fails a *fourth* way that nobody has named: the version.**
   `isForwardBump` (`release-guard.mjs:39-49`) rejects a downgrade
   (`:44-47`), and `evaluate()` errors on it (`:61-63`). A straight
   `git revert <B-2 merge>` restores the **pre-B-2 version** — anti-monotonic —
   so the recovery patch is red on the version check *and* on the changelog
   check even after D7(b) is fixed. **A revert is anti-monotonic; `release-guard`
   is monotonic on both release artifacts.** Fixing D7(b) alone would not have
   made step 2 merge-eligible; the reviewer's mandate ("make `RECOVERY-M` and
   every mechanism PR demonstrably satisfiable") requires this too, so it is
   inside the discharge, not new scope.

### Root cause — the third instance of one shape, and I am naming the general form

- **D5:** derived a *historical* fact from a *current* array (rollback coverage).
- **D14:** derived an *enforcement* set from a *recognition* set (`MARKETPLACE_ALIASES`).
- **D15:** derived an *immutability* scope from a *visibility* scope
  (`RENAME_EXEMPT_PREFIXES`).

The general form, stated once so a fourth instance is recognisable on sight:

> **A list justified by "the checker should ignore these" is never automatically
> the list justified by "an author may not change these." Ignoring is about
> *reading*; immutability is about *writing*. Any constant read by both a reader
> and a writer is a defect waiting for a PR that needs to write what the reader
> ignores.**

`RENAME_EXEMPT_PREFIXES` has exactly one correct membership rule — *"a file where
a retired literal is legitimately present"* — and two of its six entries
(`pack-plan.mjs`, `migration-doctor.mjs`) are there for the dictionary reason,
which has **nothing to do with history**. That is why the array cannot serve
D7(b).

### The ruling

**`RENAME_EXEMPT_PREFIXES` is unchanged. D7(a) is unchanged. R2, D12's marked
block and D14's three banned sets are unchanged and untouched.** D7(b) stops
reading that array and reads a new one, with a different predicate.

```
  BAN-SCAN SCOPE  =  RENAME_EXEMPT_PREFIXES                    [UNCHANGED - D7(a)]
      predicate : the literal-ban check never READS these paths
      consumer  : scripts/validate-plugin.mjs (R2, D12, D14)
      declared  : scripts/lib/pack-plan.mjs, beside PACKS_DIR

  IMMUTABILITY SCOPE = HISTORY_APPEND_ONLY_PATHS               [NEW - D7(b)]
      = [ 'CHANGELOG.md',                    // acceptance names it; :64-66 requires the append
          'kai/library/releases/',           // acceptance names it; 16 shipped ship-records
          'docs/proposals/',                 // records of what was proposed, not what is true
          'test/fixtures/host-installs.json' // 1.0.4 evidence; already declared append-only
        ]
      predicate : for each path in the PR diff, DELETED-LINE COUNT == 0.
                  These files may GROW. They may not be REWRITTEN or SHRUNK.
      consumer  : scripts/release-guard.mjs, beside evaluate()
      binding   : EVERY pull request, unconditionally. No self-classification.
```

**Five properties, each doing one job:**

1. **The predicate is the acceptance line's own verb.** The acceptance criterion
   reads *"Historical records are explicitly excluded from **rewriting**."* Not
   "from touching." `deleted == 0` is the mechanical form of "not rewritten": a
   rename sweep replaces `@kai-plugins` with `@kai`, which in a unified diff is a
   deletion plus an addition, so **any sweep into these paths fires the rule**. An
   append is additions only, so it passes. The rule and the requirement are now the
   same sentence.
2. **Every change to D7(b) is a *relaxation*, and the only newly-permitted
   behaviour is appending — which no rename sweep does.** Membership shrinks
   (`scripts/lib/*.mjs` out; `test/` narrowed to one file; `kai/` narrowed to
   `library/releases/`) and the predicate loosens (touch → rewrite). A sweep
   modifies existing lines by definition, so **the control against the actual
   threat is unchanged.** D7 is not weakened; it is made *satisfiable*, and
   therefore enforceable, for the first time.
3. **It lives in `release-guard.mjs`, and that placement is the structural fix,
   not just a convenience.** That module already runs only on pull requests
   (`validate.yml:66-68`), already computes the three-dot no-renames diff
   (`:74-80`), and already owns the question *"what must a PR contain."* Putting
   the immutability rule beside `evaluate()` means **the rule that requires the
   CHANGELOG append and the rule that constrains it now live in the same
   function.** The contradiction P1-6 found existed precisely because the two
   halves were authored in different records and met only in the CI log. They can
   no longer drift apart unseen. No new job, no new workflow step, no new script,
   no new import.
4. **Unconditional binding, deliberately.** Conditioning on "is this a rename PR?"
   reintroduces the self-classification judgment D7 exists to remove. With the
   corrected membership the rule is **inert** for any PR not rewriting a record —
   it costs one `--numstat` read. The escape hatch for a genuine correction is the
   same one this repo already uses everywhere: **append a correction, do not
   rewrite the record.** This thread is the proof: four appended revisions, zero
   rewrites.
5. **`kai/coordination/items/**`, `kai/coordination/ACTIVE.md|BOARD.md|backlog.md`
   and `kai/initiatives/**` are deliberately OUT of the constant.** They are
   *mutable state machines* — `version`, `state`, `lease`, `scope.current` change
   on every pass. An append-only rule over them would red **this very pass**,
   which edits `kai/coordination/items/area-plugins-migration-architecture.md`.
   They keep the acceptance line's protection through **D7(a)**, which is the
   mechanism that actually prevents sweeps: the checker never reads them, and D7's
   own procedure is *"each PR fixes exactly the files the checker names, and the
   checker names only non-exempt files"* (`thread:657-659`). A path the scanner
   cannot see is a path no sweep is ever directed to. Belt-and-braces (b) is spent
   only where a rewrite would destroy **shipped or evidentiary** history.

### The four confirmations the packet requires, arm by arm

All four are `derived-from-source` — read from `release-guard.mjs:20,21-26,39-49,52-71`
and `validate.yml:31,43,66-68`. **Nothing executed; no shell this session.**

**(i) A-4 can merge.** ✅
Diff: `pack-plan.mjs` (`PACKS_DIR='plugins'`), `git mv packs plugins`, regenerated
tree, `marketplace.json` `source:` ×5, `plugin.json`+`package.json` bump,
`CHANGELOG.md`, `README.md`.
- `release-guard`: behaviour paths present (`scripts/`, `packs/`→`plugins/`,
  `marketplace.json`) ⇒ needs forward bump ✅, `CHANGELOG.md` in diff ✅ (`:64-66`),
  `README.md` in diff ✅ (`:67-69`).
- `HISTORY_APPEND_ONLY_PATHS`: `CHANGELOG.md` gains a new dated section at the top
  (`CHANGELOG.md:1-7` is newest-first) ⇒ **0 deletions** ✅. No path under
  `kai/library/releases/`, `docs/proposals/`, or `test/fixtures/host-installs.json`
  ✅. `pack-plan.mjs` is **not in this constant** ⇒ the edit is simply legal ✅.
- D7(a) unchanged ⇒ R2's scan still never reads history. ✅
**Green.** The old rule failed it twice (`CHANGELOG.md` + `pack-plan.mjs`).

**(ii) B-2 can merge.** ✅
Diff: `marketplace.json:2` → `"kai"`, `MARKETPLACE='kai'`,
`MARKETPLACE_ALIASES=['kai-plugins']`, `RETIRED_MARKETPLACE_NAMES=['kai-plugins']`,
regenerated `kai-core-workspace-onboarding` installer, the `@kai-plugins → @kai`
prose sweep across `docs/**`/`README.md`/`skills/**`, bump, `CHANGELOG.md`,
`README.md`.
- `release-guard`: `marketplace.json` is a `BEHAVIOR_FILE` (`:21-26`) ⇒ bump ✅,
  `CHANGELOG.md` ✅, `README.md` ✅.
- `HISTORY_APPEND_ONLY_PATHS`: `migration-doctor.mjs` is **not in this constant**
  ⇒ legal ✅. `CHANGELOG.md` appended ⇒ 0 deletions ✅. **The prose sweep cannot
  reach `docs/proposals/`** — and this is the arm that matters, because
  `docs/proposals/pack-architecture.md:6,26,109,139` carries four live
  `kai-plugins` / `packs/` tokens. D7(a) keeps the scanner from ever *naming* them
  (so the sweep is never directed there) and D15 fires if someone sweeps them
  anyway. ✅
**Green.** The old rule failed it twice (`CHANGELOG.md` + `migration-doctor.mjs`).

**(iii) `RECOVERY-M` step 2's revert can merge.** ✅ — **with two mechanical
commands added, because a revert is anti-monotonic.**
A bare `git revert <B-2 merge>` is red on three counts even after D15: it *deletes*
B-2's `CHANGELOG.md` section (append-only violation **and** `:64-66` still demands
a changelog entry) and it *lowers* `plugin.json`/`package.json` (`isForwardBump`
`:39-49` rejects it). The fix is two commands, no judgment:

```
git revert -n <B-2 merge commit>
git restore --source=HEAD --staged --worktree -- CHANGELOG.md plugin.json package.json package-lock.json
#   (older git: git checkout HEAD -- CHANGELOG.md plugin.json package.json package-lock.json)
# then four small edits, all named by the checks themselves:
#   1. MARKETPLACE_ALIASES = ['kai']
#   2. forward patch bump: plugin.json + package.json (+ package-lock.json)
#   3. append a new dated section to CHANGELOG.md
#   4. re-stamp README.md "## Status"
git commit
```

- The revert still carries **everything that matters** backwards mechanically:
  `marketplace.json:2`, `MARKETPLACE`, `RETIRED_MARKETPLACE_NAMES`, the
  regenerated installer skill and **every prose token B-2 swept to `@kai`** —
  including `README.md`'s prose, which is why `README.md` is deliberately **not**
  in the restore list. The diff is still "B-2 read backwards," reviewable by eye.
- The restore list is exactly the **two monotonic release artifacts** (plus the
  lockfile that mirrors the version). One line, no site list, no judgment call.
- `release-guard`: forward bump ✅, `CHANGELOG.md` present and appended ✅,
  `README.md` present (swept + re-stamped) ✅.
- `HISTORY_APPEND_ONLY_PATHS`: `CHANGELOG.md` 0 deletions ✅; B-2 never touched
  `kai/library/releases/`, `docs/proposals/` or the host-installs fixture, so its
  revert cannot either ✅.
**Green.** This is the arm the "carve-out" phrase was covering; it is now
demonstrated rather than asserted.

**(iv) `CHANGELOG.md` and `kai/library/releases/**` remain immutable to a rename
sweep.** ✅ — **protected twice, by two independent mechanisms.**
- **D7(a), unchanged:** both are inside `RENAME_EXEMPT_PREFIXES`, so the literal
  ban never reads them, never reports a hit there, and therefore never *directs* a
  sweep there. Since D7's procedure is checker-driven (`thread:657-659`), an
  invisible path is an unvisited path.
- **D15, new:** if a sweep reaches them anyway — a careless global find-and-replace,
  an over-broad `sed` — every rewritten line is a deletion, so the count is > 0 and
  the required `contract` job goes red on the PR, *regardless of intent*. Deleting
  a `ship-record.md` fires. Editing a shipped `## [1.0.x]` section fires. Adding a
  new dated section, or a new `ship-record.md` under a new run directory, passes —
  which is required, since `release-guard:64-66` mandates the first and the release
  workflow mandates the second.
**Immutable to rewriting, open to growth. That is exactly the acceptance line.**

Also confirmed green under D15, for completeness: **A-1** (`release-guard.mjs`,
`pack-preview.mjs`, `validate.yml`, + bump/CHANGELOG/README — none in the new
constant), **A-2** (both source-of-truth modules now legal), **A-3** (can declare
the constant it lives beside), **A-5** (docs sweep incl.
`docs/getting-started.md:180-184,202`'s `packs/` sites, which the tree-prefix ban
names), **B-1** (fixture arms are **added**, `old ones kept` — 0 deletions ⇒
passes the one file it is scoped to). **All eight PRs green.**

### Reversibility

**Cheap.** `HISTORY_APPEND_ONLY_PATHS` is one exported constant and one predicate
in a module that already computes the diff, landing in **A-3** alongside the checks
it accompanies — before any of the constrained paths are touched by the plan. If
the membership proves wrong, it is a one-line edit with no data migration and no
host-visible effect. Consequence if wrong in the permissive direction: a rewrite of
a shipped record reaches `main` and must be corrected by a follow-up commit —
recoverable, since git retains it. Consequence if wrong in the restrictive
direction: a PR is red with a message naming the exact path and deleted-line count,
and the author appends instead of rewriting. Neither failure mode strands a user.

### Domain work this implies

- **`principal-swe-infra` / whoever lands A-3:** declare
  `HISTORY_APPEND_ONLY_PATHS` and the `deleted == 0` predicate inside
  `scripts/release-guard.mjs`, beside `evaluate()`. The *how* — `--numstat` vs.
  parsing `--patch`, and how the failure message is phrased — is theirs.
- **Whoever lands A-3's self-test:** the repo's convention is a witness arm in an
  existing self-test (`release-guard.mjs --self-test` already runs at
  `validate.yml:48-49`), not a new gate. Two cases suffice: an append passes, a
  rewrite fails.
- **`principal-swe-manager`:** the two extra commands in `RECOVERY-M` step 2 are
  runbook text, not sequencing — no PR resequencing is implied and no PR moves
  between releases.

---

## Corrected `RECOVERY-M` green table — supersedes the table at `thread:2595-2602`

Same evaluation point (recovery commit reaching the `contract` job after B-2, at
or after milestone 4). Two rows changed: **required derived pins** (P2-7) and
**D7** (P1-6). The other four are unchanged and restated so the operator reads one
table. All results `derived-from-source`.

| gate arm | state at recovery | result |
|---|---|---|
| **banned marketplace names** | `RETIRED_MARKETPLACE_NAMES=['kai-plugins']`, `MARKETPLACE='kai-plugins'` after the revert ⇒ set is `{}` | **GREEN** — unchanged. `kai` is not in the set and cannot be; the D14 entry guard forbids it |
| **banned identity strings** | `RETIRED_PACK_PLUGINS=['kai-personal']`; its only shipping occurrence is inside D12's marked block; the recovery prose names no retired identity | **GREEN** — unchanged |
| **banned path prefixes** | `LEGACY_TREE_DIRS=['packs']`; the recovery commit is a layer-3 change and introduces no `packs/` string | **GREEN** — unchanged |
| **required derived pins** (`validate-plugin.mjs:861,878,898-899`, D13's `` marketplace:${MARKETPLACE} ``) | **the revert restores them.** B-2 contained the regenerated installer skill (`thread:716`); reverting B-2 reverts that regeneration, so the pinned spans return to `kai-plugins` **in the same commit that returns `MARKETPLACE` to `'kai-plugins'`** | **GREEN — by construction, no extra step. CORRECTED (P2-7).** Expect green, not red. *Only* on the hand-authored fallback branch (operator patches by hand instead of reverting) is this red until `skills/kai-core-workspace-onboarding/SKILL.md` is re-derived — and there the check names every failing span |
| **R1** (derived provider-root placeholder rule) | unaffected by a marketplace name | **GREEN** — unchanged |
| **`release-guard` version + release artifacts** (`release-guard.mjs:39-49,64-69`) | a bare revert is **anti-monotonic**: it lowers the version and deletes B-2's changelog section | **GREEN once step 2 restores `CHANGELOG.md` + the version files before committing** — the two commands in amended step 2. **NEW ROW; this arm was never evaluated** |
| **D7 / history immutability** (`diff ∩ HISTORY_APPEND_ONLY_PATHS` has 0 deletions) | the recovery diff touches `marketplace.json`, `scripts/**`, `skills/**`, `docs/**`, `README.md`, `CHANGELOG.md`. Of these only `CHANGELOG.md` is in the constant, and step 2 restores it before appending ⇒ **0 deletions**. Nothing under `kai/library/releases/`, `docs/proposals/` or `test/fixtures/host-installs.json` | **GREEN. CORRECTED (P1-6).** The old row cited a carve-out that does not exist; under D15 no carve-out is needed, because appending was never the thing being forbidden |

**Operator-facing summary, in one line, because that is what gets read at 2am:**
**run the two commands in amended step 2 and every arm is green — including the
pins, which you should NOT expect to see red.**

---

## Amendment to `RECOVERY-M` step 2 — supersedes the step 2 at `thread:2616-2645`

Everything in the previous step 2 stands — the revert-not-hand-diff rationale, the
prose sweep-back being required for correctness rather than by a ban, the A1
exception, zero identity movement, and `RETIRED_MARKETPLACE_NAMES` needing no
attention either way. **Two commands are inserted, and the reason is stated so
nobody removes them.**

> **Step 2 (amends the 2028 step 2) — forward patch release, from the revert.**
>
> ```
> git revert -n <B-2 merge commit>
> git restore --source=HEAD --staged --worktree -- CHANGELOG.md plugin.json package.json package-lock.json
> ```
> then: set `MARKETPLACE_ALIASES = ['kai']`; bump the patch version forward;
> append a new dated `CHANGELOG.md` section; re-stamp `README.md`'s `## Status`.
> Commit.
>
> - **Why `-n` and the restore.** A revert runs *backwards*; `release-guard` runs
>   *forwards*. It requires a forward version bump (`release-guard.mjs:39-49,61-63`)
>   and a `CHANGELOG.md` entry (`:64-66`), and D15 requires `CHANGELOG.md` to grow
>   rather than shrink. A bare revert lowers the version and deletes B-2's
>   changelog section, so it is **red on three checks in the required job**.
>   Restoring exactly the two monotonic release artifacts (plus the lockfile that
>   mirrors the version) and then moving them forward is the whole fix.
> - **`README.md` is deliberately NOT restored.** Its prose must be swept back to
>   `@kai-plugins` by the revert — that is a correctness requirement, not a
>   cosmetic one — and `release-guard:67-69` only requires that it appear in the
>   diff, which it does. Re-stamp `## Status` on top of the reverted content.
> - **Still no site list, still no judgment call.** The revert carries every prose
>   token, the installer regeneration, `marketplace.json:2`, `MARKETPLACE` and
>   `RETIRED_MARKETPLACE_NAMES` backwards mechanically. The operator types two
>   commands and makes four edits that the checks themselves name if forgotten.

Steps 1, 3–7, the detection signals, the thresholds, the owners, the wedged-host
branch, the layer-2 prohibition and the three time bounds are **unchanged**.

---

## P2-6 · The repo-slug sites, enumerated — and what the deferred positive rule must decide

**Accepted.** All read by file this session.

**The six `marketplace add` sites (the P2-6 set):**

| # | site | form |
|---|---|---|
| 1 | `README.md:12` | `copilot plugin marketplace add RubenSaucedo/kai` |
| 2 | `README.md:78` | same |
| 3 | `README.md:135` | same |
| 4 | `docs/getting-started.md:16` | same |
| 5 | `docs/getting-started.md:105` | same (indented, in a numbered step) |
| 6 | **`skills/kai-core-workspace-onboarding/SKILL.md:85`** | same — **inside the generator-derived installer skill**, which is why this one is decisive |

**Four further repo-slug shapes in the same file, which the same rule must also
classify** — carried now so the deferred pass does not rediscover them:

| site | form | why it is a different question |
|---|---|---|
| `docs/getting-started.md:180-184` | `copilot plugin install RubenSaucedo/kai:packs/<pack>` | repo slug **plus a tree path**. The `packs/` half is already owned by D14's tree-prefix ban and is swept by **A-5**; the slug half is not |
| `docs/getting-started.md:195` | `https://github.com/RubenSaucedo/kai/issues/102` | a URL, not a token |
| `docs/getting-started.md:200` | `git clone https://github.com/RubenSaucedo/kai.git` | a clone URL |
| `docs/getting-started.md:215` | prose: *"Add `RubenSaucedo/kai` to the repository's coding-agent plugin configuration"* | a slug in prose, no command around it |

(For completeness and to keep A-5's scope honest: `docs/getting-started.md:202` is
`--plugin-dir packs/…` — a **tree-prefix** site, not a repo-slug site. It is
already the tree ban's, not the positive rule's.)

**Where the deferred positive rule is decided, and the constraint this puts on it.**
The deferred rule is *"every marketplace token in shipping prose names
`MARKETPLACE`."* These ten sites are exactly where it must decide whether a **repo
slug is a marketplace token**. It is not, and the record now says so with a reason:

- **Marketplaces are added by repo slug; the marketplace's *name* is declared at
  `.github/plugin/marketplace.json:2`.** `RubenSaucedo/kai` in `marketplace add`
  is an *address*, not a *name*. It is correct today and stays correct after the
  rename, because the rename changes the name field, not the repo.
- **A positive rule keyed on COMMAND POSITION — "the argument of `marketplace
  add`" — would be wrong and would recreate P1-5 a third time.** It would demand
  `marketplace add kai`, red-lighting all six sites including
  `SKILL.md:85`, which is **generator-derived**: the rule and the generator would
  be mutually unsatisfiable, exactly the shape the reviewer found in P1-5.
- **Therefore the positive rule must be keyed on TOKEN SHAPE, never on command
  position**, and must explicitly exclude `owner/repo` slugs and URLs. The shapes
  it may bind are the three D14 already names: `<plugin>@<marketplace>`,
  `browse <name>`, `marketplace:<name>`.

**Disposition: Defer, with the constraint recorded.** No rule ships in this
initiative. The trigger that reopens it is unchanged — the first time a stale
marketplace token reaches `main` in a shape the negative ban cannot see. This
entry adds the site list and the "slug is an address, not a name" constraint so
that pass starts from evidence rather than a rediscovery.

---

## P2-7 · The green table's pin row · **Accepted — fixed in the corrected table above**

The reviewer is right, and right about the direction of the error: telling an
operator under a one-day bound to expect **red** where they will see **green**
invites the conclusion that the revert did not take, at the exact moment a wrong
conclusion is most expensive. The corrected table splits the row by branch — the
revert restores the regenerated installer skill with everything else (`thread:716`)
and the pins come back green **by construction**; the hand-authored fallback is the
only branch where the row is red, and there the check names every failing span. The
one-line operator summary under the table states the expectation in the words that
survive stress.

---

## Amendments index — what this entry changes

| # | what | supersedes | status of everything else |
|---|---|---|---|
| 1 | **D15** — `HISTORY_APPEND_ONLY_PATHS` + `deleted == 0` predicate becomes D7(b)'s basis, in `release-guard.mjs` | D7(b) at `thread:652-655` | **D7(a) and `RENAME_EXEMPT_PREFIXES` are byte-for-byte unchanged** |
| 2 | `RECOVERY-M` **step 2** gains `git revert -n` + one `git restore` of the two monotonic release artifacts | step 2 at `thread:2616-2645` | steps 1, 3–7, signals, thresholds, owners, time bounds unchanged |
| 3 | The **`RECOVERY-M` green table** is reissued with the pins row and the D7 row corrected and a version/release-artifact row added | table at `thread:2595-2602` | the other four arms restated unchanged |
| 4 | **P2-6** site enumeration + the "a repo slug is an address, not a name" constraint on the deferred positive rule | — | the positive rule stays **deferred**; nothing ships |
| 5 | The **general form** of the D5 / D14 / D15 shape is named once, so a fourth instance is recognisable | — | no decision changes as a result |

**Explicitly unchanged and not reopened:** D0, D1, D2, D3, D4, D5, D6, D7(a), D8,
D9, D10, D11, D12, D13, D14, R1, R2, the two-release sequencing, PROBE-M as the
publish gate, PROBE-M′, the `installSurface: "packs"` enum call, the whole "What
stays the same" list, and the named residual (a stale `@kai` token names a
marketplace no host declares, so it fails loudly at first use rather than
resolving to a third party — `observed` per the reviewer, from
`marketplace.json:2`).

---

## Scope-discipline self-check

**Classification: `Apply`.** Not `Propose`, not `Defer`.

- **Adds no step, gate, surface or capability.** The predicate lands inside
  `scripts/release-guard.mjs`, which already runs as a named step at
  `validate.yml:66-68`. **No new workflow step, no new job, no new script, no new
  import, no new module.** D7(b) was already asserted somewhere in this job; D15
  changes *which constant it reads and what it asserts*, not whether it exists.
- **Strictly reduces enforcement surface.** Membership shrinks on three axes and
  the predicate loosens on one. Nothing becomes newly forbidden anywhere.
- **Mechanises contracts already committed**, rather than legislating new ones:
  the acceptance line's *"excluded from rewriting"*, `test/fixtures/host-installs.json`'s
  already-declared append-only property, and this repo's existing
  release-notes-are-shipped-history practice.
- **Violates no product `non_negotiable`.** It enforces #9 and success measure #5
  ("silent stranding paths: 0") by making the recovery path *executable*; an
  unmergeable recovery patch is a stranding path with extra steps.
- **No scope expansion routed to the PM.** Nothing here needs a product, cost or
  strategy call.
- **No production change.** No file under `scripts/`, `packs/`, `agents/`,
  `skills/`, `docs/`, `plugin.json` or `.github/` was modified this session; all
  were read as evidence. `kai/initiatives/area-plugins/` not created, no `mkdir`
  attempted. `kai/initiatives/pack-split/` and every `area-plugins-m2-*` record
  untouched. Milestone 1's acceptance — *"No production code, manifest, or
  marketplace change has been made"* — **holds.**

---

## Open questions / escalations

**None. Nothing is routed to `@operator` as a decision, and I decline to
manufacture one.**

- **P2-5 remains an operator *verification***, not a decision: whether `contract`
  is a required status check. Amended step 3 is already correct under both
  answers.
- **PROBE-M / PROBE-M′ remain operator *actions***, not decisions. The design is
  identical under every outcome.
- **Everything in this revision is an engineering call inside my seam** — the
  membership of two constants and two commands in a runbook — and I have made it.
- Two claims stay `reported`, not `observed`, and are labelled as such wherever
  used: whether `contract` is a required status check, and whether the working
  tree is clean. **No shell existed in this session; nothing was executed.** Every
  CI outcome above is `derived-from-source` — read from
  `release-guard.mjs:20,21-26,39-49,52-71,74-80` and `validate.yml:31,43,66-68` —
  and the first real execution of D15's predicate will be in A-3's CI run, which
  is the right place for it.

---

## HANDOFF 2026-08-27-2053 — principal-swe-architect -> principal-sre

- did:       Revision 4, resolving `REVIEW 2026-08-27-2042`'s single P1 and both P2s. **P1-6 accepted in full — the finding was correct and the "carve-out already in D7" close was unsupported; I re-read D7 (`thread:627-660`) and there is no carve-out.** Found the defect is **worse than scored**: because `release-guard.evaluate()` makes `CHANGELOG.md` mandatory on every behaviour PR (`release-guard.mjs:64-66`) and every PR in the plan is a behaviour PR (`:20,21-26`), D7(b) was unsatisfiable for **all eight** PRs (A-1…A-5, B-1, B-2, recovery), not five — and B-1 fails on a distinct `test/` arm, A-3 could not even land the rule (the constant lives in `pack-plan.mjs`), and **`RECOVERY-M` step 2 fails a fourth, previously unnamed way: a revert is anti-monotonic and `isForwardBump` (`:39-49`) rejects the version downgrade.** **D15 splits the constant** into BAN-SCAN scope (`RENAME_EXEMPT_PREFIXES`, byte-for-byte unchanged, still read by `validate-plugin.mjs`) and IMMUTABILITY scope (`HISTORY_APPEND_ONLY_PATHS` = `CHANGELOG.md`, `kai/library/releases/`, `docs/proposals/`, `test/fixtures/host-installs.json`) with a **different predicate — deleted-line count == 0: these files may grow, they may not be rewritten**, which is the acceptance line's own verb. It lives beside `evaluate()` in `release-guard.mjs`, so **the rule that requires the changelog append and the rule that constrains it are now in the same function** and cannot drift apart again — no new job, step, script or import. **D7 is not weakened:** every change is a relaxation and the only newly-permitted behaviour is *appending*, which no rename sweep does. All four required confirmations demonstrated arm by arm: **(i) A-4 merges** (`pack-plan.mjs` no longer forbidden; changelog append is 0 deletions), **(ii) B-2 merges** (`migration-doctor.mjs` legal; the sweep still cannot reach `docs/proposals/`, where `pack-architecture.md:6,26,109,139` proves four live sweep-bait tokens), **(iii) RECOVERY-M step 2 merges** with two added mechanical commands (`git revert -n` + one `git restore` of `CHANGELOG.md`/`plugin.json`/`package.json`/`package-lock.json`, `README.md` deliberately excluded so the prose sweep-back survives), **(iv) `CHANGELOG.md` and `kai/library/releases/**` stay immutable to a sweep, protected twice** — D7(a) makes them invisible to the checker that directs sweeps, D15 reds any rewrite that reaches them anyway. **P2-6:** all six `marketplace add RubenSaucedo/kai` sites enumerated (`README.md:12,78,135`, `docs/getting-started.md:16,105`, `SKILL.md:85`) plus four further repo-slug shapes (`getting-started.md:180-184,195,200,215`), with the constraint recorded that the deferred positive rule must key on **token shape, never command position** — a slug is an address, not a name — or it recreates P1-5 against the generator-derived skill. **P2-7:** green table reissued; the pins row now reads GREEN by construction on the revert branch (B-2 carried the installer regeneration, `thread:716`, so the revert restores it), red only on the hand-authored fallback, plus a new version/release-artifact row and an operator-facing one-line summary.
- state:     in-review
- needs:     `principal-sre` — `independent-reliability` re-review of `DECISION 2026-08-27-2053` (revision 4). Narrow: one seam plus two P2s. D0–D14, R1, R2, sequencing and the residual are untouched and not reopened.
- artifacts: kai/coordination/threads/area-plugins-migration-architecture.md (this DECISION entry, appended — no prior entry altered); kai/coordination/items/area-plugins-migration-architecture.md (version 17, `in-review`, `next_role: principal-sre`, lease cleared to null on all five fields, **all three** `completed_reviews` entries preserved)
- evidence:  See the evidence register in this entry. **No shell this session — nothing executed.** Every CI outcome is `derived-from-source`, read from `scripts/release-guard.mjs:20,21-26,28-31,35-49,52-71,74-80`, `.github/workflows/validate.yml:31,43,66-68`, `CHANGELOG.md:1-7`, `kai/library/releases/**` (16 ship-records), `docs/proposals/pack-architecture.md:6,26,109,139`, `README.md:12,78,135`, `docs/getting-started.md:16,105,180-184,195,200,202,215`, `skills/kai-core-workspace-onboarding/SKILL.md:85`.
- questions: none blocking. **No operator decision is required and none was manufactured.** P2-5 stays an operator *verification*; PROBE-M/PROBE-M′ stay operator *actions*.
- next:      `principal-sre` — `area-plugins-migration-architecture` (`in-review`, version 17, lease null, `next_role: principal-sre`). Milestone `decisions-locked` stays **open** until the review requirement is discharged; `scope.current` does not advance; `area-plugins-m2-planpacks-prefix` and the milestone-2 chain remain gated on this item reaching `completed`. Dispatch is `director-chief-of-staff`'s.

---

## REVIEW 2026-08-27-2228 — principal-sre · independent-reliability (fourth and final-intent pass)

**Mode:** CHANGE-REVIEW · **Scope/change_ref:** `null` — knowledge item. This
verdict binds explicitly to **`DECISION 2026-08-27-2053 — principal-swe-architect
(revision 4)`**, the **newest dated DECISION entry in this thread** (`thread:3269`),
appended after `REVIEW 2026-08-27-2042`, at item **version 18**. Read together with
revisions 3, 2 and the 1922 packet via that entry's amendments index.
**Environment:** repository `C:\src\kai`, read-only, **no shell** — `gh`, `node`,
`npm` and `git` were not run. Every execution-dependent claim below is `reported`
or `derived-from-source`, never `observed`.
**Evidence window:** 2026-08-27, files read directly this session.

**Verdict: CONDITIONAL** (`approved-with-conditions`) · **P0 0 / P1 0 / P2 4** ·
**`satisfies_requirement: true`**

**Lease re-verified immediately before this write:** holder `principal-sre` ✔,
token `apx-mig-sre4-20260827-2240-r1` ✔, `version_at_grant` 17 against record
version 18 ✔ (the grant itself increments — not a collision, per the dispatch
packet). **Matched. No collision.** *Records-hygiene note, not a collision:* the
session clock reads `2026-08-27T22:27`, while `lease.acquired` reads `2240`. I
timestamp from the session clock rather than invent a time to match the field, and
flag the ~13-minute skew for the steward.

---

### Summary

**P1-6 is genuinely discharged.** I did not read the discharge back from the
record; I re-derived every anchor from source and then re-ran all eight PR arms
myself against `evaluate()`. The unsatisfiability is gone: the recovery patch
merges, seven of eight PRs are unconditionally green, and the eighth is
conditionally green with a loud, self-explaining failure and a trivial author-side
fix. The `isForwardBump` finding the architect discovered on their own — that a
revert is anti-monotonic and would have been red on the version check *even after*
D7(b) was fixed — is **correct, verified from source, and was named by no
reviewer**. That is the mark of a real pass rather than a paper one.

**Citation discipline — the thing under test across all three prior passes — holds
at the standard.** I re-derived roughly two dozen anchors this session:
`release-guard.mjs:20, 21-26, 28-31, 35, 39, 44-47, 52-71, 61-63, 64-66, 67-69,
74-80`; `validate.yml:31, 43, 48-49, 66-68`; `CHANGELOG.md:1-7`;
`pack-plan.mjs:49`; `marketplace.json:2`; `docs/proposals/pack-architecture.md:6,
26,109,139`; all ten P2-6 repo-slug sites; and the 16 `ship-record.md` files under
`kai/library/releases/**`. **Every one resolves exactly.** Not one loose citation
in revision 4 — including the four the architect self-corrected before finishing.

**I tested the load-bearing safety claim hard, as instructed, and it splits.** The
*design* is safe: D7(b)'s new forbidden set is a strict subset of its old one on
the path axis, its predicate is strictly weaker on the retained paths, and **no
rewrite of a retained path is newly permitted**. But the *summary sentence* —
"every change is a relaxation… the only newly-permitted behaviour is appending…
nothing becomes newly forbidden anywhere" — is **not accurate on two axes**, and
the architect's own property 4 contradicts it. The functional conclusions it
supports are nonetheless all true when re-derived independently, which is the
distinction that keeps this a P2 and not a fourth P1: revision 3's defect broke a
function; revision 4's imprecision mis-describes a function that works.

**Question 4 — the mirror-image defect — is real, and I found it.** Splitting one
array into two does create a cross-list invariant with nothing enforcing it. It
differs from the two I found before in the one way that matters for severity: it
fails **loud and closed**, not silent and open. Current membership satisfies the
invariant, so no PR in this plan is affected.

**Four P2s, no P1, and I am not manufacturing a fourth block.** Every finding
below either fails closed, is recoverable via git, or is a wording correction.
None breaks the recovery path, none touches the irreversible byte, none strands a
user. They are implementation notes for A-3, and the record already routes A-3's
*how* to `principal-swe-infra`. Conditions are the right instrument; a fourth
`changes-requested` would be ceremony.

---

### 1 · Is P1-6 genuinely discharged? — **Yes.** `derived-from-source`

**The two rules, re-read from source this session.** `evaluate()` at
`release-guard.mjs:52-71` makes `CHANGELOG.md` mandatory (`:64-66`) and `README.md`
mandatory (`:67-69`) whenever any `BEHAVIOR_PREFIXES` path (`:20` — `agents/`,
`skills/`, `scripts/`, `packs/`) or `BEHAVIOR_FILES` entry (`:21-26` —
`marketplace.json`, `plugin.json`, `package.json`, `package-lock.json`) is in the
diff. Both this and the D7(b) assertion run in the same required `contract` job:
`validate.yml:31` (job), `:43` (`validate-plugin.mjs`), `:66-68` (`release-guard`,
`if: github.event_name == 'pull_request'`). **All four line spans exact.**

**D7 re-read in full, independently.** `thread:635-642` is the constant — six
entries, exactly as revision 4's diagram draws them. `thread:652-655` is the
assertion, and it does say *"regardless of intent"*. **There is still no carve-out**;
my third-pass finding stands as recorded, and the architect's acceptance of it is
correct rather than diplomatic.

**All eight arms re-run by me against the new constant.** `HISTORY_APPEND_ONLY_PATHS`
= `['CHANGELOG.md', 'kai/library/releases/', 'docs/proposals/',
'test/fixtures/host-installs.json']`, predicate `deleted == 0`.

| PR | edits in the new constant? | CHANGELOG shape | result |
|---|---|---|---|
| A-1 | none (`release-guard.mjs`, `pack-preview.mjs`, `validate.yml`) | append | **green** |
| A-2 | none — both `scripts/lib/*.mjs` dropped from the constant | append | **green** |
| A-3 | none — and it can now declare the rule it lands | append | **green** |
| A-4 | none — `pack-plan.mjs` no longer forbidden | append | **green** |
| A-5 | none — sweep is checker-directed, `docs/proposals/` invisible to it | append | **green** |
| B-1 | **yes** — `test/fixtures/host-installs.json` | append | **conditional — see P2-10** |
| B-2 | none — `migration-doctor.mjs` no longer forbidden | append | **green** |
| RECOVERY-M step 2 | `CHANGELOG.md`, restored then appended | append | **green** |

**The `CHANGELOG.md` append is genuinely 0 deletions, and I verified the file shape
rather than assuming it.** `CHANGELOG.md:1-7` is newest-first — `## [1.0.4] -
2026-08-27` sits immediately under the three-line preamble — so a new dated section
is a pure insertion at line 7. Markdown carries no structural punctuation on the
preceding block, so nothing above it is rewritten. ✔

**`kai/library/releases/**` likewise.** 16 `ship-record.md` files under dated run
directories (`2026-08-24` ×1, `2026-08-25` ×4, `2026-08-26` ×3, `2026-08-27` ×8 —
counted this session, matching the architect's "16"). A new ship-record is a **new
file** under a new run directory: pure addition, 0 deletions. ✔

**`docs/proposals/` is genuine sweep-bait and the double protection is real.**
`pack-architecture.md:6` (`kai-plugins` marketplace), `:26` (`packs/`), `:109`
(`from kai-plugins`), `:139` (`install kai-engineering@kai-plugins`) — **four live
retired tokens, all four lines exact.** D7(a) keeps the scanner from naming them,
so A-5's checker-directed sweep is never sent there; D15 reds any sweep that
arrives anyway. Both legs verified. ✔

**Ruling: P1-6 discharged.** The remedy has the shape D14 proved, it reopens
nothing, and it places the control in the one function where the two conflicting
rules already meet — which is a structural fix, not a convenience. I agree with the
architect that the defect was worse than I scored it: `CHANGELOG.md` being mandatory
on every behaviour PR makes the old assertion unsatisfiable for **all eight**, not
five. My third-pass scoring was too generous.

### 2 · "Every change is a relaxation" — **tested hard. Design safe; claim inaccurate on two axes.** `derived-from-source`

This is the load-bearing safety argument, so I evaluated it as a set-containment
question rather than accepting the prose.

**The path axis and the predicate axis: the claim holds. `observed` from the two
constants.** New set ⊆ old set (`CHANGELOG.md` and `docs/proposals/` identical;
`kai/library/releases/` ⊂ `kai/`; `test/fixtures/host-installs.json` ⊂ `test/`;
both `scripts/lib/*.mjs` dropped). Predicate weakens from *"must not appear in the
diff"* to *"may appear with 0 deletions."* For every **retained** path, the set of
legal diffs strictly grows, and the growth is exactly `{appends}`. **No rewrite of
any retained path is newly permitted.** A sweep replaces a token, which in a
unified diff is a deletion plus an addition, so any sweep into those four paths
fires. The predicate genuinely is the acceptance line's own verb. ✔ **The control
against the actual threat is unchanged.**

**Axis 3 — dropped paths. The claim is inaccurate here.** The newly-permitted
behaviour is *not* only appending. Dropping `kai/` → `kai/library/releases/` and
`test/` → one fixture means `kai/coordination/**`, `kai/initiatives/**`, the rest
of `kai/library/**` and the rest of `test/` are newly permitted to be **rewritten**
by D7(b), not merely appended to. The architect's property 5 states this
accurately and defends it; property 2's summary and the handoff compress it into
something stronger than the design.

**Axis 4 — the binding axis TIGHTENS, and this contradicts "nothing becomes newly
forbidden anywhere."** Old D7(b): *"**The rename PRs** assert…"* New D7(b):
*"binding: **EVERY pull request, unconditionally.** No self-classification."* An
ordinary non-rename PR that rewrites a shipped `## [1.0.x]` section — a typo fix in
released notes — was legal under the old rule and is red under the new one.

**Ruling: this is not a weakening of history immutability, and here is why I say
so rather than assuming it.**

1. **There is no functioning baseline to weaken *from*.** The old D7(b) redded all
   eight PRs including the one that would have landed it. A rule that reds every PR
   is a build break, not a control; it would have been deleted or waived at first
   contact. Mechanical write-protection over `CHANGELOG.md` and
   `kai/library/releases/**` goes from **zero** to **enforced**.
2. **The tightening is a strengthening.** Axis 4 forbids *more*, and it fails
   closed. Property 4's reasoning — that conditioning on "is this a rename PR?"
   reintroduces the self-classification judgment D7 exists to remove — is correct
   and is the better design.
3. **Excluding the mutable state machines is correct and necessary.** An
   append-only predicate over `kai/coordination/items/**` would red this very pass,
   which rewrites `version`, `state` and `lease`. Including them would have been the
   mirror-image of P1-6.

**But the exclusion rationale over-generalizes, and this is the actionable part.**
"They are mutable state machines" is true of `items/`, `ACTIVE.md`, `BOARD.md` and
`backlog.md`. It is **not** true of **`kai/coordination/threads/**`**, which is
append-only by contract — *this thread is the proof the architect cites for the
practice*: four appended revisions, zero rewrites. `deleted == 0` is exactly its
shape, and it would **pass this very pass**, which appends and deletes nothing. It
is also the path whose rewriting would be most damaging, since it is the audit
trail carrying every `changes-requested` verdict in this chain — including the three
that produced the design now being promoted. Excluding it costs the one path that
best fits the predicate. → **P2-9.**

### 3 · The `isForwardBump` finding and the recovery recipe — **finding holds; recipe satisfies every arm including the version arm.** `derived-from-source`

**The finding is correct, verified line by line.** `isForwardBump`
(`release-guard.mjs:39`) parses head, parses base, then at `:44-47` walks the three
core components and returns `b.core[i] > a.core[i]` at the first difference. With
base = post-B-2 `main` and head = the reverted commit, head < base at some
component ⇒ **false** ⇒ `evaluate()` pushes the "not bumped forward" error at
`:61-63`. **A revert of B-2 is red on the version check on its own merits**, before
D7(b) is considered at all. The architect is right that fixing D7(b) alone would
**not** have made the recovery patch mergeable. This was a genuine fourth failure
mode and no reviewer named it, including me.

**The recipe resolves it, and I traced each arm.** `git revert -n` stages without
committing, so `HEAD` is still post-B-2; `git restore --source=HEAD --staged
--worktree -- CHANGELOG.md plugin.json package.json package-lock.json` therefore
restores post-B-2 content to exactly the monotonic release artifacts, discarding
the revert's backward motion on them alone.

| arm | mechanism | result |
|---|---|---|
| version (`:39-49`, `:61-63`) | post-B-2 version restored, then bumped forward | **green** |
| `CHANGELOG.md` present (`:64-66`) | restored, then a new dated section appended | **green** |
| `CHANGELOG.md` 0 deletions (D15) | restore discards the revert's deletion; append only | **green** |
| `README.md` present (`:67-69`) | swept back by the revert + `## Status` re-stamped | **green** |
| the rest of D15's constant | B-2 never touched releases / proposals / the fixture, so its revert cannot | **green** |
| identity restoration | `marketplace.json:2`, `MARKETPLACE`, `RETIRED_*`, installer skill, prose all carried backwards | **green** |

**Excluding `README.md` from the restore is right, and it is the subtle call in the
recipe.** `:67-69` only requires `README.md` to *appear* in the diff — it asserts
nothing about content — so the reverted prose satisfies the gate while the
sweep-back survives. Restoring it would have silently stranded new installers on
`@kai` prose after the marketplace went back to `kai-plugins`. The architect states
the reason inline so nobody "tidies" it later. That is good runbook authorship.

**One mechanical gap in the newly-added commands.** `git revert -n <B-2 merge
commit>` on a **true merge commit** requires `-m <parent-number>`; without it git
refuses outright. Whether B-2 lands as a squash or a merge commit is `unknown` to
me — I have no shell and found no documented merge convention (the only nearby
signal, `docs/reference/plugin-structure.md:191`, says *"On the exact merge
commit"*, which is suggestive but not a convention). It fails loud at command 1
with git's own message naming the fix, so it costs minutes, not correctness — but
those are minutes inside a one-day recovery bound. → **P2-11.**

### 4 · Does splitting one array into two create the mirror-image problem? — **Yes, a real one. It fails loud-closed, and current membership satisfies it.** `derived-from-source`

I have twice found single-construct-two-scopes defects here, so I checked the
inverse deliberately.

**There is a genuine cross-list invariant, and the record does not state it:**

```
  HISTORY_APPEND_ONLY_PATHS  must stay ⊆  the coverage of RENAME_EXEMPT_PREFIXES
```

**Why it must hold.** A path that is append-only-frozen but *visible to the ban
scanner* is unsatisfiable by construction: the scanner names it ("a retired literal
is here, fix it"), the fix is a token replacement, a token replacement is a
deletion, and D15 reds it. **That is P1-6 reborn in the new pair of lists.**

**It holds today** — I checked all four: `CHANGELOG.md` ∈ both; `kai/library/releases/`
⊂ `kai/`; `docs/proposals/` ∈ both; `test/fixtures/host-installs.json` ⊂ `test/`. ✔

**Nothing enforces it.** The two constants live in different modules
(`pack-plan.mjs` vs `release-guard.mjs`), are read by different scripts
(`validate-plugin.mjs` vs `release-guard.mjs`), and no check relates them. D14
faced the analogous risk and *did* add an entry guard.

**Why this is P2 and D14's was P1.** D14's divergence failed **silent-open** — the
ban set self-emptied and the gate went green while protecting nothing. This one
fails **loud-closed**: a red PR naming the exact path and deleted-line count. A
control that refuses to let a bad rename through is not a reliability gap of the
same class as one that waves it through. Severity follows the failure direction,
not the structural resemblance. The other direction — paths added to
`RENAME_EXEMPT_PREFIXES` for scan reasons silently gaining *zero* write protection
— is the same family and is folded into the same finding. → **P2-8.**

### 5 · Was anything upheld across the three prior reviews weakened? — **No.** `observed`

**Append-only confirmed by header positions:** `DECISION 1922` (:19), `REVIEW 1944`
(:990), `DECISION 2001` (:1352), `REVIEW 2015` (:2027), `DECISION 2028` (:2356),
`REVIEW 2042` (:2899), `DECISION 2053` (:3269) — all seven present, in order, none
rewritten. Revision 4 appended below my last review and altered nothing above it.

- **D7(a) / `RENAME_EXEMPT_PREFIXES` byte-for-byte unchanged.** Re-read at
  `thread:635-642`: same six entries, same four rationales, same comments. The
  amendments index claims this and it is true. ✔
- **R2, D12's marked block, D14's three banned sets untouched.** Revision 4's
  amendments index lists exactly five changes, none of which reaches them, and the
  "explicitly unchanged and not reopened" list names D0–D14, R1, R2, the two-release
  sequencing, PROBE-M/PROBE-M′, the `installSurface` enum call and the residual. No
  contradicting text appears in the new entry. ✔
- **D14's entry guard (`RETIRED ∩ KAI_PLUGINS = ∅`) intact**, so the P1-5 discharge
  I verified last pass is undisturbed. `kai` remains permanently unbannable as a
  marketplace name. ✔
- **The named residual is unchanged** and still carries the `observed` upgrade I
  gave it: a stale `@kai` token names a marketplace no host declares, so it fails
  loudly at first use. Re-confirmed from `marketplace.json:2` and the ten repo-slug
  sites. ✔
- **The acceptance line's annotation is honest, not inflated.** The item's
  Historical-records checkbox now states plainly that D15 covers `CHANGELOG.md` and
  `kai/library/releases/**`, while all four named paths keep D7(a). It does **not**
  claim mechanical write-protection it does not have. Given P2-9, that honesty is
  what keeps this line satisfied rather than overclaimed.

### 6 · Production surface — **untouched.** `observed`

- `HISTORY_APPEND_ONLY_PATHS`, `RENAME_EXEMPT_PREFIXES` and `HISTORY_IMMUTABLE_PREFIXES`
  appear **only** in the two `kai/coordination/**` files — 41 matches in the thread,
  8 in the item, **zero** anywhere under `scripts/`, `packs/`, `skills/`, `agents/`,
  `docs/`, `.github/` or `plugin.json`.
- `release-guard.mjs` contains **no** `--numstat`, no deleted-line predicate and no
  new constant — D15 is specified, not implemented, which is correct for a knowledge
  item.
- `.github/plugin/marketplace.json:2` still `"name": "kai-plugins"`. ✔
- `scripts/lib/pack-plan.mjs:49` still `export const PACKS_DIR = 'packs';`. ✔
- No manifest or marketplace change. Milestone 1's acceptance holds. "No uncommitted
  change anywhere in the tree" remains `reported` — **no shell**.

### 7 · `completed_reviews` — **all three prior entries preserved.** `observed`

Verified in the item frontmatter before writing: `1944` (P1 4 / P2 6), `2015`
(P1 1 / P2 5), `2042` (P1 1 / P2 2) — all three `changes-requested`, all three
`satisfies_requirement: false`, none deleted, none altered. This review appends a
**fourth**.

---

## Findings — P0 0 / P1 0 / P2 4

None of the four blocks. All four are carried as **conditions on A-3's
implementation**, not as reopened architecture.

### P2-8 · The two split constants share an unstated invariant that nothing enforces

`derived-from-source`. `HISTORY_APPEND_ONLY_PATHS` must stay within the coverage of
`RENAME_EXEMPT_PREFIXES`, or a frozen-but-scannable path becomes unsatisfiable —
P1-6's exact shape in the new pair. It holds today for all four members and is
violated by no PR in this plan. It fails loud-closed if broken, which is why it is
not a P1. **Remedy (A-3's call):** state the invariant in a comment beside
`HISTORY_APPEND_ONLY_PATHS`, and preferably add it as a witness case to the existing
`release-guard.mjs --self-test` (`validate.yml:48-49`) rather than a new gate —
which is the convention revision 4 already names for the append/rewrite witnesses.
Evidence: `thread:3453-3466`; `thread:635-642`; `release-guard.mjs:52-71`.

### P2-9 · The "every change is a relaxation" summary is inaccurate on two axes, and the exclusion rationale over-generalizes to `kai/coordination/threads/**`

`derived-from-source`. Two corrections, plus one membership suggestion:

1. **Dropped paths newly permit rewriting, not only appending.** `kai/coordination/**`,
   `kai/initiatives/**`, the rest of `kai/library/**` and the rest of `test/` leave
   D7(b) entirely. Property 5 says this accurately; property 2 and the handoff do
   not. Evidence: `thread:635-642` vs `thread:3458-3466`.
2. **The binding axis tightens.** Old D7(b) bound *"the rename PRs"* (`thread:652`);
   new D7(b) binds *"EVERY pull request, unconditionally"* (`thread:3466`). That
   contradicts *"Nothing becomes newly forbidden anywhere"* in the scope-discipline
   self-check. **The tightening is correct and is the better design** — it is
   property 4's own argument — but the record should say so instead of claiming a
   pure relaxation, because an implementer who trusts the summary will not expect an
   unrelated PR to go red for rewriting a shipped changelog section.
3. **`kai/coordination/threads/**` is a candidate the rationale wrongly sweeps out.**
   "Mutable state machines" is true of `items/`, `ACTIVE.md`, `BOARD.md`,
   `backlog.md` — not of `threads/`, which is append-only by contract and would pass
   this very pass (this entry appends and deletes nothing). It is also the path whose
   rewriting would be most damaging: it is the audit trail carrying every
   `changes-requested` verdict behind the promoted decision. Consider adding it in
   A-3; if it is deliberately left out, record the reason as its own sentence rather
   than under the state-machine rationale.

### P2-10 · `test/fixtures/host-installs.json` — "0 deletions" is not the natural shape of a JSON-object append, so B-1's green is conditional

`derived-from-source`, from the file's structure read this session. Two problems,
one narrow:

- **The support is overstated.** The record calls the fixture *"already declared
  append-only."* Its `_note` (`test/fixtures/host-installs.json:2-14`) declares no
  such property — it describes what the fixture is and how `workspace-doctor
  --self-test` materializes it. The append-only intent is declared in **this record**
  (B-1: *"new-bucket fixture arms added, old ones kept"*, `thread:715`), not in the
  file.
- **The mechanics do not follow.** `homes` spans `:16-444`, `workspaces` `:446-459`.
  Appending a key **after** the last entry of a JSON object requires the previous
  entry's closing `}` to gain a comma — **1 deletion + 1 addition under
  `--numstat`** — so the predicate reds a PR whose author genuinely only added.
  Inserting **before** the last entry is a pure insertion and passes. So B-1 is green
  only under an unstated authoring constraint, and an author who appends naturally
  gets an inexplicable red.

**Why P2, not P1:** it is over-restrictive on a fail-closed control affecting one
non-irreversible PR, with a trivial workaround, and it is already dispositioned in
revision 4's Reversibility section ("wrong in the restrictive direction… the author
appends instead of rewriting"). **Remedy (A-3's call, three acceptable answers):**
drop the fixture from the constant (its protection via D7(a) is unchanged either
way); or keep it and state the insert-before-last constraint where B-1's author will
read it; or count only non-structural deletions. Do **not** leave it asserted as
unconditionally green.

### P2-11 · `git revert -n <B-2 merge commit>` needs `-m <parent>` if B-2 lands as a true merge commit

`unknown` — I have no shell and found no documented merge convention; the nearest
signal is `docs/reference/plugin-structure.md:191` (*"On the exact merge commit"*),
which is suggestive, not dispositive. If B-2 is squash-merged the command is exactly
right. If it is a true merge commit, git refuses with *"commit … is a merge but no
-m option was given"* at **command 1 of the recovery runbook**, under a one-day
bound. Loud refusal, not a wrong result — hence P2. **Remedy:** state the repo's
merge strategy in step 2, or write `git revert -n [-m 1] <B-2 merge commit>` with a
one-clause note. This is runbook text; it belongs to whoever owns `RECOVERY-M`.

---

## Conditions of this CONDITIONAL verdict

Binding on the **implementation** of D15 (PR **A-3**), not on this record. None
requires another architecture pass, and none blocks `decisions-locked`.

1. **P2-8** — record the `HISTORY_APPEND_ONLY_PATHS ⊆ ban-scan coverage` invariant
   beside the constant; prefer a witness arm in the existing
   `release-guard.mjs --self-test` over a new gate.
2. **P2-9** — correct the "pure relaxation / nothing newly forbidden" summary to
   match property 4 and property 5; rule explicitly on `kai/coordination/threads/**`.
3. **P2-10** — resolve the JSON-object append shape before B-1 is authored, by one
   of the three named answers.
4. **P2-11** — make the revert command unambiguous about merge-commit parents.
5. **Standing:** the first real execution of D15's predicate is A-3's CI run. Until
   then every green in this record — mine included — is `derived-from-source`. If
   A-3's run contradicts any arm above, that is a new reliability question, not a
   discharged one.

---

## What this verdict does and does not do

- It **discharges** the `independent-reliability` review requirement.
  `satisfies_requirement: true`.
- It **does not** move any release state. `workflow-ship` alone owns
  `release-ready`, `deploying`, `production-verification` and `shipped`. **Nothing
  here is shipped**; no human has deployed or verified anything.
- It **does not** approve the marketplace publish. PROBE-M and PROBE-M′ remain
  operator *actions*; P2-5's `contract` required-status check remains an operator
  *verification* and stays `reported`.
- It **assigns no human on-call obligation** and requires **no operator decision**.
  I decline to manufacture one.
- **No production code, manifest, marketplace file, `scripts/`, `packs/`,
  `plugin.json`, `agents/` or `skills/` file was modified in this pass**, and
  `kai/initiatives/pack-split/` and every other item were left untouched.

---

### Sanitized evidence register

All read by file from `C:\src\kai` on 2026-08-27. **Nothing executed — no shell.**

- `scripts/release-guard.mjs:20` (`BEHAVIOR_PREFIXES`), `:21-26` (`BEHAVIOR_FILES`),
  `:28-31` (`isBehaviorPath`), `:35` (`parseSemver`), `:39` + `:44-47`
  (`isForwardBump`; downgrade returns false), `:52-71` (`evaluate`), `:61-63`
  (version error), `:64-66` (CHANGELOG mandatory), `:67-69` (README mandatory),
  `:74-80` (`gitChangedFiles`, three-dot, `--no-renames`). **No `--numstat`, no
  deleted-line predicate, no new constant — D15 is unimplemented, as intended.**
- `.github/workflows/validate.yml:31` (job `contract`), `:43` (`validate-plugin.mjs`),
  `:48-49` (`release-guard --self-test`), `:66-68` (`release-guard` gate,
  `if: github.event_name == 'pull_request'`).
- `CHANGELOG.md:1-7` — newest-first; a new section is a pure insertion.
- `kai/library/releases/**` — 16 `ship-record.md` files enumerated under dated run
  directories 2026-08-24 … 2026-08-27.
- `docs/proposals/pack-architecture.md:6,26,109,139` — four live sweep-bait tokens.
- `test/fixtures/host-installs.json:2-14` (`_note`, no append-only declaration),
  `:16` / `:444` (`homes`), `:446` / `:459` (`workspaces`), `:460` (root close).
- `README.md:12,78,135`; `docs/getting-started.md:16,105` (+ `:180-184,195,200,215`
  repo-slug shapes; `:202` tree-prefix);
  `skills/kai-core-workspace-onboarding/SKILL.md:85` — all ten P2-6 sites resolve
  exactly.
- `.github/plugin/marketplace.json:2` (`"name": "kai-plugins"`, unchanged);
  `scripts/lib/pack-plan.mjs:49` (`PACKS_DIR = 'packs'`, unchanged).
- `docs/reference/plugin-structure.md:191` — the only nearby merge-strategy signal.
- Thread: `:19, :990, :1352, :2027, :2356, :2899, :3269` (append-only order),
  `:635-642` (D7(a)), `:652-655` (D7(b), *"regardless of intent"*), `:715` (B-1),
  `:716` (B-2 installer regeneration), `:2602` (the superseded D7 row and its
  "carve-out" phrase), `:3269-3838` (revision 4 in full).
- Item frontmatter — three preserved `completed_reviews`; lease fields as verified
  above.

---

## HANDOFF 2026-08-27-2228 — principal-sre -> principal-product-manager

- did:       Fourth and final-intent `independent-reliability` review, binding explicitly to **`DECISION 2026-08-27-2053` (revision 4)** — the newest dated DECISION entry (`thread:3269`) — at item version 18. **Verdict CONDITIONAL (approved-with-conditions), P0 0 / P1 0 / P2 4, `satisfies_requirement: true`.** **P1-6 is genuinely discharged:** I re-derived every anchor from source and re-ran all eight PR arms myself against `evaluate()` — the recovery patch merges, seven PRs are unconditionally green and the eighth (B-1) is conditionally green with a loud failure and a trivial fix. **The `isForwardBump` finding holds** — verified at `release-guard.mjs:39,44-47,61-63` that a revert of B-2 is anti-monotonic and would have been red on the version check even after D7(b) was fixed; the architect found this themselves and no reviewer had named it. The `git revert -n` + selective `git restore` recipe satisfies every arm **including the previously unevaluated version/release-artifact arm**, and excluding `README.md` from the restore is the right subtle call. **Citation discipline holds at the standard under test:** ~two dozen anchors re-derived, **every one exact**. **Tested the "every change is a relaxation" claim hard, as instructed:** the *design* is safe — new forbidden set ⊆ old on the path axis, predicate strictly weaker on retained paths, **no rewrite of a retained path newly permitted** — but the *summary* is inaccurate on two axes (dropped paths newly permit rewriting, and the binding axis tightens from "rename PRs" to "every PR", contradicting "nothing becomes newly forbidden"). Functional conclusions all hold when re-derived, which is what keeps this a P2: revision 3's defect broke a function, revision 4's imprecision mis-describes a function that works. **Checked question 4 deliberately and found the mirror-image risk is real** — `HISTORY_APPEND_ONLY_PATHS ⊆ ban-scan coverage` is an unenforced cross-list invariant — but it fails **loud-closed** where D14's failed silent-open, and current membership satisfies it, so P2 not P1. Confirmed **nothing upheld across the three prior reviews was weakened** (D7(a) byte-for-byte unchanged at `:635-642`; R2/D12/D14 and the entry guard untouched; the residual and its `observed` upgrade intact; the acceptance annotation honest rather than overclaimed), **no production/manifest/marketplace change** (both constants appear only in the two coordination files; `marketplace.json:2` and `pack-plan.mjs:49` unchanged; `release-guard.mjs` has no `--numstat` — D15 is specified, not implemented), and **all three prior `completed_reviews` entries preserved**, with a fourth appended.
- needs:     `principal-product-manager` (steward) to close milestone `decisions-locked`. The `independent-reliability` requirement is discharged; the item is `completed`, lease cleared, `next_role: principal-product-manager`. **`area-plugins-m2-planpacks-prefix` and the milestone-2 chain are unblocked** once the steward closes the milestone and advances `scope.current`.
- artifacts: `kai/coordination/threads/area-plugins-migration-architecture.md` (this REVIEW, appended — no prior entry altered); `kai/coordination/items/area-plugins-migration-architecture.md` (version 19, `completed`, lease null on all five fields, **four** `completed_reviews` entries); `kai/initiatives/area-plugins/artifacts/decisions/area-plugins-migration-architecture.md` (**promoted canonical decision** — the thread remains the append-only audit trail including all three `changes-requested` verdicts).
- evidence:  See the sanitized evidence register above. **No shell this session — `gh`, `node`, `npm` and `git` were not run.** Every CI outcome is `derived-from-source`; only first-hand file reads are `observed`. The first real execution of D15's predicate will be A-3's CI run.
- questions: none blocking, **no operator decision required, and none manufactured.** Two items for the steward, neither gating: (1) `kai/initiatives/area-plugins/artifacts/decisions/README.md` still lists this decision as *"in review (4th reliability pass owed)"* — a one-line index row I deliberately did not edit, since that file is outside my declared `touches`; (2) `lease.acquired` read `2240` while the session clock read `2227` — a ~13-minute skew in the record, flagged rather than silently reconciled.
- next:      `principal-product-manager` — close `decisions-locked` for `area-plugins`. The four P2 conditions ride with **PR A-3's implementation** (`principal-swe-infra` owns the *how*), not with this record; none of them reopens architecture and none of them blocks the milestone.
