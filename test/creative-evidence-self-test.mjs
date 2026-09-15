import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join, posix } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const baseline = 'docs/reference/skill-evaluation/creative-baseline-2026-09-13';
const authoringRoot = 'docs/reference/skill-evaluation/creative-foundation';
const finalMethods = [
  'grounding',
  'scope',
  'mockups-ascii',
  'mockups-html',
  'video-create-narration',
  'video-align-narration',
  'video-render-zoom',
  'html-block-diagrams',
];
const selector = process.argv[2] ?? 'all';
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
const readJson = relative => JSON.parse(readFileSync(join(root, ...relative.split('/')), 'utf8')
  .replace(/^\uFEFF/, ''));

function indexedBytes(relative, label = relative) {
  try {
    return execFileSync('git', ['show', `:${relative}`], {
      cwd: root,
      stdio: ['ignore', 'pipe', 'pipe'],
    });
  } catch {
    assert.fail(`${label}: must be present in the Git index`);
  }
}

function runBaselineChecks() {
  const manifest = readJson(`${baseline}/manifest.json`);
  assert.equal(manifest.files.length, 20, 'the baseline keeps every captured log and stage mapping');
  const names = new Set();
  for (const entry of manifest.files) {
    assert.match(entry.path, /^[a-z0-9.-]+$/, 'baseline entries are local filenames');
    assert.ok(!names.has(entry.path), `duplicate baseline entry: ${entry.path}`);
    names.add(entry.path);
    const relative = `${baseline}/${entry.path}`;
    assert.equal(hash(readFileSync(join(root, relative))), entry.sha256,
      `${relative}: working bytes must match the captured evidence`);
    assert.equal(hash(indexedBytes(relative)), entry.sha256,
      `${relative}: indexed bytes must match too; Git normalization is not evidence preservation`);
  }

  const attributes = execFileSync('git', [
    'check-attr', 'text', '--',
    `${baseline}/creative-baseline-stage-01.log`,
    `${authoringRoot}/grounding/current/SKILL.md`,
  ], { cwd: root, encoding: 'utf8' }).trim().split(/\r?\n/);
  assert.ok(attributes.every(line => line.endsWith(': text: unset')),
    'raw baseline and authoring evidence must bypass Git line-ending normalization');
}

function evidencePath(value, label) {
  assert.equal(typeof value, 'string', `${label}: path must be a string`);
  assert.ok(value.length > 0, `${label}: path must not be empty`);
  assert.ok(!/^[a-zA-Z]:/.test(value), `${label}: path must be repository-relative`);
  const relative = value.replaceAll('\\', '/');
  assert.equal(posix.normalize(relative), relative, `${label}: path must be normalized`);
  assert.ok(relative.startsWith(`${authoringRoot}/`),
    `${label}: path must stay inside ${authoringRoot}`);
  return relative;
}

function normalizedHash(bytes) {
  return hash(Buffer.from(bytes.toString('utf8').replace(/\r\n/g, '\n'), 'utf8'));
}

function validateHashedRecord(record, label) {
  assert.ok(record && typeof record === 'object', `${label}: hashed record is required`);
  const relative = evidencePath(record.path, `${label}.path`);
  assert.match(record.originalBytesSha256, /^[a-f0-9]{64}$/,
    `${label}: originalBytesSha256 must be a SHA-256`);
  assert.match(record.sha256, /^[a-f0-9]{64}$/, `${label}: sha256 must be a SHA-256`);
  assert.ok(Number.isInteger(record.bytes) && record.bytes >= 0,
    `${label}: bytes must be a non-negative integer`);

  const workingPath = join(root, ...relative.split('/'));
  assert.ok(existsSync(workingPath), `${label}: working file must exist at ${relative}`);
  const working = readFileSync(workingPath);
  assert.equal(working.length, record.bytes, `${label}: working byte count must match`);
  assert.equal(hash(working), record.originalBytesSha256,
    `${label}: working raw SHA-256 must match`);
  assert.equal(normalizedHash(working), record.sha256,
    `${label}: working CRLF-to-LF SHA-256 must match`);

  const indexed = indexedBytes(relative, label);
  assert.equal(indexed.length, record.bytes, `${label}: indexed byte count must match`);
  assert.equal(hash(indexed), record.originalBytesSha256,
    `${label}: indexed raw SHA-256 must match`);
  assert.equal(normalizedHash(indexed), record.sha256,
    `${label}: indexed CRLF-to-LF SHA-256 must match`);
  return relative;
}

