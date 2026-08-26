#!/usr/bin/env node
// workspace-doctor — dependency-light validator for a kai *consumer* workspace.
//
// `validate-plugin.mjs` proves the plugin SOURCE is internally consistent.
// This doctor proves a GENERATED workspace (a repo or external folder a user
// onboarded) is well-formed and schema-compatible before coordinated agents act
// on it. It uses only Node built-ins so any host can run it.
//
// It also carries the pack-migration check (#29): an explicit, read-only report
// on whether this HOST may install the pack surface — legacy `kai` verifiably
// uninstalled, no coexistence, provenance known. That check is opt-in
// (`--migration-check`) rather than part of the default run, because the default
// run inspects a workspace and must not depend on a host it was not asked about.
//
// Usage:
//   node scripts/workspace-doctor.mjs [--root <dir>]   validate a workspace
//   node scripts/workspace-doctor.mjs --migration-check [--home <dir>] [--root <dir>] [--json]
//   node scripts/workspace-doctor.mjs --self-test      run against bundled fixtures
//
// Workspace exit code: 0 = healthy, 1 = invalid.
// Migration exit code: 0 = clear, 2 = blocked, 3 = unknown.

import {
  readFileSync, existsSync, readdirSync, cpSync, writeFileSync, mkdirSync, mkdtempSync, rmSync,
  lstatSync, readlinkSync, symlinkSync,
} from 'node:fs';
import { spawnSync } from 'node:child_process';
import { join, resolve, dirname, basename, relative, isAbsolute, sep } from 'node:path';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';
import {
  LIFECYCLE, NEEDS_CHANGE_REF, REQUIRES_STATES,
  frontmatter, scalar, cleanScalar, isNull, unquote, dependsOn, lease, parseStamp,
} from './lib/coordination.mjs';
import {
  WORKSPACE_PROVENANCE, LEGACY_PLUGIN, CORE_PLUGIN,
  defaultHome, migrationReport, parseJsonc, installTreeTail, normalizeHostPath,
} from './lib/migration-doctor.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));

// --- Contract constants the current plugin generates -----------------------
const CURRENT_SCHEMA_VERSION = 2;
const REQUIRED_MANIFEST_KEYS = [
  'plugin', 'version', 'schema_version', 'scaffolded', 'workspace_mode',
  'workspace_root', 'kai', 'runs', 'corpus', 'coordination', 'initiatives',
  'library', 'personal', 'areas',
];
// Schema 2 moved the working corpus under kai/. Roots are resolved from the
// manifest so the doctor never assumes a layout the workspace does not have.
const CORPUS_ROOTS = ['coordination', 'initiatives', 'library', 'personal'];
// Whether the working corpus is published with the repository. Optional: an
// absent key means "committed", which is what every workspace scaffolded before
// this key existed already does — so its absence needs no migration.
const CORPUS_VISIBILITIES = new Set(['committed', 'local']);
const DEFAULT_ROOTS = {
  corpus: 'kai',
  coordination: 'kai/coordination',
  initiatives: 'kai/initiatives',
  library: 'kai/library',
  personal: 'kai/personal',
};
// Files that only kai creates. A bare root directory is treated as retired kai
// content — rather than an unrelated product folder of the same generic name —
// only when at least one of these is present inside it.
const KAI_ROOT_MARKERS = {
  coordination: ['items', 'threads', 'BOARD.md', 'ACTIVE.md', 'backlog.md'],
  initiatives: ['INDEX.md'],
  library: ['dev-designs', 'qa-findings', 'briefings', 'investigations', 'learnings', 'playbooks'],
  personal: ['inbox.md', 'agenda.md', 'identity', 'consultations', 'decisions'],
};
const CANONICAL_AREAS = new Set([
  'qa', 'eng', 'product', 'revenue', 'support', 'review', 'ship', 'incident',
  'ai', 'learn', 'lessons', 'pulse', 'content',
]);
const WORKSPACE_MODES = new Set(['repository', 'external']);

