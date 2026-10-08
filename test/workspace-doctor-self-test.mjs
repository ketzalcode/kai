// The consumer-workspace doctor and the pack-migration check —
// `src/core/workspace-doctor.mjs`.
//
// Moved out of the command itself (#225). This was the largest block of
// non-product code a consumer downloaded: 1,252 lines across two functions plus
// the 190-line migration scenario table below, all reachable only through a
// `--self-test` argv string no build-time constant could fold away.
//
// Nothing was dropped in the move. What changed:
//
//   * fixture paths resolve from `test/` rather than from `src/core/`, which is
//     what the comment at the top of the doctor warned about;
//   * `selfPath` names the source command explicitly, because the spawned CLI
//     assertions must run the doctor, not this file;
//   * `sleepSync` is re-declared here. It is a one-line `Atomics.wait` used to
//     pace a lock-contention loop, not behaviour under test, so exporting it
//     from the shipped module would have been an export owned by a test.
//
// `writeRegistry`, `migrationExitCode` and `migrationInventory` ARE exported
// from the doctor: each is real behaviour these checks assert directly — the
// registry write path under lock, the three distinct verdict exit codes, and
// the JSON inventory's redaction of cache paths.

import {
  readFileSync, existsSync, readdirSync, cpSync, writeFileSync, mkdirSync, mkdtempSync, rmSync,
  lstatSync, readlinkSync, symlinkSync, openSync, closeSync,
} from 'node:fs';
import { spawn, spawnSync } from 'node:child_process';
import { join, resolve, dirname, basename, relative, isAbsolute, sep } from 'node:path';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';
import { frontmatter, scalar, lease } from '../src/core/lib/coordination.mjs';
import {
  migrationReport, parseJsonc, installTreeTail, normalizeHostPath,
} from '../src/core/lib/migration-doctor.mjs';
import {
  loadWorkspaceRegistry, registryPath, resolveWorkspaceRoot,
} from '../src/core/lib/workspace-resolve.mjs';
import { normalized } from '../src/core/lib/workspace-path-safety.mjs';
import {
  checkWorkspace, initializeWorkspace, adoptWorkspace, forgetWorkspace,
  writeRegistry, migrationExitCode, migrationInventory,
} from '../src/core/workspace-doctor.mjs';

const REPO_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const selfPath = join(REPO_ROOT, 'src', 'core', 'workspace-doctor.mjs');

function sleepSync(milliseconds) {
  Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, milliseconds);
}

function caseAlias(path) {
  if (process.platform !== 'win32') return null;
  const upper = path.toUpperCase();
  if (upper !== path) return upper;
  const lower = path.toLowerCase();
  return lower !== path ? lower : null;
}

