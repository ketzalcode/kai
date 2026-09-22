// The test that would have caught the lectoria bug.
//
// Every other check in this repository inspects a tree in place, with the whole
// checkout — and therefore `node_modules/`, sibling source, and the repository
// root — sitting right there. A consumer has none of that. The host copies a
// plugin directory into `~/.copilot/installed-plugins/<marketplace>/<plugin>`
// and runs commands out of it. Nothing installs anything.
//
// That gap is not hypothetical. A runtime npm dependency shipped for multiple
// releases and could never have resolved on a single consumer machine, because
// no check ever ran a command the way a consumer runs it. This one does: copy a
// built pack somewhere else, delete nothing back in, and execute every shipped
// entry point.
//
// What this proves: each entry point LOADS and runs standalone. It does not
// prove the command does the right thing — the suites own that. A load failure
// is the class of bug this exists to catch, because it is invisible everywhere
// else and total for the user.
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync, mkdtempSync, readdirSync, rmSync, writeFileSync, mkdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { materializePacks, moduleSpecifiers, PACK_ORDER, packPluginName } from '../tools/lib/pack-plan.mjs';
import { discoveryRoots } from '../src/core/lib/coordination-runtime/native-discovery.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const scratch = mkdtempSync(join(tmpdir(), 'kai-consumer-install-'));

// Deny by default. An allowlist of known-bad messages was the first attempt and
// it was wrong in exactly the direction that matters: it named the failures raw
// copying could produce and missed the ones bundling introduces. An ESM chunk
// cycle ("Cannot access 'X' before initialization"), esbuild's CJS interop shim
// ("Dynamic require of \"x\" is not supported") and an interop `TypeError` all
// crash on load for every consumer, and none of them matched. So any uncaught
// throw counts as a load failure unless the command printed it itself.
//
// A command may legitimately exit non-zero on an unrecognised argument, and may
// print its own `Error: ...` line while doing so. What it may not do is die with
// a stack trace, so that — not the word "Error" — is the signal. Node prints a
// stack frame for every uncaught throw, including a parse error in a chunk.
const LOAD_FAILURE = /^\s+at\s+\S/m;
let failures = 0;
const ok = (condition, message) => {
  if (condition) { console.log(`  ok ${message}`); return; }
  failures += 1;
  console.log(`  FAIL ${message}`);
};

