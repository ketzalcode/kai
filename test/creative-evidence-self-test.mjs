import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join, posix } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseScreenplay } from '../scripts/demo-capture.mjs';

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
const alignmentMethod = 'video-align-narration';
const alignmentRoot = `${authoringRoot}/${alignmentMethod}`;
const alignmentCorrection = {
  primaryCasePath: `${alignmentRoot}/case-v2.md`,
  comparedArms: ['control', 'candidate'],
  invalidFixture: {
    casePath: `${alignmentRoot}/case.md`,
    manifest: `${alignmentRoot}/invalid-fixture-v1-manifest.json`,
    reason: 'invalid-fixture-v1',
    comparisonInvocations: 10,
  },
};
const selector = process.argv[2] ?? 'all';
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
const readJson = relative => JSON.parse(readFileSync(join(root, ...relative.split('/')), 'utf8')
  .replace(/^\uFEFF/, ''));

function firstFencedJson(relative, label) {
  const text = readFileSync(join(root, ...relative.split('/')), 'utf8');
  const match = /```json\s*([\s\S]*?)```/.exec(text);
  assert.ok(match, `${label}: first fenced JSON block is required`);
  return { source: match[1], document: text };
}

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

function readIndexedJson(relative, label) {
  const working = readFileSync(join(root, ...relative.split('/')));
  assert.equal(hash(indexedBytes(relative, label)), hash(working),
    `${label}: working and indexed bytes must match`);
  return JSON.parse(working.toString('utf8').replace(/^\uFEFF/, ''));
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

function validateAlignmentDeclaration(manifest, method) {
  const declared = manifest.primaryCasePath !== undefined
    || manifest.comparedArms !== undefined
    || manifest.invalidFixture !== undefined;
  if (method !== alignmentMethod) {
    assert.equal(declared, false,
      `${method}: only video-align-narration may declare the alignment-v2 correction`);
    return null;
  }

  assert.equal(evidencePath(manifest.primaryCasePath, `${method}.primaryCasePath`),
    alignmentCorrection.primaryCasePath,
    `${method}: primaryCasePath must select the corrected v2 case`);
  assert.deepEqual(manifest.comparedArms, alignmentCorrection.comparedArms,
    `${method}: comparedArms must be the ruled control/candidate comparison`);
  assert.ok(manifest.invalidFixture && typeof manifest.invalidFixture === 'object',
    `${method}: invalidFixture is required`);
  for (const field of ['casePath', 'manifest']) {
    assert.equal(
      evidencePath(manifest.invalidFixture[field], `${method}.invalidFixture.${field}`),
      alignmentCorrection.invalidFixture[field],
      `${method}: invalidFixture.${field} must match the ruled v1 fixture history`,
    );
  }
  assert.equal(manifest.invalidFixture.reason, alignmentCorrection.invalidFixture.reason,
    `${method}: invalidFixture.reason must identify invalid-fixture-v1`);
  assert.equal(
    manifest.invalidFixture.comparisonInvocations,
    alignmentCorrection.invalidFixture.comparisonInvocations,
    `${method}: invalidFixture must charge all ten v1 comparison invocations`,
  );
  assert.equal(typeof manifest.invalidFixture.parserError, 'string',
    `${method}: invalidFixture.parserError is required`);
  assert.ok(manifest.invalidFixture.parserError.length > 0,
    `${method}: invalidFixture.parserError must not be empty`);
  return alignmentCorrection;
}

function excludedFixtureSample(sample, method, correction) {
  const declaresExclusion = sample.excludedFromPrimary !== undefined
    || sample.exclusionReason !== undefined;
  if (!declaresExclusion) return false;
  assert.ok(correction && method === alignmentMethod,
    `${method}: only the declared alignment-v2 correction may exclude fixture history`);
  assert.equal(sample.excludedFromPrimary, true,
    `${method}: excluded fixture records must set excludedFromPrimary true`);
  assert.equal(sample.exclusionReason, alignmentCorrection.invalidFixture.reason,
    `${method}: excluded fixture records must use invalid-fixture-v1`);
  return true;
}

function validateAlignmentCases(manifest, inputs) {
  const v1 = firstFencedJson(alignmentCorrection.invalidFixture.casePath, 'alignment v1 case');
  const v2 = firstFencedJson(alignmentCorrection.primaryCasePath, 'alignment v2 case');
  assert.match(v1.document, /Do not access media files/,
    'alignment v1 case must remain a synthetic no-media case');
  assert.match(v2.document, /Do not access media files/,
    'alignment v2 case must remain a synthetic no-media case');

  let parserError;
  try {
    parseScreenplay(v1.source);
  } catch (error) {
    parserError = error;
  }
  assert.ok(parserError, 'alignment v1 screenplay must be rejected by the real parser');
  assert.match(parserError.message,
    /steps\[3\]\.intends_to_show must be one of .*got "saved search confirmation"/,
    'alignment v1 screenplay must fail only on the invalid intends_to_show enum');
  assert.equal(manifest.invalidFixture.parserError, parserError.message,
    'alignment invalidFixture.parserError must preserve the real parser rejection');

  const parsedV2 = parseScreenplay(v2.source);
  assert.equal(parsedV2.steps.length, 4, 'alignment v2 screenplay must parse four steps');
  assert.equal(parsedV2.narration.length, 1, 'alignment v2 screenplay must parse one beat');

  const rawV1 = JSON.parse(v1.source);
  const rawV2 = JSON.parse(v2.source);
  assert.equal(rawV1.steps[3]?.intends_to_show, 'saved search confirmation',
    'alignment v1 must preserve the rejected enum');
  assert.equal(rawV2.steps[3]?.intends_to_show, 'intended-outcome',
    'alignment v2 must use the accepted intended-outcome enum');
  const correctedV1 = structuredClone(rawV1);
  correctedV1.steps[3].intends_to_show = 'intended-outcome';
  assert.deepEqual(rawV2, correctedV1,
    'alignment v2 must differ from v1 only at the corrected intends_to_show enum');

  const requiredInputs = [
    alignmentCorrection.invalidFixture.casePath,
    alignmentCorrection.primaryCasePath,
    `${alignmentRoot}/current/SKILL.md`,
    `${alignmentRoot}/candidate/SKILL.md`,
  ];
  for (const relative of requiredInputs) {
    assert.ok(inputs.has(relative), `video-align-narration: inputs must hash ${relative}`);
  }
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

function excludedRecordFields(sample) {
  return {
    id: sample.id,
    arm: sample.arm,
    casePath: sample.casePath,
    guidePath: sample.guidePath,
    output: sample.output,
  };
}

function validateAlignmentExcludedHistory(manifest, excludedSamples, inputs) {
  const frozen = readIndexedJson(
    alignmentCorrection.invalidFixture.manifest,
    'video-align-narration frozen v1 manifest',
  );
  assert.equal(frozen.method, alignmentMethod,
    'alignment frozen v1 manifest must retain the video-align-narration method');
  assert.ok(Array.isArray(frozen.samples),
    'alignment frozen v1 manifest must retain its samples array');
  assert.equal(frozen.samples.length, 10,
    'alignment frozen v1 manifest must retain exactly ten samples');
  assert.equal(excludedSamples.length, 10,
    'alignment final manifest must retain exactly ten excluded v1 samples');

  const expectedIds = [
    ...Array.from({ length: 5 }, (_, index) => `control-${String(index + 1).padStart(2, '0')}`),
    ...Array.from({ length: 5 }, (_, index) => `current-${String(index + 1).padStart(2, '0')}`),
  ];
  assert.deepEqual(frozen.samples.map(sample => sample.id).sort(), expectedIds.sort(),
    'alignment frozen v1 manifest must contain the original five control and current IDs');

  const frozenById = new Map();
  const frozenIds = new Set();
  const frozenOutputs = new Set();
  const v1Bindings = sampleBindings(alignmentMethod);
  for (const [index, sample] of frozen.samples.entries()) {
    const label = `video-align-narration frozen samples[${index}]`;
    assert.equal(sample.excludedFromPrimary, undefined,
      `${label}: frozen records must not be rewritten as excluded records`);
    assert.equal(sample.exclusionReason, undefined,
      `${label}: frozen records must not gain an exclusion reason`);
    const kind = validateSample(sample, label, inputs, v1Bindings, frozenIds, frozenOutputs);
    assert.ok(kind.primary && ['control', 'current'].includes(kind.family),
      `${label}: frozen v1 samples must be primary control/current records`);
    frozenById.set(sample.id, sample);
  }

  for (const [index, sample] of excludedSamples.entries()) {
    const label = `video-align-narration excluded samples[${index}]`;
    assert.equal(sample.excludedFromPrimary, true,
      `${label}: excludedFromPrimary must be true`);
    assert.equal(sample.exclusionReason, alignmentCorrection.invalidFixture.reason,
      `${label}: exclusionReason must identify invalid-fixture-v1`);
    const source = frozenById.get(sample.id);
    assert.ok(source, `${label}: must match an original frozen v1 record`);
    assert.deepEqual(excludedRecordFields(sample), excludedRecordFields(source),
      `${label}: id, arm, case, guide, and hashed output must remain unchanged`);
  }
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

  const declaredAlignment = {
    primaryCasePath: alignmentCorrection.primaryCasePath,
    comparedArms: [...alignmentCorrection.comparedArms],
    invalidFixture: {
      ...alignmentCorrection.invalidFixture,
      parserError: 'real parser rejection',
    },
  };
  assert.doesNotThrow(
    () => validateAlignmentDeclaration(declaredAlignment, alignmentMethod),
    'alignment guard must accept only the ruled v2 correction',
  );
  assert.throws(
    () => validateAlignmentDeclaration(declaredAlignment, 'grounding'),
    /only video-align-narration may declare/,
    'other methods cannot claim the alignment-v2 correction',
  );
  assert.throws(
    () => validateAlignmentDeclaration({
      ...structuredClone(declaredAlignment),
      primaryCasePath: alignmentCorrection.invalidFixture.casePath,
    }, alignmentMethod),
    /primaryCasePath must select the corrected v2 case/,
    'alignment v2 cannot select the rejected v1 case as its primary input',
  );
  assert.throws(
    () => validateAlignmentDeclaration({
      ...structuredClone(declaredAlignment),
      comparedArms: ['current', 'candidate'],
    }, alignmentMethod),
    /comparedArms must be the ruled control\/candidate comparison/,
    'alignment v2 cannot substitute the old current arm',
  );
  const excluded = {
    excludedFromPrimary: true,
    exclusionReason: alignmentCorrection.invalidFixture.reason,
  };
  assert.throws(
    () => excludedFixtureSample(excluded, 'grounding', null),
    /only the declared alignment-v2 correction may exclude fixture history/,
    'other methods cannot exclude failed fixture history',
  );

  const alignmentInputs = new Map([
    [alignmentCorrection.primaryCasePath, {}],
    [alignmentCorrection.invalidFixture.casePath, {}],
    [`${alignmentRoot}/current/SKILL.md`, {}],
    [`${alignmentRoot}/candidate/SKILL.md`, {}],
  ]);
  const alignmentBindings = sampleBindings(
    alignmentMethod,
    alignmentCorrection.primaryCasePath,
  );
  validateSampleIdentity({
    id: 'control-v2-01',
    arm: 'control',
    casePath: alignmentCorrection.primaryCasePath,
    guidePath: null,
    output: { path: `${alignmentRoot}/control-v2-01.md` },
  }, 'mutation.validAlignmentControl', alignmentInputs, alignmentBindings);
  assert.throws(
    () => validateSampleIdentity({
      id: 'candidate-01',
      arm: 'candidate',
      casePath: alignmentCorrection.invalidFixture.casePath,
      guidePath: `${alignmentRoot}/candidate/SKILL.md`,
      output: { path: `${alignmentRoot}/candidate-01.md` },
    }, 'mutation.alignmentOldCase', alignmentInputs, alignmentBindings),
    /casePath must be the fixed case/,
    'alignment v2 candidate cannot use the rejected v1 case',
  );
  assert.throws(
    () => validateSampleIdentity({
      id: 'control-v2-01',
      arm: 'control',
      casePath: alignmentCorrection.primaryCasePath,
      guidePath: `${alignmentRoot}/candidate/SKILL.md`,
      output: { path: `${alignmentRoot}/control-v2-01.md` },
    }, 'mutation.alignmentControlCandidateGuide', alignmentInputs, alignmentBindings),
    /control guidePath must match its arm/,
    'alignment v2 control cannot use the candidate guide',
  );

  const schedule = {
    comparison: 15,
    boundary: 2,
    protocolDeviation: 0,
    excludedFixture: 0,
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
  const alignmentSchedule = {
    comparison: 20,
    boundary: 2,
    protocolDeviation: 0,
    excludedFixture: 10,
    primary: { control: 5, current: 0, candidate: 5 },
    newPrimary: { control: 5, current: 0, candidate: 5 },
  };
  assert.doesNotThrow(
    () => validateClosedSchedule(
      alignmentSchedule,
      alignmentMethod,
      alignmentCorrection.comparedArms,
    ),
    'schedule guard must accept ten excluded v1 calls plus the ruled two-arm v2 comparison',
  );
  assert.throws(
    () => validateClosedSchedule({
      ...structuredClone(alignmentSchedule),
      comparison: 21,
      primary: { control: 5, current: 1, candidate: 5 },
      newPrimary: { control: 5, current: 1, candidate: 5 },
    }, alignmentMethod, alignmentCorrection.comparedArms),
    /exactly zero valid primary current outputs/,
    'alignment v2 cannot retain a current arm in its valid primary comparison',
  );
  assert.throws(
    () => validateGlobalInvocationCounts(
      { comparisonSamples: 16, boundarySamples: 2 },
      {
        primaryComparisonSamples: 15,
        protocolDeviationSamples: 0,
        excludedFixtureSamples: 0,
        boundarySamples: 2,
      },
      { absoluteCaps: { comparisonSamples: 120, boundarySamples: 16 } },
    ),
    /must include primary, protocol-deviation, and excluded fixture invocations/,
    'schedule guard must account for each comparison invocation class separately',
  );
}

function addCounts(counts, kind, excludedFromPrimary = false) {
  if (kind.boundary) {
    assert.equal(excludedFromPrimary, false,
      'boundary samples cannot be excluded fixture history');
    counts.boundary += 1;
    return;
  }
  counts.comparison += 1;
  counts.arms[kind.family] += 1;
  if (excludedFromPrimary) {
    counts.excludedFixture += 1;
    return;
  }
  if (kind.primary) {
    counts.primary[kind.family] += 1;
    counts.newPrimary[kind.family] += 1;
  }
  if (kind.protocolDeviation) counts.protocolDeviation += 1;
}

function validateClosedSchedule(counts, method, comparedArms = ['control', 'current', 'candidate']) {
  for (const arm of ['control', 'current', 'candidate']) {
    const expected = comparedArms.includes(arm) ? 5 : 0;
    const expectedLabel = expected === 5 ? 'five' : 'zero';
    assert.equal(counts.primary[arm], expected,
      `${method}: the closed schedule requires exactly ${expectedLabel} valid primary ${arm} outputs`);
  }
  assert.ok(counts.boundary <= 2,
    `${method}: the closed schedule permits at most two boundary samples`);
  const newPrimaryTotal = Object.values(counts.newPrimary)
    .reduce((sum, value) => sum + value, 0);
  assert.equal(
    counts.comparison,
    newPrimaryTotal + counts.protocolDeviation + counts.excludedFixture,
    `${method}: comparison invocations must separate primary, protocol deviations, and excluded fixture history`,
  );
  return newPrimaryTotal;
}

function validateGlobalInvocationCounts(actualUsed, invocationKinds, budget) {
  assert.equal(
    actualUsed.comparisonSamples,
    invocationKinds.primaryComparisonSamples
      + invocationKinds.protocolDeviationSamples
      + invocationKinds.excludedFixtureSamples,
    'global comparison usage must include primary, protocol-deviation, and excluded fixture invocations',
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
    excludedFixtureSamples: 0,
    boundarySamples: 0,
  };
  for (const method of finalMethods) {
    const manifest = manifests.get(method);
    const budgetMethod = budget.methods[method];
    const correction = validateAlignmentDeclaration(manifest, method);
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

    let bindings = sampleBindings(method, correction?.primaryCasePath);
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
    if (correction) validateAlignmentCases(manifest, inputs);

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
      excludedFixture: 0,
      arms: { control: 0, current: 0, candidate: 0 },
      primary: { control: 0, current: 0, candidate: 0 },
      newPrimary: { control: 0, current: 0, candidate: 0 },
    };
    const excludedSamples = [];
    assert.ok(Array.isArray(manifest.samples), `${method}: samples must be an array`);
    for (const [index, sample] of manifest.samples.entries()) {
      const excluded = excludedFixtureSample(sample, method, correction);
      if (excluded) excludedSamples.push(sample);
      const sampleBindingsForRecord = excluded
        ? sampleBindings(alignmentMethod)
        : bindings;
      const kind = validateSample(
        sample,
        `${method}.samples[${index}]`,
        inputs,
        sampleBindingsForRecord,
        ids,
        outputPaths,
      );
      if (correction && !excluded && !kind.boundary) {
        assert.ok(correction.comparedArms.includes(kind.family),
          `${method}: valid v2 samples must belong to the declared comparedArms`);
      }
      addCounts(counts, kind, excluded);
    }
    assert.ok(ids.size > 0, `${method}: samples are required`);
    if (correction) {
      validateAlignmentExcludedHistory(manifest, excludedSamples, inputs);
      assert.equal(counts.excludedFixture, correction.invalidFixture.comparisonInvocations,
        `${method}: excluded fixture count must match invalidFixture.comparisonInvocations`);
      const primaryIds = manifest.samples
        .filter(sample => !sample.excludedFromPrimary && sampleKind(sample, method).primary)
        .map(sample => sample.id)
        .sort();
      assert.deepEqual(primaryIds, [
        ...Array.from(
          { length: 5 },
          (_, index) => `candidate-${String(index + 1).padStart(2, '0')}`,
        ),
        ...Array.from(
          { length: 5 },
          (_, index) => `control-v2-${String(index + 1).padStart(2, '0')}`,
        ),
      ].sort(), `${method}: valid v2 primary IDs must be five control-v2 and five candidate records`);
      const boundaryCases = new Set(manifest.samples
        .filter(sample => sampleKind(sample, method).boundary)
        .map(sample => evidencePath(sample.casePath, `${method} boundary case`)));
      assert.equal(boundaryCases.size, counts.boundary,
        `${method}: each boundary invocation must use its own hashed boundary case`);
      for (const relative of boundaryCases) {
        assert.ok(inputs.has(relative), `${method}: inputs must hash boundary case ${relative}`);
      }
    } else {
      assert.equal(excludedSamples.length, 0,
        `${method}: fixture exclusions are not permitted`);
    }

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
    const newPrimaryTotal = validateClosedSchedule(
      counts,
      method,
      correction?.comparedArms,
    );

    actualUsed.comparisonSamples += counts.comparison;
    actualUsed.boundarySamples += counts.boundary;
    invocationKinds.primaryComparisonSamples += newPrimaryTotal;
    invocationKinds.protocolDeviationSamples += counts.protocolDeviation;
    invocationKinds.excludedFixtureSamples += counts.excludedFixture;
    invocationKinds.boundarySamples += counts.boundary;
  }

  assert.deepEqual(budget.used, actualUsed,
    'authoring budget used counts must equal retained new invocations');
  assert.deepEqual(budget.remaining, {
    comparisonSamples: budget.absoluteCaps.comparisonSamples - actualUsed.comparisonSamples,
    boundarySamples: budget.absoluteCaps.boundarySamples - actualUsed.boundarySamples,
  }, 'authoring budget remaining counts must reconcile with exact caps');
  validateGlobalInvocationCounts(actualUsed, invocationKinds, budget);
  assert.deepEqual(actualUsed, { comparisonSamples: 116, boundarySamples: 16 },
    'final authoring evidence must retain the planned 116 comparison and 16 boundary invocations');
}

assert.ok(['baseline', 'all'].includes(selector),
  `unknown creative evidence selector "${selector}"; expected baseline or all`);
runIdentityMutationChecks();
runBaselineChecks();
if (selector === 'all') runAuthoringChecks();
console.log(selector === 'baseline'
  ? 'creative baseline captured/indexed byte assertions passed'
  : 'creative baseline and final authoring evidence assertions passed');
