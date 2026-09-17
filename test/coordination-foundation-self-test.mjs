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
import { materializePacks } from '../scripts/lib/pack-plan.mjs';

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), '..');
const files = materializePacks({ root: repoRoot, version: '99.0.0-test' });

// ---------------------------------------------------------------------------
// 1. Core owns the entry point and the store the plan names explicitly.
// ---------------------------------------------------------------------------
assert.ok(files.has('kai-core/scripts/coordinate.mjs'),
  'kai-core must emit the coordination entry point scripts/coordinate.mjs');
assert.ok(files.has('kai-core/scripts/lib/coordination-runtime/store.mjs'),
  'kai-core must emit the coordination store module');

// ---------------------------------------------------------------------------
// 2. The whole runtime closure ships, derived from the source directory rather
//    than a hand-maintained list — a module added tomorrow is covered.
// ---------------------------------------------------------------------------
const runtimeModules = readdirSync(
  join(repoRoot, 'scripts', 'lib', 'coordination-runtime'),
).filter((name) => name.endsWith('.mjs')).sort();
assert.ok(runtimeModules.length >= 30,
  `expected the coordination runtime to have modules, found ${runtimeModules.length}`);
const missing = runtimeModules.filter(
  (name) => !files.has(`kai-core/scripts/lib/coordination-runtime/${name}`),
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
  (path) => !path.startsWith('kai-core/')
    && (path.includes('/scripts/lib/coordination-runtime/')
      || path.endsWith('/scripts/coordinate.mjs')),
);
assert.deepEqual(departmentRuntimeFiles, [],
  `only kai-core may emit coordination runtime files: ${departmentRuntimeFiles.join(', ')}`);

// ---------------------------------------------------------------------------
// 4. Core-alone emission stays closed. Selecting only core must still produce
//    the full closure: that is what a consumer who installs kai-core gets.
// ---------------------------------------------------------------------------
const coreOnly = materializePacks({
  root: repoRoot, version: '99.0.0-test', packs: ['core'],
});
const missingCoreOnly = runtimeModules.filter(
  (name) => !coreOnly.has(`kai-core/scripts/lib/coordination-runtime/${name}`),
);
assert.deepEqual(missingCoreOnly, [],
  `kai-core installed alone must be loadable: ${missingCoreOnly.join(', ')}`);
assert.ok(coreOnly.has('kai-core/scripts/coordinate.mjs'),
  'kai-core installed alone must still carry its coordination entry point');

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
