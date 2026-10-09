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
// One self-contained bundle per entry point is a size REGRESSION here because
// `coordinate`, `work-status`, and `workspace-doctor` would inline overlapping
// copies of the coordination runtime. Code splitting keeps named public
// entrypoints while each package owns one stable `runtime-<pack>.mjs`.
//
// Minification would reach 537 KB, but a minified stack trace from a consumer
// machine nobody can inspect is close to useless, and shipping sourcemaps to
// recover it costs 2,090 KB — more than twice what raw source costs today. The
// readable-output trade was taken deliberately.
//
// Self-test code no longer ships. It was gated on `argv.includes('--self-test')`,
// a runtime value no build-time constant can fold, so `define` eliminated
// nothing — output was byte-identical with and without it. The only fix was to
// move the blocks out of `src/` entirely, which #225 did: every shipped entry
// point's assertions now live in `test/<command>-self-test.mjs` and the
// bundler never sees them.

import {execFileSync} from 'node:child_process';
import {readdirSync, existsSync} from 'node:fs';
import {dirname, join} from 'node:path';
import {fileURLToPath} from 'node:url';

// esbuild's plugin API is asynchronous, while the existing pack planner is
// intentionally synchronous. The worker keeps that interface stable without
// writing scratch files. It injects the complete package library graph and
// resolves local dynamic imports eagerly at build time so esbuild emits exactly
// one shared runtime or fails with a clear error.
const WORKER = join(dirname(fileURLToPath(import.meta.url)), 'bundle-worker.mjs');

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
  const output = execFileSync(process.execPath, [
    WORKER,
    JSON.stringify({root, srcDir, shippedDir, pack}),
  ], {
    cwd: root,
    encoding: 'utf8',
    maxBuffer: 32 * 1024 * 1024,
  });
  const result = JSON.parse(output);
  return {
    files: new Map(result.files.map(file => [
      file.path,
      Buffer.from(file.content, 'base64').toString('utf8'),
    ])),
    inputs: new Set(result.inputs),
  };
}
