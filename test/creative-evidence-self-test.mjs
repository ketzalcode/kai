import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join, posix } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseScreenplay } from '../scripts/demo-capture.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const baselineRoot = 'docs/reference/skill-evaluation/creative-baseline-2026-09-13';
const authoringRoot = 'docs/reference/skill-evaluation/creative-foundation';
const methods = [
  'grounding',
  'scope',
  'mockups-ascii',
  'mockups-html',
  'video-create-narration',
  'video-align-narration',
  'video-render-zoom',
  'html-block-diagrams',
];
const arms = ['control', 'current', 'candidate'];
const alignmentMethod = 'video-align-narration';
const alignmentRoot = `${authoringRoot}/${alignmentMethod}`;
const alignment = {
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
const sha256 = bytes => createHash('sha256').update(bytes).digest('hex');
const diskPath = relative => join(root, ...relative.split('/'));
const readBytes = relative => readFileSync(diskPath(relative));
const parseJson = bytes => JSON.parse(bytes.toString('utf8').replace(/^\uFEFF/, ''));
const normalizedSha = bytes => sha256(
  Buffer.from(bytes.toString('utf8').replace(/\r\n/g, '\n'), 'utf8'),
);

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
  const working = readBytes(relative);
  assert.equal(sha256(indexedBytes(relative, label)), sha256(working), `${label}: working and indexed bytes must match`);
  return parseJson(working);
}

function evidencePath(value, label) {
  assert.equal(typeof value, 'string', `${label}: path must be a string`);
  assert.ok(value.length > 0, `${label}: path must not be empty`);
  assert.ok(!/^[a-zA-Z]:/.test(value), `${label}: path must be repository-relative`);
  const relative = value.replaceAll('\\', '/');
  assert.equal(posix.normalize(relative), relative, `${label}: path must be normalized`);
  assert.ok(relative.startsWith(`${authoringRoot}/`), `${label}: path must stay inside ${authoringRoot}`);
  return relative;
}

function validateRecord(record, label) {
  assert.ok(record && typeof record === 'object', `${label}: hashed record is required`);
  const relative = evidencePath(record.path, `${label}.path`);
  assert.match(record.originalBytesSha256, /^[a-f0-9]{64}$/, `${label}: originalBytesSha256 must be a SHA-256`);
  assert.match(record.sha256, /^[a-f0-9]{64}$/, `${label}: sha256 must be a SHA-256`);
  assert.ok(Number.isInteger(record.bytes) && record.bytes >= 0, `${label}: bytes must be a non-negative integer`);
  assert.ok(existsSync(diskPath(relative)), `${label}: working file must exist at ${relative}`);
  for (const [source, bytes] of [['working', readBytes(relative)], ['indexed', indexedBytes(relative, label)]]) {
    assert.equal(bytes.length, record.bytes, `${label}: ${source} byte count must match`);
    assert.equal(sha256(bytes), record.originalBytesSha256, `${label}: ${source} raw SHA-256 must match`);
    assert.equal(normalizedSha(bytes), record.sha256, `${label}: ${source} CRLF-to-LF SHA-256 must match`);
  }
  return relative;
}

function runBaselineChecks() {
  const manifest = parseJson(readBytes(`${baselineRoot}/manifest.json`));
  assert.equal(manifest.files.length, 20, 'the baseline keeps every captured log and stage mapping');
  const names = new Set();
  for (const entry of manifest.files) {
    assert.match(entry.path, /^[a-z0-9.-]+$/, 'baseline entries are local filenames');
    assert.ok(!names.has(entry.path), `duplicate baseline entry: ${entry.path}`);
    names.add(entry.path);
    const relative = `${baselineRoot}/${entry.path}`;
    assert.equal(sha256(readBytes(relative)), entry.sha256, `${relative}: working bytes must match the captured evidence`);
    assert.equal(sha256(indexedBytes(relative)), entry.sha256, `${relative}: indexed bytes must match too; Git normalization is not evidence preservation`);
  }
  const checked = [
    `${baselineRoot}/creative-baseline-stage-01.log`,
    `${authoringRoot}/grounding/current/SKILL.md`,
  ];
  const attributes = execFileSync('git', ['check-attr', 'text', '--', ...checked], {
    cwd: root, encoding: 'utf8',
  }).trim().split(/\r?\n/);
  assert.equal(attributes.length, checked.length, 'raw evidence attribute check must stay narrowly scoped');
  assert.ok(attributes.every(line => line.endsWith(': text: unset')), 'raw evidence must bypass Git line-ending normalization');
}

