import assert from 'node:assert/strict';
import test from 'node:test';
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
});
