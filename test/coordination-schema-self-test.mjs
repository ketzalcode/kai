import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {mkdirSync, readFileSync, rmSync, writeFileSync} from 'node:fs';
import {dirname, join} from 'node:path';
import test from 'node:test';
import {fileURLToPath} from 'node:url';
import {
  COMMAND_KINDS as CONTRACT_COMMAND_KINDS,
  RECORD_KINDS as CONTRACT_RECORD_KINDS,
} from '../src/core/lib/coordination-runtime/contract.mjs';
import {
  COORDINATION_SCHEMA,
  COMMAND_KINDS,
  RECORD_KINDS,
  commandKind,
  recordKind,
} from '../src/core/lib/coordination-runtime/schema.mjs';
import {parentHandlers} from '../src/core/lib/coordination-runtime/hierarchy-engine.mjs';
import {taskHandlers} from '../src/core/lib/coordination-runtime/task-engine.mjs';
import {
  registerArtifact,
  registerEvidence,
  recordApproval,
  recordReview,
  transitionAsset,
} from '../src/core/lib/coordination-runtime/evidence.mjs';
import {
  recordAttempt,
  recordEffect,
  recordHostResult,
} from '../src/core/lib/coordination-runtime/host.mjs';
import {PACKS} from '../src/core/lib/coordination-runtime/contract-primitives.mjs';
import {PACK_ORDER} from '../src/core/lib/pack-names.mjs';
import {WORKSPACE_CONTRACT} from '../src/core/lib/workspace-layout.mjs';
import * as packPlan from '../tools/lib/pack-plan.mjs';

const repositoryRoot = join(dirname(fileURLToPath(import.meta.url)), '..');

const expectedRecords = [
  'approval',
  'artifact',
  'asset',
  'attempt',
  'effect',
  'epic',
  'evidence',
  'feature',
  'grant',
  'host-attempt',
  'message',
  'question',
  'requirement',
  'review',
  'task',
];

const expectedCommands = [
  'approval.record',
  'artifact.register',
  'asset.transition',
  'attempt.recover',
  'attempt.result',
  'attempt.start',
  'effect.intent',
  'effect.result',
  'epic.activate',
  'epic.complete',
  'epic.create',
  'epic.hold',
  'epic.release',
  'epic.update',
  'evidence.register',
  'feature.activate',
  'feature.complete',
  'feature.create',
  'feature.hold',
  'feature.release',
  'feature.update',
  'question.answer',
  'question.open',
  'requirement.activate',
  'requirement.complete',
  'requirement.create',
  'requirement.hold',
  'requirement.release',
  'requirement.update',
  'review.record',
  'task.create',
  'task.grant',
  'task.handoff',
  'task.promote',
  'task.restore',
  'task.transition',
  'task.update',
];

const dedicatedHandlers = new Map([
  ['artifact.register', registerArtifact],
  ['asset.transition', transitionAsset],
  ['evidence.register', registerEvidence],
  ['review.record', recordReview],
  ['approval.record', recordApproval],
  ['attempt.start', recordAttempt],
  ['attempt.result', recordHostResult],
  ['effect.intent', recordEffect],
  ['effect.result', recordEffect],
]);
const handlers = new Map([...parentHandlers, ...taskHandlers, ...dedicatedHandlers]);

test('coordination registry is the complete executable schema-5 declaration', () => {
  assert.deepEqual([...COORDINATION_SCHEMA.records.keys()].sort(), expectedRecords);
  assert.deepEqual([...COORDINATION_SCHEMA.commands.keys()].sort(), expectedCommands);

  for (const [kind, record] of COORDINATION_SCHEMA.records) {
    assert.ok(record.validator, `${kind} declares one validator`);
    assert.equal(recordKind(kind), record);
  }

  for (const [kind, command] of COORDINATION_SCHEMA.commands) {
    assert.ok(command.subjectKind, `${kind} declares its subject kind`);
    assert.ok(command.authority, `${kind} declares its authority policy`);
    assert.ok(command.validator, `${kind} declares its validator`);
    assert.ok(command.handler, `${kind} declares its handler`);
    assert.ok(Array.isArray(command.allowedMutations),
      `${kind} declares its allowed mutations`);
    assert.equal(typeof handlers.get(command.handler), 'function',
      `${kind} handler ${command.handler} resolves`);
    assert.equal(commandKind(kind), command);
  }
});

test('coordination registry views and declarations reject mutation', () => {
  const expectRefusal = (mutate, restore) => {
    let error = null;
    try {
      mutate();
    } catch (caught) {
      error = caught;
    }
    restore();
    assert.match(error?.message ?? '', /read-only/i);
  };

  expectRefusal(
    () => COORDINATION_SCHEMA.records.set('initiative', {validator: 'hierarchy'}),
    () => {
      if (COORDINATION_SCHEMA.records.has('initiative')) {
        COORDINATION_SCHEMA.records.delete('initiative');
      }
    },
  );
  const taskCreate = commandKind('task.create');
  expectRefusal(
    () => COORDINATION_SCHEMA.commands.delete('task.create'),
    () => {
      if (!COORDINATION_SCHEMA.commands.has('task.create')) {
        COORDINATION_SCHEMA.commands.set('task.create', taskCreate);
      }
    },
  );
  expectRefusal(
    () => RECORD_KINDS.add('initiative'),
    () => {
      if (RECORD_KINDS.has('initiative')) RECORD_KINDS.delete('initiative');
    },
  );
  expectRefusal(
    () => COMMAND_KINDS.delete('task.create'),
    () => {
      if (!COMMAND_KINDS.has('task.create')) COMMAND_KINDS.add('task.create');
    },
  );

  assert.throws(() => {
    recordKind('task').validator = 'host';
  }, TypeError);
  assert.throws(() => commandKind('task.create').authority.push('host'), TypeError);

  assert.equal(recordKind('initiative'), null);
  assert.ok(commandKind('task.create'));
  assert.equal(RECORD_KINDS.has('initiative'), false);
  assert.equal(COMMAND_KINDS.has('task.create'), true);
});

