// Task 11 — source-and-emission contract for the coordination runtime.
//
// The runtime is a kai-core capability. This file asserts the *emitted*
// installable surface, not the repository layout: it calls the authoritative
// generator (`materializePacks` in `scripts/lib/pack-plan.mjs`) exactly the way
// `test/engineering-foundation-self-test.mjs` and
// `test/creative-foundation-self-test.mjs` do, and checks who owns what.
//
// Two guarantees, both of which have failed before in this repository:
//
//   1. kai-core installed alone carries the whole executable — the entry point
//      *and* every module it imports. A partial closure installs fine and then
//      throws ERR_MODULE_NOT_FOUND on the consumer's first coordinated command.
//   2. A department pack carries none of it. kai-engineering and kai-creative
//      route to the runtime through core; copying core's executable into a
//      department would create a second, silently divergent implementation.
//
// This is a packaging contract. It does not execute a coordinated workflow and
// makes no claim that the runtime has been accepted on a live host.

import assert from 'node:assert/strict';
import { readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { bundlePack } from '../tools/lib/bundle.mjs';
import { materializePacks, moduleSpecifiers } from '../tools/lib/pack-plan.mjs';

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), '..');
const files = materializePacks({ root: repoRoot, version: '99.0.0-test' });

// ---------------------------------------------------------------------------
// 1. Core owns the entry point and the store the plan names explicitly.
// ---------------------------------------------------------------------------
assert.ok(files.has('kai-core/scripts/coordinate.mjs'),
  'kai-core must emit the coordination entry point scripts/coordinate.mjs');

// ---------------------------------------------------------------------------
// 2. The whole runtime closure is COMPILED IN, derived from the source
//    directory rather than a hand-maintained list — a module added tomorrow is
//    covered.
//
//    Modules are inlined now, so "did this ship?" cannot be answered by looking
//    for a file, and searching output text for an identifier is unreliable
//    because the bundler renames on collision. The build reports its own
//    inputs, which is the exact answer.
// ---------------------------------------------------------------------------
const runtimeModules = readdirSync(
  join(repoRoot, 'src', 'core', 'lib', 'coordination-runtime'),
).filter((name) => name.endsWith('.mjs')).sort();
assert.ok(runtimeModules.length >= 30,
  `expected the coordination runtime to have modules, found ${runtimeModules.length}`);

const coreInputs = bundlePack({
  root: repoRoot, srcDir: 'src', shippedDir: 'scripts', pack: 'core',
}).inputs;
const missing = runtimeModules.filter(
  (name) => ![...coreInputs].some((input) => input.endsWith(`coordination-runtime/${name}`)),
);
assert.deepEqual(missing, [],
  `kai-core is missing runtime modules its entry point imports: ${missing.join(', ')}`);

// ---------------------------------------------------------------------------
// 3. No department pack carries the executable or any runtime module.
// ---------------------------------------------------------------------------
assert.ok(!files.has('kai-creative/scripts/coordinate.mjs'),
  'kai-creative must not emit a second copy of the coordination entry point');
assert.ok(!files.has('kai-engineering/scripts/coordinate.mjs'),
  'kai-engineering must not emit a second copy of the coordination entry point');
const departmentRuntimeFiles = [...files.keys()].filter(
  (path) => !path.startsWith('kai-core/') && path.endsWith('/scripts/coordinate.mjs'),
);
assert.deepEqual(departmentRuntimeFiles, [],
  `only kai-core may emit coordination runtime files: ${departmentRuntimeFiles.join(', ')}`);

// A path-based check can no longer see the risk it was written for. Bundling
// means no pack emits anything under `scripts/lib/` at all, so that clause was
// dead — while the danger grew: a department entry point that imported the
// coordination runtime would inline the whole thing into its own bundle and
// leave no path to notice. Ask the build what it compiled in instead.
for (const pack of ['creative', 'engineering']) {
  const inputs = [...bundlePack({
    root: repoRoot, srcDir: 'src', shippedDir: 'scripts', pack,
  }).inputs].filter((input) => input.includes('coordination-runtime/'));
  assert.deepEqual(inputs, [],
    `kai-${pack} must not compile the coordination runtime into its bundles: ${inputs.join(', ')}`);
}

// ---------------------------------------------------------------------------
// 4. Core-alone emission stays closed. Selecting only core must still produce
//    the full closure: that is what a consumer who installs kai-core gets.
//
//    Core-only is the selection where splitting could plausibly emit a
//    different chunk set, so the closure — not just the entry point — is what
//    has to hold. Every chunk the emitted files import must itself be emitted.
// ---------------------------------------------------------------------------
const coreOnly = materializePacks({
  root: repoRoot, version: '99.0.0-test', packs: ['core'],
});
assert.ok(coreOnly.has('kai-core/scripts/coordinate.mjs'),
  'kai-core installed alone must still carry its coordination entry point');

const coreOnlyScripts = [...coreOnly.keys()].filter((key) => /^kai-core\/scripts\/[^/]+\.mjs$/.test(key));
assert.ok(coreOnlyScripts.length > 0, 'a core-only install must emit shipped scripts');
const danglingCoreOnly = [];
for (const key of coreOnlyScripts) {
  for (const specifier of moduleSpecifiers(coreOnly.get(key))) {
    if (!specifier.startsWith('./')) continue;
    const target = `kai-core/scripts/${specifier.slice(2)}`;
    if (!coreOnly.has(target)) danglingCoreOnly.push(`${key} -> ${specifier}`);
  }
}
assert.deepEqual(danglingCoreOnly, [],
  `kai-core installed alone must be loadable: ${danglingCoreOnly.join(', ')}`);

// ---------------------------------------------------------------------------
// 5. The runtime is reachable: shipped core sources must route to the emitted
//    entry point, or the closure above would be dead weight nothing invokes.
// ---------------------------------------------------------------------------
const routingSources = [...files.keys()].filter(
  (path) => path.startsWith('kai-core/skills/') && path.endsWith('.md'),
);
const routesToCli = routingSources.filter(
  (path) => files.get(path).includes('scripts/coordinate.mjs'),
);
assert.ok(routesToCli.length > 0,
  'no shipped kai-core skill references scripts/coordinate.mjs, so nothing '
  + 'collects the runtime closure through normal asset routing');

console.log('coordination foundation self-test: all checks passed');
