# Package workspace navigation

Read this reference only when the operator asks to navigate durable package
artifacts by lifecycle or group.

## Authority and inputs

Compose the view at the caller boundary from independent inputs:

```text
owning package publication contract + current artifact directories
optional supplied lifecycle/group projection with source revision
explicit caller-supplied display grouping
```

A package never invokes or requires a sibling package to build this view. Core
defines the neutral rendering convention but owns no department lifecycle or
grouping vocabulary. An optional provider such as Project Management remains
independently installable and authoritative only for its own records.

## Stable artifacts

Artifact paths never move because lifecycle or grouping changes:

```text
.kai/<pack>/<type>/<id>/{drafts,evidence,scratch}/
docs/kai/<pack>/<type>/<id>/
```

The owning publication contract remains authoritative for valid types,
subtypes, formats, privacy, and destinations. A planning Feature ID may join an
artifact only through a deterministic matching package/type/stable ID. A title,
Epic name, lifecycle, or display section is never part of the artifact ID.
Project knowledge uses its canonical repository home from creation; the private
lanes shown above are supporting evidence or working material, not another
knowledge authority.

## Projection precedence

For each artifact:

1. Use a supplied authoritative projection only when it names its source,
   record version, and snapshot/sequence basis.
2. Use an explicit caller-supplied section only as display grouping, labeled
   `supplied`; it is not lifecycle authority.
3. Otherwise render `UNGROUPED` and `LIFECYCLE UNKNOWN`.

Never derive lifecycle from folder names, artifact acceptance, Git history,
file timestamps, Task state, or the presence of drafts/evidence.

## View shape

Render one compact on-demand view:

```text
<Package> <Type>                         source: <authority and basis | none>
└─ <Group | UNGROUPED>
   ├─ PROPOSED
   │  └─ <stable-id>  <title>            record <version>
   ├─ ACTIVE
   │  └─ <stable-id>  <title>            <hold/dependency summary>
   ├─ COMPLETED
   │  └─ <stable-id>  <title>            <disposition>
   └─ LIFECYCLE UNKNOWN
      └─ <stable-id>
```

Show only non-empty lifecycle sections. Name missing or contradictory
projection evidence instead of guessing.

Planning completion does not accept or publish an artifact. Artifact
acceptance does not complete planning scope. Show both conditions separately
when both inputs exist.

Do not persist the view as Markdown, JSON, a directory index, or another
database. Re-render from current inputs so the display cannot become another
authority or stale synchronization target.
