import assert from 'node:assert/strict';
import {existsSync, readFileSync} from 'node:fs';
import {dirname, join} from 'node:path';
import test from 'node:test';
import {fileURLToPath} from 'node:url';
import {materializePacks, sourceSkillFiles} from '../tools/lib/pack-plan.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const skill = sourceSkillFiles(root).find(
  entry => entry.id === 'setup-agentic-repository-maintenance',
);
const body = skill
  ? readFileSync(skill.path, 'utf8').replace(/\r\n/g, '\n')
  : '';
const referencePath = join(
  root,
  'plugins',
  'kai-engineering',
  'skills',
  'setup-agentic-repository-maintenance',
  'references',
  'github-agentic-repository-maintenance.md',
);
const workflowPath = join(
  root,
  '.github',
  'workflows',
  'agentic-repository-maintenance.md',
);
const lockPath = join(
  root,
  '.github',
  'workflows',
  'agentic-repository-maintenance.lock.yml',
);

test('agentic repository maintenance setup investigates before acting', () => {
  assert.ok(skill, 'setup-agentic-repository-maintenance must exist');
  assert.equal(skill.pack, 'engineering');
  assert.match(body, /^user-invocable:\s*true$/m);
  assert.match(body, /^argument-hint:\s*"maintenance goal, cadence, or target repository"$/m);
  assert.match(body, /creates\s+no `\.kai` state/);
  assert.match(body, /does not perform a manual\s+maintenance audit/);
  assert.match(body, /repository host, issue tracker/);
  assert.match(body, /user, service-account, and token permissions/);
  assert.match(body, /administrator-only enablement, secrets, billing/);
  assert.match(body, /available models, assessment quality, model cost/);
  assert.match(body, /stack-native validation commands/);
  assert.match(body, /network, private dependency, secret, and data-residency constraints/);
  assert.match(body, /Return two or three viable approaches/);
  assert.match(body, /Obtain explicit\s+operator approval before installing tools/);
  assert.match(body, /Keep assessment and remediation separate/);
});

test('daily workflow is the exact shipped setup template', () => {
  const reference = readFileSync(referencePath, 'utf8').replace(/\r\n/g, '\n');
  const workflow = readFileSync(workflowPath, 'utf8').replace(/\r\n/g, '\n');
  assert.equal(workflow, reference);
  assert.equal(existsSync(lockPath), true, 'compiled Agentic Workflow lock must exist');

  assert.match(workflow, /cron:\s*"0 16 \* \* \*"/);
  assert.match(workflow, /workflow_dispatch:/);
  assert.match(workflow, /copilot-requests:\s*write/);
  assert.match(workflow, /id:\s*copilot/);
  assert.match(workflow, /model:\s*gpt-5\.6-terra/);
  assert.match(workflow, /contents:\s*read/);
  assert.doesNotMatch(workflow, /contents:\s*write/);
  assert.doesNotMatch(workflow, /pull-requests:\s*write/);
  assert.match(workflow, /create-issue:/);
  assert.match(workflow, /max:\s*3/);
  assert.match(workflow, /deduplicate-by-title:\s*2/);
  assert.doesNotMatch(workflow, /create-pull-request|assign-to-agent|close-issue/);
});

test('maintenance audit covers evidence-backed docs, comments, bugs, and improvements', () => {
  const workflow = readFileSync(referencePath, 'utf8');
  for (const expected of [
    /README and package-level documentation/,
    /comments, TODOs, and FIXMEs/,
    /reproducible bugs or exact contract contradictions/,
    /concrete improvements with a named current owner/,
    /Search open issues/,
    /If no material finding remains, create no issue/,
    /Never include secrets, personal data/,
  ]) {
    assert.match(workflow, expected);
  }
});

test('copied Engineering packages include the maintenance setup template', () => {
  const files = materializePacks({
    root,
    version: JSON.parse(readFileSync(join(root, 'package.json'), 'utf8')).version,
    packs: ['core', 'engineering'],
  });
  assert.ok(files.has(
    'kai-engineering/skills/setup-agentic-repository-maintenance/references/github-agentic-repository-maintenance.md',
  ));
});
