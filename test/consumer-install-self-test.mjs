// Prove committed generated packs work after being copied into a clean
// consumer repository. Source modules and repository node_modules are
// deliberately unavailable from every executed entrypoint.
import assert from 'node:assert/strict';
import {execFileSync, spawnSync} from 'node:child_process';
import {
  appendFileSync,
  cpSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import {tmpdir} from 'node:os';
import {dirname, isAbsolute, join, relative, resolve} from 'node:path';
import {pathToFileURL, fileURLToPath} from 'node:url';
import {moduleSpecifiers, PACK_ORDER, packPluginName} from '../tools/lib/pack-plan.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const fixtureRoot = join(root, 'test', 'fixtures', 'schema5-consumer');
const scratchRoot = mkdtempSync(join(tmpdir(), 'kai-consumer-install-'));
const fixtureNames = ['core-only', 'core-engineering', 'core-creative', 'all-packs'];
const publicationSkills = {
  core: 'kai-core-workspace-publication',
  engineering: 'engineering-workspace-publication',
  creative: 'creative-workspace-publication',
};
const direction = [
  '# Vision',
  'A composable consumer workspace.',
  '',
  '# Mission',
  'Prove generated packs operate without the Kai checkout.',
  '',
  '# Current Goal',
  'Exercise lazy schema-5 composition.',
  '',
  '# Out of Scope',
  '- Eager department directories.',
  '',
].join('\n');
const LOAD_FAILURE = /^\s+at\s+\S/m;
let failures = 0;
const ok = (condition, message, detail = '') => {
  if (condition) {
    console.log(`  ok ${message}`);
    return true;
  }
  failures += 1;
  console.log(`  FAIL ${message}${detail ? `\n      ${detail}` : ''}`);
  return false;
};

function nativePath(base, relativePath) {
  return join(base, ...relativePath.split('/'));
}

function parsePublicationContract(installedRoot, pack) {
  const path = join(installedRoot, packPluginName(pack), 'publication.json');
  const declaration = JSON.parse(readFileSync(path, 'utf8'));
  assert.equal(declaration.pack, pack, `${pack}: publication declaration pack mismatch`);
  assert.equal(declaration.skill, publicationSkills[pack],
    `${pack}: publication declaration entrypoint mismatch`);
  assert.ok(declaration.entries.length > 0,
    `${pack}: publication declaration must contain live entries`);
  return {
    declaration,
    rows: declaration.entries.map(entry => ({
      namespace: pack,
      type: entry.type,
      subtype: entry.subtype ?? '-',
      'private form': entry.privateForm,
      'public form': entry.publicForm,
      formats: entry.formats,
      privacy: entry.privacy,
    })),
  };
}

function selectRoute(contract, {pack, type, subtype}) {
  return contract.rows.find(row =>
    row.namespace === pack
    && row.type === type
    && (row.subtype === '-' ? subtype == null : row.subtype === subtype)) ?? null;
}

function privateDirectory(row, id, lifecycle) {
  return row['private form']
    .replace('<id>', id)
    .replace('{drafts,evidence,scratch}', lifecycle);
}

function publicationDirectory(row, id) {
  return row['public form'].replace('<id>', id).replace(/\/$/, '');
}

function createPrivateArtifact({projectRoot, contract, artifact, lifecycle, file, content}) {
  const row = selectRoute(contract, artifact);
  if (!row || !new Set(['drafts', 'evidence', 'scratch']).has(lifecycle)) {
    return {ok: false, row};
  }
  const directory = privateDirectory(row, artifact.id, lifecycle);
  const path = nativePath(projectRoot, `${directory}/${file}`);
  mkdirSync(dirname(path), {recursive: true});
  writeFileSync(path, content);
  return {ok: true, row, directory, path};
}

function publishArtifact({projectRoot, contract, artifact, source, lifecycle, accepted, file}) {
  const row = selectRoute(contract, artifact);
  if (!row) return {ok: false, reason: 'unknown route'};
  if (lifecycle === 'scratch') {
    return {ok: false, reason: 'scratch'};
  }
  if (lifecycle === 'evidence' && row.privacy === 'evidence-private') {
    return {ok: false, reason: 'private evidence'};
  }
  if (!accepted) {
    return {ok: false, reason: 'unaccepted'};
  }
  const directory = publicationDirectory(row, artifact.id);
  const target = nativePath(projectRoot, `${directory}/${file}`);
  mkdirSync(dirname(target), {recursive: true});
  cpSync(source, target);
  return {ok: true, directory, target};
}

function copyGeneratedPacks(installedRoot, packs) {
  for (const pack of packs) {
    cpSync(
      join(root, 'plugins', packPluginName(pack)),
      join(installedRoot, packPluginName(pack)),
      {recursive: true},
    );
  }
}

function importPolicyProblems(text) {
  return moduleSpecifiers(text)
    .filter(specifier => !specifier.startsWith('node:') && !specifier.startsWith('./'));
}

function probeGeneratedImports(installedRoot, packs) {
  for (const pack of packs) {
    const scriptsDir = join(installedRoot, packPluginName(pack), 'scripts');
    if (!existsSync(scriptsDir)) continue;
    const present = new Set(readdirSync(scriptsDir).filter(name => name.endsWith('.mjs')));
    const referenced = new Set();
    let dangling = 0;
    let disallowedImports = 0;
    for (const name of present) {
      const text = readFileSync(join(scriptsDir, name), 'utf8');
      disallowedImports += importPolicyProblems(text).length;
      for (const specifier of moduleSpecifiers(text)) {
        if (!specifier.startsWith('./')) continue;
        const target = specifier.slice(2);
        referenced.add(target);
        if (!present.has(target)) dangling += 1;
      }
    }
    ok(disallowedImports === 0,
      `${packPluginName(pack)}: generated bundles import only node: modules or pack-local ./ files`);
    ok(dangling === 0,
      `${packPluginName(pack)}: every generated local import resolves inside the copied pack`);
    const orphans = [...present].filter(name => name.startsWith('chunk-') && !referenced.has(name));
    ok(orphans.length === 0,
      `${packPluginName(pack)}: no unreferenced generated chunk ships`,
      orphans.join(', '));
  }
}

function pathContains(parent, candidate) {
  const rel = relative(parent, candidate);
  return rel === '' || (!rel.startsWith('..') && !isAbsolute(rel));
}

function checkoutAncestorsWithNodeModules() {
  const ancestors = [];
  let current = resolve(root);
  while (true) {
    if (existsSync(join(current, 'node_modules'))) ancestors.push(current);
    const parent = dirname(current);
    if (parent === current) break;
    current = parent;
  }
  return ancestors;
}

function assertBareImportMutationRejected() {
  const mutationRoot = mkdtempSync(join(scratchRoot, 'bare-import-'));
  const installedRoot = join(mutationRoot, 'installed-plugins');
  try {
    copyGeneratedPacks(installedRoot, ['core']);
    const coordinate = join(installedRoot, 'kai-core', 'scripts', 'coordinate.mjs');
    appendFileSync(coordinate, '\nimport "review-only-bare-dependency";\n');
    ok(importPolicyProblems(readFileSync(coordinate, 'utf8'))
      .includes('review-only-bare-dependency'),
    'generated import policy rejects a deliberate non-node bare import');
  } finally {
    rmSync(mutationRoot, {recursive: true, force: true});
  }
}

function probeEntrypoints(installedRoot, packs, consumerRoot) {
  let executed = 0;
  for (const pack of packs) {
    const scriptsDir = join(installedRoot, packPluginName(pack), 'scripts');
    if (!existsSync(scriptsDir)) continue;
    for (const name of readdirSync(scriptsDir)
      .filter(value => value.endsWith('.mjs') && !value.startsWith('chunk-'))
      .sort()) {
      const path = join(scriptsDir, name);
      let output = '';
      let loadFailed = false;
      try {
        execFileSync(process.execPath, [path, '--kai-consumer-install-probe'], {
          encoding: 'utf8',
          stdio: 'pipe',
          timeout: 120_000,
          cwd: consumerRoot,
        });
      } catch (error) {
        output = `${error.stdout ?? ''}${error.stderr ?? ''}`;
        loadFailed = LOAD_FAILURE.test(output);
      }
      ok(!loadFailed,
        `${packPluginName(pack)}/scripts/${name} loads from copied generated files`,
        output.split('\n').find(line => /Error/.test(line)) ?? '');
      executed += 1;
    }
  }
  ok(executed > 0, `executed ${executed} generated entry point(s) from copied packs`);
}

function generatedDirect(coordinate, projectRoot) {
  const result = spawnSync(process.execPath, [coordinate, 'direct'], {
    cwd: projectRoot,
    encoding: 'utf8',
    env: {...process.env, KAI_TEST_REPORT_COORDINATION_ENTRYPOINT: '1'},
  });
  let json = null;
  try {
    json = JSON.parse(result.stdout);
  } catch {
    // Report the malformed output through the ordinary matrix assertion.
  }
  return {result, json};
}

function git(projectRoot, args) {
  return spawnSync('git', args, {cwd: projectRoot, encoding: 'utf8'});
}

function assertPathMutationParity({doctor, projectRoot}) {
  const manifestPath = join(projectRoot, '.kai', 'manifest.json');
  const original = JSON.parse(readFileSync(manifestPath, 'utf8'));
  const decisions = [];
  for (const candidate of ['C:\\definitely-missing-kai', '/definitely-missing-kai']) {
    writeFileSync(manifestPath, `${JSON.stringify({
      ...original,
      projects: [{...original.projects[0], path: candidate}],
    }, null, 2)}\n`);
    const report = doctor.checkWorkspace(projectRoot);
    decisions.push({
      accepted: report.errors.length === 0,
      pathRefusal: /must be "\."|absolute|UNC|device|network/i.test(report.errors.join('\n')),
    });
  }
  writeFileSync(manifestPath, `${JSON.stringify(original, null, 2)}\n`);
  ok(decisions.every(decision => !decision.accepted && decision.pathRefusal)
    && decisions[0].accepted === decisions[1].accepted,
  'Windows and POSIX absolute project-path mutations return equivalent refusal decisions',
  JSON.stringify(decisions));
}

async function runFixture(fixtureName) {
  const fixture = JSON.parse(readFileSync(join(fixtureRoot, fixtureName, 'fixture.json'), 'utf8'));
  const caseRoot = mkdtempSync(join(scratchRoot, `${fixtureName}-`));
  const projectRoot = join(caseRoot, 'project');
  const installedRoot = join(caseRoot, 'installed-plugins');
  mkdirSync(projectRoot, {recursive: true});
  mkdirSync(installedRoot, {recursive: true});
  console.log(`\n${fixture.name}:`);
  try {
    const exposedAncestors = checkoutAncestorsWithNodeModules()
      .filter(ancestor => pathContains(ancestor, caseRoot));
    ok(exposedAncestors.length === 0,
      'clean consumer is outside every checkout ancestor containing node_modules',
      exposedAncestors.join(', '));
    copyGeneratedPacks(installedRoot, fixture.packs);
    ok(!existsSync(join(projectRoot, 'node_modules')),
      'clean consumer repository has no node_modules');
    for (const pack of fixture.packs) {
      ok(!existsSync(join(installedRoot, packPluginName(pack), 'node_modules')),
        `${packPluginName(pack)} has no installed dependencies`);
    }
    probeGeneratedImports(installedRoot, fixture.packs);
    probeEntrypoints(installedRoot, fixture.packs, projectRoot);

    const coordinate = join(installedRoot, 'kai-core', 'scripts', 'coordinate.mjs');
    const direct = generatedDirect(coordinate, projectRoot);
    ok(direct.result.status === 0
      && direct.json?.coordinationRequired === false
      && resolve(direct.json?.entrypoint ?? '') === resolve(coordinate),
    'direct generated Core work needs no workspace and reports its executing entrypoint',
    `${direct.result.stderr}${direct.result.stdout}`);
    ok(!existsSync(join(projectRoot, '.kai'))
      && !existsSync(join(projectRoot, 'docs', 'kai')),
    'direct code work creates no pack directory');

    git(projectRoot, ['init', '--quiet']);
    writeFileSync(join(projectRoot, '.gitignore'), '/.kai/\n');
    mkdirSync(join(projectRoot, 'docs', 'kai'), {recursive: true});
    writeFileSync(join(projectRoot, 'docs', 'kai', 'DIRECTION.md'), direction);

    const doctorPath = join(installedRoot, 'kai-core', 'scripts', 'workspace-doctor.mjs');
    const doctor = await import(`${pathToFileURL(doctorPath).href}?fixture=${fixtureName}`);
    if (!ok(typeof doctor.initializeWorkspace === 'function',
      'generated Core exports the schema-5 standalone initializer',
      `exports: ${Object.keys(doctor).sort().join(', ')}`)) {
      return;
    }
    const plugin = JSON.parse(readFileSync(join(installedRoot, 'kai-core', 'plugin.json'), 'utf8'));
    const initialized = doctor.initializeWorkspace({
      root: projectRoot,
      confirm: true,
      manifest: {
        plugin: 'kai-core',
        version: plugin.version,
        schema_version: 5,
        scaffolded: '2026-10-02',
        workspace_id: `consumer-${fixtureName}`,
        placement: 'repo-local',
        workspace_root: '.',
        private_root: '.kai',
        direction: 'docs/kai/DIRECTION.md',
        projects: [{id: 'default', path: '.', publication_root: 'docs/kai'}],
      },
    });
    if (!ok(initialized.ok === true,
      'generated Core initializes a schema-5 consumer workspace',
      JSON.stringify(initialized))) {
      return;
    }
    ok(existsSync(join(projectRoot, '.kai', 'core', 'runtime', 'coordination.sqlite')),
      'initialization creates only the fixed Core runtime store');
    ok(!existsSync(join(projectRoot, '.kai', 'engineering'))
      && !existsSync(join(projectRoot, '.kai', 'creative')),
    'initialization creates no department directories');
    assertPathMutationParity({doctor, projectRoot});

    const contract = parsePublicationContract(installedRoot, fixture.artifact.pack);
    const row = selectRoute(contract, fixture.artifact);
    if (!ok(Boolean(row), 'installed pack exposes the fixture publication route')) return;
    ok(privateDirectory(row, fixture.artifact.id, 'drafts') === fixture.artifact.privateDirectory,
      'canonical private route matches the hand-checked fixture path');
    ok(publicationDirectory(row, fixture.artifact.id) === fixture.artifact.publicationDirectory,
      'canonical publication route mirrors the hand-checked fixture path');
    if (fixture.artifact.pack === 'creative' && fixture.artifact.type === 'media') {
      ok(row.formats.includes('markdown-destination-record'),
        'creative media accepts an approved external-destination record');
    }

    const created = createPrivateArtifact({
      projectRoot,
      contract,
      artifact: fixture.artifact,
      lifecycle: 'drafts',
      file: fixture.artifact.file,
      content: fixture.artifact.pack === 'creative'
        ? '# Approved durable destination\n\nhttps://example.invalid/media/consumer-media\n'
        : `# ${fixture.name} accepted artifact\n`,
    });
    ok(created.ok && created.directory === fixture.artifact.privateDirectory,
      'first private write creates only the selected pack/type/id/drafts path');
    for (const pack of PACK_ORDER.filter(pack => pack !== fixture.artifact.pack && pack !== 'core')) {
      ok(!existsSync(join(projectRoot, '.kai', pack)),
        `${pack}: installed but unused pack stays absent after first write`);
    }

    const beforeInvalid = existsSync(join(projectRoot, '.kai', fixture.artifact.pack, 'misc'));
    const invalidType = createPrivateArtifact({
      projectRoot,
      contract,
      artifact: {...fixture.artifact, type: 'misc', subtype: null},
      lifecycle: 'drafts',
      file: 'invalid.md',
      content: 'must not exist',
    });
    const invalidSubtype = createPrivateArtifact({
      projectRoot,
      contract,
      artifact: {...fixture.artifact, subtype: 'invalid-subtype'},
      lifecycle: 'drafts',
      file: 'invalid.md',
      content: 'must not exist',
    });
    ok(!beforeInvalid && !invalidType.ok && !invalidSubtype.ok
      && !existsSync(join(projectRoot, '.kai', fixture.artifact.pack, 'misc')),
    'invalid type and subtype create nothing and have no fallback');

    const scratch = createPrivateArtifact({
      projectRoot,
      contract,
      artifact: fixture.artifact,
      lifecycle: 'scratch',
      file: 'scratch.md',
      content: 'disposable',
    });
    const rejectedScratch = publishArtifact({
      projectRoot,
      contract,
      artifact: fixture.artifact,
      source: scratch.path,
      lifecycle: 'scratch',
      accepted: true,
      file: 'scratch.md',
    });
    const rejectedDraft = publishArtifact({
      projectRoot,
      contract,
      artifact: fixture.artifact,
      source: created.path,
      lifecycle: 'drafts',
      accepted: false,
      file: 'unaccepted.md',
    });
    ok(!rejectedScratch.ok && !rejectedDraft.ok
      && !existsSync(nativePath(projectRoot, `${fixture.artifact.publicationDirectory}/scratch.md`))
      && !existsSync(nativePath(projectRoot, `${fixture.artifact.publicationDirectory}/unaccepted.md`)),
    'scratch and unaccepted drafts cannot publish');

    const evidence = createPrivateArtifact({
      projectRoot,
      contract,
      artifact: fixture.artifact,
      lifecycle: 'evidence',
      file: 'private-evidence.txt',
      content: 'consumer-private-evidence',
    });
    const ignored = git(projectRoot, ['check-ignore', '--quiet', '--',
      `${privateDirectory(row, fixture.artifact.id, 'evidence')}/private-evidence.txt`]);
    const status = git(projectRoot, ['status', '--porcelain', '--untracked-files=all']);
    ok(evidence.ok && ignored.status === 0 && !status.stdout.includes('.kai/'),
      'private evidence stays ignored and untracked',
      status.stdout);

    const published = publishArtifact({
      projectRoot,
      contract,
      artifact: fixture.artifact,
      source: created.path,
      lifecycle: 'drafts',
      accepted: true,
      file: fixture.artifact.file,
    });
    ok(published.ok
      && published.directory === fixture.artifact.publicationDirectory
      && readFileSync(published.target, 'utf8') === readFileSync(created.path, 'utf8'),
    'first accepted publication mirrors only the selected artifact');

    const privateManifest = join(projectRoot, '.kai', 'manifest.json');
    const publicArtifact = published.target;
    rmSync(installedRoot, {recursive: true, force: true});
    ok(existsSync(privateManifest) && existsSync(publicArtifact),
      'uninstall simulation leaves both .kai and docs/kai content intact');
  } finally {
    rmSync(caseRoot, {recursive: true, force: true});
  }
}

try {
  assertBareImportMutationRejected();
  for (const fixtureName of fixtureNames) await runFixture(fixtureName);
} finally {
  rmSync(scratchRoot, {recursive: true, force: true});
}

console.log(`\nconsumer-install self-test: ${failures ? `${failures} FAILED` : 'all checks passed'}`);
process.exit(failures ? 1 : 0);