// A durable path must be workspace-root-relative: no machine-absolute root,
// no UNC share, no session-state, no parent-escape, no abbreviated `.../`.
function badPath(p) {
  const t = unquote(p);
  if (isNull(t) || t === '[]') return null;
  const norm = t.replace(/\\/g, '/');
  if (t.startsWith('\\\\') || norm.startsWith('//')) return 'UNC / share path';
  if (/^[A-Za-z]:\//.test(norm) || norm.startsWith('/')) return 'machine-absolute path';
  if (t.includes('.../')) return 'abbreviated `.../` path';
  if (norm.split('/').some((seg) => seg === '..')) return 'path escaping the workspace root';
  if (/session-state/i.test(t)) return 'session-state-relative path';
  return null;
}

// --- validation ------------------------------------------------------------
function looksLikeKaiRoot(root, key) {
  const dir = join(root, key);
  if (!existsSync(dir)) return false;
  return (KAI_ROOT_MARKERS[key] || []).some((marker) => existsSync(join(dir, marker)));
}

export function checkWorkspace(root) {
  const errors = [];
  const warnings = [];
  const migrations = [];
  const err = (m) => errors.push(m);
  const warn = (m) => warnings.push(m);

  // 1. Manifest -------------------------------------------------------------
  const manifestPath = join(root, '.kai', 'manifest.json');
  if (!existsSync(manifestPath)) {
    err('.kai/manifest.json is missing — the workspace is not onboarded. Run workflow-workspace-init.');
    return { errors, warnings, migrations };
  }
  let m;
  try { m = JSON.parse(readFileSync(manifestPath, 'utf8')); }
  catch (e) { err(`.kai/manifest.json is not valid JSON: ${e.message}`); return { errors, warnings, migrations }; }

  for (const k of REQUIRED_MANIFEST_KEYS) {
    if (!(k in m)) {
      if (k === 'schema_version') continue; // handled by migration logic below
      // `corpus` arrived with schema 2; a schema-1 manifest is legitimately
      // missing it and is already told to migrate.
      if (k === 'corpus' && Number.isInteger(m.schema_version) && m.schema_version < 2) continue;
      err(`.kai/manifest.json missing required key "${k}"`);
    }
  }
  // Provenance: which plugin scaffolded this workspace. `kai` today, `kai-core`
  // once packs are the install surface — a closed set, so a typo is still an
  // error rather than a third mode. `--migration-check` is what reconciles the
  // recorded value against what the host actually has installed.
  if (m.plugin !== undefined && !WORKSPACE_PROVENANCE.has(m.plugin)) {
    err(`.kai/manifest.json "plugin" must be "${LEGACY_PLUGIN}" (monolith) or "${CORE_PLUGIN}" (pack install)`);
  }
  if (m.workspace_mode !== undefined && !WORKSPACE_MODES.has(m.workspace_mode)) {
    err(`.kai/manifest.json "workspace_mode" must be "repository" or "external" (found ${JSON.stringify(m.workspace_mode)})`);
  }
  if (m.workspace_mode === 'repository' && m.workspace_root !== '.') {
    err('.kai/manifest.json repository-mode "workspace_root" must be "."');
  }
  // A typo here would silently publish a corpus the operator asked to keep
  // local, so an unrecognized value is an error rather than a fallback.
  if (m.corpus_visibility !== undefined && !CORPUS_VISIBILITIES.has(m.corpus_visibility)) {
    err(`.kai/manifest.json "corpus_visibility" must be "committed" or "local" (found ${JSON.stringify(m.corpus_visibility)})`);
  } else if (m.corpus_visibility === 'local') {
    checkLocalCorpusPrivacy(root, err, warn);
  }
  if (Array.isArray(m.areas)) {
    const a = new Set(m.areas);
    for (const x of a) if (!CANONICAL_AREAS.has(x)) err(`.kai/manifest.json declares unknown run area "${x}"`);
    for (const x of CANONICAL_AREAS) if (!a.has(x)) err(`.kai/manifest.json is missing run area "${x}"`);
  }

  // schema_version compatibility + migration plan
  const sv = m.schema_version;
  if (sv === undefined || sv === 0) {
    migrations.push(`schema_version absent → migrate to ${CURRENT_SCHEMA_VERSION} (add schema_version, reconcile fixed roots/areas, drop retired fields).`);
    err(`workspace schema is pre-versioned; migration to schema_version ${CURRENT_SCHEMA_VERSION} required before claiming work.`);
  } else if (!Number.isInteger(sv)) {
    err(`.kai/manifest.json "schema_version" must be an integer (found ${JSON.stringify(sv)}).`);
  } else if (sv < CURRENT_SCHEMA_VERSION) {
    for (let v = sv + 1; v <= CURRENT_SCHEMA_VERSION; v++) migrations.push(`apply migration step → ${v} (see kai-core-workspace-onboarding ladder).`);
    err(`workspace schema_version ${sv} is behind the current contract ${CURRENT_SCHEMA_VERSION}; migration required before claiming work.`);
  } else if (sv > CURRENT_SCHEMA_VERSION) {
    err(`workspace schema_version ${sv} is newer than this plugin's contract ${CURRENT_SCHEMA_VERSION}; update the plugin (/plugin update kai) before claiming work.`);
  }

  // Resolve corpus roots from the manifest rather than assuming a layout.
  const rootOf = (key) => {
    const v = m[key];
    return typeof v === 'string' && v.trim() ? v.trim().replace(/\/+$/, '') : DEFAULT_ROOTS[key];
  };
  for (const key of CORPUS_ROOTS) {
    const declared = rootOf(key);
    if (Number.isInteger(sv) && sv >= CURRENT_SCHEMA_VERSION && declared !== DEFAULT_ROOTS[key]) {
      err(`.kai/manifest.json "${key}" must be "${DEFAULT_ROOTS[key]}" (found "${declared}"); the layout is a contract constant, not a per-workspace setting.`);
    }
    // Split-brain guard: a leftover schema-1 root alongside its schema-2 home
    // silently forks the workspace. A bare directory only counts when it holds
    // kai's own marker files — a product repository is entitled to its own
    // `library/` or `personal/` folder, which is precisely why kai moved.
    if (looksLikeKaiRoot(root, key) && existsSync(join(root, ...DEFAULT_ROOTS[key].split('/')))) {
      err(`split-brain layout: a retired schema-1 "${key}/" holding kai content coexists with "${DEFAULT_ROOTS[key]}/"; finish the schema 1 → 2 migration and remove the retired root before claiming work.`);
    }
  }
  if (Number.isInteger(sv) && sv >= CURRENT_SCHEMA_VERSION && rootOf('corpus') !== DEFAULT_ROOTS.corpus) {
    err(`.kai/manifest.json "corpus" must be "${DEFAULT_ROOTS.corpus}" (found "${rootOf('corpus')}"); the layout is a contract constant, not a per-workspace setting.`);
  }
  const coordinationRoot = rootOf('coordination');

  // 2. Coordination items ---------------------------------------------------
  const itemsDir = join(root, ...coordinationRoot.split('/'), 'items');
  const itemIds = new Set();
  const deps = new Map(); // id -> [depId]
  if (existsSync(itemsDir)) {
    // README.md is the lane's own scaffold file, not a work item.
    const files = readdirSync(itemsDir).filter((f) => f.endsWith('.md') && f !== 'README.md');
    for (const f of files) {
      const id = basename(f, '.md');
      const rel = `${coordinationRoot}/items/${f}`;
      const fm = frontmatter(readFileSync(join(itemsDir, f), 'utf8'));
      if (!fm) { err(`${rel}: missing YAML frontmatter`); continue; }
      itemIds.add(id);

      if (scalar(fm, 'type') !== 'work-item') err(`${rel}: frontmatter "type" must be "work-item"`);
      const fid = scalar(fm, 'id');
      if (fid !== id) err(`${rel}: frontmatter id "${fid}" must equal filename id "${id}"`);

      const state = scalar(fm, 'state');
      if (!LIFECYCLE.has(state)) err(`${rel}: invalid lifecycle state "${state}"`);
      const changeRef = scalar(fm, 'change_ref');
      if (NEEDS_CHANGE_REF.has(state) && isNull(changeRef)) {
        err(`${rel}: state "${state}" requires a non-null change_ref`);
      }
      // change_ref must content-address a git object (commit/PR-head SHA), not an
      // ad hoc digest — the only reproducible-across-machines form (see #31).
      if (!isNull(changeRef) && !/^[0-9a-f]{7,40}$/i.test(changeRef)) {
        err(`${rel}: change_ref "${changeRef}" must be a git commit/PR-head SHA (7–40 hex chars); bespoke diff hashes are not allowed`);
      }

      const ver = scalar(fm, 'version');
      if (!/^\d+$/.test(ver ?? '')) err(`${rel}: "version" must be an integer (found ${JSON.stringify(ver)})`);

      const lz = lease(fm);
      if (!isNull(lz.holder)) {
        if (isNull(lz.expires)) {
          err(`${rel}: lease held by ${lz.holder} but has no expiry`);
        }
        if (isNull(lz.token)) {
          err(`${rel}: lease held by ${lz.holder} but has no token (a held lease must carry a unique grant token — see kai-core-work-coordination "Claiming work safely")`);
        }
        if (isNull(lz.versionAtGrant)) {
          err(`${rel}: lease held by ${lz.holder} but has no version_at_grant (the grant must be bound to the item version it was issued against)`);
        } else if (!/^\d+$/.test(lz.versionAtGrant)) {
          err(`${rel}: lease version_at_grant must be an integer (found ${JSON.stringify(lz.versionAtGrant)})`);
        } else if (/^\d+$/.test(ver ?? '') && Number(lz.versionAtGrant) >= Number(ver)) {
          err(`${rel}: lease version_at_grant ${lz.versionAtGrant} must be strictly less than the item version ${ver} — granting increments the version, so version_at_grant >= version signals a grant that skipped the increment (a racy or tampered lease)`);
        }
      }
      if (!isNull(lz.expires)) {
        const ts = parseStamp(lz.expires);
        if (ts === null) {
          warn(`${rel}: lease expires "${lz.expires}" is not a recognizable timestamp`);
        } else if (ts < Date.now()) {
          warn(`${rel}: lease expired at ${lz.expires} (stale-work recovery signal; the director should reconcile before reclaiming)`);
        }
      }

      for (const key of ['artifact_target']) {
        const reason = badPath(scalar(fm, key));
        if (reason) err(`${rel}: ${key} is a ${reason}; durable paths must be workspace-root-relative`);
      }

      const dlist = dependsOn(fm);
      for (const d of dlist) {
        if (isNull(d.requires)) warn(`${rel}: depends_on "${d.item}" has no required upstream state`);
        else if (!REQUIRES_STATES.has(d.requires)) err(`${rel}: depends_on "${d.item}" has invalid requires "${d.requires}" (expected in-review|completed|release-ready|shipped)`);
      }
      deps.set(id, dlist.map((d) => d.item));
    }
  }

  // dangling dependencies
  for (const [id, list] of deps) {
    for (const d of list) if (!itemIds.has(d)) err(`${coordinationRoot}/items/${id}.md: depends_on references unknown item "${d}"`);
  }
  // dependency cycles (DFS)
  const cycle = findCycle(deps);
  if (cycle) err(`coordination dependency cycle: ${cycle.join(' -> ')}`);

  // 3. BOARD drift ----------------------------------------------------------
  const boardPath = join(root, ...coordinationRoot.split('/'), 'BOARD.md');
  if (existsSync(boardPath) && itemIds.size > 0) {
    const board = readFileSync(boardPath, 'utf8');
    const rowIds = new Set(
      [...board.matchAll(/^\|\s*([a-z][a-z0-9-]+)\s*\|/gm)].map((x) => x[1]).filter((x) => x !== 'id'),
    );
    for (const id of itemIds) if (!rowIds.has(id)) warn(`${coordinationRoot}/BOARD.md is missing a row for item "${id}" (derived index is stale)`);
    for (const id of rowIds) if (!itemIds.has(id)) warn(`${coordinationRoot}/BOARD.md row "${id}" has no item record (derived index is stale)`);
  } else if (!existsSync(boardPath) && itemIds.size > 0) {
    warn(`${coordinationRoot}/BOARD.md is absent though coordination items exist (derived index missing)`);
  }

  return { errors, warnings, migrations };
}

// Parse a `YYYY-MM-DD-HHMM` (or `YYYY-MM-DD`) stamp to epoch ms, else null.

function findCycle(deps) {
  const WHITE = 0, GRAY = 1, BLACK = 2;
  const color = new Map();
  const stack = [];
  let found = null;
  const visit = (n) => {
    if (found) return;
    color.set(n, GRAY); stack.push(n);
    for (const d of deps.get(n) || []) {
      if (!deps.has(d)) continue;
      const c = color.get(d) || WHITE;
      if (c === GRAY) { found = [...stack.slice(stack.indexOf(d)), d]; return; }
      if (c === WHITE) { visit(d); if (found) return; }
    }
    color.set(n, BLACK); stack.pop();
  };
  for (const n of deps.keys()) if ((color.get(n) || WHITE) === WHITE) { visit(n); if (found) break; }
  return found;
}

// --- reporting -------------------------------------------------------------
function report(root, res) {
  const rel = root === process.cwd() ? '.' : root;
  for (const m of res.migrations) console.log(`  ↑ migration: ${m}`);
  for (const w of res.warnings) console.log(`  ! ${w}`);
  for (const e of res.errors) console.log(`  ✗ ${e}`);
  if (res.errors.length === 0) {
    console.log(`✓ workspace healthy — claimable (${rel})${res.warnings.length ? ` — ${res.warnings.length} warning(s)` : ''}`);
    return 0;
  }
  console.log(`✗ workspace not claimable: ${res.errors.length} error(s)${res.migrations.length ? `, migration required` : ''} (${rel})`);
  return 1;
}

// The pack-migration verdict, printed. Read-only throughout: every repair is a
// numbered step for the operator, never something this process performs.
const SEVERITY_MARK = { refusal: '✗', unverified: '?', note: '✓' };
const VERDICT = {
  clear: '✓ clear — no legacy/pack conflict on this host; a pack install may proceed',
  blocked: '✗ blocked — do NOT install packs here until the steps above are done and re-checked',
  unknown: '? unknown — the install state could not be verified, so it is NOT treated as clear',
};

const migrationExitCode = (status) => (status === 'clear' ? 0 : status === 'blocked' ? 2 : 3);
const terminalText = (value) => String(value)
  .replace(/[\x00-\x1f\x7f-\x9f\u200b\u200e\u200f\u202a-\u202e\u2066-\u2069]/g, '?');
const jsonText = (value) => JSON.stringify(value, null, 2)
  .replace(/[\u200b\u200e\u200f\u202a-\u202e\u2066-\u2069]/g, (character) => (
    `\\u${character.charCodeAt(0).toString(16).padStart(4, '0')}`
  ));

function reportMigration({ home, root, json = false }) {
  const res = migrationReport({ home, root });
  if (json) {
    const output = {
      status: res.status,
      codes: res.codes,
      home: res.home,
      root: res.root,
      findings: res.findings,
      steps: res.steps,
      notices: res.notices,
      workspace: res.workspace,
    };
    console.log(jsonText(output));
    return migrationExitCode(res.status);
  }
  console.log(`kai migration doctor (read-only) — host ${terminalText(res.home)}`);
  console.log(`  workspace ${terminalText(root ?? '(not inspected)')}\n`);
  for (const f of res.findings) console.log(`  ${SEVERITY_MARK[f.severity]} ${terminalText(f.message)}`);
  if (res.steps.length) {
    console.log('\n  remediation — run these yourself; this check changed nothing:');
    res.steps.forEach((s, i) => console.log(`    ${i + 1}. ${terminalText(s)}`));
  }
  for (const n of res.notices) console.log(`\n  ! ${terminalText(n)}`);
  console.log(`\n${VERDICT[res.status]}`);
  return migrationExitCode(res.status);
}

// Under `corpus_visibility: local` the operator asked for kai state to stay off
// the remote. That promise is kept by git, not by the manifest, so it has to be
// verified against git rather than assumed from the recorded value — a manifest
// saying `local` over a .gitignore that never got the block is exactly the
// silent failure the setting exists to prevent. Only invoked for `local`, so a
// `committed` workspace keeps the doctor's historical behaviour of never
// shelling out at all.
function checkLocalCorpusPrivacy(root, err, warn) {
  const git = (args) => spawnSync('git', ['-C', root, ...args], { encoding: 'utf8', windowsHide: true });
  const tree = git(['rev-parse', '--is-inside-work-tree']);
  if (tree.error || tree.status !== 0 || tree.stdout.trim() !== 'true') {
    warn('corpus_visibility is "local" but this workspace is not a git work tree (or git is unavailable), so the exclusion could not be verified. Nothing is claimed about what a remote would receive.');
    return;
  }
  // .gitignore never untracks anything. A tracked file stays committable no
  // matter what the ignore block says, so this is an error and not a warning.
  const tracked = git(['ls-files', '--', 'kai', '.kai']);
  if (tracked.status === 0 && tracked.stdout.trim()) {
    const files = tracked.stdout.trim().split(/\r?\n/);
    const sample = files.slice(0, 3).join(', ');
    err(`corpus_visibility is "local" but ${files.length} kai path(s) are tracked by git (e.g. ${sample}${files.length > 3 ? ', …' : ''}); ignoring a path does not untrack it, so this state is still committable. Untrack them ("git rm --cached") or record corpus_visibility "committed".`);
  }
  // check-ignore reports the EFFECTIVE rule, so a later negation or a
  // hand-edited block is caught rather than inferred from the block's text.
  for (const p of ['kai/coordination', '.kai/manifest.json']) {
    const r = git(['check-ignore', '--no-index', '-q', '--', p]);
    if (r.status === 1) {
      err(`corpus_visibility is "local" but "${p}" is not ignored; re-install the managed .gitignore block from kai-core-workspace-onboarding.`);
    } else if (r.status !== 0) {
      warn(`corpus_visibility is "local" but git could not evaluate ignore rules for "${p}"; the exclusion is unverified.`);
    }
  }
}


function selfTest() {
  const fx = join(__dirname, '..', 'test', 'fixtures');
  let ok = true;
  const good = checkWorkspace(join(fx, 'repo-workspace'));
  if (good.errors.length !== 0) {
    ok = false; console.log('✗ self-test: healthy fixture reported errors:'); good.errors.forEach((e) => console.log(`    ${e}`));
  } else if (good.warnings.length !== 0) {
    ok = false; console.log('✗ self-test: healthy fixture reported warnings:'); good.warnings.forEach((w) => console.log(`    ${w}`));
  } else {
    console.log('✓ self-test: healthy fixture passes (0 errors, 0 warnings)');
  }

  const bad = checkWorkspace(join(fx, 'broken-workspace'));
  const expected = [
    { label: 'pre-schema migration', re: /pre-versioned|migration required/i },
    { label: 'missing change_ref', re: /requires a non-null change_ref/i },
    { label: 'non-SHA change_ref', re: /must be a git commit\/PR-head SHA/i },
    { label: 'dangling dependency', re: /unknown item/i },
    { label: 'machine-absolute artifact path', re: /machine-absolute/i },
  ];
  if (bad.errors.length === 0) {
    ok = false; console.log('✗ self-test: broken fixture was NOT rejected');
  } else {
    const joined = bad.errors.join('\n');
    const missing = expected.filter((x) => !x.re.test(joined));
    if (missing.length) {
      ok = false; console.log(`✗ self-test: broken fixture missing expected error class(es): ${missing.map((x) => x.label).join(', ')}`);
    } else {
      console.log(`✓ self-test: broken fixture rejected with all ${expected.length} expected error classes (${bad.errors.length} error(s))`);
    }
  }

  // Split-brain fixture: an incomplete schema 1 -> 2 migration that left a bare
  // root holding kai content alongside its kai/ counterpart must be refused.
  const split = checkWorkspace(join(fx, 'splitbrain-workspace'));
  if (/split-brain layout/i.test(split.errors.join('\n'))) {
    console.log(`✓ self-test: split-brain fixture rejected (${split.errors.length} error(s))`);
  } else {
    ok = false;
    console.log('✗ self-test: split-brain fixture was NOT rejected (coexisting coordination/ and kai/coordination/)');
  }

  // Product-collision fixture: a healthy schema-2 workspace whose *product*
  // owns unrelated root-level library/ and personal/ directories must NOT be
  // mistaken for a half-migrated workspace.
  const collide = checkWorkspace(join(fx, 'product-collision-workspace'));
  if (/split-brain layout/i.test(collide.errors.join('\n'))) {
    ok = false;
    console.log('✗ self-test: product-collision fixture false-positived on product-owned library/ or personal/');
  } else {
    console.log('✓ self-test: product-owned root-level library/ and personal/ are not mistaken for retired kai roots');
  }


  // Spine-only fixture: a freshly onboarded workspace with the full spine
  // committed and no output lane yet materialized. `.kai/runs/<area>/` and
  // `kai/library/<type>/` are created on first write, so this is the normal
  // state between onboarding and first use — and must be claimable.
  const spine = checkWorkspace(join(fx, 'spine-workspace'));
  if (spine.errors.length === 0 && spine.migrations.length === 0) {
    console.log('✓ self-test: spine-only workspace with no materialized lanes is healthy');
  } else {
    ok = false;
    console.log(`✗ self-test: spine-only workspace was rejected (${spine.errors.length} error(s), ${spine.migrations.length} migration(s))`);
    for (const e of [...spine.errors, ...spine.migrations]) console.log(`    ${e}`);
  }

  // Committed end-to-end example: the shipped documentation must stay a valid
  // workspace, or a new user's first reference is wrong.
  const example = checkWorkspace(join(__dirname, '..', 'examples', 'e2e-feature-delivery'));
  if (example.errors.length === 0 && example.migrations.length === 0) {
    console.log('✓ self-test: examples/e2e-feature-delivery is a healthy, claimable workspace');
  } else {
    ok = false;
    console.log(`✗ self-test: examples/e2e-feature-delivery is not healthy (${example.errors.length} error(s))`);
    for (const e of [...example.errors, ...example.migrations]) console.log(`    ${e}`);
  }

  // that skipped the version increment are rejected) and stale-lease recovery
  // (an expired but tokened lease is surfaced as a warning).
  const conc = checkWorkspace(join(fx, 'concurrency-workspace'));
  const concErr = conc.errors.join('\n');
  const concWarn = conc.warnings.join('\n');
  const tokenErr = /lease held by .* but has no token/i.test(concErr);
  const vagErr = /lease held by .* but has no version_at_grant/i.test(concErr);
  const racyErr = /version_at_grant \d+ must be strictly less than the item version/i.test(concErr);
  const staleWarn = /stale-work recovery signal/i.test(concWarn);
  if (tokenErr && vagErr && racyErr && staleWarn) {
    console.log(`✓ self-test: concurrency fixture detects un-tokened + racy (increment-skipping) grants as collisions (${conc.errors.length} error(s)) and the stale-lease recovery signal (${conc.warnings.length} warning(s))`);
  } else {
    ok = false;
    console.log('✗ self-test: concurrency fixture did not surface the expected lease findings:');
    if (!tokenErr) console.log('    missing error: un-tokened held lease');
    if (!vagErr) console.log('    missing error: held lease without version_at_grant');
    if (!racyErr) console.log('    missing error: version_at_grant >= version (increment-skipping grant)');
    if (!staleWarn) console.log('    missing warning: expired lease stale-work recovery signal');
  }

  // corpus_visibility: optional, and its ABSENCE must stay healthy — every
  // workspace scaffolded before the key existed omits it and must not be forced
  // into a migration. `local` is equally valid; only an unrecognized value is
  // rejected, because a typo would silently publish a corpus meant to stay off
  // a public remote.
  const tmpRoot = mkdtempSync(join(tmpdir(), 'kai-doctor-'));
  try {
    const variant = (value, prepare) => {
      const dir = join(tmpRoot, `vis-${String(value)}-${Math.random().toString(36).slice(2, 8)}`);
      cpSync(join(fx, 'repo-workspace'), dir, { recursive: true });
      const mPath = join(dir, '.kai', 'manifest.json');
      const m = JSON.parse(readFileSync(mPath, 'utf8'));
      m.corpus_visibility = value;
      writeFileSync(mPath, `${JSON.stringify(m, null, 2)}\n`);
      if (prepare) prepare(dir);
      return checkWorkspace(dir);
    };
    const git = (dir, args) => spawnSync('git', ['-C', dir, ...args], { encoding: 'utf8', windowsHide: true });

    const badVis = variant('private');
    if (/"corpus_visibility" must be "committed" or "local"/.test(badVis.errors.join('\n'))) {
      console.log('✓ self-test: an unrecognized corpus_visibility is rejected rather than defaulted');
    } else {
      ok = false;
      console.log('✗ self-test: corpus_visibility "private" was NOT rejected');
    }

    // Not a git work tree: the exclusion cannot be verified, so it is reported
    // as unverified rather than either failed or quietly assumed to hold.
    const nonGit = variant('local');
    if (nonGit.errors.length === 0 && /could not be verified/i.test(nonGit.warnings.join('\n'))) {
      console.log('✓ self-test: "local" outside a git work tree warns that the exclusion is unverified, and claims nothing');
    } else {
      ok = false;
      console.log('✗ self-test: "local" outside a git work tree did not report an unverified exclusion');
      [...nonGit.errors, ...nonGit.warnings].forEach((e) => console.log(`    ${e}`));
    }

    const gitAvailable = spawnSync('git', ['--version'], { encoding: 'utf8', windowsHide: true }).status === 0;
    if (!gitAvailable) {
      console.log('~ self-test: git unavailable — skipped the corpus_visibility drift checks');
    } else {
      // The failure the setting exists to prevent: the manifest says "local"
      // while git happily tracks the corpus and no ignore rule covers it.
      const exposed = variant('local', (dir) => {
        git(dir, ['init', '-q']);
        // safecrlf would abort the add on this repo's LF fixtures under a
        // Windows checkout, leaving an empty index and a hollow assertion.
        git(dir, ['-c', 'core.safecrlf=false', '-c', 'core.autocrlf=false', 'add', '-A']);
      });
      const exposedJoined = exposed.errors.join('\n');
      const sawTracked = /kai path\(s\) are tracked by git/.test(exposedJoined);
      const sawUnignored = /is not ignored/.test(exposedJoined);
      if (sawTracked && sawUnignored) {
        console.log('✓ self-test: "local" over a tracked, unignored corpus is rejected — the recorded value is verified against git, not trusted');
      } else {
        ok = false;
        console.log('✗ self-test: "local" over a tracked, unignored corpus was not fully rejected:');
        if (!sawTracked) console.log('    missing error: tracked kai paths');
        if (!sawUnignored) console.log('    missing error: corpus not ignored');
      }

      const honored = variant('local', (dir) => {
        git(dir, ['init', '-q']);
        writeFileSync(join(dir, '.gitignore'), '/kai/\n/.kai/\n');
      });
      if (honored.errors.length === 0) {
        console.log('✓ self-test: a correctly excluded "local" workspace is healthy');
      } else {
        ok = false;
        console.log('✗ self-test: a correctly excluded "local" workspace was rejected:');
        honored.errors.forEach((e) => console.log(`    ${e}`));
      }
    }
  } finally {
    rmSync(tmpRoot, { recursive: true, force: true });
  }

  // The pack-migration check, over its own fixture matrix.
  if (!migrationSelfTest()) ok = false;

  // A workspace whose provenance has been migrated to `kai-core` must still be a
  // healthy workspace — otherwise the migration this doctor prescribes produces
  // a workspace its own default run rejects.
  const migratedRoot = mkdtempSync(join(tmpdir(), 'kai-doctor-provenance-'));
  try {
    cpSync(join(fx, 'repo-workspace'), migratedRoot, { recursive: true });
    const mPath = join(migratedRoot, '.kai', 'manifest.json');
    const manifest = JSON.parse(readFileSync(mPath, 'utf8'));
    manifest.plugin = CORE_PLUGIN;
    writeFileSync(mPath, `${JSON.stringify(manifest, null, 2)}\n`);
    const migrated = checkWorkspace(migratedRoot);
    if (migrated.errors.length === 0) {
      console.log(`✓ self-test: a workspace migrated to plugin "${CORE_PLUGIN}" stays healthy and claimable`);
    } else {
      ok = false;
      console.log(`✗ self-test: a workspace migrated to plugin "${CORE_PLUGIN}" was rejected:`);
      migrated.errors.forEach((e) => console.log(`    ${e}`));
    }

    manifest.plugin = 'kai-fork';
    writeFileSync(mPath, `${JSON.stringify(manifest, null, 2)}\n`);
    const forked = checkWorkspace(migratedRoot);
    if (/"plugin" must be/.test(forked.errors.join('\n'))) {
      console.log('✓ self-test: an unrecognized manifest "plugin" is still rejected — provenance is a closed set');
    } else {
      ok = false;
      console.log('✗ self-test: an unrecognized manifest "plugin" was accepted');
    }
  } finally {
    rmSync(migratedRoot, { recursive: true, force: true });
  }

  return ok ? 0 : 1;
}

// --- pack-migration self-test ----------------------------------------------
// The scenarios the migration check must get right, each pinned to a status and
// the finding codes behind it. `status` is asserted exactly: a case that should
// be `unknown` must not pass as `clear`, which is the whole point of separating
// unverifiable evidence from verified absence.
const MIGRATION_CASES = [
  {
    label: 'legacy monolith installed (direct), workspace scaffolded by it',
    home: 'legacy-direct', workspace: 'monolith', status: 'blocked',
    expect: ['legacy-installed', 'workspace-provenance-current'],
    forbid: ['coexistence', 'nothing-installed'],
    steps: [/^copilot plugin uninstall kai$/, /copilot plugin list/, /confirm every legacy install tree/],
  },
  {
    label: 'clean pack set (core + one department, marketplace), workspace already migrated',
    home: 'packs-marketplace', workspace: 'pack', status: 'clear',
    expect: ['workspace-provenance-migrated'],
    forbid: ['legacy-installed', 'workspace-provenance-stale'],
    noSteps: true, notices: [/start a new session/i],
  },
  {
    label: 'legacy `kai` and `kai-core` installed together',
    home: 'coexistence', status: 'blocked',
    expect: ['coexistence', 'legacy-installed'],
    steps: [/^copilot plugin uninstall kai$/],
  },
  {
    label: 'department pack installed without kai-core',
    home: 'partial-packs', status: 'blocked',
    expect: ['partial-pack-set'], forbid: ['legacy-installed', 'coexistence'],
    steps: [/copilot plugin install kai-core@kai-plugins/],
  },
  {
    label: 'stale direct install tree left behind by an uninstall',
    home: 'stale-direct', status: 'blocked',
    expect: ['stale-install', 'legacy-installed'],
    steps: [/remove each leftover install tree/],
  },
  {
    label: 'same pack installed from both a direct source and the marketplace',
    home: 'provenance-collision', status: 'blocked',
    expect: ['provenance-collision'], steps: [/copilot plugin uninstall kai-core/],
  },
  {
    label: 'provenance inferred from a cache path, plus an unidentifiable kai tree',
    home: 'inferred-provenance', status: 'unknown',
    expect: ['unknown-provenance'], forbid: ['nothing-installed'], noRefusal: true,
  },
  {
    label: 'host config truncated mid-write',
    home: 'malformed-config', status: 'unknown',
    expect: ['unreadable-metadata', 'install-tree-unverified'],
    forbid: ['nothing-installed', 'stale-install'], noRefusal: true, noSteps: true,
  },
  {
    label: 'host config parses but its entries are junk; workspace records an unknown plugin',
    home: 'malformed-entries', workspace: 'unrecognized', status: 'unknown',
    expect: ['unreadable-metadata', 'workspace-provenance-unknown'], noRefusal: true,
  },
  {
    label: 'same pack has two direct install trees',
    home: 'same-source-collision', status: 'blocked',
    expect: ['provenance-collision'], forbid: ['nothing-installed'],
  },
  {
    label: 'Windows and macOS cache paths (case, separators, trailing slash) both resolve',
    home: 'path-normalization', status: 'clear', noSteps: true, noRefusal: true,
  },
  {
    label: 'nothing installed, and both surfaces were readable',
    home: 'absent', status: 'clear', expect: ['nothing-installed'], noSteps: true,
  },
  {
    label: 'host config has no installedPlugins list',
    home: 'missing-installed-list', status: 'unknown',
    expect: ['unreadable-metadata'], forbid: ['nothing-installed'], noRefusal: true,
  },
  {
    label: 'install directory is missing',
    home: 'missing-install-dir', status: 'unknown',
    expect: ['unreadable-install-tree'], forbid: ['nothing-installed'], noRefusal: true,
  },
  {
    label: 'install directory path is not a directory',
    home: 'install-path-file', status: 'unknown',
    expect: ['unreadable-install-tree'], forbid: ['nothing-installed'], noRefusal: true,
  },
  {
    label: 'symlinked install directory is followed and legacy leftovers remain blocked',
    home: 'symlinked-install-dir', status: 'blocked',
    expect: ['stale-install', 'legacy-installed'], forbid: ['nothing-installed'],
  },
  {
    label: 'kai-shaped tree declares a foreign plugin identity',
    home: 'foreign-identity', status: 'unknown',
    expect: ['unknown-provenance'], forbid: ['nothing-installed'], noRefusal: true,
  },
  {
    label: 'manifest-less legacy remnant with child content does not disappear',
    home: 'manifestless-legacy-remnant', status: 'unknown',
    expect: ['unknown-provenance'], forbid: ['nothing-installed'], noRefusal: true, noSteps: true,
  },
  {
    label: 'deep marketplace layout still reveals a stale kai install',
    home: 'deep-marketplace-layout', status: 'unknown',
    expect: ['install-tree-unverified'], forbid: ['nothing-installed', 'stale-install'], noRefusal: true, noSteps: true,
  },
  {
    label: 'recorded marketplace and inferred bucket disagreement is unknown, not collision',
    home: 'provenance-disagreement', status: 'unknown',
    expect: ['provenance-disagreement'], forbid: ['provenance-collision'], noRefusal: true,
  },
  {
    label: 'dangling install link makes enumeration unknown',
    home: 'dangling-install-link', status: 'unknown',
    expect: ['unreadable-install-tree'], forbid: ['nothing-installed'], noRefusal: true,
  },
  {
    label: 'packs installed but the workspace still records the monolith',
    home: 'packs-marketplace', workspace: 'monolith', status: 'blocked',
    expect: ['workspace-provenance-stale'],
    steps: [/set "plugin": "kai-core"/, /workspace-doctor\.mjs --root/],
  },
  {
    label: 'config still lists the monolith after its files were removed',
    home: 'incomplete-uninstall', status: 'blocked',
    expect: ['incomplete-install', 'legacy-installed'], forbid: ['stale-install'],
  },
  {
    label: 'config and the install tree disagree about what is installed',
    home: 'identity-mismatch', status: 'blocked', expect: ['identity-mismatch'],
  },
  {
    label: 'workspace migrated ahead of the host, legacy still installed',
    home: 'legacy-direct', workspace: 'pack', status: 'blocked',
    expect: ['workspace-provenance-ahead', 'legacy-installed'],
  },
  {
    label: 'workspace manifest unreadable',
    home: 'absent', workspace: 'malformed', status: 'unknown',
    expect: ['workspace-provenance-unreadable'], noRefusal: true,
  },
];

// The fixtures are data rather than committed directories: a host cache tree and
// an empty directory are both things a checkout cannot reproduce faithfully.
function materializeHostFixtures(dest) {
  const fx = JSON.parse(readFileSync(join(__dirname, '..', 'test', 'fixtures', 'host-installs.json'), 'utf8'));
  const write = (base, files) => {
    for (const [rel, content] of Object.entries(files)) {
      const target = resolve(base, ...rel.split('/').filter(Boolean));
      const fromBase = relative(resolve(base), target);
      if (fromBase === '..' || fromBase.startsWith(`..${sep}`) || isAbsolute(fromBase)) {
        throw new Error(`fixture path escapes its root: ${rel}`);
      }
      if (content === null) { mkdirSync(target, { recursive: true }); continue; }
      mkdirSync(dirname(target), { recursive: true });
      const text = Array.isArray(content) ? `${content.join('\n')}\n` : `${JSON.stringify(content, null, 2)}\n`;
      writeFileSync(target, text);
    }
  };
  const fixtureBase = (kind, name) => {
    if (!name || name === '.' || name === '..' || /[\\/]/.test(name)) {
      throw new Error(`invalid ${kind} fixture name: ${name}`);
    }
    return join(dest, kind, name);
  };
  for (const [name, files] of Object.entries(fx.homes)) write(fixtureBase('homes', name), files);
  for (const [name, files] of Object.entries(fx.workspaces)) write(fixtureBase('workspaces', name), files);

  const linkedStore = join(dest, 'linked-install-store');
  write(linkedStore, {
    '_direct/RubenSaucedo--kai/plugin.json': { name: 'kai', version: '0.55.0' },
  });
  symlinkSync(linkedStore, join(dest, 'homes', 'symlinked-install-dir', 'installed-plugins'), 'junction');
  symlinkSync(
    join(dest, 'missing-linked-install-store'),
    join(dest, 'homes', 'dangling-install-link', 'installed-plugins'),
    'junction',
  );
}

// Path + content of every file below `dir`, so "this check mutates nothing" is
// asserted rather than asserted-in-a-comment.
function snapshotTree(dir, prefix = '') {
  const out = [];
  for (const entry of readdirSync(dir, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))) {
    const rel = prefix ? `${prefix}/${entry.name}` : entry.name;
    if (lstatSync(join(dir, entry.name)).isSymbolicLink()) out.push(`${rel}->${readlinkSync(join(dir, entry.name))}`);
    else if (entry.isDirectory()) out.push(`${rel}/`, ...snapshotTree(join(dir, entry.name), rel));
    else out.push(`${rel}:${readFileSync(join(dir, entry.name), 'utf8')}`);
  }
  return out;
}

