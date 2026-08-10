#!/usr/bin/env node
// workspace-doctor — dependency-light validator for a kai *consumer* workspace.
//
// `validate-plugin.mjs` proves the plugin SOURCE is internally consistent.
// This doctor proves a GENERATED workspace (a repo or external folder a user
// onboarded) is well-formed and schema-compatible before coordinated agents act
// on it. It uses only Node built-ins so any host can run it.
//
// Usage:
//   node scripts/workspace-doctor.mjs [--root <dir>]   validate a workspace
//   node scripts/workspace-doctor.mjs --self-test      run against bundled fixtures
//
// Exit code: 0 = healthy (claimable); non-zero = errors or migration required.

import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { join, resolve, dirname, basename } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  LIFECYCLE, NEEDS_CHANGE_REF, REQUIRES_STATES,
  frontmatter, scalar, cleanScalar, isNull, unquote, dependsOn, lease, parseStamp,
} from './lib/coordination.mjs';

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
  if (m.plugin !== undefined && m.plugin !== 'kai') err('.kai/manifest.json "plugin" must be "kai"');
  if (m.workspace_mode !== undefined && !WORKSPACE_MODES.has(m.workspace_mode)) {
    err(`.kai/manifest.json "workspace_mode" must be "repository" or "external" (found ${JSON.stringify(m.workspace_mode)})`);
  }
  if (m.workspace_mode === 'repository' && m.workspace_root !== '.') {
    err('.kai/manifest.json repository-mode "workspace_root" must be "."');
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
    for (let v = sv + 1; v <= CURRENT_SCHEMA_VERSION; v++) migrations.push(`apply migration step → ${v} (see workspace-onboarding ladder).`);
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
          err(`${rel}: lease held by ${lz.holder} but has no token (a held lease must carry a unique grant token — see work-coordination "Claiming work safely")`);
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

// --- self-test -------------------------------------------------------------
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

  return ok ? 0 : 1;
}

// --- main ------------------------------------------------------------------
// Guarded so importing `checkWorkspace` (see work-status.mjs) does not execute
// the CLI. Without this, an importer's own flags are consumed by this module.
const isEntry = process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isEntry) {
  const argv = process.argv.slice(2);
  if (argv.includes('--self-test')) {
    process.exit(selfTest());
  } else {
    const ri = argv.indexOf('--root');
    const root = ri !== -1 && argv[ri + 1] ? resolve(argv[ri + 1]) : process.cwd();
    process.exit(report(root, checkWorkspace(root)));
  }
}