function sampleKind(sample, label) {
  assert.equal(typeof sample.id, 'string', `${label}: sample id is required`);
  assert.ok(sample.id.length > 0, `${label}: sample id must not be empty`);
  assert.equal(typeof sample.arm, 'string', `${label}: recorded arm is required`);
  const arm = /^(control|current|candidate)(?:-(protocol-deviation|boundary))?$/
    .exec(sample.arm);
  assert.ok(arm, `${label}: unrecognized arm ${sample.arm}`);
  return {
    boundary: arm[2] === 'boundary',
    family: arm[1],
    primary: arm[2] === undefined,
    protocolDeviation: arm[2] === 'protocol-deviation',
  };
}

function sampleBindings(method, primaryCasePath, currentGuidePath) {
  const methodRoot = `${authoringRoot}/${method}`;
  return {
    methodRoot,
    primaryCasePath: primaryCasePath ?? `${methodRoot}/case.md`,
    guides: {
      control: null,
      current: currentGuidePath ?? `${methodRoot}/current/SKILL.md`,
      candidate: `${methodRoot}/candidate/SKILL.md`,
    },
  };
}

function validateSampleIdentity(sample, label, inputs, bindings) {
  const kind = sampleKind(sample, label);
  assert.match(sample.id, new RegExp(`^${kind.family}-`),
    `${label}: sample id must agree with base arm ${kind.family}`);

  const casePath = evidencePath(sample.casePath, `${label}.casePath`);
  assert.ok(inputs.has(casePath), `${label}: casePath must reference a hashed input`);
  const expectedGuide = bindings.guides[kind.family];
  const guidePath = sample.guidePath === null
    ? null
    : evidencePath(sample.guidePath, `${label}.guidePath`);

  if (kind.boundary) {
    assert.equal(kind.family, 'candidate',
      `${label}: boundary samples must use the candidate arm`);
    assert.ok(casePath.startsWith(`${bindings.methodRoot}/`),
      `${label}: boundary casePath must stay inside its method directory`);
    assert.ok(![
      bindings.primaryCasePath,
      bindings.guides.current,
      bindings.guides.candidate,
    ].includes(casePath), `${label}: boundary casePath must be a dedicated boundary case`);
    assert.match(casePath.slice(casePath.lastIndexOf('/') + 1), /^boundary.*case\.md$/,
      `${label}: boundary casePath must name a boundary case file`);
    assert.equal(guidePath, bindings.guides.candidate,
      `${label}: boundary guidePath must be the candidate guide`);
  } else {
    assert.equal(casePath, bindings.primaryCasePath,
      `${label}: primary and protocol-deviation casePath must be the fixed case`);
    assert.equal(guidePath, expectedGuide,
      `${label}: ${kind.family} guidePath must match its arm`);
  }
  if (guidePath !== null) {
    assert.ok(inputs.has(guidePath), `${label}: guidePath must reference a hashed input`);
  }

  const outputPath = evidencePath(sample.output?.path, `${label}.output.path`);
  assert.ok(outputPath.startsWith(`${bindings.methodRoot}/`),
    `${label}: output must stay inside its method directory`);
  return { kind, outputPath };
}

