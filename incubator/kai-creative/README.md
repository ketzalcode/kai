# Incubated creative capture

`demo-capture.mjs` is the capture half of the demo seam: it drives a declared
screenplay, records it, and writes down the second each action really happened
and the rectangle it really acted on. It is preserved here with its history and
is not part of the active source registrations or any newly generated pack.

## Why it is parked

Live recording left the active creative base in **9.0.0** — the changelog's
Removed section says so. Git history retains the superseded design record that
parked capture while preserving the parser dependency used by the remaining
methods.

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
  not syntax-gated.

The parked command currently has no execution coverage. It imports the shipped
parsers from `../../../src/creative/lib/screenplay.mjs`, but no current test
imports it. `test/creative-screenplay-self-test.mjs` covers the active parser
contract only. No current capture-specific test, npm script, or workflow exists.

The daily `.github/workflows/nightly.yml` job runs `npm ci`, `npm test`,
`npm run build:check`, `npm run consumer-install:self-test`, and release
readiness on Linux/Node 24.15.0. The Monday
`.github/workflows/release.yml` workflow releases only the exact SHA from the
latest successful nightly. Neither workflow executes this parked file.

Parked therefore means preserved historical source, not a currently verified
or supported capability. Re-entry must restore focused coverage before the
command can become active again.

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
3. Add a focused test under `test/` for the emitted driver and safe preflight
   behavior, add that file to the root `test` script, and update
   `test/package-build-self-test.mjs` if the public entry-point expectation
   changes.
4. Run `npm run build`, `npm test`, `npm run build:check`, and
   `npm run consumer-install:self-test`.

[#226]: https://github.com/RubenSaucedo/kai/issues/226
