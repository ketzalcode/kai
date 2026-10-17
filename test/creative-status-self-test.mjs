import assert from 'node:assert/strict';
import test, { after } from 'node:test';
import { mkdtempSync, writeFileSync, existsSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import {
  DESCRIPTOR_SCHEMA,
  RECEIPTS_SCHEMA,
  parseDescriptor,
  loadReceipts,
  recordStage,
  computeStageStatus,
  buildProductionReport,
  hashFile,
} from '../src/creative/demo-status.mjs';

const fixtureDirs = [];
after(() => fixtureDirs.forEach((dir) => rmSync(dir, { recursive: true, force: true })));

function makeFixture() {
  const dir = mkdtempSync(join(tmpdir(), 'demo-status-test-'));
  fixtureDirs.push(dir);
  const screenplay = join(dir, 'screenplay.json');
  const take = join(dir, 'take.json');
  const plan = join(dir, 'plan.json');
  const render = join(dir, 'render.mp4');
  writeFileSync(screenplay, 'screenplay-v1');
  writeFileSync(take, 'take-v1');
  writeFileSync(plan, 'plan-v1');
  writeFileSync(render, 'render-v1');
  const receiptsPath = join(dir, 'receipts.json');
  const descriptor = parseDescriptor(JSON.stringify({
    schema: DESCRIPTOR_SCHEMA,
    stages: [
      { stage: 'screenplay', output: screenplay },
      { stage: 'take', output: take, inputs: [screenplay] },
      { stage: 'placement', output: plan, inputs: [screenplay, take] },
      { stage: 'render', output: render, inputs: [plan] },
      { stage: 'music', output: join(dir, 'music-acceptance.json'), inputs: [], optional: true },
    ],
  }));
  return { dir, screenplay, take, plan, render, receiptsPath, descriptor };
}

test('descriptor rejects a duplicate stage name', () => {
  assert.throws(() => parseDescriptor(JSON.stringify({
    schema: DESCRIPTOR_SCHEMA,
    stages: [{ stage: 'a', output: 'x' }, { stage: 'a', output: 'y' }],
  })), /used twice/);
});

test('loadReceipts returns an empty store when no file exists yet', () => {
  const fx = makeFixture();
  const receipts = loadReceipts(join(fx.dir, 'missing-receipts.json'));
  assert.equal(receipts.schema, RECEIPTS_SCHEMA);
  assert.deepEqual(receipts.stages, {});
});

test('a stage with no output yet reports pending', () => {
  const fx = makeFixture();
  const receipts = loadReceipts(fx.receiptsPath);
  const status = computeStageStatus(fx.descriptor.find((s) => s.stage === 'music'), receipts);
  assert.equal(status.status, 'pending');
  assert.equal(status.optional, true);
});

test('an output file with no receipt is reported unknown, never complete', () => {
  const fx = makeFixture();
  const receipts = loadReceipts(fx.receiptsPath);
  const status = computeStageStatus(fx.descriptor.find((s) => s.stage === 'screenplay'), receipts);
  assert.equal(status.status, 'unknown');
});

test('recordStage persists a receipt keyed to the exact output and input bytes', () => {
  const fx = makeFixture();
  const stored = recordStage(fx.receiptsPath, 'screenplay', { output: fx.screenplay, status: 'ok' });
  assert.equal(stored.output_hash, hashFile(fx.screenplay));
  const receipts = loadReceipts(fx.receiptsPath);
  assert.ok(receipts.stages.screenplay);
});

test('recordStage refuses to record ok for an output that does not exist', () => {
  const fx = makeFixture();
  assert.throws(() => recordStage(fx.receiptsPath, 'ghost', { output: join(fx.dir, 'ghost.json'), status: 'ok' }), /does not exist/);
});

test('a recorded, unchanged stage reports complete', () => {
  const fx = makeFixture();
  recordStage(fx.receiptsPath, 'screenplay', { output: fx.screenplay, status: 'ok' });
  const receipts = loadReceipts(fx.receiptsPath);
  const status = computeStageStatus(fx.descriptor.find((s) => s.stage === 'screenplay'), receipts);
  assert.equal(status.status, 'complete');
});

test('a recorded stage whose output changed afterward reports unknown, not complete', () => {
  const fx = makeFixture();
  recordStage(fx.receiptsPath, 'screenplay', { output: fx.screenplay, status: 'ok' });
  writeFileSync(fx.screenplay, 'screenplay-v2-edited');
  const receipts = loadReceipts(fx.receiptsPath);
  const status = computeStageStatus(fx.descriptor.find((s) => s.stage === 'screenplay'), receipts);
  assert.equal(status.status, 'unknown');
});

test('a recorded stage whose declared input changed afterward reports stale', () => {
  const fx = makeFixture();
  recordStage(fx.receiptsPath, 'screenplay', { output: fx.screenplay, status: 'ok' });
  recordStage(fx.receiptsPath, 'take', { output: fx.take, inputs: [fx.screenplay], status: 'ok' });
  writeFileSync(fx.screenplay, 'screenplay-v2-edited');
  const receipts = loadReceipts(fx.receiptsPath);
  // screenplay itself is now unknown (its own output changed)...
  const screenplayStatus = computeStageStatus(fx.descriptor.find((s) => s.stage === 'screenplay'), receipts);
  assert.equal(screenplayStatus.status, 'unknown');
  // ...and "take", which was built from the old screenplay bytes, is stale rather than complete.
  const takeStatus = computeStageStatus(fx.descriptor.find((s) => s.stage === 'take'), receipts);
  assert.equal(takeStatus.status, 'stale');
});

test('a recorded failure with unchanged inputs stays failed, not pending', () => {
  const fx = makeFixture();
  writeFileSync(fx.render, '');
  recordStage(fx.receiptsPath, 'render', { output: fx.plan, inputs: [fx.plan], status: 'failed', note: 'ffmpeg exited non-zero' });
  const receipts = loadReceipts(fx.receiptsPath);
  const status = computeStageStatus({ stage: 'render', output: fx.render, inputs: [fx.plan], optional: false }, receipts);
  assert.equal(status.status, 'failed');
});

test('a recorded failure whose inputs since changed is reported pending, inviting a fresh attempt', () => {
  const fx = makeFixture();
  recordStage(fx.receiptsPath, 'render', { output: fx.plan, inputs: [fx.plan], status: 'failed' });
  writeFileSync(fx.plan, 'plan-v2-fixed');
  const receipts = loadReceipts(fx.receiptsPath);
  const status = computeStageStatus({ stage: 'render', output: join(fx.dir, 'no-render-yet.mp4'), inputs: [fx.plan], optional: false }, receipts);
  assert.equal(status.status, 'pending');
});

test('buildProductionReport names a concrete, non-automatic next action per unresolved stage', () => {
  const fx = makeFixture();
  recordStage(fx.receiptsPath, 'screenplay', { output: fx.screenplay, status: 'ok' });
  const receipts = loadReceipts(fx.receiptsPath);
  const report = buildProductionReport(fx.descriptor, receipts);
  const byStage = Object.fromEntries(report.stages.map((s) => [s.stage, s.status]));
  assert.equal(byStage.screenplay, 'complete');
  assert.equal(byStage.take, 'unknown');
  assert.equal(byStage.music, 'pending');
  assert.equal(report.all_complete, false);
  const takeAction = report.pending_operations.find((p) => p.stage === 'take');
  assert.match(takeAction.action, /verify "take" manually/);
  const musicAction = report.pending_operations.find((p) => p.stage === 'music');
  assert.match(musicAction.action, /before running "music"/);
});

test('report treats an incomplete optional stage as not blocking all_complete', () => {
  const fx = makeFixture();
  recordStage(fx.receiptsPath, 'screenplay', { output: fx.screenplay, status: 'ok' });
  recordStage(fx.receiptsPath, 'take', { output: fx.take, inputs: [fx.screenplay], status: 'ok' });
  recordStage(fx.receiptsPath, 'placement', { output: fx.plan, inputs: [fx.screenplay, fx.take], status: 'ok' });
  recordStage(fx.receiptsPath, 'render', { output: fx.render, inputs: [fx.plan], status: 'ok' });
  const receipts = loadReceipts(fx.receiptsPath);
  const report = buildProductionReport(fx.descriptor, receipts);
  assert.equal(report.all_complete, true);
});

test('removing a declared input invalidates the receipt instead of completing the stage', () => {
  const fx = makeFixture();
  recordStage(fx.receiptsPath, 'render', { output: fx.render, inputs: [fx.plan], status: 'ok' });
  const stage = { stage: 'render', output: fx.render, inputs: [], optional: false };
  assert.equal(computeStageStatus(stage, loadReceipts(fx.receiptsPath)).status, 'stale');
});

test('unknown receipt statuses cannot establish completion', () => {
  const fx = makeFixture();
  recordStage(fx.receiptsPath, 'screenplay', { output: fx.screenplay, status: 'ok' });
  const receipts = loadReceipts(fx.receiptsPath);
  receipts.stages.screenplay.status = 'unverified';
  assert.equal(computeStageStatus(fx.descriptor[0], receipts).status, 'unknown');
  writeFileSync(fx.receiptsPath, JSON.stringify(receipts));
  assert.throws(() => loadReceipts(fx.receiptsPath), /invalid recorded status/);
});
