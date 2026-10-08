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
  'durableOutputProducerDeclaration',
  'agentDirectOutputErrors',
  'activeGuideDecisionFiles',
  'workflowShipContractErrors',
  'stewardshipAuthorityErrors',
  'webOutputContractErrors',
  'directModeContractErrors',
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

const agentEntries = sourceEntries.filter(entry => entry.kind === 'agent');
const skillEntries = sourceEntries.filter(entry => entry.kind === 'skill');
const declarationCounts = {
  agent: {producers: 0, nonProducers: 0},
  skill: {producers: 0, nonProducers: 0},
};
for (const entry of sourceEntries) {
  const declared = packPlan.durableOutputProducerDeclaration(entry);
  assert.equal(typeof declared, 'boolean',
    `${entry.rel}: frontmatter must declare durable-output-producer true or false`);
  if (declared) declarationCounts[entry.kind].producers += 1;
  else declarationCounts[entry.kind].nonProducers += 1;
  if (entry.kind === 'agent') {
    assert.deepEqual(
      packPlan.agentDirectOutputErrors(entry),
      [],
      `${entry.rel}: direct output and durable Kai authority boundary`,
    );
  }
  assert.deepEqual(
    packPlan.publicationRoutingErrors(entry),
    [],
    `${entry.rel}: owning publication route and producer classification`,
  );
}
for (const kind of ['agent', 'skill']) {
  assert.ok(declarationCounts[kind].producers > 0,
    `publication routing gate must inspect at least one declared ${kind} producer`);
  assert.ok(declarationCounts[kind].nonProducers > 0,
    `publication routing gate must inspect at least one declared ${kind} non-producer`);
}

for (const [kind, entries] of [
  ['agent', agentEntries],
  ['skill', skillEntries],
]) {
  const producer = entries.find(entry =>
    packPlan.durableOutputProducerDeclaration(entry) === true);
  const ownerPublication = publicationByPack[producer.pack];
  const withoutOwnerRoute = producer.body.replace(
    new RegExp(
      `(?:Apply|Invoke|Load|Run)\\s+(?:the\\s+)?\`${ownerPublication}\``,
      'i',
    ),
    '',
  );
  assert.ok(
    packPlan.publicationRoutingErrors({...producer, body: withoutOwnerRoute})
      .some(message => message.includes(`must route \`${ownerPublication}\``)),
    `removing a ${kind} producer publication route must fail by owning skill name`,
  );

  const withoutBothRoutes = producer.body
    .replace(
      new RegExp(
        `(?:Apply|Invoke|Load|Run)\\s+(?:the\\s+)?\`${ownerPublication}\`[^.]*\\.\\s*`,
        'gi',
      ),
      '',
    )
    .replace(
      /(?:Apply|Invoke|Load|Run)\s+(?:the\s+)?`kai-core-asset-producing`[^.]*\.\s*/gi,
      '',
    );
  assert.ok(
    packPlan.publicationRoutingErrors({...producer, body: withoutBothRoutes})
      .some(message => message.includes('declared durable-output producer')),
    `removing both ${kind} production routes must fail from the authoritative declaration`,
  );

  assert.ok(
    packPlan.publicationRoutingErrors({
      ...producer,
      body: producer.body.replace(
        'durable-output-producer: true',
        'durable-output-producer: false',
      ),
    }).some(message => message.includes('declared non-producer')),
    `falsifying the ${kind} producer declaration must fail while producer routes remain`,
  );
  assert.ok(
    packPlan.publicationRoutingErrors({
      ...producer,
      body: producer.body.replace(/^durable-output-producer:\s*true\s*$/m, ''),
    }).some(message => message.includes('must declare frontmatter')),
    `removing the ${kind} producer declaration must fail by declaration name`,
  );

  const wrongPublication = producer.pack === 'creative'
    ? publicationByPack.engineering
    : publicationByPack.creative;
  assert.ok(
    packPlan.publicationRoutingErrors({
      ...producer,
      body: producer.body.replace(ownerPublication, wrongPublication),
    }).some(message => message.includes('cannot route publication skill owned by')),
    `routing a ${kind} producer through another pack vocabulary must fail`,
  );

  const separatedRoute = producer.body.replace(
    /(?:Apply|Invoke|Load|Run)\s+(?:the\s+)?`kai-core-asset-producing`/i,
    'Apply `kai-core-workspace-paths`, then Apply `kai-core-asset-producing`',
  );
  assert.ok(
    packPlan.publicationRoutingErrors({...producer, body: separatedRoute})
      .some(message => message.includes('immediately before')),
    `inserting another route between ${kind} publication and production must fail order`,
  );

  const nonProducer = entries.find(entry =>
    packPlan.durableOutputProducerDeclaration(entry) === false);
  assert.ok(
    packPlan.publicationRoutingErrors({
      ...nonProducer,
      body: `${nonProducer.body}\n\nApply \`${publicationByPack[nonProducer.pack]}\`, then apply \`kai-core-asset-producing\`.\n`,
    }).some(message => message.includes('declared non-producer')),
    `adding both durable routes to a declared ${kind} non-producer must fail classification`,
  );
}

