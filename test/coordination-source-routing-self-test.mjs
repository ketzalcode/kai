// Task 11 — schema-5 source contract and mutation gates.
//
// These checks read the exact shipped agents and skills. Runtime behavior has
// its own focused tests; this file protects the operational instructions that
// tell a loaded role which schema, vocabulary, authority, and path rules to use.

import assert from 'node:assert/strict';
import {existsSync, readFileSync} from 'node:fs';
import {dirname, join} from 'node:path';
import {fileURLToPath} from 'node:url';
import * as packPlan from '../tools/lib/pack-plan.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const read = path => readFileSync(path, 'utf8').replace(/\r\n/g, '\n');
const skillPath = (pack, id) =>
  join(root, 'plugins', `kai-${pack}`, 'skills', id, 'SKILL.md');
const agentPath = (pack, id) =>
  join(root, 'plugins', `kai-${pack}`, 'agents', `${id}.agent.md`);

const publicationByPack = Object.freeze({
  core: 'kai-core-workspace-publication',
  engineering: 'engineering-workspace-publication',
  creative: 'creative-workspace-publication',
});

const requiredHelpers = [
  'publicationInventoryErrors',
  'publicationContractErrors',
  'publicationRoutingErrors',
  'activeWorkspaceLanguageErrors',
  'markdownCoordinationAuthorityErrors',
  'directionContractErrors',
  'epicWorkflowContractErrors',
  'chiefOfStaffContractErrors',
];
for (const helper of requiredHelpers) {
  assert.equal(typeof packPlan[helper], 'function',
    `pack-plan must export ${helper} so validate-plugin and mutations share one gate`);
}

const publicationSources = Object.entries(publicationByPack).map(([pack, id]) => {
  const path = skillPath(pack, id);
  assert.ok(existsSync(path), `kai-${pack} is missing publication skill ${id}`);
  return {pack, id, path, body: read(path)};
});
assert.equal(publicationSources.length, 3,
  'the publication contract must inspect all three shipped packs');

for (const source of publicationSources) {
  assert.deepEqual(
    packPlan.publicationContractErrors(source),
    [],
    `${source.id}: canonical vocabulary and refusal contract`,
  );
}

const corePublication = publicationSources.find(source => source.pack === 'core');
const engineeringPublication = publicationSources.find(source => source.pack === 'engineering');
const creativePublication = publicationSources.find(source => source.pack === 'creative');

assert.ok(
  packPlan.publicationContractErrors({
    ...corePublication,
    body: corePublication.body.replace('| `direction` |', '| `initiatives` |'),
  }).some(message => message.includes('canonical type set')),
  'changing a core vocabulary type must fail the canonical type-set gate',
);
assert.ok(
  packPlan.publicationContractErrors({
    ...engineeringPublication,
    body: engineeringPublication.body.replace(
      '| `documentation` | `architecture` |',
      '| `documentation` | `security` |',
    ),
  }).some(message => message.includes('canonical subtype set')),
  'changing an engineering subtype must fail the canonical subtype-set gate',
);
assert.ok(
  packPlan.publicationContractErrors({
    ...creativePublication,
    body: creativePublication.body.replace(
      '.kai/creative/media/<id>/{drafts,evidence,scratch}',
      '.kai/creative/misc/<id>/{drafts,evidence,scratch}',
    ),
  }).some(message => message.includes('private form')),
  'introducing a fallback lane must fail the private-form gate',
);

for (const [label, phrase, expected] of [
  ['unknown type/subtype', 'unknown type or subtype', 'unknown type or subtype'],
  ['scratch publication', 'scratch can never publish', 'scratch'],
  ['unaccepted draft', 'an unaccepted draft can never publish', 'unaccepted draft'],
  ['private evidence', 'private evidence can never publish', 'private evidence'],
  ['arbitrary root', 'an arbitrary root can never publish', 'arbitrary root'],
]) {
  assert.ok(
    packPlan.publicationContractErrors({
      ...corePublication,
      body: corePublication.body.replace(new RegExp(phrase, 'i'), ''),
    }).some(message => message.includes(expected)),
    `removing the ${label} refusal must fail by refusal name`,
  );
}
assert.ok(
  packPlan.publicationContractErrors({
    ...creativePublication,
    body: creativePublication.body.replace('unsafe media destination', ''),
  }).some(message => message.includes('unsafe media destination')),
  'removing the unsafe-media refusal must fail by refusal name',
);