function sampleKind(sample, label) {
  assert.equal(typeof sample.id, 'string', `${label}: sample id is required`);
  assert.ok(sample.id.length > 0, `${label}: sample id must not be empty`);
  assert.equal(typeof sample.arm, 'string', `${label}: recorded arm is required`);
  const match = /^(control|current|candidate)(?:-(protocol-deviation|boundary))?$/
    .exec(sample.arm);
  assert.ok(match, `${label}: unrecognized arm ${sample.arm}`);
  return {
    family: match[1],
    boundary: match[2] === 'boundary',
    primary: match[2] === undefined,
    protocol: match[2] === 'protocol-deviation',
  };
}

function bindingsFor(method, primaryCasePath, currentGuidePath) {
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

function validateIdentity(sample, label, inputs, bindings) {
  const kind = sampleKind(sample, label);
  assert.match(sample.id, new RegExp(`^${kind.family}-`), `${label}: sample id must agree with base arm ${kind.family}`);
  const casePath = evidencePath(sample.casePath, `${label}.casePath`);
  assert.ok(inputs.has(casePath), `${label}: casePath must reference a hashed input`);
  const guidePath = sample.guidePath === null ? null : evidencePath(sample.guidePath, `${label}.guidePath`);
  if (kind.boundary) {
    assert.equal(kind.family, 'candidate', `${label}: boundary samples must use the candidate arm`);
    assert.ok(casePath.startsWith(`${bindings.methodRoot}/`), `${label}: boundary casePath must stay inside its method directory`);
    assert.ok(![bindings.primaryCasePath, bindings.guides.current, bindings.guides.candidate].includes(casePath),
      `${label}: boundary casePath must be a dedicated boundary case`);
    assert.match(posix.basename(casePath), /^boundary.*case\.md$/, `${label}: boundary casePath must name a boundary case file`);
    assert.equal(guidePath, bindings.guides.candidate, `${label}: boundary guidePath must be the candidate guide`);
  } else {
    assert.equal(casePath, bindings.primaryCasePath, `${label}: primary and protocol-deviation casePath must be the fixed case`);
    assert.equal(guidePath, bindings.guides[kind.family], `${label}: ${kind.family} guidePath must match its arm`);
  }
  if (guidePath !== null) assert.ok(inputs.has(guidePath), `${label}: guidePath must reference a hashed input`);
  const outputPath = evidencePath(sample.output?.path, `${label}.output.path`);
  assert.ok(outputPath.startsWith(`${bindings.methodRoot}/`), `${label}: output must stay inside its method directory`);
  return { kind, outputPath };
}

function validateSample(sample, label, inputs, bindings, ids, outputPaths) {
  const { kind, outputPath } = validateIdentity(sample, label, inputs, bindings);
  assert.ok(!ids.has(sample.id), `${label}: duplicate sample id ${sample.id}`);
  assert.ok(!outputPaths.has(outputPath), `${label}: duplicate output path ${outputPath}`);
  ids.add(sample.id);
  outputPaths.add(outputPath);
  assert.equal(validateRecord(sample.output, `${label}.output`), outputPath, `${label}: validated output path must remain stable`);
  return kind;
}

function validateAlignmentDeclaration(manifest, method) {
  const declared = ['primaryCasePath', 'comparedArms', 'invalidFixture'].some(field => manifest[field] !== undefined);
  if (method !== alignmentMethod) {
    assert.equal(declared, false, `${method}: only video-align-narration may declare the alignment-v2 correction`);
    return null;
  }
  assert.equal(evidencePath(manifest.primaryCasePath, `${method}.primaryCasePath`), alignment.primaryCasePath,
    `${method}: primaryCasePath must select the corrected v2 case`);
  assert.deepEqual(manifest.comparedArms, alignment.comparedArms, `${method}: comparedArms must be the ruled control/candidate comparison`);
  assert.ok(manifest.invalidFixture && typeof manifest.invalidFixture === 'object', `${method}: invalidFixture is required`);
  for (const field of ['casePath', 'manifest']) {
    assert.equal(evidencePath(manifest.invalidFixture[field], `${method}.invalidFixture.${field}`),
      alignment.invalidFixture[field], `${method}: invalidFixture.${field} must match the ruled v1 fixture history`);
  }
  for (const field of ['reason', 'comparisonInvocations']) {
    assert.equal(manifest.invalidFixture[field], alignment.invalidFixture[field], `${method}: invalidFixture.${field} must match the ruling`);
  }
  assert.ok(typeof manifest.invalidFixture.parserError === 'string'
    && manifest.invalidFixture.parserError.length > 0, `${method}: invalidFixture.parserError is required`);
  return alignment;
}

function isExcludedFixture(sample, method, correction) {
  const declared = sample.excludedFromPrimary !== undefined
    || sample.exclusionReason !== undefined;
  if (!declared) return false;
  assert.ok(correction && method === alignmentMethod, `${method}: only the declared alignment-v2 correction may exclude fixture history`);
  assert.equal(sample.excludedFromPrimary, true, `${method}: excluded fixture records must set excludedFromPrimary true`);
  assert.equal(sample.exclusionReason, alignment.invalidFixture.reason, `${method}: excluded fixture records must use invalid-fixture-v1`);
  return true;
}

function fencedJson(relative, label) {
  const document = readBytes(relative).toString('utf8');
  const match = /```json\s*([\s\S]*?)```/.exec(document);
  assert.ok(match, `${label}: first fenced JSON block is required`);
  return { document, raw: JSON.parse(match[1]), source: match[1] };
}

function assertEnumOnlyCorrection(original, corrected) {
  const normalize = text => text.replace(/\r\n/g, '\n');
  assert.equal(normalize(corrected),
    normalize(original).replace('"saved search confirmation"', '"intended-outcome"'),
    'alignment v2 complete case must change only the one intent enum');
}

function validateAlignmentCases(manifest, inputs) {
  assert.equal(hash(readBytes(alignment.invalidFixture.casePath)),
    'cc5d5512a54daa3f297272ab5603765e9a106ff33ff0c4c733e49851d420418a',
    'alignment v1 case must preserve the original captured bytes');
  const v1 = fencedJson(alignment.invalidFixture.casePath, 'alignment v1 case');
  const v2 = fencedJson(alignment.primaryCasePath, 'alignment v2 case');
  assertEnumOnlyCorrection(v1.document, v2.document);
  assert.match(v1.document, /Do not access media files/, 'alignment v1 case must remain a synthetic no-media case');
  assert.match(v2.document, /Do not access media files/, 'alignment v2 case must remain a synthetic no-media case');
  let parserError;
  try { parseScreenplay(v1.source); } catch (error) { parserError = error; }
  assert.ok(parserError, 'alignment v1 screenplay must be rejected by the real parser');
  assert.match(parserError.message,
    /steps\[3\]\.intends_to_show must be one of .*got "saved search confirmation"/,
    'alignment v1 screenplay must fail only on the invalid intends_to_show enum');
  assert.equal(manifest.invalidFixture.parserError, parserError.message, 'alignment invalidFixture.parserError must preserve the real parser rejection');
  const parsedV2 = parseScreenplay(v2.source);
  assert.equal(parsedV2.steps.length, 4, 'alignment v2 screenplay must parse four steps');
  assert.equal(parsedV2.narration.length, 1, 'alignment v2 screenplay must parse one beat');
  assert.equal(v1.raw.steps[3]?.intends_to_show, 'saved search confirmation', 'alignment v1 must preserve the rejected enum');
  assert.equal(v2.raw.steps[3]?.intends_to_show, 'intended-outcome', 'alignment v2 must use the accepted intended-outcome enum');
  const corrected = structuredClone(v1.raw);
  corrected.steps[3].intends_to_show = 'intended-outcome';
  assert.deepEqual(v2.raw, corrected, 'alignment v2 must differ from v1 only at the corrected intends_to_show enum');
  for (const relative of [
    alignment.invalidFixture.casePath,
    alignment.primaryCasePath,
    `${alignmentRoot}/current/SKILL.md`,
    `${alignmentRoot}/candidate/SKILL.md`,
  ]) {
    assert.ok(inputs.has(relative), `${alignmentMethod}: inputs must hash ${relative}`);
  }
}

const recordFields = sample => ({
  id: sample.id,
  arm: sample.arm,
  casePath: sample.casePath,
  guidePath: sample.guidePath,
  output: sample.output,
});

function validateExcludedHistory(excludedSamples) {
  assert.equal(hash(readBytes(alignment.invalidFixture.manifest)),
    '6d4d80c5951b71fb9de4c80b464101b6cc13443afe2a2c1019612cb19146fa03',
    'alignment v1 manifest must preserve the original frozen records');
  const frozen = readIndexedJson(alignment.invalidFixture.manifest, `${alignmentMethod} frozen v1 manifest`);
  assert.equal(frozen.method, alignmentMethod, 'alignment frozen v1 manifest must retain its method');
  assert.ok(Array.isArray(frozen.samples), 'alignment frozen v1 manifest must retain its samples array');
  assert.equal(frozen.samples.length, 10, 'alignment frozen v1 manifest must retain exactly ten samples');
  assert.equal(excludedSamples.length, 10, 'alignment final manifest must retain exactly ten excluded v1 samples');
  const expectedIds = arms.slice(0, 2).flatMap(arm =>
    Array.from({ length: 5 }, (_, index) => `${arm}-${String(index + 1).padStart(2, '0')}`));
  assert.deepEqual(frozen.samples.map(sample => sample.id).sort(), expectedIds.sort(), 'alignment frozen v1 IDs must remain unchanged');
  const frozenById = new Map(frozen.samples.map(sample => {
    assert.equal(sample.excludedFromPrimary, undefined, `${sample.id}: frozen record must not be rewritten as excluded`);
    assert.equal(sample.exclusionReason, undefined, `${sample.id}: frozen record must not gain an exclusion reason`);
    return [sample.id, sample];
  }));
  for (const sample of excludedSamples) {
    const source = frozenById.get(sample.id);
    assert.ok(source, `${sample.id}: excluded sample must match an original frozen v1 record`);
    assert.deepEqual(recordFields(sample), recordFields(source), `${sample.id}: excluded v1 record must remain byte-record identical`);
  }
}

function sharedRoles(inputs, label) {
  const result = {};
  for (const role of ['shared-baseline-case', 'shared-baseline-current-guide']) {
    const matches = inputs.filter(input => input.role === role);
    assert.equal(matches.length, 1, `${label}: exactly one ${role} input is required`);
    result[role] = {
      input: matches[0],
      path: evidencePath(matches[0].path, `${label}.${role}`),
    };
  }
  return result;
}

function emptyCounts() {
  return {
    comparison: 0,
    boundary: 0,
    protocol: 0,
    excluded: 0,
    arms: { control: 0, current: 0, candidate: 0 },
    primary: { control: 0, current: 0, candidate: 0 },
    newPrimary: { control: 0, current: 0, candidate: 0 },
  };
}

function addCount(counts, kind, excluded) {
  if (kind.boundary) {
    assert.equal(excluded, false, 'boundary samples cannot be excluded fixture history');
    counts.boundary += 1;
    return;
  }
  counts.comparison += 1;
  counts.arms[kind.family] += 1;
  if (excluded) {
    counts.excluded += 1;
  } else if (kind.primary) {
    counts.primary[kind.family] += 1;
    counts.newPrimary[kind.family] += 1;
  } else if (kind.protocol) {
    counts.protocol += 1;
  }
}

function validateSchedule(counts, method, comparedArms = arms) {
  for (const arm of arms) {
    const expected = comparedArms.includes(arm) ? 5 : 0;
    assert.equal(counts.primary[arm], expected, `${method}: the closed schedule requires exactly ${expected ? 'five' : 'zero'} valid primary ${arm} outputs`);
  }
  assert.ok(counts.boundary <= 2, `${method}: the closed schedule permits at most two boundary samples`);
  if (method === alignmentMethod) {
    assert.equal(counts.protocol, 0, 'alignment correction permits no protocol-deviation calls');
    assert.equal(counts.comparison, 20, 'alignment correction must retain exactly twenty comparison calls');
  }
  const newPrimary = Object.values(counts.newPrimary).reduce((sum, value) => sum + value, 0);
  assert.equal(counts.comparison, newPrimary + counts.protocol + counts.excluded,
    `${method}: comparison invocations must separate primary, protocol deviations, and excluded fixture history`);
  return newPrimary;
}

function assertArms(actual, declared, label) {
  for (const arm of arms) {
    assert.equal(declared?.[arm], actual[arm], `${label}: ${arm} count must match retained samples`);
  }
}

function validateHtmlReuse(manifest, asciiManifest, roles, ids, outputPaths, counts) {
  const shared = manifest.sharedBaselineDataset;
  assert.ok(shared && typeof shared === 'object', 'mockups-html: sharedBaselineDataset is required');
  assert.equal(shared.method, 'mockups-ascii', 'mockups-html: shared baseline method must be mockups-ascii');
  assert.equal(evidencePath(shared.manifest, 'mockups-html shared manifest'),
    `${authoringRoot}/mockups-ascii/manifest.json`,
    'mockups-html: shared baseline manifest must reference mockups-ascii');
  const sharedCase = evidencePath(shared.casePath, 'mockups-html shared casePath');
  assert.equal(sharedCase, `${authoringRoot}/mockups-ascii/case.md`, 'mockups-html: shared case must be the mockups-ascii fixed case');
  assert.equal(roles['shared-baseline-case'].path, sharedCase, 'mockups-html: shared case role must match sharedBaselineDataset.casePath');
  assert.equal(roles['shared-baseline-current-guide'].path, `${authoringRoot}/mockups-ascii/current/SKILL.md`,
    'mockups-html: shared current guide must be the mockups-ascii current guide');
  const asciiInputs = new Map(asciiManifest.inputs.map(input => [
    evidencePath(input.path, 'mockups-ascii shared input'),
    input,
  ]));
  for (const { input, path } of Object.values(roles)) {
    const source = asciiInputs.get(path);
    assert.ok(source, `mockups-html: ${input.role} must reference its mockups-ascii input`);
    const fields = ({ path: value, sha256, originalBytesSha256, bytes }) =>
      ({ path: value, sha256, originalBytesSha256, bytes });
    assert.deepEqual(fields(input), fields(source), `mockups-html: ${input.role} must reproduce the mockups-ascii input record`);
  }
  assert.ok(Array.isArray(manifest.sharedBaselineSamples), 'mockups-html: sharedBaselineSamples must be an array');
  assert.equal(manifest.sharedBaselineSamples.length, 10, 'mockups-html: exactly ten ASCII control/current records must be reused');
  const asciiSamples = new Map(asciiManifest.samples.map(sample => [sample.id, sample]));
  for (const [index, sample] of manifest.sharedBaselineSamples.entries()) {
    const label = `mockups-html.sharedBaselineSamples[${index}]`;
    const kind = sampleKind(sample, label);
    assert.ok(kind.primary && ['control', 'current'].includes(kind.family), `${label}: shared baselines must be primary control/current samples`);
    assert.ok(!ids.has(sample.id), `${label}: duplicate sample id ${sample.id}`);
    const source = asciiSamples.get(sample.id);
    assert.ok(source, `${label}: must reference a retained mockups-ascii sample`);
    assert.deepEqual({ id: sample.id, arm: sample.arm, output: sample.output },
      { id: source.id, arm: source.arm, output: source.output },
      `${label}: must reproduce the mockups-ascii retained output record`);
    const outputPath = evidencePath(sample.output.path, `${label}.output.path`);
    assert.ok(!outputPaths.has(outputPath), `${label}: duplicate output path ${outputPath}`);
    ids.add(sample.id);
    outputPaths.add(outputPath);
    counts.arms[kind.family] += 1;
    counts.primary[kind.family] += 1;
  }

  const reused = manifest.sharedBaselineSamples.length;
  assert.equal(shared.comparisonSamplesReused, reused, 'mockups-html: shared dataset count must match sharedBaselineSamples');
  assert.equal(manifest.sharedBaselineComparisonSamples, reused, 'mockups-html: declared shared baseline count must match retained references');
  assert.equal(manifest.newComparisonSamples, counts.comparison, 'mockups-html: new comparison count must match retained samples');
  assert.equal(manifest.totalComparisonEvidence, counts.comparison + reused, 'mockups-html: total comparison evidence must include shared references once');
  return reused;
}

function reject(label, action, expected) {
  assert.throws(action, expected, `evidence guard must reject ${label}`);
}

function runMutationChecks() {
  const methodRoot = `${authoringRoot}/grounding`;
  const paths = {
    case: `${methodRoot}/case.md`,
    current: `${methodRoot}/current/SKILL.md`,
    candidate: `${methodRoot}/candidate/SKILL.md`,
    boundary: `${methodRoot}/candidate/boundary-case.md`,
  };
  const inputs = new Map(Object.values(paths).map(path => [path, {}]));
  const bindings = bindingsFor('grounding');
  const sample = {
    id: 'candidate-01',
    arm: 'candidate',
    casePath: paths.case,
    guidePath: paths.candidate,
    output: { path: `${methodRoot}/candidate-01.md` },
  };
  const mutations = [
    ['an arm using another guide', { guidePath: paths.current }, /candidate guidePath must match/],
    ['an alternative primary case', { casePath: paths.boundary }, /casePath must be the fixed case/],
    ['an ID disagreeing with its arm', { id: 'current-01' }, /sample id must agree/],
    ['a cross-method output', { output: { path: `${authoringRoot}/scope/candidate-01.md` } }, /output must stay inside its method directory/],
  ];
  for (const [label, change, expected] of mutations) {
    reject(label, () => validateIdentity({ ...structuredClone(sample), ...change }, `mutation.${label}`, inputs, bindings), expected);
  }
  reject('a control sample with a guide', () => validateIdentity({
    ...sample, id: 'control-01', arm: 'control', guidePath: paths.candidate,
  }, 'mutation.controlGuide', inputs, bindings), /control guidePath must match/);
  const shared = [
    { role: 'shared-baseline-case', path: `${authoringRoot}/mockups-ascii/case.md` },
    { role: 'shared-baseline-current-guide', path: `${authoringRoot}/mockups-ascii/current/SKILL.md` },
  ];
  reject('duplicate HTML shared roles', () => sharedRoles([...shared, structuredClone(shared[0])], 'mutation.sharedRoles'),
    /exactly one shared-baseline-case/);
  const declaration = {
    primaryCasePath: alignment.primaryCasePath,
    comparedArms: [...alignment.comparedArms],
    invalidFixture: { ...alignment.invalidFixture, parserError: 'real parser rejection' },
  };
  assert.doesNotThrow(() => validateAlignmentDeclaration(declaration, alignmentMethod));
  reject('the fixture exception on another method', () => validateAlignmentDeclaration(declaration, 'grounding'),
    /only video-align-narration may declare/);
  reject('an arbitrary excluded failure', () => isExcludedFixture({
    excludedFromPrimary: true, exclusionReason: alignment.invalidFixture.reason,
  }, 'grounding', null),
    /only the declared alignment-v2 correction may exclude/);
  reject('the rejected v1 case as alignment primary', () => validateAlignmentDeclaration({
    ...structuredClone(declaration), primaryCasePath: alignment.invalidFixture.casePath,
  }, alignmentMethod), /primaryCasePath must select the corrected v2 case/);
  reject('the old current arm in alignment v2', () => validateAlignmentDeclaration({
    ...structuredClone(declaration), comparedArms: ['current', 'candidate'],
  }, alignmentMethod), /comparedArms must be the ruled control\/candidate comparison/);
  const schedule = {
    comparison: 15,
    boundary: 2,
    protocol: 0,
    excluded: 0,
    arms: { control: 5, current: 5, candidate: 5 },
    primary: { control: 5, current: 5, candidate: 5 },
    newPrimary: { control: 5, current: 5, candidate: 5 },
  };
  assert.equal(validateSchedule(schedule, 'mutation.validSchedule'), 15);
  assert.equal(validateSchedule({
    ...structuredClone(schedule), comparison: 16, protocol: 1,
    arms: { ...schedule.arms, current: 6 },
  }, 'mutation.protocolDeviation'), 15);
  assert.equal(validateSchedule({
    ...structuredClone(schedule), comparison: 20, excluded: 10,
    arms: { control: 10, current: 5, candidate: 5 },
    primary: { control: 5, current: 0, candidate: 5 },
    newPrimary: { control: 5, current: 0, candidate: 5 },
  }, alignmentMethod, alignment.comparedArms), 10);
  reject('a sixth primary output', () => validateSchedule({
    ...structuredClone(schedule), comparison: 16,
    primary: { ...schedule.primary, candidate: 6 },
    newPrimary: { ...schedule.newPrimary, candidate: 6 },
  }, 'mutation.extraPrimary'), /exactly five valid primary candidate outputs/);
  reject('a third boundary sample', () => validateSchedule({ ...structuredClone(schedule), boundary: 3 },
    'mutation.extraBoundary'), /at most two boundary samples/);
  reject('an alignment current primary', () => validateSchedule({
    ...structuredClone(schedule), comparison: 21, excluded: 10,
  }, alignmentMethod, alignment.comparedArms), /exactly zero valid primary current outputs/);
  reject('an alignment protocol substitution', () => validateSchedule({
    ...emptyCounts(), comparison: 21, excluded: 10, protocol: 1,
    primary: { control: 5, current: 0, candidate: 5 },
    newPrimary: { control: 5, current: 0, candidate: 5 },
  }, alignmentMethod, alignment.comparedArms), /no protocol-deviation calls/);
  const caseText = '{"intends_to_show":"saved search confirmation"}\nTake unchanged\nRequest unchanged\n';
  const correctedCase = caseText.replace('"saved search confirmation"', '"intended-outcome"');
  assertEnumOnlyCorrection(caseText, correctedCase);
  reject('a changed measured take outside the screenplay',
    () => assertEnumOnlyCorrection(caseText, correctedCase.replace('Take unchanged', 'Take changed')),
    /complete case must change only/);
}

function runAuthoringChecks() {
  const manifestPaths = new Map(methods.map(method => [method, `${authoringRoot}/${method}/manifest.json`]));
  const missing = [...manifestPaths.values()].filter(relative => !existsSync(diskPath(relative)));
  assert.equal(missing.length, 0, `missing final authoring manifests: ${missing.join(', ')}`);
  const budget = readIndexedJson(`${authoringRoot}/budget.json`, 'authoring budget');
  assert.equal(budget.methodBudgetCap, 8, 'authoring budget must declare exactly eight methods');
  assert.equal(budget.absoluteCaps?.comparisonSamples, 120, 'comparison sample cap must remain exactly 120');
  assert.equal(budget.absoluteCaps?.boundarySamples, 16, 'boundary sample cap must remain exactly 16');
  assert.deepEqual(Object.keys(budget.methods ?? {}).sort(), [...methods].sort(), 'budget methods must exactly match the eight final methods');
  const manifests = new Map([...manifestPaths].map(([method, relative]) => {
    const manifest = readIndexedJson(relative, `${method} manifest`);
    assert.equal(manifest.method, method, `${method} manifest must declare its directory method`);
    return [method, manifest];
  }));
  const actual = { comparisonSamples: 0, boundarySamples: 0 };
  const invocations = { primary: 0, protocol: 0, excluded: 0, boundary: 0 };

  for (const method of methods) {
    const manifest = manifests.get(method);
    const budgetMethod = budget.methods[method];
    const correction = validateAlignmentDeclaration(manifest, method);
    assert.equal(budgetMethod.status, 'complete', `${method}: budget status must be complete`);
    assert.equal(evidencePath(budgetMethod.path, `${method} budget path`), `${authoringRoot}/${method}`,
      `${method}: budget path must match its evidence directory`);
    assert.equal(evidencePath(manifest.outputDirectory, `${method} outputDirectory`), `${authoringRoot}/${method}`,
      `${method}: outputDirectory must match its evidence directory`);
    for (const [index, analysisPath] of (manifest.analyses ?? []).entries()) {
      evidencePath(analysisPath, `${method}.analyses[${index}]`);
    }
    assert.ok(Array.isArray(manifest.inputs), `${method}: inputs must be an array`);
    const inputs = new Map();
    for (const [index, input] of manifest.inputs.entries()) {
      const relative = validateRecord(input, `${method}.inputs[${index}]`);
      assert.ok(!inputs.has(relative), `${method}: duplicate hashed input ${relative}`);
      inputs.set(relative, input);
    }
    assert.ok(inputs.size > 0, `${method}: hashed inputs are required`);
    let bindings = bindingsFor(method, correction?.primaryCasePath);
    let roles;
    if (method === 'mockups-html') {
      roles = sharedRoles(manifest.inputs, 'mockups-html shared inputs');
      bindings = bindingsFor(method, roles['shared-baseline-case'].path, roles['shared-baseline-current-guide'].path);
    } else {
      assert.equal(manifest.sharedBaselineDataset, undefined, `${method}: only mockups-html may declare cross-method reuse`);
      assert.equal(manifest.sharedBaselineSamples, undefined, `${method}: only mockups-html may retain shared baseline samples`);
    }
    if (correction) validateAlignmentCases(manifest, inputs);
    for (const [relative, input] of inputs) {
      if (relative.startsWith(`${bindings.methodRoot}/`)) continue;
      assert.equal(method, 'mockups-html', `${method}: hashed inputs must stay inside their method directory`);
      assert.ok(Object.values(roles).some(role => role.path === relative && role.input === input),
        `mockups-html: cross-method input ${relative} must be an explicit shared baseline role`);
    }
    const ids = new Set();
    const outputPaths = new Set();
    const counts = emptyCounts();
    const excludedSamples = [];
    assert.ok(Array.isArray(manifest.samples), `${method}: samples must be an array`);
    for (const [index, sample] of manifest.samples.entries()) {
      const excluded = isExcludedFixture(sample, method, correction);
      if (excluded) excludedSamples.push(sample);
      const kind = validateSample(
        sample, `${method}.samples[${index}]`, inputs,
        excluded ? bindingsFor(alignmentMethod) : bindings, ids, outputPaths,
      );
      if (correction && !excluded && !kind.boundary) {
        assert.ok(correction.comparedArms.includes(kind.family), `${method}: valid v2 samples must belong to declared comparedArms`);
      }
      addCount(counts, kind, excluded);
    }
    assert.ok(ids.size > 0, `${method}: samples are required`);
    if (method === 'scope') {
      const deviations = manifest.samples.filter(sample => sampleKind(sample, method).protocol);
      assert.equal(deviations.length, 1, 'scope must retain its sole actual protocol-deviation invocation');
      assert.equal(deviations[0].id, 'current-02-initial-misrouted');
      assert.equal(evidencePath(deviations[0].output.path, 'scope protocol output'),
        `${authoringRoot}/scope/current/current-02.md`);
      assert.equal(deviations[0].output.originalBytesSha256,
        'ed88a39f29148167a14bfc0730522eea9c97a9d9b86059fc4fa5dae600479127');
    }
    if (correction) {
      validateExcludedHistory(excludedSamples);
      assert.equal(counts.excluded, correction.invalidFixture.comparisonInvocations, `${method}: excluded count must match invalidFixture`);
      const primaryIds = manifest.samples
        .filter(sample => !sample.excludedFromPrimary && sampleKind(sample, method).primary)
        .map(sample => sample.id)
        .sort();
      assert.deepEqual(primaryIds, [
        ...Array.from({ length: 5 }, (_, index) => `control-v2-${String(index + 1).padStart(2, '0')}`),
        ...Array.from({ length: 5 }, (_, index) => `candidate-${String(index + 1).padStart(2, '0')}`),
      ].sort(), `${method}: valid v2 primary IDs must be five control-v2 and five candidate records`);
      const boundaryCases = new Set(manifest.samples
        .filter(sample => sampleKind(sample, method).boundary)
        .map(sample => evidencePath(sample.casePath, `${method} boundary case`)));
      assert.equal(boundaryCases.size, counts.boundary, `${method}: each boundary invocation must use its own hashed boundary case`);
    } else {
      assert.equal(excludedSamples.length, 0, `${method}: fixture exclusions are not permitted`);
    }
    let sharedCount = 0;
    if (method === 'mockups-html') {
      sharedCount = validateHtmlReuse(manifest, manifests.get('mockups-ascii'), roles, ids, outputPaths, counts);
      assert.equal(budgetMethod.newComparisonSamples, counts.comparison, `${method}: budget new count must match samples`);
      assert.equal(budgetMethod.sharedBaselineComparisonSamples, sharedCount, `${method}: budget shared count must match references`);
      assert.equal(budgetMethod.totalComparisonEvidence, counts.comparison + sharedCount, `${method}: budget total must include reuse`);
    } else {
      assert.equal(manifest.comparisonSamples, counts.comparison, `${method}: comparison count must match retained samples`);
      assert.equal(budgetMethod.comparisonSamples, counts.comparison, `${method}: budget comparison count must match samples`);
    }
    assert.equal(manifest.boundarySamples, counts.boundary, `${method}: boundary count must match retained samples`);
    assert.equal(budgetMethod.boundarySamples, counts.boundary, `${method}: budget boundary count must match samples`);
    assertArms(counts.arms, budgetMethod.arms, `${method} budget arms`);
    const primaryTotal = Object.values(counts.primary).reduce((sum, value) => sum + value, 0);
    if (manifest.primaryComparisonOutputs !== undefined) {
      assert.equal(manifest.primaryComparisonOutputs, primaryTotal, `${method}: primaryComparisonOutputs must exclude deviations`);
    }
    const newPrimary = validateSchedule(counts, method, correction?.comparedArms);
    actual.comparisonSamples += counts.comparison;
    actual.boundarySamples += counts.boundary;
    invocations.primary += newPrimary;
    invocations.protocol += counts.protocol;
    invocations.excluded += counts.excluded;
    invocations.boundary += counts.boundary;
  }
  assert.deepEqual(budget.used, actual, 'authoring budget used counts must equal retained new invocations');
  assert.deepEqual(budget.remaining, {
    comparisonSamples: budget.absoluteCaps.comparisonSamples - actual.comparisonSamples,
    boundarySamples: budget.absoluteCaps.boundarySamples - actual.boundarySamples,
  }, 'authoring budget remaining counts must reconcile with exact caps');
  assert.equal(actual.comparisonSamples, invocations.primary + invocations.protocol + invocations.excluded,
    'global comparison usage must include primary, protocol-deviation, and excluded invocations');
  assert.equal(actual.boundarySamples, invocations.boundary, 'global boundary usage must count boundary invocations separately');
  assert.ok(actual.comparisonSamples <= budget.absoluteCaps.comparisonSamples, 'comparison samples must not exceed the cap');
  assert.ok(actual.boundarySamples <= budget.absoluteCaps.boundarySamples, 'boundary samples must not exceed the cap');
  assert.deepEqual(actual, { comparisonSamples: 116, boundarySamples: 16 }, 'final evidence must retain planned 116/16 invocations');
}

assert.ok(['baseline', 'all'].includes(selector),
  `unknown creative evidence selector "${selector}"; expected baseline or all`);
runMutationChecks();
runBaselineChecks();
if (selector === 'all') runAuthoringChecks();
console.log(selector === 'baseline'
  ? 'creative baseline captured/indexed byte assertions passed'
  : 'creative baseline and final authoring evidence assertions passed');