function validateSample(sample, label, inputs, bindings, ids, outputPaths) {
  const { kind, outputPath: identityOutputPath } =
    validateSampleIdentity(sample, label, inputs, bindings);
  assert.ok(!ids.has(sample.id), `${label}: duplicate sample id ${sample.id}`);
  ids.add(sample.id);

  const outputPath = validateHashedRecord(sample.output, `${label}.output`);
  assert.equal(outputPath, identityOutputPath,
    `${label}: validated output path must remain stable`);
  assert.ok(!outputPaths.has(outputPath), `${label}: duplicate output path ${outputPath}`);
  outputPaths.add(outputPath);
  return kind;
}

function validateSharedBaselineInputRoles(inputRecords, label) {
  const roles = {};
  for (const role of ['shared-baseline-case', 'shared-baseline-current-guide']) {
    const matches = inputRecords.filter(input => input.role === role);
    assert.equal(matches.length, 1, `${label}: exactly one ${role} input is required`);
    roles[role] = {
      input: matches[0],
      path: evidencePath(matches[0].path, `${label}.${role}`),
    };
  }
  return roles;
}

function runIdentityMutationChecks() {
  const rootPath = `${authoringRoot}/grounding`;
  const paths = {
    case: `${rootPath}/case.md`,
    current: `${rootPath}/current/SKILL.md`,
    candidate: `${rootPath}/candidate/SKILL.md`,
    boundary: `${rootPath}/candidate/boundary-case.md`,
  };
  const inputs = new Map(Object.values(paths).map(path => [path, {}]));
  const bindings = sampleBindings('grounding');
  const candidate = {
    id: 'candidate-01',
    arm: 'candidate',
    casePath: paths.case,
    guidePath: paths.candidate,
    output: { path: `${rootPath}/candidate-01.md` },
  };
  const mutations = [
    ['candidateCurrentGuide', { guidePath: paths.current }, /candidate guidePath must match/],
    ['primaryBoundaryCase', { casePath: paths.boundary }, /casePath must be the fixed case/],
    ['mismatchedIdArm', { id: 'current-01' }, /sample id must agree with base arm candidate/],
    ['crossMethodOutput', {
      output: { path: `${authoringRoot}/scope/candidate-01.md` },
    }, /output must stay inside its method directory/],
  ];
  for (const [name, changes, expected] of mutations) {
    assert.throws(
      () => validateSampleIdentity(
        { ...structuredClone(candidate), ...changes },
        `mutation.${name}`,
        inputs,
        bindings,
      ),
      expected,
      `identity guard must reject ${name}`,
    );
  }

  const htmlRoot = `${authoringRoot}/mockups-html`;
  const sharedInputs = [
    { role: 'shared-baseline-case', path: `${authoringRoot}/mockups-ascii/case.md` },
    {
      role: 'shared-baseline-current-guide',
      path: `${authoringRoot}/mockups-ascii/current/SKILL.md`,
    },
    { role: 'candidate-guide', path: `${htmlRoot}/candidate/SKILL.md` },
  ];
  const htmlInputs = new Map(sharedInputs.map(input => [input.path, input]));
  assert.throws(
    () => validateSharedBaselineInputRoles(
      [...sharedInputs, structuredClone(sharedInputs[0])],
      'mutation.htmlSharedRoles',
    ),
    /exactly one shared-baseline-case input is required/,
    'identity guard must reject a duplicate HTML shared input role',
  );
  validateSampleIdentity({
    ...candidate,
    id: 'candidate-04',
    casePath: sharedInputs[0].path,
    guidePath: sharedInputs[2].path,
    output: { path: `${htmlRoot}/candidate/candidate-04.md` },
  }, 'mutation.validHtmlDeviation', htmlInputs,
    sampleBindings('mockups-html', sharedInputs[0].path, sharedInputs[1].path));
  validateSampleIdentity({
    ...candidate,
    id: 'current-02-replacement',
    arm: 'current',
    guidePath: paths.current,
    output: { path: `${rootPath}/current-02.md` },
  }, 'mutation.validReplacement', inputs, bindings);
  validateSampleIdentity({
    ...candidate,
    id: 'current-02-initial-misrouted',
    arm: 'current-protocol-deviation',
    guidePath: paths.current,
    output: { path: `${rootPath}/current/current-02.md` },
  }, 'mutation.validProtocolDeviation', inputs, bindings);

  const schedule = {
    comparison: 15,
    boundary: 2,
    protocolDeviation: 0,
    primary: { control: 5, current: 5, candidate: 5 },
    newPrimary: { control: 5, current: 5, candidate: 5 },
  };
  assert.doesNotThrow(
    () => validateClosedSchedule(schedule, 'mutation.validSchedule'),
    'schedule guard must accept the closed five-per-arm schedule',
  );
  const extraPrimary = {
    ...structuredClone(schedule),
    comparison: 16,
    primary: { ...schedule.primary, candidate: 6 },
    newPrimary: { ...schedule.newPrimary, candidate: 6 },
  };
  assert.throws(
    () => validateClosedSchedule(extraPrimary, 'mutation.extraPrimary'),
    /exactly five valid primary candidate outputs/,
    'schedule guard must reject an unruled sixth primary output',
  );
  const extraBoundary = structuredClone(schedule);
  extraBoundary.boundary += 1;
  assert.throws(
    () => validateClosedSchedule(extraBoundary, 'mutation.extraBoundary'),
    /at most two boundary samples/,
    'schedule guard must reject a third boundary sample',
  );
  assert.throws(
    () => validateGlobalInvocationCounts(
      { comparisonSamples: 16, boundarySamples: 2 },
      {
        primaryComparisonSamples: 15,
        protocolDeviationSamples: 0,
        boundarySamples: 2,
      },
      { absoluteCaps: { comparisonSamples: 120, boundarySamples: 16 } },
    ),
    /must include primary and protocol-deviation invocations/,
    'schedule guard must account for protocol-deviation comparison invocations separately',
  );
}

