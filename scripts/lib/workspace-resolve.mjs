// The one workspace-root resolver every kai CLI defers to.
//
// Before this module, `observe-subagent`/`observe-watch` each grew their own
// upward walk (accepting a bare `.kai/` OR a bare `.git` as a stopping point),
// while `activity`/`work-status` did no resolution at all -- just whatever
// `--root` or `process.cwd()` happened to be. Three shapes answering the same
// question is exactly the drift kai-core-workspace-conventions exists to prevent, so
// this is the single place that answer lives.
//
// Precedence, highest first:
//   1. an explicit root the caller already knows (e.g. --root) -- validated
//      directly at that exact path, never searched upward. An explicit root
//      is a caller assertion "this IS the workspace"; silently retargeting an
//      ancestor when the caller named a non-workspace subdirectory would be a
//      surprise, not a convenience, so this fails instead of guessing.
//   2. KAI_WORKSPACE_ROOT -- an absolute, directly-validated override for a
//      caller with no natural cwd (a detached hook, a CI job). Same rule as
//      an explicit root: it must name the workspace root itself and is never
//      searched upward, so an operator override can never silently escape to
//      an unrelated ancestor workspace.
//   3. an upward search from cwd -- the one tier that walks, because cwd is
//      ambient (a subagent or a terminal can be anywhere inside the tree) and
//      was never asserted to already be the root.
//
// A bare `.kai/` directory or a bare `.git` no longer qualify on their own --
// `.kai/manifest.json` is the one bootstrap sentinel the conventions define,
// and this module does not add registry or schema semantics on top of it: it
// only answers "is there a manifest here", nothing about its contents.
//
// Node built-ins only; imported by checks CI runs with no install step.

import { existsSync } from 'node:fs';
import { dirname, isAbsolute, join, parse as parsePath, resolve as resolvePath } from 'node:path';

export const MANIFEST_REL = join('.kai', 'manifest.json');

function hasManifest(dir) {
  return existsSync(join(dir, MANIFEST_REL));
}

// Bounded so a symlink loop or a filesystem with no real root cannot spin
// forever -- 64 levels is far past any real repository nesting depth.
const MAX_SEARCH_DEPTH = 64;

export function searchUpward(startDir) {
  let dir = resolvePath(startDir);
  for (let i = 0; i < MAX_SEARCH_DEPTH; i++) {
    if (hasManifest(dir)) return dir;
    const up = dirname(dir);
    if (up === dir || up === parsePath(dir).root) return null;
    dir = up;
  }
  return null;
}

/**
 * Resolve the workspace root a CLI should operate against.
 *
 * @param {object} [opts]
 * @param {string|null} [opts.explicitRoot] - a caller-known root (e.g. --root).
 *   Wins over the env override and cwd; validated directly at that exact
 *   path, never searched upward -- a named non-workspace directory fails
 *   rather than silently resolving to an ancestor.
 * @param {string} [opts.cwd] - the upward-search start when no explicit root
 *   is given. Defaults to `process.cwd()`.
 * @param {NodeJS.ProcessEnv} [opts.env] - defaults to `process.env`; injectable
 *   so tests never have to mutate real process state, and so a caller that
 *   must never honor an operator override (the subagent hook) can pass `{}`.
 * @returns {{ok: true, root: string, source: 'explicit'|'env'|'search'} | {ok: false, reason: string}}
 */
export function resolveWorkspaceRoot(opts = {}) {
  const { explicitRoot, cwd = process.cwd(), env = process.env } = opts;

  if (explicitRoot) {
    const dir = resolvePath(explicitRoot);
    if (hasManifest(dir)) return { ok: true, root: dir, source: 'explicit' };
    return { ok: false, reason: `no ${MANIFEST_REL} in explicit root "${dir}" -- an explicit root is validated directly, never searched upward` };
  }

  const envRoot = env.KAI_WORKSPACE_ROOT;
  if (envRoot) {
    if (!isAbsolute(envRoot)) {
      return { ok: false, reason: `KAI_WORKSPACE_ROOT must be an absolute path, got "${envRoot}"` };
    }
    if (!hasManifest(envRoot)) {
      return { ok: false, reason: `KAI_WORKSPACE_ROOT "${envRoot}" has no ${MANIFEST_REL} -- not an onboarded kai workspace` };
    }
    return { ok: true, root: envRoot, source: 'env' };
  }

  const found = searchUpward(cwd);
  if (found) return { ok: true, root: found, source: 'search' };
  return { ok: false, reason: `no kai workspace found -- looked for ${MANIFEST_REL} from "${resolvePath(cwd)}" upward` };
}