const sourceEntries = [
  ...packPlan.sourceAgentFiles(root),
  ...packPlan.sourceSkillFiles(root),
].map(entry => ({...entry, body: read(entry.path)}));
assert.ok(sourceEntries.length >= 50,
  `expected a non-vacuous shipped source corpus, found ${sourceEntries.length}`);

let producers = 0;
let nonProducers = 0;
for (const entry of sourceEntries) {
  const routes = packPlan.routedSkills(entry.body);
  if (routes.includes('kai-core-asset-producing')) producers += 1;
  else nonProducers += 1;
  assert.deepEqual(
    packPlan.publicationRoutingErrors(entry),
    [],
    `${entry.rel}: owning publication route and producer classification`,
  );
}
assert.ok(producers > 0, 'publication routing gate must inspect at least one producer');
assert.ok(nonProducers > 0, 'publication routing gate must inspect at least one non-producer');

const producer = sourceEntries.find(entry =>
  packPlan.routedSkills(entry.body).includes('kai-core-asset-producing'));
const ownerPublication = publicationByPack[producer.pack];
const withoutOwnerRoute = producer.body.replace(
  new RegExp(
    `(?:Apply|Invoke|Load|Run)\\s+(?:the\\s+)?\`${ownerPublication}\`[^.]*\\.\\s*`,
    'i',
  ),
  '',
);
assert.ok(
  packPlan.publicationRoutingErrors({...producer, body: withoutOwnerRoute})
    .some(message => message.includes(`must route \`${ownerPublication}\``)),
  'removing a producer publication route must fail by owning skill name',
);

const wrongPublication = producer.pack === 'creative'
  ? publicationByPack.engineering
  : publicationByPack.creative;
assert.ok(
  packPlan.publicationRoutingErrors({
    ...producer,
    body: producer.body.replace(ownerPublication, wrongPublication),
  }).some(message => message.includes('cannot route publication skill owned by')),
  'routing a department or core producer through another pack vocabulary must fail',
);

const separatedRoute = producer.body.replace(
  new RegExp(
    `(Apply|Invoke|Load|Run)\\s+(?:the\\s+)?\`${ownerPublication}\`([^.]*)\\.\\s*`
    + `(Apply|Invoke|Load|Run)\\s+(?:the\\s+)?\`kai-core-asset-producing\``,
    'i',
  ),
  `$1 \`${ownerPublication}\`$2. Apply \`kai-core-workspace-paths\`. `
    + '$3 `kai-core-asset-producing`',
);
assert.ok(
  packPlan.publicationRoutingErrors({...producer, body: separatedRoute})
    .some(message => message.includes('immediately before')),
  'inserting another routed contract between publication and production must fail order',
);

const nonProducer = sourceEntries.find(entry =>
  !packPlan.routedSkills(entry.body).includes('kai-core-asset-producing'));
assert.ok(
  packPlan.publicationRoutingErrors({
    ...nonProducer,
    body: `${nonProducer.body}\n\nApply \`${publicationByPack[nonProducer.pack]}\` for later use.\n`,
  }).some(message => message.includes('non-producer')),
  'adding a publication route to a non-producer must fail classification',
);

const shippedLanguageErrors = sourceEntries.flatMap(entry =>
  packPlan.activeWorkspaceLanguageErrors(entry)
    .map(message => `${entry.rel}: ${message}`));
assert.deepEqual(shippedLanguageErrors, [],
  'shipped agents and skills must use only live schema-5 workspace/work language');

for (const mutation of [
  'Write the draft to `.kai/runs/reports/demo.md`.',
  'Use `kai-core-work-item` before the next write.',
  'Create a new initiative record.',
  'Set `placement: "shared"` for collaboration.',
  'Append the coordinated work item to `.kai/state/items/demo.md`.',
]) {
  assert.ok(
    packPlan.activeWorkspaceLanguageErrors({
      rel: 'mutation.md',
      body: mutation,
    }).length > 0,
    `active-language mutation must fail: ${mutation}`,
  );
}