function addCounts(counts, kind) {
  if (kind.boundary) {
    counts.boundary += 1;
    return;
  }
  counts.comparison += 1;
  counts.arms[kind.family] += 1;
  if (kind.primary) {
    counts.primary[kind.family] += 1;
    counts.newPrimary[kind.family] += 1;
  }
  if (kind.protocolDeviation) counts.protocolDeviation += 1;
}

function validateClosedSchedule(counts, method) {
  for (const arm of ['control', 'current', 'candidate']) {
    assert.equal(counts.primary[arm], 5,
      `${method}: the closed schedule requires exactly five valid primary ${arm} outputs`);
  }
  assert.ok(counts.boundary <= 2,
    `${method}: the closed schedule permits at most two boundary samples`);
  const newPrimaryTotal = Object.values(counts.newPrimary)
    .reduce((sum, value) => sum + value, 0);
  assert.equal(counts.comparison, newPrimaryTotal + counts.protocolDeviation,
    `${method}: comparison invocations must separate primary and protocol deviations`);
  return newPrimaryTotal;
}

function validateGlobalInvocationCounts(actualUsed, invocationKinds, budget) {
  assert.equal(
    actualUsed.comparisonSamples,
    invocationKinds.primaryComparisonSamples + invocationKinds.protocolDeviationSamples,
    'global comparison usage must include primary and protocol-deviation invocations',
  );
  assert.equal(actualUsed.boundarySamples, invocationKinds.boundarySamples,
    'global boundary usage must count boundary invocations separately');
  assert.ok(actualUsed.comparisonSamples <= budget.absoluteCaps.comparisonSamples,
    'comparison samples must not exceed the cap');
  assert.ok(actualUsed.boundarySamples <= budget.absoluteCaps.boundarySamples,
    'boundary samples must not exceed the cap');
}

function assertArms(actual, declared, label) {
  for (const arm of ['control', 'current', 'candidate']) {
    assert.equal(declared?.[arm], actual[arm], `${label}: ${arm} count must match retained samples`);
  }
}