const producer = agentEntries.find(entry =>
  packPlan.durableOutputProducerDeclaration(entry) === true);

assert.ok(
  packPlan.agentDirectOutputErrors({
    ...producer,
    body: producer.body.replace('existing typed hierarchy subject', 'new report request'),
  }).some(message => message.includes('existing typed hierarchy subject')),
  'removing the typed-subject gate from a durable direct-output branch must fail',
);
assert.ok(
  packPlan.agentDirectOutputErrors({
    ...producer,
    body: producer.body.replace(
      'Direct work may return only inline or repository-native output.',
      'Direct work may register a durable Kai report.',
    ),
  }).some(message => message.includes('inline or repository-native')),
  'allowing direct work to register durable Kai output must fail',
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

const activeDocs = packPlan.activeGuideDecisionFiles(root)
  .map(entry => ({...entry, body: read(entry.path)}));
assert.ok(activeDocs.length >= 10,
  `active guide/decision scan must be non-vacuous, found ${activeDocs.length}`);
for (const required of [
  'AGENTS.md',
  'README.md',
  'docs/reference/agent-authoring/README.md',
  'docs/reference/agents-and-skills.md',
  'docs/kai/decisions/workspace-schema-3.md',
  'docs/kai/decisions/asset-lifecycle.md',
]) {
  assert.ok(activeDocs.some(entry => entry.rel === required),
    `active guide/decision scan must include ${required}`);
}
for (const historical of [
  'docs/superpowers/specs/2026-10-02-composable-workspace-design.md',
  'docs/proposals/agent-contract-refactor.md',
  'docs/kai/reports/releases/2026-08-24/01-ship-pack-split-generator-gates/ship-record.md',
  'docs/reference/skill-evaluation/coding-foundation-authoring.md',
]) {
  assert.ok(existsSync(join(root, ...historical.split('/'))),
    `historical exclusion fixture must exist: ${historical}`);
  assert.ok(!activeDocs.some(entry => entry.rel === historical),
    `active guide/decision scan must retain the historical exclusion for ${historical}`);
}
for (const entry of activeDocs) {
  assert.deepEqual(packPlan.activeWorkspaceLanguageErrors(entry), [],
    `${entry.rel}: active guide/decision must use schema-5 language`);
  assert.deepEqual(packPlan.markdownCoordinationAuthorityErrors(entry), [],
    `${entry.rel}: active guide/decision must keep SQLite authoritative`);
}
const activeDocMutation = {
  ...activeDocs.find(entry => entry.rel === 'docs/reference/agent-authoring/README.md'),
};
assert.ok(packPlan.activeWorkspaceLanguageErrors({
  ...activeDocMutation,
  body: `${activeDocMutation.body}\nCreate a work item under \`.kai/state/items/demo.md\`.\n`,
}).length >= 2,
  'restoring schema-4 language in any active guide must fail the corpus-wide scan');
for (const phrase of [
  'Generated coordination state validates item schemas before use.',
  'Release assessment requires a coordination item before transition.',
  'Current coordination examples identify the item owners.',
]) {
  assert.ok(
    packPlan.activeWorkspaceLanguageErrors({
      ...activeDocMutation,
      body: `${activeDocMutation.body}\n${phrase}\n`,
    }).some(message => message.includes('generic coordination item semantics')),
    `active guide mutation must reject schema-4 semantic phrase: ${phrase}`,
  );
}
assert.deepEqual(packPlan.activeWorkspaceLanguageErrors({
  body: 'Catalog item owners maintain JSON item schemas for storefront imports.',
}), [], 'ordinary non-coordination English must not trigger schema-4 semantic validation');
assert.deepEqual(packPlan.activeWorkspaceLanguageErrors({
  body: '<!-- kai:schema4-history -->\n'
    + 'Generated coordination state used item schemas and a coordination item with item owners.\n'
    + '<!-- /kai:schema4-history -->',
}), [], 'explicit historical text must not trigger active schema-5 semantic validation');

const workspacesGuide = read(join(root, 'docs', 'workspaces.md'));
assert.match(workspacesGuide, /explicit[\s\S]{0,120}schema[- ]5 migration/i,
  'the current workspace guide routes old workspaces through explicit migration');
const supersededWorkspaceDecision = read(
  join(root, 'docs', 'kai', 'decisions', 'workspace-schema-3.md'),
);
assert.match(supersededWorkspaceDecision, /status:\s*superseded/i,
  'the schema-3 decision must be explicitly superseded');
assert.match(supersededWorkspaceDecision, /\.\.\/\.\.\/workspaces\.md/,
  'the schema-3 decision must link to the current workspace contract');

const workflowShip = read(agentPath('engineering', 'workflow-ship'));
assert.deepEqual(packPlan.workflowShipContractErrors({body: workflowShip}), [],
  'workflow-ship must block failures and restore the recorded original state');
assert.ok(packPlan.workflowShipContractErrors({
  body: workflowShip.replace(
    /resumes the\s+recorded allowed original state/i,
    'returns the Task to release-ready',
  ),
}).some(message => message.includes('never rewind to release-ready')),
'workflow-ship mutation must reject a release-ready rewind claim');
assert.ok(packPlan.workflowShipContractErrors({
  body: workflowShip.replace('release Task', 'release item'),
}).some(message => message.includes('generic item')),
'workflow-ship mutation must reject generic executable-record language');

const stewardship = read(skillPath('core', 'kai-core-work-stewardship'));
assert.deepEqual(packPlan.stewardshipAuthorityErrors({body: stewardship}), [],
  'stewardship authority table must match runtime and design');
assert.ok(packPlan.stewardshipAuthorityErrors({
  body: stewardship.replace(
    'Feature owner or delegated pack/scope authority',
    'Feature scope authority',
  ),
}).some(message => message.includes('Requirement proposal')),
'stewardship mutation must reject the wrong Requirement proposal authority');

for (const id of ['kai-core-web-evaluation', 'kai-core-web-content-extraction']) {
  const body = read(skillPath('core', id));
  assert.deepEqual(packPlan.webOutputContractErrors({id, body}), [],
    `${id}: typed private/public path and collision-safe report ID`);
}
const webEvaluation = read(skillPath('core', 'kai-core-web-evaluation'));
const evaluationIdGrammar = 'web-evaluation-<YYYYMMDD>-<NN>-<descriptor>';
assert.ok(webEvaluation.includes(evaluationIdGrammar),
  'web evaluation must declare the exact date/sequence/descriptor ID grammar');
assert.ok(packPlan.webOutputContractErrors({
  id: 'kai-core-web-evaluation',
  body: webEvaluation
    .replace(
      `.kai/core/reports/${evaluationIdGrammar}/`,
      `<working-root>/qa/${evaluationIdGrammar}/`,
    ),
}).some(message => message.includes('typed core report path')),
'web evaluation mutation must reject the retired QA working root');
assert.ok(packPlan.webOutputContractErrors({
  id: 'kai-core-web-evaluation',
  body: webEvaluation.replace(
    `.kai/core/reports/${evaluationIdGrammar}/{drafts,evidence,scratch}`,
    '.kai/core/reports/web-evaluation-<artifact-id>/{drafts,evidence,scratch}',
  ),
}).some(message => message.includes('exact web-evaluation ID grammar')),
'web evaluation mutation must reject private/public grammar drift');
assert.ok(packPlan.webOutputContractErrors({
  id: 'kai-core-web-evaluation',
  body: webEvaluation.replace(
    'Every rerun allocates a new `<NN>` and never reuses an earlier ID.',
    'Every rerun reuses the previous report ID.',
  ),
}).some(message => message.includes('grammar/prose drift')),
'web evaluation mutation must reject rerun prose that contradicts the ID grammar');
assert.ok(packPlan.webOutputContractErrors({
  id: 'kai-core-web-content-extraction',
  body: read(skillPath('core', 'kai-core-web-content-extraction'))
    .replace('<artifact-id>', '<NN>'),
}).some(message => message.includes('collision-safe typed ID')),
'web extraction mutation must reject an unrepresented sequential run directory');

const granting = read(skillPath('core', 'kai-core-work-granting'));
assert.deepEqual(packPlan.directModeContractErrors({body: granting}), [],
  'direct mode must use the direct runtime verb and require coordinationRequired:false');
assert.ok(packPlan.directModeContractErrors({
  body: granting.replace(' direct --root ', ' inspect --root '),
}).some(message => message.includes('`direct` runtime verb')),
'direct-mode mutation must reject inspect as authorization');

const validator = read(join(root, 'tools', 'validate-plugin.mjs'));
assert.match(validator, /publicationInventoryErrors/,
  'validate-plugin must run the publication inventory gate');
assert.match(validator, /activeGuideDecisionFiles/,
  'validate-plugin must scan the complete active guide/decision corpus');
assert.doesNotMatch(validator, /fixture "storage_mode" must be "shared"/,
  'validate-plugin must not enforce retired shared placement as a live fixture');
assert.doesNotMatch(validator, /could not locate the manifest "areas" list/,
  'validate-plugin must not enforce retired generic run areas');

console.log(
  `coordination source routing assertions passed `
  + `(sources=${sourceEntries.length}, agent producers=${declarationCounts.agent.producers}, `
  + `agent non-producers=${declarationCounts.agent.nonProducers}, `
  + `skill producers=${declarationCounts.skill.producers}, `
  + `skill non-producers=${declarationCounts.skill.nonProducers}, active docs=${activeDocs.length}, `
  + `publication tables=${publicationSources.length}, authority sources=${authoritySources.length})`,
);
