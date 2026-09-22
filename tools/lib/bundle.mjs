// Bundling: turning the module graph a command needs into the file a consumer runs.
//
// Why this exists
// ---------------
// The Copilot CLI host is a file-copying installer. It copies a plugin tree and
// never runs npm, a build, or a lifecycle script, so everything a command needs
// must already be on disk and resolvable with Node built-ins alone.
//
// Shipping raw source satisfied that only by accident: the generator followed
// every relative import and copied the whole graph, so a consumer received 54
// files to run 10 commands. Bundling makes the shipped unit the thing a
// consumer actually invokes.
//
// Why splitting, and why not minification
// ---------------------------------------
// One self-contained bundle per entry point is a size REGRESSION here: measured
// at 1,601 KB against 947 KB of raw source, because `coordinate`, `work-status`
// and `workspace-doctor` each inline overlapping copies of the coordination
// runtime. Code splitting hoists that shared code into chunks and brings the
// total to 845 KB across 22 files — better than the status quo on both axes.
//
// Minification would reach 537 KB, but a minified stack trace from a consumer
// machine nobody can inspect is close to useless, and shipping sourcemaps to
// recover it costs 2,090 KB — more than twice what raw source costs today. The
// readable-output trade was taken deliberately.
//
// Self-test code still ships. It is gated on `argv.includes('--self-test')`, a
// runtime value no build-time constant can fold, so `define` cannot eliminate
// it. Removing it means moving self-tests into `test/`, which is separate work.
// Claiming it was stripped would be false.

import { readdirSync, existsSync } from 'node:fs';
import { createRequire } from 'node:module';
import { join } from 'node:path';

// esbuild is loaded on first build rather than on import. Importing it at the
// top would make `pack-plan.mjs` — which many suites import only for a constant
// — unloadable without `node_modules`, and the coordination-runtime CI job
// deliberately installs nothing. `createRequire` keeps the load synchronous,
// which `buildSync` and the whole generator pipeline depend on.
const require = createRequire(import.meta.url);
let esbuild;
const buildSync = (options) => (esbuild ??= require('esbuild')).buildSync(options);

// ESM output can still contain CJS dependencies that expect `require`.
// `__dirname`/`__filename` are deliberately NOT shimmed here: esbuild supplies
// them per-module, and a banner-level definition collides with any bundled
// module that declares its own.
const BANNER = "import{createRequire as __cr}from'node:module';"
  + 'const require=__cr(import.meta.url);';

// Node's own modules are always present on any host that can run the command.
// Everything else has to be inlined, because nothing will install it.
const TARGET = 'node22';

// Only top-level files are entry points. `lib/` holds internal modules, which
// the bundler inlines or hoists into a shared chunk — they are never a path a
// shipped instruction names.
export function packEntryPoints(root, srcDir, pack) {
  const dir = join(root, srcDir, pack);
  if (!existsSync(dir)) return [];
  return readdirSync(dir, { withFileTypes: true })
    .filter((entry) => entry.isFile() && entry.name.endsWith('.mjs'))
    .map((entry) => entry.name)
    .sort();
}

// Returns { files, inputs }.
//
// `files` is Map<shipped-relative path, text>, e.g. `scripts/coordinate.mjs`.
// Pure and in-memory: the caller decides whether anything reaches disk, so the
// validator and the `--check` gate can compare a freshly built tree against the
// committed one without writing first.
//
// `inputs` is the set of repo-relative source files that went INTO those
// bundles. Once modules are inlined, "did this module ship?" can no longer be
// answered by looking for a file, and searching output text for an identifier
// is unreliable because the bundler renames on collision. The build already
// knows the answer, so it reports it.
export function bundlePack({ root, srcDir, shippedDir, pack }) {
  const names = packEntryPoints(root, srcDir, pack);
  if (!names.length) return { files: new Map(), inputs: new Set() };

  const result = buildSync({
    entryPoints: names.map((name) => join(root, srcDir, pack, name)),
    // Never written; esbuild needs it only to name outputs relative to something.
    outdir: join(root, srcDir, pack),
    bundle: true,
    platform: 'node',
    format: 'esm',
    target: TARGET,
    banner: { js: BANNER },
    splitting: true,
    write: false,
    metafile: true,
    // Entry points keep their `.mjs` names because that is what shipped
    // instructions and `hooks.json` already invoke. Without this esbuild emits
    // `.js` and every command string would silently point at nothing.
    outExtension: { '.js': '.mjs' },
    // Chunk names are content-hashed, so the same source produces the same
    // tree on every run and the regenerate-and-diff check stays meaningful.
    chunkNames: 'chunk-[hash]',
    legalComments: 'inline',
  });

  const files = new Map();
  for (const output of result.outputFiles) {
    const name = output.path.split(/[\\/]/).pop();
    files.set(`${shippedDir}/${name}`, output.text);
  }
  const inputs = new Set(Object.keys(result.metafile.inputs)
    .map((path) => path.replace(/\\/g, '/')));
  return { files, inputs };
}