const authoritySources = [
  ['kai-core-work-hierarchy', skillPath('core', 'kai-core-work-hierarchy')],
  ['kai-core-work-stewardship', skillPath('core', 'kai-core-work-stewardship')],
  ['kai-core-work-task', skillPath('core', 'kai-core-work-task')],
  ['kai-core-work-acting', skillPath('core', 'kai-core-work-acting')],
  ['kai-core-work-granting', skillPath('core', 'kai-core-work-granting')],
  ['director-chief-of-staff', agentPath('core', 'director-chief-of-staff')],
];
for (const [id, path] of authoritySources) {
  assert.ok(existsSync(path), `${id}: expected source ${path}`);
  const body = read(path);
  assert.match(body, /\.kai\/core\/runtime\/coordination\.sqlite/,
    `${id}: names the schema-5 SQLite coordination authority`);
  assert.match(body, /only\s+coordination\s+authority/i,
    `${id}: states that SQLite is the only coordination authority`);
  assert.deepEqual(packPlan.markdownCoordinationAuthorityErrors({id, body}), [],
    `${id}: no Markdown board/backlog/milestone/thread/item/initiative log is authoritative`);
}
assert.ok(
  packPlan.markdownCoordinationAuthorityErrors({
    id: 'mutation',
    body: '`BOARD.md` is the authoritative coordination backlog; append every Task there.',
  }).some(message => message.includes('Markdown coordination authority')),
  'restoring an authoritative Markdown board must fail by gate name',
);

const directionSources = [
  ['kai-core-workspace-paths', skillPath('core', 'kai-core-workspace-paths')],
  ['kai-core-workspace-onboarding', skillPath('core', 'kai-core-workspace-onboarding')],
  ['workflow-workspace-init', agentPath('core', 'workflow-workspace-init')],
];
for (const [id, path] of directionSources) {
  assert.deepEqual(packPlan.directionContractErrors({id, body: read(path)}), [],
    `${id}: Direction requires Vision, Mission, one observable time-bounded Current Goal, and Out of Scope`);
}
assert.ok(
  packPlan.directionContractErrors({
    id: 'mutation',
    body: read(directionSources[0][1]).replace('Mission', 'Purpose'),
  }).some(message => message.includes('Mission')),
  'removing Mission from the Direction contract must fail by section name',
);

const epicPath = agentPath('core', 'workflow-epic-init');
assert.ok(existsSync(epicPath), 'workflow-epic-init must replace workflow-initiative-init');
const epic = read(epicPath);
assert.deepEqual(packPlan.epicWorkflowContractErrors({
  id: 'workflow-epic-init',
  body: epic,
}), [], 'workflow-epic-init: Direction and named-authority proposal boundary');
assert.ok(
  packPlan.epicWorkflowContractErrors({
    id: 'mutation',
    body: epic.replace(/creates no record before\s+named authority approval/i, ''),
  }).some(message => message.includes('no record before named authority approval')),
  'allowing Epic creation before named authority approval must fail by gate name',
);

for (const id of ['kai-core-work-hierarchy', 'kai-core-work-stewardship']) {
  const body = read(skillPath('core', id));
  assert.match(body,
    /suggestion[\s\S]{0,160}conversational[\s\S]{0,160}named authority/i,
    `${id}: unapproved suggestions remain conversational`);
}

const director = read(agentPath('core', 'director-chief-of-staff'));
assert.deepEqual(packPlan.chiefOfStaffContractErrors({
  id: 'director-chief-of-staff',
  body: director,
}), [], 'Chief of Staff grants Tasks only and cannot invent hierarchy authority');
assert.ok(
  packPlan.chiefOfStaffContractErrors({
    id: 'mutation',
    body: director.replace('cannot invent', 'may invent'),
  }).some(message => message.includes('cannot invent')),
  'letting Chief of Staff invent hierarchy scope must fail by boundary name',
);

const workspacesGuide = read(join(root, 'docs', 'workspaces.md'));
assert.deepEqual(packPlan.activeWorkspaceLanguageErrors({
  rel: 'docs/workspaces.md',
  body: workspacesGuide,
}), [], 'the current workspace guide must present schema 5 as the live contract');
assert.match(workspacesGuide, /explicit[\s\S]{0,120}schema[- ]5 migration/i,
  'the current workspace guide routes old workspaces through explicit migration');

const validator = read(join(root, 'tools', 'validate-plugin.mjs'));
assert.match(validator, /publicationInventoryErrors/,
  'validate-plugin must run the publication inventory gate');
assert.doesNotMatch(validator, /fixture "storage_mode" must be "shared"/,
  'validate-plugin must not enforce retired shared placement as a live fixture');
assert.doesNotMatch(validator, /could not locate the manifest "areas" list/,
  'validate-plugin must not enforce retired generic run areas');

console.log(
  `coordination source routing assertions passed `
  + `(sources=${sourceEntries.length}, producers=${producers}, non-producers=${nonProducers}, `
  + `publication tables=${publicationSources.length}, authority sources=${authoritySources.length})`,
);
