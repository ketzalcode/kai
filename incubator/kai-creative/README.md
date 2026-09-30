# Incubated creative capture

`demo-capture.mjs` is the capture half of the demo seam: it drives a declared
screenplay, records it, and writes down the second each action really happened
and the rectangle it really acted on. It is preserved here with its history and
is not part of the active source registrations or any newly generated pack.

## Why it is parked

Live recording left the active creative base in **9.0.0** — the changelog's
Removed section says so, `demo-capture` is in `RETIRED_CREATIVE_SKILL_IDS`, and
the [creative skills foundation
design](../../docs/superpowers/specs/2026-09-13-creative-skills-foundation-design.md)
decided to "preserve inactive outside exported plugin sources; remove active
routes. Preserve the helper/parser dependency needed by the remaining methods."

What kept the file in the shipped pack until [#226] was the second half of that
sentence. `demo-format`, `demo-narrate` and `demo-zoom` imported their
screenplay and take parsers from it, so the bundler hoisted the whole 962-line
CLI — usage text, argument parsing, and a
`process.argv[1].endsWith('demo-capture.mjs')` invocation guard that can never
be true from inside a chunk — into the chunk all four creative entry points
load. The parsers now live in `src/creative/lib/screenplay.mjs`, so the command
can be parked without taking the contract with it.

This is a source change. It does not uninstall anything from a host that
already installed `kai-creative`, and it makes no claim about live capture ever
having been verified on a host.

## What is inactive about it

Nothing under `incubator/` is discovered, validated, emitted, catalogued or
installable. Concretely, for this file:

- it is no longer a top-level `.mjs` under `src/creative/`, so it is not a pack
  entry point and `plugins/kai-creative/scripts/` no longer contains it;
- `tools/check-syntax.mjs` scans `src/`, `tools/` and `examples/` only, so it is
  not syntax-gated;
- its `--self-test` no longer runs in `npm test`. The **parser** assertions it
  used to carry were moved to `test/creative-screenplay-self-test.mjs`, because
  those cover shipped code. The ~16 **driver** assertions — ffmpeg preflight,
  the measured recording clock, pointer gliding, quiet-wait ordering — went
  dormant with the driver they cover. Run them with
  `npm run demo-capture:self-test`.

It still imports the shipped parsers from `../../../src/creative/lib/`, so a
change to that contract can rot this file silently. That is the cost of being
parked, and re-entry has to re-run its self-test.

| Component | Kind | Original path | Status |
| --- | --- | --- | --- |
| `demo-capture` | command | `src/creative/demo-capture.mjs` | inactive |

## Re-entry

Being here is not a queue position. Re-entry needs the review described in
[`incubator/README.md`](../README.md), and then:

1. `git mv incubator/kai-creative/scripts/demo-capture.mjs src/creative/`, and
   change its parser import back to `./lib/screenplay.mjs`.
2. Give it a real invocation: a shipped instruction, skill or `hooks.json` entry
   must name `scripts/demo-capture.mjs`, or it is an unreferenced entry point
   again.
3. Restore its entries in `npm test` and in
   `test/creative-foundation-self-test.mjs`, which currently asserts that the
   pack does **not** emit it.
4. Decide what to do with `demo-capture` in `RETIRED_CREATIVE_SKILL_IDS`.
5. Regenerate (`npm run pack-preview -- --write`) and run `npm test`.

[#226]: https://github.com/RubenSaucedo/kai/issues/226