function selfTest() {
  const fx = join(REPO_ROOT, 'test', 'fixtures');
  let failed = 0;
  const ok = (condition, message, details = []) => {
    if (condition) console.log(`✓ self-test: ${message}`);
    else {
      failed++;
      console.log(`✗ self-test: ${message}`);
      details.forEach((detail) => console.log(`    ${detail}`));
    }
  };

  const direction = [
    '# Vision',
    'A composable private workspace.',
    '',
    '# Mission',
    'Coordinate exact work safely.',
    '',
    '# Current Goal',
    'Activate schema 5.',
    '',
    '# Out of Scope',
    'Inventing project direction.',
    '',
  ].join('\n');
  const schema5Manifest = (overrides = {}) => ({
    plugin: 'kai-core',
    version: 'test',
    schema_version: 5,
    scaffolded: '2026-10-02',
    workspace_id: 'stable-id',
    placement: 'repo-local',
    workspace_root: '.',
    private_root: '.kai',
    direction: 'docs/kai/DIRECTION.md',
    projects: [{
      id: 'default',
      path: '.',
      publication_root: 'docs/kai',
    }],
    ...overrides,
  });

  const unconfirmedRoot = mkdtempSync(join(tmpdir(), 'kai-schema5-unconfirmed-'));
  try {
    spawnSync('git', ['init', '--quiet', unconfirmedRoot], {windowsHide: true});
    writeFileSync(join(unconfirmedRoot, '.gitignore'), '/.kai/\n');
    mkdirSync(join(unconfirmedRoot, 'docs', 'kai'), {recursive: true});
    writeFileSync(join(unconfirmedRoot, 'docs', 'kai', 'DIRECTION.md'), direction);
    const unconfirmed = initializeWorkspace({
      root: unconfirmedRoot,
      manifest: schema5Manifest({workspace_id: 'unconfirmed-init'}),
    });
    ok(!unconfirmed.ok
      && unconfirmed.code === 'AUTHORITY_REQUIRED'
      && !existsSync(join(unconfirmedRoot, '.kai')),
    'the standalone initializer requires explicit confirmation before any workspace mutation',
    [unconfirmed.reason, ...snapshotTree(unconfirmedRoot)]);
  } finally {
    rmSync(unconfirmedRoot, {recursive: true, force: true});
  }

  const schema5Root = mkdtempSync(join(tmpdir(), 'kai-schema5-init-'));
  try {
    spawnSync('git', ['init', '--quiet', schema5Root], {windowsHide: true});
    writeFileSync(join(schema5Root, '.gitignore'), '/.kai/\n');
    mkdirSync(join(schema5Root, 'docs', 'kai'), {recursive: true});
    writeFileSync(join(schema5Root, 'docs', 'kai', 'DIRECTION.md'), direction);

    const initialized = spawnSync(process.execPath, [
      selfPath,
      '--initialize',
      '--root',
      schema5Root,
      '--confirm',
    ], {
      input: JSON.stringify(schema5Manifest()),
      encoding: 'utf8',
      windowsHide: true,
    });
    ok(initialized.status === 0,
      'the explicit confirmed standalone initializer activates schema 5',
      [initialized.stderr, initialized.stdout].filter(Boolean));
    const initializedFiles = snapshotTree(schema5Root)
      .filter(entry => !entry.startsWith('.git/'))
      .filter(entry => entry !== '.git/')
      .sort();
    const expectedFiles = [
      '.gitignore:/.kai/\n',
      '.kai/',
      '.kai/core/',
      '.kai/core/runtime/',
      '.kai/core/runtime/coordination.sqlite:',
      '.kai/manifest.json:',
      'docs/',
      'docs/kai/',
      `docs/kai/DIRECTION.md:${direction}`,
      'docs/kai/README.md:',
    ];
    ok(
      expectedFiles.every(expected => initializedFiles.some(actual =>
        expected.endsWith(':') ? actual.startsWith(expected) : actual === expected))
        && initializedFiles.length === expectedFiles.length,
      'initialization creates only manifest, schema-2 store, README, and the supplied Direction',
      initializedFiles,
    );
    const forbiddenInitialDirectories = [
      'engineering', 'creative', 'personal', 'learning', 'runs', 'review', 'archive', 'artifacts',
    ];
    ok(
      forbiddenInitialDirectories.every(name =>
        !initializedFiles.some(entry => entry.split('/').includes(name))),
      'initialization creates no department, personal, generic, run, review, or archive directory',
      initializedFiles,
    );
    const ignore = spawnSync('git', ['--no-pager', '-C', schema5Root, 'check-ignore', '--no-index', '-q', '--', '.kai/'],
      {encoding: 'utf8', windowsHide: true});
    const tracked = spawnSync('git', ['--no-pager', '-C', schema5Root, 'ls-files', '--', '.kai'],
      {encoding: 'utf8', windowsHide: true});
    ok(ignore.status === 0 && tracked.stdout.trim() === '',
      'repo-local initialization leaves the whole .kai tree ignored and untracked',
      [ignore.stderr, tracked.stdout, tracked.stderr].filter(Boolean));
    const healthySchema5 = checkWorkspace(schema5Root);
    ok(healthySchema5.errors.length === 0,
      'the activated schema-5 workspace passes doctor validation',
      healthySchema5.errors);

    const manifestPath = join(schema5Root, '.kai', 'manifest.json');
    const exactManifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
    for (const [key, value] of [
      ['runs', '.kai/runs'],
      ['installed_packs', ['kai-core']],
    ]) {
      writeFileSync(manifestPath, `${JSON.stringify({...exactManifest, [key]: value}, null, 2)}\n`);
      const retiredKey = checkWorkspace(schema5Root);
      ok(new RegExp(`unexpected key "${key}"|retired.*"${key}"`, 'i').test(retiredKey.errors.join('\n')),
        `schema 5 rejects manifest key "${key}" instead of aliasing it`,
        retiredKey.errors);
    }
    writeFileSync(manifestPath, `${JSON.stringify({...exactManifest, placement: 'shared'}, null, 2)}\n`);
    const sharedPlacement = checkWorkspace(schema5Root);
    ok(/placement.*repo-local.*external/i.test(sharedPlacement.errors.join('\n')),
      'schema 5 rejects retired shared placement',
      sharedPlacement.errors);
    for (const [label, projectPath] of [
      ['UNC', '\\\\server\\share'],
      ['device', '\\\\?\\C:\\workspace'],
      ['POSIX absolute', '/var/kai/project'],
    ]) {
      writeFileSync(manifestPath, `${JSON.stringify({
        ...exactManifest,
        projects: [{...exactManifest.projects[0], path: projectPath}],
      }, null, 2)}\n`);
      const unsafe = checkWorkspace(schema5Root);
      ok(/must be "\."|UNC|device|network|native absolute/i.test(unsafe.errors.join('\n')),
        `schema 5 refuses ${label} project paths without traversing them`,
        unsafe.errors);
    }
    writeFileSync(manifestPath, `${JSON.stringify(exactManifest, null, 2)}\n`);
  } finally {
    rmSync(schema5Root, {recursive: true, force: true});
  }

  const failedInitRoot = mkdtempSync(join(tmpdir(), 'kai-schema5-failed-init-'));
  try {
    spawnSync('git', ['init', '--quiet', failedInitRoot], {windowsHide: true});
    writeFileSync(join(failedInitRoot, '.gitignore'), '/.kai/\n');
    mkdirSync(join(failedInitRoot, 'docs', 'kai', 'README.md'), {recursive: true});
    writeFileSync(join(failedInitRoot, 'docs', 'kai', 'DIRECTION.md'), direction);
    const failedInit = initializeWorkspace({
      root: failedInitRoot,
      manifest: schema5Manifest({workspace_id: 'failed-init'}),
      confirm: true,
    });
    ok(!failedInit.ok
      && !existsSync(join(failedInitRoot, '.kai', 'manifest.json'))
      && !existsSync(join(failedInitRoot, '.kai', 'core', 'runtime', 'coordination.sqlite'))
      && (!existsSync(join(failedInitRoot, '.kai'))
        || !readdirSync(join(failedInitRoot, '.kai'), {withFileTypes: true})
          .some(entry => entry.name.includes('manifest'))),
    'an initialization failure cleans its staged manifest and new store',
    [failedInit.reason, ...snapshotTree(failedInitRoot)]);
  } finally {
    rmSync(failedInitRoot, {recursive: true, force: true});
  }

  const missingDirectionRoot = mkdtempSync(join(tmpdir(), 'kai-schema5-no-direction-'));
  try {
    spawnSync('git', ['init', '--quiet', missingDirectionRoot], {windowsHide: true});
    writeFileSync(join(missingDirectionRoot, '.gitignore'), '/.kai/\n');
    const missingDirection = initializeWorkspace({
      root: missingDirectionRoot,
      manifest: schema5Manifest({workspace_id: 'no-direction'}),
      confirm: true,
    });
    ok(!missingDirection.ok
      && /DIRECTION_REQUIRED|direction/i.test(`${missingDirection.code} ${missingDirection.reason}`)
      && !existsSync(join(missingDirectionRoot, '.kai')),
    'missing operator Direction fails before any private tree is created',
    [missingDirection.reason]);
  } finally {
    rmSync(missingDirectionRoot, {recursive: true, force: true});
  }

  const linkedInitRoot = mkdtempSync(join(tmpdir(), 'kai-schema5-linked-init-'));
  const linkedInitOutside = mkdtempSync(join(tmpdir(), 'kai-schema5-linked-outside-'));
  try {
    spawnSync('git', ['init', '--quiet', linkedInitRoot], {windowsHide: true});
    writeFileSync(join(linkedInitRoot, '.gitignore'), '/.kai/\n');
    mkdirSync(join(linkedInitRoot, 'docs', 'kai'), {recursive: true});
    writeFileSync(join(linkedInitRoot, 'docs', 'kai', 'DIRECTION.md'), direction);
    symlinkSync(linkedInitOutside, join(linkedInitRoot, '.kai'), 'junction');
    const linkedInit = initializeWorkspace({
      root: linkedInitRoot,
      manifest: schema5Manifest({workspace_id: 'linked-init'}),
      confirm: true,
    });
    ok(!linkedInit.ok
      && !existsSync(join(linkedInitOutside, 'manifest.json'))
      && !existsSync(join(linkedInitOutside, 'core')),
    'initialization refuses a linked private root before staging any file',
    [linkedInit.reason].filter(Boolean));
  } finally {
    rmSync(linkedInitRoot, {recursive: true, force: true});
    rmSync(linkedInitOutside, {recursive: true, force: true});
  }

  const externalRoot = mkdtempSync(join(tmpdir(), 'kai-schema5-external-'));
  try {
    const projectRoot = join(externalRoot, 'project');
    const workspaceRoot = join(externalRoot, 'workspace');
    const env = {KAI_HOME: join(externalRoot, 'home')};
    mkdirSync(join(projectRoot, 'docs', 'kai'), {recursive: true});
    mkdirSync(workspaceRoot, {recursive: true});
    writeFileSync(join(projectRoot, 'docs', 'kai', 'DIRECTION.md'), direction);
    writeFileSync(join(projectRoot, 'docs', 'kai', 'README.md'), '# Operator-owned Kai index\n');
    const manifest = schema5Manifest({
      workspace_id: 'external-stable-id',
      placement: 'external',
      workspace_root: workspaceRoot,
      projects: [{id: 'default', path: projectRoot, publication_root: 'docs/kai'}],
    });
    writeRegistry([{
      project_root: projectRoot,
      workspace_root: workspaceRoot,
      workspace_id: manifest.workspace_id,
    }], env);
    const initialized = initializeWorkspace({root: workspaceRoot, manifest, env, confirm: true});
    ok(initialized.ok
      && existsSync(join(workspaceRoot, '.kai', 'core', 'runtime', 'coordination.sqlite'))
      && !existsSync(join(projectRoot, '.kai'))
      && readFileSync(join(projectRoot, 'docs', 'kai', 'README.md'), 'utf8') === '# Operator-owned Kai index\n',
    'external initialization preserves registry binding, project privacy, and an existing README',
    [initialized.reason].filter(Boolean));
    const checked = checkWorkspace(workspaceRoot, {env});
    ok(checked.errors.length === 0,
      'an initialized external schema-5 workspace validates against its exact project binding',
      checked.errors);
    const forgotten = forgetWorkspace({projectRoot, env});
    ok(forgotten.ok
      && existsSync(join(workspaceRoot, '.kai', 'manifest.json'))
      && existsSync(join(projectRoot, 'docs', 'kai', 'DIRECTION.md')),
    'removing an installation binding never deletes .kai or docs/kai content',
    [forgotten.reason].filter(Boolean));
  } finally {
    rmSync(externalRoot, {recursive: true, force: true});
  }

  const good = checkWorkspace(join(fx, 'repo-workspace'));
  ok(good.errors.length === 0, 'healthy schema-3 shared fixture passes', good.errors);

  const bad = checkWorkspace(join(fx, 'broken-workspace'));
  const badText = bad.errors.join('\n');
  ok(
    /migration .*required/i.test(badText)
      && /requires a non-null change_ref/i.test(badText)
      && /unknown item/i.test(badText),
    'broken fixture reports migration, item, and dependency failures',
    bad.errors,
  );

  const concurrency = checkWorkspace(join(fx, 'concurrency-workspace'));
  const concurrencyText = concurrency.errors.join('\n');
  ok(
    /has no token/i.test(concurrencyText)
      && /has no version_at_grant/i.test(concurrencyText)
      && /strictly less/i.test(concurrencyText)
      && /stale-work recovery signal/i.test(concurrency.warnings.join('\n')),
    'coordination lease integrity still fails closed',
    [...concurrency.errors, ...concurrency.warnings],
  );

  const example = checkWorkspace(join(REPO_ROOT, 'examples', 'e2e-feature-delivery'));
  ok(example.errors.length === 0, 'end-to-end schema-3 example is claimable', example.errors);

  const publicationTemplates = ['decision.md', 'spec.md', 'report.md'].map((name) => ({
    name,
    fm: frontmatter(readFileSync(join(REPO_ROOT, 'plugins', 'kai-core', 'templates', 'publication', name), 'utf8')),
  }));
  ok(
    publicationTemplates.every(({ fm }) => fm && scalar(fm, 'item') === '<work-item-id>'),
    'publication templates declare the owning work item',
    publicationTemplates.filter(({ fm }) => !fm || scalar(fm, 'item') !== '<work-item-id>').map(({ name }) => name),
  );

  const tmpRoot = mkdtempSync(join(tmpdir(), 'kai-schema3-'));
  try {
    const publicationWorkspace = join(tmpRoot, 'publication-workspace');
    cpSync(join(fx, 'repo-workspace'), publicationWorkspace, { recursive: true });
    const publicationItem = join(publicationWorkspace, '.kai', 'state', 'items', 'sample-api.md');
    const originalItem = readFileSync(publicationItem, 'utf8');
    const publicationItemText = (target) => originalItem.replace(
      'artifact_target: null',
      [
        'artifact_expectation: owed',
        'artifact_class: design',
        'completion_authority: principal-product-manager',
        'validity_owner: principal-swe-architect',
        `artifact_target: ${target}`,
      ].join('\n'),
    );
    writeFileSync(
      publicationItem,
      publicationItemText('project:fixture:docs/kai/reports/sample-api.md'),
    );
    const missingPublication = checkWorkspace(publicationWorkspace);
    ok(/does not exist for item state "in-review"/i.test(missingPublication.errors.join('\n')),
      'review-stage items cannot claim missing published targets',
      missingPublication.errors);

    const publishedAsset = join(publicationWorkspace, 'docs', 'kai', 'reports', 'sample-api.md');
    mkdirSync(dirname(publishedAsset), { recursive: true });
    writeFileSync(publishedAsset, [
      '---',
      'asset_id: sample-api',
      'asset_class: design',
      'item: sample-api',
      'produced_by: principal-swe-architect',
      'created: 2026-08-31',
      'revision: 2',
      'disposition:',
      '  status: published',
      'completion:',
      '  authority: principal-product-manager',
      '  verdict: pending',
      '  revision_at_verdict: 1',
      'validity:',
      '  status: provisional',
      '  owner: principal-swe-architect',
      '---',
      '',
      '# Sample API',
      '',
    ].join('\n'));
    const unacceptedPublication = checkWorkspace(publicationWorkspace);
    ok(/not accepted and published|accepted revision does not match/i.test(unacceptedPublication.errors.join('\n')),
      'a public target is rejected until its current revision is accepted',
      unacceptedPublication.errors);

    writeFileSync(publishedAsset, [
      '---',
      'asset_id: sample-api',
      'asset_class: design',
      'item: sample-api',
      'produced_by: principal-swe-architect',
      'created: 2026-08-31',
      'revision: 2',
      'disposition:',
      '  status: published',
      'completion:',
      '  authority: principal-product-manager',
      '  verdict: accepted',
      '  revision_at_verdict: 2',
      'validity:',
      '  status: current',
      '  owner: principal-swe-architect',
      '---',
      '',
      '# Sample API',
      '',
    ].join('\n'));
    const acceptedPublication = checkWorkspace(publicationWorkspace);
    ok(acceptedPublication.errors.length === 0,
      'an accepted current project-qualified revision remains claimable',
      acceptedPublication.errors);

    writeFileSync(publishedAsset, readFileSync(publishedAsset, 'utf8').replace(
      'item: sample-api',
      'item: another-item',
    ));
    const mismatchedAssetItem = checkWorkspace(publicationWorkspace);
    ok(/owned by item "another-item", not "sample-api"/i.test(mismatchedAssetItem.errors.join('\n')),
      'a published asset remains bound to the item that claims it',
      mismatchedAssetItem.errors);
    writeFileSync(publishedAsset, readFileSync(publishedAsset, 'utf8').replace(
      'item: another-item',
      'item: sample-api',
    ));

    writeFileSync(publishedAsset, readFileSync(publishedAsset, 'utf8').replace(
      '  authority: principal-product-manager',
      '  authority: principal-swe-architect',
    ));
    const mismatchedAuthority = checkWorkspace(publicationWorkspace);
    ok(/completion\.authority .* does not match work item declaration/i.test(mismatchedAuthority.errors.join('\n')),
      'published acceptance must come from the work item declared authority',
      mismatchedAuthority.errors);
    writeFileSync(publishedAsset, readFileSync(publishedAsset, 'utf8').replace(
      '  authority: principal-swe-architect',
      '  authority: principal-product-manager',
    ));

    writeFileSync(publishedAsset, readFileSync(publishedAsset, 'utf8').replace(
      '  status: current',
      '  status: invalidated',
    ));
    const invalidatedPublication = checkWorkspace(publicationWorkspace);
    ok(/validity is not current/i.test(invalidatedPublication.errors.join('\n')),
      'an invalidated public revision is no longer claimable',
      invalidatedPublication.errors);

    writeFileSync(publishedAsset, readFileSync(publishedAsset, 'utf8').replace(
      '  status: invalidated',
      '  status: current',
    ));

    writeFileSync(
      publicationItem,
      publicationItemText('project:fixture:reports/sample-api.md'),
    );
    const escapedPublication = checkWorkspace(publicationWorkspace);
    ok(/escapes project .* publication_root/i.test(escapedPublication.errors.join('\n')),
      'project-qualified artifact targets cannot bypass the configured publication root',
      escapedPublication.errors);

    writeFileSync(
      publicationItem,
      publicationItemText('docs/kai/reports/sample-api.md'),
    );
    const unqualifiedPublication = checkWorkspace(publicationWorkspace);
    ok(/unqualified project path/i.test(unqualifiedPublication.errors.join('\n')),
      'public artifact targets cannot bypass project qualification',
      unqualifiedPublication.errors);

    // A schema-4 manifest without a store is historical read-only state.
    // Inspection reports it without creating anything; coordinate intent routes
    // only to explicit offline schema-5 migration.
    const preInitWorkspace = join(tmpRoot, 'pre-init-schema4-workspace');
    cpSync(join(fx, 'repo-workspace'), preInitWorkspace, { recursive: true });
    const preInitManifestPath = join(preInitWorkspace, '.kai', 'manifest.json');
    writeFileSync(preInitManifestPath, `${JSON.stringify({
      ...JSON.parse(readFileSync(preInitManifestPath, 'utf8')), schema_version: 4,
    }, null, 2)}\n`);
    const preInitInspect = checkWorkspace(preInitWorkspace, { intent: 'inspect' });
    ok(
      preInitInspect.errors.length === 0
        && /historical workspace remains read-only/i.test(preInitInspect.warnings.join('\n')),
      'a schema-4 workspace with no store remains a read-only inspection condition',
      [...preInitInspect.errors.map((e) => `error: ${e}`),
        ...preInitInspect.warnings.map((w) => `warning: ${w}`)],
    );
    const preInitCoordinate = checkWorkspace(preInitWorkspace, { intent: 'coordinate' });
    ok(
      preInitCoordinate.errors.some((e) =>
        /schema 4 is read-only; explicit offline schema 5 migration is required/i.test(e)),
      'coordinated writes refuse schema 4 and route to explicit schema-5 migration',
      preInitCoordinate.errors,
    );

    const incompleteWorkspace = join(tmpRoot, 'incomplete-workspace');
    cpSync(join(fx, 'repo-workspace'), incompleteWorkspace, { recursive: true });
    rmSync(join(incompleteWorkspace, '.kai', 'CONVENTIONS.md'));
    mkdirSync(join(incompleteWorkspace, 'kai', 'personal'), { recursive: true });
    writeFileSync(join(incompleteWorkspace, 'kai', 'personal', 'inbox.md'), '# Legacy inbox\n');
    mkdirSync(join(incompleteWorkspace, 'kai', 'initiatives', 'orphaned'), { recursive: true });
    writeFileSync(join(incompleteWorkspace, 'kai', 'initiatives', 'orphaned', 'northstar.md'), '# Legacy initiative\n');
    const incomplete = checkWorkspace(incompleteWorkspace);
    ok(
      /missing required path ".kai\/CONVENTIONS.md"/i.test(incomplete.errors.join('\n'))
        && /retired schema-2 root "kai\/personal"/i.test(incomplete.errors.join('\n'))
        && /retired schema-2 root "kai\/initiatives"/i.test(incomplete.errors.join('\n')),
      'schema-3 validation rejects incomplete and split-brain layouts',
      incomplete.errors,
    );

    const malformedWorkspace = join(tmpRoot, 'malformed-workspace');
    cpSync(join(fx, 'repo-workspace'), malformedWorkspace, { recursive: true });
    const malformedManifestPath = join(malformedWorkspace, '.kai', 'manifest.json');
    const malformedManifest = JSON.parse(readFileSync(malformedManifestPath, 'utf8'));
    malformedManifest.state = null;
    malformedManifest.areas = {};
    writeFileSync(malformedManifestPath, `${JSON.stringify(malformedManifest, null, 2)}\n`);
    rmSync(join(malformedWorkspace, '.kai', 'state', 'items'), { recursive: true });
    writeFileSync(join(malformedWorkspace, '.kai', 'state', 'items'), 'not a directory\n');
    const malformed = checkWorkspace(malformedWorkspace);
    ok(
      /"state" must be exactly ".kai\/state"/i.test(malformed.errors.join('\n'))
        && /"areas" must be an array/i.test(malformed.errors.join('\n'))
        && /path ".kai\/state\/items" must be a directory/i.test(malformed.errors.join('\n')),
      'malformed schema-3 roots and path types fail as validation errors',
      malformed.errors,
    );

    const scalarManifestWorkspace = join(tmpRoot, 'scalar-manifest-workspace');
    cpSync(join(fx, 'repo-workspace'), scalarManifestWorkspace, { recursive: true });
    writeFileSync(join(scalarManifestWorkspace, '.kai', 'manifest.json'), 'null\n');
    const scalarManifest = checkWorkspace(scalarManifestWorkspace);
    ok(/manifest\.json must contain a JSON object/i.test(scalarManifest.errors.join('\n')),
      'valid JSON scalars fail as manifest validation errors',
      scalarManifest.errors);
    const scalarManifestProject = join(tmpRoot, 'scalar-manifest-project');
    const scalarManifestEnv = { KAI_HOME: join(tmpRoot, 'scalar-manifest-home') };
    mkdirSync(scalarManifestProject, { recursive: true });
    writeRegistry([{
      project_root: scalarManifestProject,
      workspace_root: scalarManifestWorkspace,
      workspace_id: 'scalar-manifest-workspace',
    }], scalarManifestEnv);
    const scalarResolution = resolveWorkspaceRoot({ cwd: scalarManifestProject, env: scalarManifestEnv });
    ok(!scalarResolution.ok && /must contain a JSON object/i.test(scalarResolution.reason),
      'registry discovery rejects scalar external manifests without throwing',
      [scalarResolution.reason]);

    const malformedExternalWorkspace = join(tmpRoot, 'malformed-external-workspace');
    cpSync(join(fx, 'external-workspace'), malformedExternalWorkspace, { recursive: true });
    const malformedExternalManifestPath = join(malformedExternalWorkspace, '.kai', 'manifest.json');
    const malformedExternalManifest = JSON.parse(readFileSync(malformedExternalManifestPath, 'utf8'));
    malformedExternalManifest.workspace_root = malformedExternalWorkspace;
    malformedExternalManifest.projects = [null];
    writeFileSync(malformedExternalManifestPath, `${JSON.stringify(malformedExternalManifest, null, 2)}\n`);
    const malformedExternal = checkWorkspace(malformedExternalWorkspace, {
      env: { KAI_HOME: join(tmpRoot, 'malformed-external-home') },
    });
    ok(/projects\[0\] must be an object/i.test(malformedExternal.errors.join('\n')),
      'malformed external project entries fail without crashing registry validation',
      malformedExternal.errors);

    const repoLocalWorkspace = join(tmpRoot, 'repo-local-workspace');
    cpSync(join(fx, 'repo-workspace'), repoLocalWorkspace, { recursive: true });
    const repoLocalManifestPath = join(repoLocalWorkspace, '.kai', 'manifest.json');
    const repoLocalManifest = JSON.parse(readFileSync(repoLocalManifestPath, 'utf8'));
    repoLocalManifest.storage_mode = 'repo-local';
    writeFileSync(repoLocalManifestPath, `${JSON.stringify(repoLocalManifest, null, 2)}\n`);
    writeFileSync(join(repoLocalWorkspace, '.gitignore'), [
      '!/.kai/',
      '!/.kai/**',
      '/.kai/manifest.json',
      '/.kai/state/BOARD.md',
      '',
    ].join('\n'));
    spawnSync('git', ['init', '--quiet', repoLocalWorkspace], { encoding: 'utf8', windowsHide: true });
    const partiallyIgnored = checkWorkspace(repoLocalWorkspace);
    ok(/requires the entire \.kai\/ directory to be ignored/i.test(partiallyIgnored.errors.join('\n')),
      'repo-local mode rejects sentinel-only ignore rules',
      partiallyIgnored.errors);
    writeFileSync(join(repoLocalWorkspace, '.gitignore'), '/.kai/\n');
    const fullyIgnored = checkWorkspace(repoLocalWorkspace);
    ok(fullyIgnored.errors.length === 0,
      'repo-local mode accepts a fully ignored private workspace',
      fullyIgnored.errors);

    const privateTargetWorkspace = join(tmpRoot, 'private-target-workspace');
    const outsidePrivateTarget = join(tmpRoot, 'outside-private-target');
    cpSync(join(fx, 'repo-workspace'), privateTargetWorkspace, { recursive: true });
    mkdirSync(outsidePrivateTarget, { recursive: true });
    symlinkSync(outsidePrivateTarget, join(privateTargetWorkspace, '.kai', 'state', 'escaped-artifacts'), 'junction');
    const privateTargetItem = join(privateTargetWorkspace, '.kai', 'state', 'items', 'sample-api.md');
    writeFileSync(
      privateTargetItem,
      readFileSync(privateTargetItem, 'utf8').replace(
        'artifact_target: null',
        'artifact_target: .kai/state/escaped-artifacts/sample-api.md',
      ),
    );
    const escapedPrivateTarget = checkWorkspace(privateTargetWorkspace);
    ok(/artifact_target resolves outside the workspace/i.test(escapedPrivateTarget.errors.join('\n')),
      'private artifact targets cannot escape through state-tree links',
      escapedPrivateTarget.errors);

    const linkedPrivateWorkspace = join(tmpRoot, 'linked-private-workspace');
    const outsidePrivateLane = join(tmpRoot, 'outside-private-lane');
    cpSync(join(fx, 'repo-workspace'), linkedPrivateWorkspace, { recursive: true });
    mkdirSync(outsidePrivateLane, { recursive: true });
    symlinkSync(outsidePrivateLane, join(linkedPrivateWorkspace, '.kai', 'runs'), 'junction');
    const linkedPrivate = checkWorkspace(linkedPrivateWorkspace);
    ok(/schema-3 path ".kai\/runs" resolves outside the workspace/i.test(linkedPrivate.errors.join('\n')),
      'private lanes cannot escape the workspace through a symbolic link or junction',
      linkedPrivate.errors);

    const danglingPrivateWorkspace = join(tmpRoot, 'dangling-private-workspace');
    const removedPrivateTarget = join(tmpRoot, 'removed-private-target');
    cpSync(join(fx, 'repo-workspace'), danglingPrivateWorkspace, { recursive: true });
    mkdirSync(removedPrivateTarget, { recursive: true });
    symlinkSync(removedPrivateTarget, join(danglingPrivateWorkspace, '.kai', 'review'), 'junction');
    rmSync(removedPrivateTarget, { recursive: true });
    const danglingPrivate = checkWorkspace(danglingPrivateWorkspace);
    ok(/private workspace path ".kai\/review" is a symbolic link or junction/i.test(danglingPrivate.errors.join('\n')),
      'dangling private-lane links fail closed',
      danglingPrivate.errors);

    const nestedGitWorkspace = join(tmpRoot, 'nested-git-workspace');
    cpSync(join(fx, 'repo-workspace'), nestedGitWorkspace, { recursive: true });
    mkdirSync(join(nestedGitWorkspace, '.kai', 'runs', 'cloned-evidence', '.git'), { recursive: true });
    const nestedGit = checkWorkspace(nestedGitWorkspace);
    ok(/private workspace path .* contains a nested Git repository/i.test(nestedGit.errors.join('\n')),
      'private lanes cannot hide independently tracked Git repositories',
      nestedGit.errors);

    const privatePublicationWorkspace = join(tmpRoot, 'private-publication-workspace');
    cpSync(join(fx, 'repo-workspace'), privatePublicationWorkspace, { recursive: true });
    const privateManifestPath = join(privatePublicationWorkspace, '.kai', 'manifest.json');
    const privateManifest = JSON.parse(readFileSync(privateManifestPath, 'utf8'));
    privateManifest.projects[0].publication_root = './.KaI';
    writeFileSync(privateManifestPath, `${JSON.stringify(privateManifest, null, 2)}\n`);
    const privatePublication = checkWorkspace(privatePublicationWorkspace);
    ok(/publication_root must be outside .kai/i.test(privatePublication.errors.join('\n')),
      'publication_root cannot alias the private .kai control tree',
      privatePublication.errors);

    const linkedPublicationWorkspace = join(tmpRoot, 'linked-publication-workspace');
    const outsidePublication = join(tmpRoot, 'outside-publication');
    cpSync(join(fx, 'repo-workspace'), linkedPublicationWorkspace, { recursive: true });
    mkdirSync(outsidePublication, { recursive: true });
    symlinkSync(outsidePublication, join(linkedPublicationWorkspace, 'docs'), 'junction');
    const linkedPublication = checkWorkspace(linkedPublicationWorkspace);
    ok(/symbolic link or junction/i.test(linkedPublication.errors.join('\n')),
      'publication_root cannot escape the project through a symbolic link or junction',
      linkedPublication.errors);

    const overlappingProjectRoot = join(tmpRoot, 'overlapping-project');
    const overlappingWorkspaceRoot = join(overlappingProjectRoot, 'external-workspace');
    mkdirSync(overlappingProjectRoot, { recursive: true });
    cpSync(join(fx, 'external-workspace'), overlappingWorkspaceRoot, { recursive: true });
    const overlappingManifestPath = join(overlappingWorkspaceRoot, '.kai', 'manifest.json');
    const overlappingManifest = JSON.parse(readFileSync(overlappingManifestPath, 'utf8'));
    overlappingManifest.workspace_root = overlappingWorkspaceRoot;
    overlappingManifest.projects[0].path = overlappingProjectRoot;
    writeFileSync(overlappingManifestPath, `${JSON.stringify(overlappingManifest, null, 2)}\n`);
    const overlapping = checkWorkspace(overlappingWorkspaceRoot, { allowUnregisteredExternal: true });
    ok(/overlaps the external workspace root/i.test(overlapping.errors.join('\n')),
      'external workspaces cannot be nested in or contain their bound projects',
      overlapping.errors);

    const projectRoot = join(tmpRoot, 'project');
    const workspaceRoot = join(tmpRoot, 'workspace');
    mkdirSync(projectRoot, { recursive: true });
    cpSync(join(fx, 'external-workspace'), workspaceRoot, { recursive: true });
    const manifestPath = join(workspaceRoot, '.kai', 'manifest.json');
    const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
    manifest.workspace_root = workspaceRoot;
    manifest.projects[0].path = projectRoot;
    writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);

    const env = { KAI_HOME: join(tmpRoot, 'home') };
    const unregistered = checkWorkspace(workspaceRoot, { env });
    ok(/--adopt/i.test(unregistered.errors.join('\n')),
      'an external workspace is not claimable before registry adoption',
      unregistered.errors);

    const adopted = adoptWorkspace({ root: workspaceRoot, projectRoot, env });
    ok(adopted.ok, 'external workspace adoption writes the machine-local registry', [adopted.reason]);
    const registered = checkWorkspace(workspaceRoot, { env });
    ok(registered.errors.length === 0, 'adopted external workspace validates its registry pairing', registered.errors);

    if (adopted.ok) {
      const cliEnv = { ...process.env, ...env };
      const registryCli = spawnSync(
        process.execPath,
        [selfPath, '--registry', '--json', '--kai-home', env.KAI_HOME],
        { encoding: 'utf8', env: cliEnv, windowsHide: true },
      );
      let registryJson = null;
      try {
        registryJson = JSON.parse(registryCli.stdout);
      } catch {
        registryJson = null;
      }
      ok(registryCli.status === 0 && registryJson?.workspaces?.length === 1,
        'the registry CLI reports populated JSON without crashing',
        [registryCli.stderr, registryCli.stdout].filter(Boolean));

      const resolvedCli = spawnSync(
        process.execPath,
        [selfPath],
        { cwd: projectRoot, encoding: 'utf8', env: cliEnv, windowsHide: true },
      );
      ok(resolvedCli.status === 0 && /workspace healthy/i.test(resolvedCli.stdout),
        'the default doctor resolves a registered external workspace from the project',
        [resolvedCli.stderr, resolvedCli.stdout].filter(Boolean));

      const registeredEntries = loadWorkspaceRegistry(env).entries;
      for (const [label, unsafePath] of [
        ['UNC', '\\\\localhost\\definitely-missing-kai'],
        ['Windows absolute', 'C:\\definitely-missing-kai'],
        ['POSIX absolute', '/definitely-missing-kai'],
      ]) {
        writeFileSync(registryPath(env), `${JSON.stringify({
          schema_version: 1,
          workspaces: [{
            project_root: unsafePath,
            workspace_root: workspaceRoot,
            workspace_id: manifest.workspace_id,
          }],
        }, null, 2)}\n`);
        const loadedUnsafe = loadWorkspaceRegistry(env);
        const discoveredUnsafe = resolveWorkspaceRoot({cwd: projectRoot, env});
        ok(!loadedUnsafe.ok && !discoveredUnsafe.ok,
          `registry validation and discovery both reject ${label} path forms`,
          [loadedUnsafe.reason, discoveredUnsafe.reason].filter(Boolean));
      }
      writeRegistry(registeredEntries, env);

      const aliasProject = join(tmpRoot, 'project-alias');
      const aliasWorkspace = join(tmpRoot, 'workspace-alias');
      symlinkSync(projectRoot, aliasProject, 'junction');
      symlinkSync(workspaceRoot, aliasWorkspace, 'junction');
      writeFileSync(registryPath(env), `${JSON.stringify({
        schema_version: 1,
        workspaces: [{
          project_root: aliasProject,
          workspace_root: aliasWorkspace,
          workspace_id: manifest.workspace_id,
        }],
      }, null, 2)}\n`);
      const loadedAlias = loadWorkspaceRegistry(env);
      const discoveredAlias = resolveWorkspaceRoot({cwd: projectRoot, env});
      ok(!loadedAlias.ok && !discoveredAlias.ok
        && /alias|link|junction/i.test(`${loadedAlias.reason} ${discoveredAlias.reason}`),
      'registry validation and discovery apply the same link and canonical-alias refusal',
      [loadedAlias.reason, discoveredAlias.reason].filter(Boolean));
      rmSync(aliasProject, {force: true});
      rmSync(aliasWorkspace, {force: true});
      writeRegistry(registeredEntries, env);

      const aliasedProjectRoot = caseAlias(projectRoot);
      const aliasedWorkspaceRoot = caseAlias(workspaceRoot);
      if (aliasedProjectRoot && aliasedWorkspaceRoot) {
        writeFileSync(registryPath(env), `${JSON.stringify({
          schema_version: 1,
          workspaces: [{
            project_root: aliasedProjectRoot,
            workspace_root: aliasedWorkspaceRoot,
            workspace_id: manifest.workspace_id,
          }],
        }, null, 2)}\n`);
        const loadedCaseAlias = loadWorkspaceRegistry(env);
        const discoveredCaseAlias = resolveWorkspaceRoot({cwd: aliasedProjectRoot, env});
        ok(loadedCaseAlias.ok && discoveredCaseAlias.ok
          && normalized(discoveredCaseAlias.root) === normalized(workspaceRoot),
        'registry validation and discovery accept Windows case aliases consistently',
        [loadedCaseAlias.reason, discoveredCaseAlias.reason].filter(Boolean));
        writeRegistry(registeredEntries, env);
      }

      const duplicateWorkspace = join(tmpRoot, 'duplicate-workspace');
      mkdirSync(duplicateWorkspace);
      writeRegistry([...registeredEntries, {
        project_root: registeredEntries[0].project_root,
        workspace_root: duplicateWorkspace,
        workspace_id: 'duplicate-workspace',
      }], env);
      const duplicateBinding = checkWorkspace(workspaceRoot, { env });
      ok(/exactly one is required/i.test(duplicateBinding.errors.join('\n')),
        'duplicate external project bindings fail closed',
        duplicateBinding.errors);
      writeRegistry(registeredEntries, env);

      const concurrentHome = join(tmpRoot, 'concurrent-home');
      const concurrentEnv = { ...process.env, KAI_HOME: concurrentHome };
      const concurrentProjects = ['alpha', 'beta'].map((name) => {
        const concurrentProject = join(tmpRoot, `concurrent-project-${name}`);
        const concurrentWorkspace = join(tmpRoot, `concurrent-workspace-${name}`);
        mkdirSync(concurrentProject, { recursive: true });
        cpSync(join(fx, 'external-workspace'), concurrentWorkspace, { recursive: true });
        const concurrentManifestPath = join(concurrentWorkspace, '.kai', 'manifest.json');
        const concurrentManifest = JSON.parse(readFileSync(concurrentManifestPath, 'utf8'));
        concurrentManifest.workspace_id = `concurrent-workspace-${name}`;
        concurrentManifest.workspace_root = concurrentWorkspace;
        concurrentManifest.projects[0].id = name;
        concurrentManifest.projects[0].path = concurrentProject;
        writeFileSync(concurrentManifestPath, `${JSON.stringify(concurrentManifest, null, 2)}\n`);
        return { project: concurrentProject, workspace: concurrentWorkspace };
      });
      const concurrentLogs = [];
      for (const candidate of concurrentProjects) {
        const logPath = `${candidate.workspace}.log`;
        const log = openSync(logPath, 'w');
        spawn(
          process.execPath,
          [selfPath, '--adopt', candidate.project, '--root', candidate.workspace],
          { env: concurrentEnv, stdio: ['ignore', log, log], windowsHide: true },
        );
        closeSync(log);
        concurrentLogs.push(logPath);
      }
      const concurrentDeadline = Date.now() + 15000;
      let concurrentRegistry = { ok: true, entries: [] };
      while (Date.now() < concurrentDeadline) {
        concurrentRegistry = loadWorkspaceRegistry({ KAI_HOME: concurrentHome });
        if (concurrentRegistry.ok && concurrentRegistry.entries.length === concurrentProjects.length) break;
        sleepSync(25);
      }
      ok(concurrentRegistry.ok && concurrentRegistry.entries.length === concurrentProjects.length,
        'concurrent registry adoption preserves every project binding',
        [
          ...(concurrentRegistry.ok
            ? concurrentRegistry.entries.map((entry) => JSON.stringify(entry))
            : [concurrentRegistry.reason]),
          ...concurrentLogs.flatMap((path) => {
            const output = existsSync(path) ? readFileSync(path, 'utf8').trim() : '';
            return output ? [`${basename(path)}: ${output}`] : [];
          }),
        ]);

      const staleEnv = { KAI_HOME: join(tmpRoot, 'stale-lock-home') };
      const staleRegistryPath = registryPath(staleEnv);
      mkdirSync(dirname(staleRegistryPath), { recursive: true });
      const deadOwner = spawnSync(process.execPath, ['-e', 'process.exit(0)'], { windowsHide: true });
      writeFileSync(`${staleRegistryPath}.lock`, `${JSON.stringify({
        pid: deadOwner.pid,
        token: 'stale-owner-token',
      })}\n`);
      const recoveredWrite = writeRegistry([], staleEnv);
      ok(recoveredWrite.ok && !existsSync(`${staleRegistryPath}.lock`),
        'a registry mutation safely recovers a lock whose recorded owner exited',
        [recoveredWrite.reason].filter(Boolean));

      const registry = loadWorkspaceRegistry(env);
      registry.entries[0].workspace_id = 'mismatched-workspace';
      writeRegistry(registry.entries, env);
      const mismatched = checkWorkspace(workspaceRoot, { env });
      ok(/not paired|not registered/i.test(mismatched.errors.join('\n')),
        'registry and manifest workspace ids cannot drift silently', mismatched.errors);

      writeRegistry([{
        project_root: projectRoot,
        workspace_root: workspaceRoot,
        workspace_id: manifest.workspace_id,
      }], env);
      const staleProjectRoot = join(tmpRoot, 'stale-project');
      const staleWorkspaceRoot = join(tmpRoot, 'stale-workspace');
      writeRegistry([
        {
          project_root: projectRoot,
          workspace_root: workspaceRoot,
          workspace_id: manifest.workspace_id,
        },
        {
          project_root: staleProjectRoot,
          workspace_root: staleWorkspaceRoot,
          workspace_id: 'stale-workspace',
        },
      ], env);
      const forgottenWithUnrelatedStale = forgetWorkspace({ projectRoot, env });
      const staleRetained = JSON.parse(readFileSync(registryPath(env), 'utf8'));
      ok(forgottenWithUnrelatedStale.ok
        && staleRetained.workspaces.length === 1
        && staleRetained.workspaces[0].project_root === staleProjectRoot,
      'forget removes the requested binding even when unrelated stale rows remain',
      [forgottenWithUnrelatedStale.reason].filter(Boolean));

      writeRegistry([{
        project_root: staleProjectRoot,
        workspace_root: staleWorkspaceRoot,
        workspace_id: 'stale-workspace',
      }], env);
      const forgottenMissingTarget = forgetWorkspace({
        projectRoot: caseAlias(staleProjectRoot) || staleProjectRoot,
        env,
      });
      const emptiedStaleRegistry = JSON.parse(readFileSync(registryPath(env), 'utf8'));
      ok(forgottenMissingTarget.ok && emptiedStaleRegistry.workspaces.length === 0,
        'forget removes a missing-target binding by lexical path validation only',
        [forgottenMissingTarget.reason].filter(Boolean));

      writeRegistry([{
        project_root: projectRoot,
        workspace_root: workspaceRoot,
        workspace_id: manifest.workspace_id,
      }], env);
      const forgotten = forgetWorkspace({ projectRoot, env });
      ok(forgotten.ok && loadWorkspaceRegistry(env).entries.length === 0,
        'forget removes one project binding without deleting workspace state', [forgotten.reason]);

      const emptyRegistryCli = spawnSync(
        process.execPath,
        [selfPath, '--registry', '--kai-home', env.KAI_HOME],
        { encoding: 'utf8', env: cliEnv, windowsHide: true },
      );
      ok(emptyRegistryCli.status === 0 && /\(empty\)/.test(emptyRegistryCli.stdout),
        'the registry CLI reports an empty registry',
        [emptyRegistryCli.stderr, emptyRegistryCli.stdout].filter(Boolean));

      writeFileSync(registryPath(env), '{not-json\n');
      const malformedRegistryCli = spawnSync(
        process.execPath,
        [selfPath, '--registry', '--kai-home', env.KAI_HOME],
        { encoding: 'utf8', env: cliEnv, windowsHide: true },
      );
      ok(malformedRegistryCli.status === 1 && /not valid JSON/i.test(malformedRegistryCli.stderr),
        'the registry CLI fails clearly on malformed registry data',
        [malformedRegistryCli.stderr, malformedRegistryCli.stdout].filter(Boolean));

      writeFileSync(registryPath(env), `${JSON.stringify({
        schema_version: 1,
        workspaces: [{ project_root: null, workspace_root: workspaceRoot, workspace_id: manifest.workspace_id }],
      }, null, 2)}\n`);
      const malformedEntryCli = spawnSync(
        process.execPath,
        [selfPath, '--registry', '--kai-home', env.KAI_HOME],
        { encoding: 'utf8', env: cliEnv, windowsHide: true },
      );
      ok(malformedEntryCli.status === 1 && /missing string "project_root"/i.test(malformedEntryCli.stderr),
        'the registry CLI fails clearly on malformed registry entries',
        [malformedEntryCli.stderr, malformedEntryCli.stdout].filter(Boolean));
    }
  } finally {
    rmSync(tmpRoot, { recursive: true, force: true });
  }

  if (!migrationSelfTest()) failed++;
  return failed === 0 ? 0 : 1;
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
    label: 'settings.json is unreadable, so a config-enabled pack is not assumed enabled',
    home: 'malformed-settings', status: 'unknown',
    expect: ['enabled-state-unverified'],
    forbid: ['nothing-installed', 'disabled-install'], noRefusal: true, noSteps: true,
  },
  {
    label: 'settings.json carries a non-boolean enabled state',
    home: 'nonboolean-enabled-state', status: 'unknown',
    expect: ['enabled-state-unverified'],
    forbid: ['nothing-installed', 'disabled-install'], noRefusal: true, noSteps: true,
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
    steps: [/^copilot plugin uninstall kai$/],
    forbidSteps: [/set "plugin": "kai"/],
  },
  {
    label: 'explicit rollback reverses a migrated workspace without uninstalling the restored monolith',
    home: 'legacy-direct', workspace: 'pack', rollback: true, status: 'blocked',
    expect: ['legacy-rollback-restored', 'workspace-provenance-ahead'],
    forbid: ['legacy-installed', 'legacy-rollback-unverified', 'coexistence'],
    steps: [/^edit .*set "plugin": "kai"/, /workspace-doctor\.mjs --root/],
    forbidSteps: [/^copilot plugin uninstall kai$/, /confirm no "kai" row/, /confirm every legacy install tree/],
  },
  {
    label: 'completed rollback has matching monolith workspace provenance',
    home: 'legacy-direct', workspace: 'monolith', rollback: true, status: 'clear',
    expect: ['legacy-rollback-restored', 'workspace-provenance-current'],
    forbid: ['legacy-installed', 'legacy-rollback-unverified', 'workspace-provenance-ahead'],
    noSteps: true, noRefusal: true,
  },
  {
    label: 'rollback refuses a monolith whose install tree declares the pack identity',
    home: 'identity-mismatch', workspace: 'pack', rollback: true, status: 'blocked',
    expect: ['identity-mismatch', 'legacy-rollback-unverified', 'workspace-provenance-ahead'],
    forbid: ['legacy-rollback-restored'],
    forbidSteps: [/set "plugin": "kai"/, /^copilot plugin uninstall kai$/],
  },
  {
    label: 'rollback refuses duplicate monolith trees without uninstalling or reversing provenance',
    home: 'duplicate-legacy', workspace: 'pack', rollback: true, status: 'blocked',
    expect: ['provenance-collision', 'legacy-rollback-unverified', 'workspace-provenance-ahead'],
    forbid: ['legacy-rollback-restored'],
    forbidSteps: [/set "plugin": "kai"/, /^copilot plugin uninstall kai/],
  },
  {
    label: 'rollback refuses monolith provenance inferred from cache path',
    home: 'inferred-legacy-provenance', workspace: 'pack', rollback: true, status: 'blocked',
    expect: ['unknown-provenance', 'legacy-rollback-unverified', 'workspace-provenance-ahead'],
    forbid: ['legacy-rollback-restored'],
    forbidSteps: [/set "plugin": "kai"/, /^copilot plugin uninstall kai/],
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
  const fx = JSON.parse(readFileSync(join(REPO_ROOT, 'test', 'fixtures', 'host-installs.json'), 'utf8'));
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
      const res = migrationReport({ home, root, rollback: c.rollback ?? false });
      const problems = [];
      if (res.status !== c.status) problems.push(`status "${res.status}", expected "${c.status}"`);
      for (const code of c.expect ?? []) if (!res.codes.includes(code)) problems.push(`missing finding "${code}"`);
      for (const code of c.forbid ?? []) if (res.codes.includes(code)) problems.push(`unexpected finding "${code}"`);
      for (const re of c.steps ?? []) {
        if (!res.steps.some((s) => re.test(s))) problems.push(`no remediation step matching ${re}`);
      }
      for (const re of c.forbidSteps ?? []) {
        if (res.steps.some((s) => re.test(s))) problems.push(`unexpected remediation step matching ${re}`);
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

    const inventoryReport = migrationReport({
      home: join(tmpRoot, 'homes', 'packs-marketplace'),
      root: join(tmpRoot, 'workspaces', 'pack'),
    });
    const inventory = migrationInventory(inventoryReport);
    const core = inventory.find((plugin) => plugin.name === 'kai-core');
    if (core?.presence !== 'installed' || core.enabled !== true || !core.versions.length
      || !core.provenances.includes('marketplace:kai-plugins')) {
      fail('self-test: migration JSON inventory does not expose safe core version, enabled-state, and provenance evidence');
    } else {
      console.log('✓ self-test: migration JSON inventory exposes version, enabled state, and provenance without cache paths');
    }

    const disabledInventory = migrationInventory(migrationReport({
      home: join(tmpRoot, 'homes', 'packs-disabled'),
    }));
    if (disabledInventory.find((plugin) => plugin.name === 'kai-core')?.enabled !== false) {
      fail('self-test: an explicitly disabled core install is not exposed as disabled');
    } else {
      console.log('✓ self-test: migration JSON inventory exposes an explicitly disabled core install');
    }

    const disagreementReport = migrationReport({
      home: join(tmpRoot, 'homes', 'packs-enabled-disagreement'),
    });
    const disagreementCore = migrationInventory(disagreementReport)
      .find((plugin) => plugin.name === 'kai-core');
    if (disagreementReport.status !== 'unknown'
      || !disagreementReport.codes.includes('enabled-state-unverified')
      || disagreementCore?.enabled !== null) {
      fail('self-test: disagreeing config/settings enabled state did not fail closed as unknown');
    } else {
      console.log('✓ self-test: disagreeing enabled-state surfaces fail closed as unknown');
    }

    const directNoOverride = migrationReport({
      home: join(tmpRoot, 'homes', 'legacy-direct'),
    });
    const directCoreState = directNoOverride.host.records.get('kai')?.entries[0]?.enabled;
    if (directCoreState !== true || directNoOverride.codes.includes('enabled-state-unverified')) {
      fail('self-test: a direct install with no settings override did not retain its managed config state');
    } else {
      console.log('✓ self-test: an empty settings override map preserves direct-install enabled state');
    }

    const absentSettings = migrationReport({
      home: join(tmpRoot, 'homes', 'path-normalization'),
    });
    if (absentSettings.codes.includes('enabled-state-unverified')) {
      fail('self-test: an absent settings file incorrectly invalidated managed config enabled state');
    } else {
      console.log('✓ self-test: an absent settings file falls back to managed config enabled state');
    }

    // The other half of the same rule: settings that cannot be trusted must blank
    // the state config declared, not let `enabled: true` stand unverified.
    for (const home of ['malformed-settings', 'nonboolean-enabled-state']) {
      const report = migrationReport({ home: join(tmpRoot, 'homes', home) });
      const record = migrationInventory(report).find((plugin) => plugin.name === 'kai-core');
      if (record?.enabled !== null || !report.codes.includes('enabled-state-unverified')) {
        fail(`self-test: "${home}" did not blank the config-declared enabled state it could not verify`,
          [`enabled: ${JSON.stringify(record?.enabled)}`, `codes: ${report.codes.join(', ') || '(none)'}`]);
      } else {
        console.log(`✓ self-test: unverifiable settings (${home}) blank the config enabled state instead of trusting it`);
      }
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

process.exit(selfTest());
