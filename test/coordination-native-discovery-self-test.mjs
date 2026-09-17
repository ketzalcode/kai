import assert from 'node:assert/strict';
import {test} from 'node:test';
import {dirname, join, delimiter} from 'node:path';
import {fileURLToPath} from 'node:url';
import {mkdirSync, mkdtempSync, writeFileSync, rmSync, existsSync} from 'node:fs';
import {spawnSync} from 'node:child_process';
import {discoverCopilot} from '../scripts/lib/coordination-runtime/native-discovery.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
test('missing native executable is a precise setup gap, not a model fallback', async () => {
  await assert.rejects(discoverCopilot({root, env: {...process.env, KAI_COPILOT_EXECUTABLE: join(root, 'absent-copilot.exe')}}),
    error => error.code === 'UNSUPPORTED_HOST' && /executable/.test(error.message));
});
test('real short-lived native ACP discovers exact installed agents/models without a model prompt', {
  skip: process.env.KAI_TEST_NATIVE_DISCOVERY !== '1' && 'explicit metadata-only live probe',
}, async () => {
  const scratch = join(root, '.superpowers', 'native-discovery-tests');
  mkdirSync(scratch, {recursive: true});
  const workspace = mkdtempSync(join(scratch, 'probe-'));
  mkdirSync(join(workspace, '.kai'), {recursive: true});
  writeFileSync(join(workspace, '.kai', 'manifest.json'), JSON.stringify({
    plugin: 'kai-core', version: 'test', schema_version: 4, workspace_id: 'native-metadata-probe',
    storage_mode: 'repo-local', workspace_root: '.', state: '.kai/state', runs: '.kai/runs',
    review: '.kai/review', archive: '.kai/archive', personal: '.kai/personal', projects: [], areas: [],
  }));
  let result;
  try {
    const probe = spawnSync(process.execPath, [join(root, 'scripts', 'coordinate.mjs'), 'prepare', '--root', workspace], {
      encoding: 'utf8', input: JSON.stringify({role: 'eng-builder-software'}), timeout: 90_000, env: {...process.env,
    KAI_COPILOT_PLUGIN_DIRS: ['kai-core', 'kai-engineering', 'kai-creative'].map(pack => join(root, 'plugins', pack)).join(delimiter),
      },
    });
    assert.equal(probe.status, 0, probe.stderr);
    const output = JSON.parse(probe.stdout);
    result = output.discovery;
    assert.equal(output.preparation.actor.runId, result.advertised.sessionId);
    assert.equal(output.preparation.agentId, 'kai-engineering:eng-builder-software');
    assert.ok(output.launch.arguments.includes(`--session-id=${output.preparation.actor.runId}`));
    assert.equal(output.preparation.reserved, false);
    assert.equal(existsSync(join(workspace, '.kai', 'state', 'coordination.sqlite')), false);
  } finally { rmSync(workspace, {recursive: true, force: true}); }
  assert.equal(result.host.version, '1.0.85');
  assert.equal(result.modelPromptSent, false);
  assert.equal(result.transportClosed, true);
  assert.equal(result.capabilities.resume, false);
  assert.equal(result.capabilities.peerDispatch, false);
  for (const role of ['eng-builder-software', 'eng-reviewer-code']) {
    assert.ok(result.roster.some(entry => entry.id === `kai-engineering:${role}`));
  }
  for (const role of ['creative-lead-design', 'creative-lead-video', 'workflow-creative-demo-production']) {
    assert.ok(result.roster.some(entry => entry.id === `kai-creative:${role}`));
  }
  for (const model of ['claude-opus-5', 'claude-sonnet-5', 'gpt-5.6-sol', 'gpt-5.6-terra']) {
    assert.ok(result.capabilities.models.includes(model));
  }
  assert.equal(result.profiles['eng-builder-software'], 'execution');
});
