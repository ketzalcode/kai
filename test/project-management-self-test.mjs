import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {dirname, join} from 'node:path';
import test from 'node:test';
import {fileURLToPath} from 'node:url';
import {validateTaskBody} from '../src/core/lib/coordination-runtime/contract.mjs';
import {runCLI} from '../src/project-management/project.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const AT = '2026-10-11T20:00:00.000Z';
const steward = {role: 'eng-lead-software', runId: 'steward-run'};
const reviewer = {role: 'eng-reviewer-code', runId: 'review-run'};

async function withWorkspace(fn) {
  const workspace = mkdtempSync(join(tmpdir(), 'kai-project-management-'));
  mkdirSync(join(workspace, '.kai'), {recursive: true});
  writeFileSync(join(workspace, '.kai', 'manifest.json'), `${JSON.stringify({
    plugin: 'kai-core',
    version: '23.0.0',
    schema_version: 6,
    scaffolded: AT,
    workspace_id: `test-${randomUUID()}`,
    placement: 'repo-local',
    workspace_root: '.',
    private_root: '.kai',
    projects: [{id: 'default', path: '.', publication_root: 'docs/kai'}],
  })}\n`);
  try {
    const initialized = await runCLI(['init', '--root', workspace]);
    assert.equal(initialized.exitCode, 0);
    return await fn(workspace);
  } finally {
    rmSync(workspace, {recursive: true, force: true});
  }
}

function command(kind, recordKind, recordId, expectedVersion, payload, actor = steward) {
  return {
    operationId: randomUUID(),
    kind,
    actor,
    recordKind,
    recordId,
    expectedVersion,
    payload,
  };
}

function common(id, title, extras) {
  return {
    schema_version: 1,
    id,
    title,
    state: 'proposed',
    completion_disposition: null,
    owner: steward.role,
    scope_authority: steward.role,
    completion_authority: reviewer.role,
    priority: 1,
    outcome: `${title} outcome`,
    acceptance: [`${title} acceptance`],
    hold: null,
    created_at: AT,
    updated_at: AT,
    ...extras,
  };
}

async function apply(workspace, body) {
  const result = await runCLI(['apply', '--root', workspace], {input: body});
  assert.equal(result.exitCode, 0, JSON.stringify(result.result));
  return result.result;
}

async function seedActiveHierarchy(workspace) {
  const ids = {
    direction: 'direction:demo',
    epic: 'epic:demo',
    feature: 'engineering:feature:demo',
    requirement: 'engineering:requirement:demo',
    task: 'engineering:task:demo',
  };
  const bodies = {
    direction: common(ids.direction, 'Demo Direction', {
      vision: 'A useful product.',
      mission: 'Deliver trusted outcomes.',
      current_goal: 'Ship the bounded demo.',
      out_of_scope: ['Unapproved expansion.'],
      required_epics: [ids.epic],
      optional_epics: [],
    }),
    epic: common(ids.epic, 'Demo Epic', {
      direction_id: ids.direction,
      contribution: 'Advances the current goal.',
      scope_fit: 'Stays within the approved boundary.',
      required_features: [ids.feature],
      optional_features: [],
    }),
    feature: common(ids.feature, 'Demo Feature', {
      epic_id: ids.epic,
      required_requirements: [ids.requirement],
      optional_requirements: [],
      depends_on_features: [],
    }),
    requirement: common(ids.requirement, 'Demo Requirement', {
      feature_id: ids.feature,
      required_tasks: [ids.task],
      optional_tasks: [],
    }),
  };
  for (const kind of ['direction', 'epic', 'feature', 'requirement']) {
    await apply(workspace, command(`${kind}.create`, kind, ids[kind], 0, {
      body: bodies[kind],
    }));
    await apply(workspace, command(`${kind}.activate`, kind, ids[kind], 1, {
      at: AT,
    }));
  }
  return ids;
}

test('Project Management owns an independent planning database and emits standalone Task handoffs', async () => {
  await withWorkspace(async workspace => {
    const ids = await seedActiveHierarchy(workspace);
    const result = await runCLI(['handoff', '--root', workspace], {input: {
      requirementId: ids.requirement,
      taskId: ids.task,
      title: 'Implement the bounded demo',
      deliveryClass: 'product-change',
      nextRole: 'eng-builder-backend',
      artifactExpectation: 'none',
      artifactExpectationReason: 'The product change is the durable result.',
      artifactClass: null,
      durability: null,
      validityOwner: null,
      artifactTargets: [],
      contextArtifacts: [],
      touches: ['src/**'],
      dependsOn: [],
      reviewRequirements: [{role: reviewer.role, kind: 'code-review'}],
      updatedAt: AT,
    }});
    assert.equal(result.exitCode, 0, JSON.stringify(result.result));
    assert.equal(validateTaskBody(result.result.task), result.result.task);
    assert.deepEqual(result.result.task.planning_refs, [
      'project-management:direction/direction:demo@2',
      'project-management:epic/epic:demo@2',
      'project-management:feature/engineering:feature:demo@2',
      'project-management:requirement/engineering:requirement:demo@2',
    ]);
    assert.equal(
      result.result.task.planning_refs.some(reference => reference.includes('.sqlite')),
      false,
    );
  });
});

test('Project Management closure checks owned children and opaque required Task references', async () => {
  await withWorkspace(async workspace => {
    const ids = await seedActiveHierarchy(workspace);
    const missing = await runCLI(['apply', '--root', workspace], {input: command(
      'requirement.complete',
      'requirement',
      ids.requirement,
      2,
      {
        at: AT,
        disposition: 'satisfied',
        reason: 'Attempt closure.',
        basisRefs: ['core:evidence/demo'],
        completedTaskRefs: [],
      },
      reviewer,
    )});
    assert.equal(missing.exitCode, 1);
    assert.equal(missing.result.code, 'EVIDENCE_GAP');

    const completed = await apply(workspace, command(
      'requirement.complete',
      'requirement',
      ids.requirement,
      2,
      {
        at: AT,
        disposition: 'satisfied',
        reason: 'Required Task evidence accepted.',
        basisRefs: ['core:evidence/demo'],
        completedTaskRefs: [ids.task],
      },
      reviewer,
    ));
    assert.equal(completed.data.record.body.completion_disposition, 'satisfied');
  });
});

test('Project Management runtime is self-contained and Core does not import it', () => {
  const projectSource = readFileSync(
    join(root, 'src', 'project-management', 'project.mjs'),
    'utf8',
  );
  assert.doesNotMatch(projectSource, /src\/core|coordination-runtime|from ['"].*kai-core/);
  const coreSource = readFileSync(
    join(root, 'src', 'core', 'coordinate.mjs'),
    'utf8',
  );
  assert.doesNotMatch(coreSource, /project-management|project\.sqlite/);
});