function migrationSelfTest() {
  let ok = true;
  const fail = (msg, detail = []) => { ok = false; console.log(`✗ ${msg}`); detail.forEach((d) => console.log(`    ${d}`)); };

  // Host metadata is JSONC — the shipped config.json opens with two comment
  // lines, so a plain JSON.parse fails on every real host.
  const commented = parseJsonc('// managed\n{"a": 1, "url": "https://x/y" /* inline */}\n');
  if (!commented.ok || commented.value.a !== 1 || commented.value.url !== 'https://x/y') {
    fail('self-test: commented host config was not parsed with its string values intact');
  }
  if (parseJsonc('{"installedPlugins": [').ok) fail('self-test: truncated host config parsed as valid');

  const tails = [
    ['C:\\Users\\dev\\.copilot\\installed-plugins\\_direct\\RubenSaucedo--kai', '_direct/RubenSaucedo--kai'],
    ['/Users/dev/.copilot/installed-plugins//kai-plugins/kai-engineering/', 'kai-plugins/kai-engineering'],
    ['C:\\Users\\dev\\.copilot\\Installed-Plugins\\kai-plugins\\kai-core', 'kai-plugins/kai-core'],
    ['/opt/elsewhere/kai-core', null],
  ];
  for (const [input, want] of tails) {
    if (installTreeTail(input) !== want) {
      fail(`self-test: cache path "${input}" normalized to ${JSON.stringify(installTreeTail(input))}, expected ${JSON.stringify(want)}`);
    }
  }
  if (normalizeHostPath('C:\\a\\\\b\\') !== 'C:/a/b') fail('self-test: host path normalization did not collapse separators');
  if (migrationExitCode('clear') !== 0 || migrationExitCode('blocked') !== 2 || migrationExitCode('unknown') !== 3) {
    fail('self-test: migration verdict exit codes are not distinct');
  }

  const tmpRoot = mkdtempSync(join(tmpdir(), 'kai-migration-'));
  try {
    materializeHostFixtures(tmpRoot);
    const before = snapshotTree(tmpRoot).join('\n');
    const missingHome = migrationReport({ home: join(tmpRoot, 'homes', 'no-such-home') });
    if (missingHome.status !== 'unknown' || !missingHome.codes.includes('no-host-home')) {
      fail(`self-test: an uninspectable host home reported "${missingHome.status}" instead of unknown`);
    }

    let passed = 0;
    for (const c of MIGRATION_CASES) {
      const home = join(tmpRoot, 'homes', c.home);
      const root = c.workspace ? join(tmpRoot, 'workspaces', c.workspace) : null;
      const res = migrationReport({ home, root });
      const problems = [];
      if (res.status !== c.status) problems.push(`status "${res.status}", expected "${c.status}"`);
      for (const code of c.expect ?? []) if (!res.codes.includes(code)) problems.push(`missing finding "${code}"`);
      for (const code of c.forbid ?? []) if (res.codes.includes(code)) problems.push(`unexpected finding "${code}"`);
      for (const re of c.steps ?? []) {
        if (!res.steps.some((s) => re.test(s))) problems.push(`no remediation step matching ${re}`);
      }
      for (const re of c.notices ?? []) {
        if (!res.notices.some((n) => re.test(n))) problems.push(`no notice matching ${re}`);
      }
      if (c.noSteps && res.steps.length) problems.push(`expected no remediation steps, got ${res.steps.length}`);
      if (c.noRefusal && res.findings.some((f) => f.severity === 'refusal')) {
        problems.push('expected no refusal-severity finding');
      }
      if (problems.length) fail(`self-test: migration case "${c.label}"`, [...problems, `codes: ${res.codes.join(', ') || '(none)'}`]);
      else passed++;
    }
    if (passed === MIGRATION_CASES.length) {
      console.log(`✓ self-test: ${passed} migration scenarios verdict correctly (legacy, packs, coexistence, partial set, unreadable surfaces, stale/incomplete installs, provenance collision, unknown provenance, malformed metadata, path normalization)`);
    }

    if (snapshotTree(tmpRoot).join('\n') !== before) {
      fail('self-test: the migration check modified the host/workspace fixtures — it must be read-only');
    } else {
      console.log('✓ self-test: the migration check left every inspected file byte-identical (read-only)');
    }
  } finally {
    rmSync(tmpRoot, { recursive: true, force: true });
  }
  return ok;
}

// --- main ------------------------------------------------------------------
// Guarded so importing `checkWorkspace` (see work-status.mjs) does not execute
// the CLI. Without this, an importer's own flags are consumed by this module.
const isEntry = process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isEntry) {
  const argv = process.argv.slice(2);
  const value = (flag) => {
    const i = argv.indexOf(flag);
    return i !== -1 && argv[i + 1] ? argv[i + 1] : null;
  };
  if (argv.includes('--self-test')) {
    process.exit(selfTest());
  } else if (argv.includes('--migration-check')) {
    const home = value('--home') ? resolve(value('--home')) : defaultHome();
    // Without an explicit --root, the workspace half runs only where a workspace
    // actually is, so a run from an unrelated directory reports on the host and
    // says plainly that it inspected no workspace.
    const rootArg = value('--root');
    const cwdIsWorkspace = existsSync(join(process.cwd(), '.kai', 'manifest.json'));
    const root = rootArg ? resolve(rootArg) : (cwdIsWorkspace ? process.cwd() : null);
    process.exit(reportMigration({ home, root, json: argv.includes('--json') }));
  } else {
    const root = value('--root') ? resolve(value('--root')) : process.cwd();
    process.exit(report(root, checkWorkspace(root)));
  }
}