try {
  // 1. Materialise the packs exactly as the generator would, and write them out
  //    the way the host copies them — nothing else comes along.
  const files = materializePacks({ root, version: '0.0.0-consumer-install' });
  for (const [key, text] of files) {
    const target = join(scratch, ...key.split('/'));
    mkdirSync(dirname(target), { recursive: true });
    writeFileSync(target, text);
  }

  // 2. Nothing installs dependencies for a consumer, so nothing may be present.
  let inspected = 0;
  for (const pack of PACK_ORDER) {
    const dir = join(scratch, packPluginName(pack));
    assert.ok(existsSync(dir), `${packPluginName(pack)}: expected a materialised pack to copy`);
    inspected += 1;
    assert.equal(existsSync(join(dir, 'node_modules')), false,
      `${packPluginName(pack)}: a copied pack must not contain node_modules`);
    for (const manifest of ['package.json', 'package-lock.json']) {
      assert.equal(existsSync(join(dir, manifest)), false,
        `${packPluginName(pack)}: a copied pack must not contain ${manifest}`);
    }
  }
  // Counted, because "no pack had a package.json" is also true of no packs.
  assert.equal(inspected, PACK_ORDER.length, 'every shipped pack must be inspected');
  ok(true, `${inspected} copied pack(s) carry no npm manifest and no installed dependencies`);

  // 3. Run every shipped entry point from the copy. Entry points are the files a
  //    shipped instruction names; chunks are implementation and are only loaded
  //    through them, so a chunk that fails to resolve surfaces here too.
  let executed = 0;  for (const pack of PACK_ORDER) {
    const scriptsDir = join(scratch, packPluginName(pack), 'scripts');
    if (!existsSync(scriptsDir)) continue;
    const entryPoints = readdirSync(scriptsDir)
      .filter((name) => name.endsWith('.mjs') && !name.startsWith('chunk-'))
      .sort();
    assert.ok(entryPoints.length > 0, `${packPluginName(pack)}: expected shipped entry points`);
    for (const name of entryPoints) {
      const path = join(scriptsDir, name);
      let output = '';
      let loadFailed = false;
      try {
        // `--help` is not universally supported; what matters is that the module
        // graph resolves. A non-zero exit from the command's own argument
        // handling is fine — an unresolved import is not.
        execFileSync(process.execPath, [path, '--kai-consumer-install-probe'], {
          encoding: 'utf8', stdio: 'pipe', timeout: 120_000, cwd: scratch,
        });
      } catch (error) {
        output = `${error.stdout ?? ''}${error.stderr ?? ''}`;
        loadFailed = LOAD_FAILURE.test(output);
      }
      ok(!loadFailed,
        `${packPluginName(pack)}/scripts/${name} loads from a copied pack with no node_modules`
        + (loadFailed ? `\n      ${output.split('\n').find((line) => /Error/.test(line)) ?? ''}` : ''));
      executed += 1;
    }
  }
  ok(executed > 0, `executed ${executed} shipped entry point(s) from the copy`);

  // 4. Execution only proves what execution reaches. A chunk imported lazily —
  //    `coordinate.mjs` defers its CLI implementation this way — is never
  //    resolved by a probe run, so deleting it passes step 3 and still breaks
  //    the command in a consumer's hands. Verified: removing an eagerly
  //    imported chunk is caught by all five of its importers; removing a lazily
  //    imported one is caught by none.
  //
  //    So the import graph is checked structurally as well. Every local
  //    specifier any shipped file names must exist in the copy, and every
  //    emitted chunk must be reachable — an unreferenced chunk is dead weight
  //    that a consumer downloads and never runs.
  //
  //    `moduleSpecifiers` is reused rather than re-expressed, because a second,
  //    narrower regex is how this check would quietly stop seeing things:
  //    esbuild emits bare side-effect imports (`import "./chunk-X.mjs";`) that a
  //    `from`-anchored pattern cannot match at all.
  for (const pack of PACK_ORDER) {
    const scriptsDir = join(scratch, packPluginName(pack), 'scripts');
    if (!existsSync(scriptsDir)) continue;
    const present = new Set(readdirSync(scriptsDir).filter((n) => n.endsWith('.mjs')));
    const referenced = new Set();
    let dangling = 0;
    for (const name of present) {
      const text = readFileSync(join(scriptsDir, name), 'utf8');
      for (const specifier of moduleSpecifiers(text)) {
        if (!specifier.startsWith('./')) continue;
        const target = specifier.slice(2);
        referenced.add(target);
        if (!present.has(target)) {
          dangling += 1;
          console.log(`  FAIL ${packPluginName(pack)}/scripts/${name} imports ${specifier}, absent from the copy`);
        }
      }
    }
    ok(dangling === 0,
      `${packPluginName(pack)}: every local import resolves inside the copied pack (${referenced.size} checked)`);

    const orphans = [...present].filter((n) => n.startsWith('chunk-') && !referenced.has(n));
    ok(orphans.length === 0,
      `${packPluginName(pack)}: no unreferenced chunk ships${orphans.length ? ` (${orphans.join(', ')})` : ''}`);
  }

  // 5. The hook is the one command the HOST runs on its own, on every subagent,
  //    without an agent in the loop. If its path is wrong nobody finds out from
  //    a failing test — subagents just silently stop being observed. So its
  //    absence is a failure, not a skip: "no hooks.json" is indistinguishable
  //    from "hooks.json stopped being emitted", and the second is the bug.
  const hooksPath = join(scratch, packPluginName('core'), 'hooks.json');
  assert.ok(existsSync(hooksPath), 'kai-core must ship hooks.json to the copied pack');
  const hooks = JSON.parse(readFileSync(hooksPath));
  const commands = JSON.stringify(hooks).match(/\$\{PLUGIN_ROOT\}\/[A-Za-z0-9_\-./]+/g) ?? [];
  assert.ok(commands.length > 0, 'hooks.json must invoke at least one plugin-relative command');
  for (const command of commands) {
    const relative = command.replace('${PLUGIN_ROOT}/', '');
    assert.ok(existsSync(join(scratch, packPluginName('core'), ...relative.split('/'))),
      `hooks.json points at ${relative}, which is absent from the copied pack`);
  }
  ok(true, `every hooks.json command resolves inside the copied pack (${commands.length})`);

  // 6. The shipped layout the coordination runtime resolves its agent roster
  //    against. Bundling moved that code from `scripts/lib/coordination-runtime/`
  //    up to `scripts/`, which silently invalidated level-counting path
  //    arithmetic — a missed agent profile leaves the model unset and nothing
  //    reports it. Pinned against the real copied tree rather than trusted.
  const coreScripts = join(scratch, packPluginName('core'), 'scripts');
  const { pluginRoot } = discoveryRoots(coreScripts);
  assert.equal(pluginRoot, join(scratch, packPluginName('core')),
    'the coordination runtime must resolve the plugin root from its shipped location');
  ok(true, 'agent profiles resolve against the copied pack root, not an ancestor of it');
} finally {
  rmSync(scratch, { recursive: true, force: true });
}

console.log(`\nconsumer-install self-test: ${failures ? `${failures} FAILED` : 'all checks passed'}`);
process.exit(failures ? 1 : 0);