test('contract sets are registry views without historical planning aliases', () => {
  assert.deepEqual([...RECORD_KINDS].sort(), expectedRecords);
  assert.deepEqual([...COMMAND_KINDS].sort(), expectedCommands);
  assert.deepEqual([...CONTRACT_RECORD_KINDS].sort(), expectedRecords);
  assert.deepEqual([...CONTRACT_COMMAND_KINDS].sort(), expectedCommands);
  assert.equal(recordKind('initiative'), null);
  assert.equal(recordKind('item'), null);
  assert.equal(commandKind('initiative.create'), null);
  assert.equal(commandKind('item.create'), null);
});

test('workspace contract owns the published package declarations', () => {
  assert.equal(PACK_ORDER, WORKSPACE_CONTRACT.packs);
  assert.deepEqual([...PACKS], [...WORKSPACE_CONTRACT.packs]);
  assert.equal(packPlan.PACK_ORDER, WORKSPACE_CONTRACT.packs);
  assert.deepEqual(Object.keys(packPlan.PACKS), [...WORKSPACE_CONTRACT.packs]);

  const discovered = packPlan.sourceAgentFiles()
    .reduce((byPack, entry) => {
      byPack[entry.pack].push(entry.id);
      return byPack;
    }, Object.fromEntries(WORKSPACE_CONTRACT.packs.map(pack => [pack, []])));
  for (const pack of WORKSPACE_CONTRACT.packs) {
    assert.deepEqual([...packPlan.PACKS[pack]].sort(), discovered[pack].sort(),
      `${pack} agent declarations come from its owning package directory`);
  }

  const readme = readFileSync(join(repositoryRoot, 'README.md'), 'utf8');
  assert.match(
    readme,
    new RegExp(`\\*\\*${packPlan.sourceAgentFiles(repositoryRoot).length} agents and `
      + `${packPlan.sourceSkillFiles(repositoryRoot).length} skills\\*\\*`),
  );

  const plan = packPlan.planPacks(repositoryRoot);
  assert.ok(plan.core.includes('kai-core-workspace-reonboard'));
  const materialized = packPlan.materializePacks({
    root: repositoryRoot,
    packs: ['core'],
  });
  assert.deepEqual(
    packPlan.packProviders(materialized).get('skill:kai-core-workspace-reonboard'),
    ['core'],
  );
});

test('skill ownership follows the physical package directory without use inference', () => {
  const root = join(repositoryRoot, 'test', `.task-5-root-${randomUUID()}`);
  const write = (relativePath, body) => {
    const path = join(root, ...relativePath.split('/'));
    mkdirSync(dirname(path), {recursive: true});
    writeFileSync(path, body);
  };

  try {
    write('plugins/kai-core/agents/alt-core.agent.md', [
      '---',
      'name: alt-core',
      'description: "Alternate-root core agent."',
      'tools: [read, skill]',
      '---',
      '',
      'Load `engineering-physical-skill`.',
      '',
    ].join('\n'));
    write('plugins/kai-core/skills/kai-core-physical-skill/SKILL.md', [
      '---',
      'name: kai-core-physical-skill',
      'description: "Unreferenced core skill."',
      '---',
      '',
    ].join('\n'));
    write('plugins/kai-engineering/agents/eng-builder-alt.agent.md', [
      '---',
      'name: eng-builder-alt',
      'description: "Alternate-root engineering agent."',
      'tools: [read, skill]',
      '---',
      '',
      'Load `kai-core-physical-skill`.',
      '',
    ].join('\n'));
    write('plugins/kai-engineering/skills/engineering-physical-skill/SKILL.md', [
      '---',
      'name: engineering-physical-skill',
      'description: "Engineering-owned skill used by core."',
      '---',
      '',
    ].join('\n'));

    const plan = packPlan.planPacks(root);
    assert.deepEqual(plan.core, ['kai-core-physical-skill']);
    assert.deepEqual(plan.local.engineering, ['engineering-physical-skill']);
    assert.deepEqual(plan.local.creative, []);

    const manifests = packPlan.planManifests({root});
    assert.deepEqual(
      manifests.find(entry => entry.pack === 'core').agents,
      ['alt-core'],
    );
    assert.deepEqual(
      manifests.find(entry => entry.pack === 'engineering').agents,
      ['eng-builder-alt'],
    );

    const references = packPlan.collectReferences(root);
    assert.ok(references.length > 0);
    assert.ok(references.every(reference => reference.from.startsWith('plugins/')));
    assert.ok(references.every(reference => !reference.from.includes('director-chief-of-staff')));
    assert.equal(
      references.find(reference => reference.target === 'kai-core-physical-skill').fromPack,
      'engineering',
    );

    const materialized = packPlan.materializePacks({
      root,
      packs: ['engineering'],
    });
    assert.ok(materialized.has('kai-engineering/agents/eng-builder-alt.agent.md'));
    assert.ok(materialized.has(
      'kai-engineering/skills/engineering-physical-skill/SKILL.md',
    ));
    assert.equal(
      [...materialized.keys()].some(key => key.includes('eng-builder-platform')),
      false,
    );
  } finally {
    rmSync(root, {recursive: true, force: true});
  }
});
