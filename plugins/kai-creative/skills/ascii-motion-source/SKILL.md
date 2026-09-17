---
name: ascii-motion-source
description: "Use when an ASCII motion clip is requested and its motion has no approved source yet, or supplied footage needs a recorded licence and origin before conversion."
user-invocable: true
---

# Source ASCII Motion

Establish where the motion comes from and record it. This is not conversion,
not rendering, and not a judgement that the result looks good.

A prompt naming a subject is a request, not a source. Two sources are
available: footage or an image sequence the operator supplies, and the built-in
procedural templates. Nothing else is licensed in this version.

## Select one operation

| Requested operation | Inputs and stopping point |
| --- | --- |
| List what is available | Nothing; report the template ids and the pinned backend, then stop. |
| Record supplied media | An actual file the operator points at, plus its licence and origin; return a provenance record, no conversion. |
| Render a template clip | A template id, a render profile, and a frame count; return a frames clip with tier-2 provenance. |
| Explain a profile | A profile name; return the resolved grid, fps, palette and colour facts. |

A template clip is generated arithmetic, not footage of the named subject. Say
so plainly: `walk-cycle` is a procedural four-legged gait, not a dog. When the
operator wanted a real dog, supplied footage is the only path this version
offers.

Never fetch media from a URL, a stock service, or GIPHY. GIPHY is excluded
outright: attribution is mandatory, caching is forbidden, and partner content
is not licensed for derivative marketing.

Every clip carries licence and origin, including media the operator supplied.
An unrecorded licence blocks the clip; it does not become a guess.

## Provider and command reference

From the loaded skill's base directory, go up two directories to resolve the
kai-creative provider root, `<kai-creative-plugin>`. Never resolve commands
from cwd or use a search hit in other installed packs. The input and output
placeholders below are explicit independently resolved absolute paths.

```text
node "<kai-creative-plugin>/scripts/ascii-motion.mjs" --probe
node "<kai-creative-plugin>/scripts/ascii-motion.mjs" --explain --profile "<profile>"
node "<kai-creative-plugin>/scripts/ascii-motion.mjs" --template "<id>" --params "<json>" --out "<clip>"
```

These are independent operations, not an instruction to run every command.
`--params` takes one JSON object as a single argument, so quote it as the host
shell requires and re-read the reported error rather than retrying blind.
When Python or the pinned `movie-ascii` build is absent, report the missing
tool and the unconverted clip explicitly; do not install tools or evaluate
printed stdout automatically. Templates need neither.

## Output and authority

Load `kai-core-asset-producing` before writing a clip into a shared workspace,
and load `kai-core-workspace-paths` when the destination path is not already
decided. When kai-core is unavailable, this single-shot sourcing still works
and writes where the operator points; Kai coordination and `.kai` state do not,
so tell the operator to install or update `kai-core` before resuming
coordinated work.

Producing a clip is not review and not publication. Report what was written and
what remains unverified.