function runAuthoringChecks() {
  const manifestPaths = new Map(finalMethods.map(method => [
    method,
    `${authoringRoot}/${method}/manifest.json`,
  ]));
  const missing = [...manifestPaths.values()]
    .filter(relative => !existsSync(join(root, ...relative.split('/'))));
  assert.equal(missing.length, 0, `missing final authoring manifests: ${missing.join(', ')}`);

  const budgetPath = `${authoringRoot}/budget.json`;
  const budgetWorking = readFileSync(join(root, ...budgetPath.split('/')));
  assert.equal(hash(indexedBytes(budgetPath, 'authoring budget')), hash(budgetWorking),
    'authoring budget: working and indexed bytes must match');
  const budget = JSON.parse(budgetWorking.toString('utf8').replace(/^\uFEFF/, ''));
  assert.equal(budget.methodBudgetCap, 8, 'authoring budget must declare exactly eight methods');
  assert.equal(budget.absoluteCaps?.comparisonSamples, 120,
    'comparison sample cap must remain exactly 120');
  assert.equal(budget.absoluteCaps?.boundarySamples, 16,
    'boundary sample cap must remain exactly 16');
  assert.deepEqual(Object.keys(budget.methods ?? {}).sort(), [...finalMethods].sort(),
    'authoring budget methods must exactly match the eight final methods');

  const manifests = new Map();
  for (const [method, relative] of manifestPaths) {
    const working = readFileSync(join(root, ...relative.split('/')));
    assert.equal(hash(indexedBytes(relative, `${method} manifest`)), hash(working),
      `${method} manifest: working and indexed bytes must match`);
    const manifest = JSON.parse(working.toString('utf8').replace(/^\uFEFF/, ''));
    assert.equal(manifest.method, method, `${method} manifest must declare its directory method`);
    manifests.set(method, manifest);
  }

  const actualUsed = { comparisonSamples: 0, boundarySamples: 0 };
  const invocationKinds = {
    primaryComparisonSamples: 0,
    protocolDeviationSamples: 0,
    boundarySamples: 0,
  };
  for (const method of finalMethods) {
    const manifest = manifests.get(method);
    const budgetMethod = budget.methods[method];
    assert.equal(budgetMethod.status, 'complete', `${method}: budget status must be complete`);
    assert.equal(evidencePath(budgetMethod.path, `${method} budget path`),
      `${authoringRoot}/${method}`, `${method}: budget path must match its evidence directory`);
    assert.equal(evidencePath(manifest.outputDirectory, `${method} outputDirectory`),
      `${authoringRoot}/${method}`, `${method}: outputDirectory must match its evidence directory`);
    for (const [index, analysis] of (manifest.analyses ?? []).entries()) {
      evidencePath(analysis, `${method}.analyses[${index}]`);
    }

    assert.ok(Array.isArray(manifest.inputs), `${method}: inputs must be an array`);
    const inputs = new Map();
    for (const [index, input] of manifest.inputs.entries()) {
      const relative = validateHashedRecord(input, `${method}.inputs[${index}]`);
      assert.ok(!inputs.has(relative), `${method}: duplicate hashed input ${relative}`);
      inputs.set(relative, input);
    }
    assert.ok(inputs.size > 0, `${method}: hashed inputs are required`);

    let bindings = sampleBindings(method);
    let sharedInputRoles;
    if (method === 'mockups-html') {
      const shared = manifest.sharedBaselineDataset;
      assert.ok(shared && typeof shared === 'object',
        'mockups-html: sharedBaselineDataset is required');
      assert.equal(shared.method, 'mockups-ascii',
        'mockups-html: shared baseline method must be mockups-ascii');
      assert.equal(evidencePath(shared.manifest, 'mockups-html shared manifest'),
        manifestPaths.get('mockups-ascii'),
        'mockups-html: shared baseline manifest must reference mockups-ascii');

      sharedInputRoles = validateSharedBaselineInputRoles(
        manifest.inputs, 'mockups-html shared inputs',
      );
      const sharedCase = evidencePath(shared.casePath, 'mockups-html shared casePath');
      assert.equal(sharedInputRoles['shared-baseline-case'].path, sharedCase,
        'mockups-html: shared case role must match sharedBaselineDataset.casePath');
      assert.equal(sharedCase, `${authoringRoot}/mockups-ascii/case.md`,
        'mockups-html: shared case must be the mockups-ascii fixed case');
      assert.equal(
        sharedInputRoles['shared-baseline-current-guide'].path,
        `${authoringRoot}/mockups-ascii/current/SKILL.md`,
        'mockups-html: shared current guide must be the mockups-ascii current guide',
      );
      bindings = sampleBindings(
        method,
        sharedCase,
        sharedInputRoles['shared-baseline-current-guide'].path,
      );
    }

    for (const [relative, input] of inputs) {
      if (relative.startsWith(`${bindings.methodRoot}/`)) continue;
      assert.equal(method, 'mockups-html',
        `${method}: hashed inputs must stay inside their method directory`);
      const sharedRole = Object.values(sharedInputRoles)
        .find(record => record.path === relative);
      assert.ok(sharedRole && sharedRole.input === input,
        `mockups-html: cross-method input ${relative} must be an explicit shared baseline role`);
    }

    const ids = new Set();
    const outputPaths = new Set();
    const counts = {
      comparison: 0,
      boundary: 0,
      protocolDeviation: 0,
      arms: { control: 0, current: 0, candidate: 0 },
      primary: { control: 0, current: 0, candidate: 0 },
      newPrimary: { control: 0, current: 0, candidate: 0 },
    };
    assert.ok(Array.isArray(manifest.samples), `${method}: samples must be an array`);
    for (const [index, sample] of manifest.samples.entries()) {
      addCounts(counts, validateSample(
        sample, `${method}.samples[${index}]`, inputs, bindings, ids, outputPaths,
      ));
    }
    assert.ok(ids.size > 0, `${method}: samples are required`);

    if (method === 'mockups-html') {
      const shared = manifest.sharedBaselineDataset;
      const sharedCase = evidencePath(shared.casePath, 'mockups-html shared casePath');
      assert.ok(inputs.has(sharedCase),
        'mockups-html: shared casePath must reference a hashed input');

      const asciiManifest = manifests.get('mockups-ascii');
      const asciiInputs = new Map(asciiManifest.inputs.map(input => [
        evidencePath(input.path, 'mockups-ascii shared input'),
        input,
      ]));
      for (const { input, path: relative } of Object.values(sharedInputRoles)) {
        const source = asciiInputs.get(relative);
        assert.ok(source, `mockups-html: ${input.role} must reference its mockups-ascii input`);
        assert.deepEqual(
          {
            path: input.path,
            sha256: input.sha256,
            originalBytesSha256: input.originalBytesSha256,
            bytes: input.bytes,
          },
          {
            path: source.path,
            sha256: source.sha256,
            originalBytesSha256: source.originalBytesSha256,
            bytes: source.bytes,
          },
          `mockups-html: ${input.role} must reproduce the mockups-ascii input record`,
        );
      }

      assert.ok(Array.isArray(manifest.sharedBaselineSamples),
        'mockups-html: sharedBaselineSamples must be an array');
      const asciiSamples = new Map(asciiManifest.samples
        .map(sample => [sample.id, sample]));
      for (const [index, sample] of manifest.sharedBaselineSamples.entries()) {
        const label = `mockups-html.sharedBaselineSamples[${index}]`;
        const kind = sampleKind(sample, label);
        assert.ok(!ids.has(sample.id), `${label}: duplicate sample id ${sample.id}`);
        ids.add(sample.id);
        assert.ok(kind.primary && ['control', 'current'].includes(kind.family),
          `${label}: shared baselines must be primary control/current samples`);
        const outputPath = validateHashedRecord(sample.output, `${label}.output`);
        assert.ok(!outputPaths.has(outputPath), `${label}: duplicate output path ${outputPath}`);
        outputPaths.add(outputPath);
        const source = asciiSamples.get(sample.id);
        assert.ok(source, `${label}: must reference a retained mockups-ascii sample`);
        assert.deepEqual(
          { id: sample.id, arm: sample.arm, output: sample.output },
          { id: source.id, arm: source.arm, output: source.output },
          `${label}: must reproduce the mockups-ascii retained output record`,
        );
        counts.arms[kind.family] += 1;
        counts.primary[kind.family] += 1;
      }

      const sharedCount = manifest.sharedBaselineSamples?.length ?? 0;
      assert.equal(shared.comparisonSamplesReused, sharedCount,
        'mockups-html: shared dataset count must match sharedBaselineSamples');
      assert.equal(manifest.sharedBaselineComparisonSamples, sharedCount,
        'mockups-html: declared shared baseline count must match retained references');
      assert.equal(manifest.newComparisonSamples, counts.comparison,
        'mockups-html: new comparison count must match retained samples');
      assert.equal(manifest.boundarySamples, counts.boundary,
        'mockups-html: boundary count must match retained samples');
      assert.equal(manifest.totalComparisonEvidence, counts.comparison + sharedCount,
        'mockups-html: total comparison evidence must include shared references once');
      assert.equal(budgetMethod.newComparisonSamples, counts.comparison,
        'mockups-html: budget new comparison count must match retained samples');
      assert.equal(budgetMethod.sharedBaselineComparisonSamples, sharedCount,
        'mockups-html: budget shared baseline count must match retained references');
      assert.equal(budgetMethod.totalComparisonEvidence, counts.comparison + sharedCount,
        'mockups-html: budget total must include shared references once');
    } else {
      assert.equal(manifest.comparisonSamples, counts.comparison,
        `${method}: comparison count must match retained sample arms`);
      assert.equal(manifest.boundarySamples, counts.boundary,
        `${method}: boundary count must match retained sample arms`);
      assert.equal(budgetMethod.comparisonSamples, counts.comparison,
        `${method}: budget comparison count must match retained sample arms`);
    }

    assert.equal(budgetMethod.boundarySamples, counts.boundary,
      `${method}: budget boundary count must match retained sample arms`);
    assertArms(counts.arms, budgetMethod.arms, `${method} budget arms`);
    const primaryTotal = Object.values(counts.primary).reduce((sum, value) => sum + value, 0);
    if (manifest.primaryComparisonOutputs !== undefined) {
      assert.equal(manifest.primaryComparisonOutputs, primaryTotal,
        `${method}: primaryComparisonOutputs must exclude protocol deviations`);
    }
    const newPrimaryTotal = validateClosedSchedule(counts, method);

    actualUsed.comparisonSamples += counts.comparison;
    actualUsed.boundarySamples += counts.boundary;
    invocationKinds.primaryComparisonSamples += newPrimaryTotal;
    invocationKinds.protocolDeviationSamples += counts.protocolDeviation;
    invocationKinds.boundarySamples += counts.boundary;
  }

  assert.deepEqual(budget.used, actualUsed,
    'authoring budget used counts must equal retained new invocations');
  assert.deepEqual(budget.remaining, {
    comparisonSamples: budget.absoluteCaps.comparisonSamples - actualUsed.comparisonSamples,
    boundarySamples: budget.absoluteCaps.boundarySamples - actualUsed.boundarySamples,
  }, 'authoring budget remaining counts must reconcile with exact caps');
  validateGlobalInvocationCounts(actualUsed, invocationKinds, budget);
}

assert.ok(['baseline', 'all'].includes(selector),
  `unknown creative evidence selector "${selector}"; expected baseline or all`);
runIdentityMutationChecks();
runBaselineChecks();
if (selector === 'all') runAuthoringChecks();
console.log(selector === 'baseline'
  ? 'creative baseline captured/indexed byte assertions passed'
  : 'creative baseline and final authoring evidence assertions passed');
