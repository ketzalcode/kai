import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {createHash, randomUUID} from 'node:crypto';
import {
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import {tmpdir} from 'node:os';
import {dirname, join} from 'node:path';
import test from 'node:test';
import {fileURLToPath, pathToFileURL} from 'node:url';
import {
  sourceAgentFiles,
  sourceSkillFiles,
} from '../tools/lib/pack-plan.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const readEntries = entries => new Map(entries.map(entry => [
  entry.id,
  readFileSync(entry.path, 'utf8').replace(/\r\n/g, '\n'),
]));
const agents = readEntries(sourceAgentFiles(root));
const skills = readEntries(sourceSkillFiles(root));
const readAgent = id => {
  assert.ok(agents.has(id), `active agent ${id} must exist`);
  return agents.get(id);
};
const readSkill = id => {
  assert.ok(skills.has(id), `active skill ${id} must exist`);
  return skills.get(id);
};

async function runner() {
  return import(pathToFileURL(join(root, 'src', 'engineering', 'nightshift.mjs')));
}

function plan(overrides = {}) {
  return {
    schemaVersion: 1,
    runId: 'night-2026-10-10',
    approvedAt: '2026-10-10T20:00:00.000Z',
    deadline: '2026-10-11T06:00:00.000Z',
    projectId: 'kai',
    subject: {
      kind: 'feature',
      id: 'engineering:feature:nightshift',
      version: 3,
    },
    direction: {
      path: 'docs/kai/DIRECTION.md',
      sha256: 'a'.repeat(64),
      goal: 'Deliver bounded unattended engineering work.',
    },
    base: {
      remote: 'origin',
      branch: 'main',
      sha: '1'.repeat(40),
    },
    limits: {
      maxPullRequests: 3,
      maxAiCredits: 30,
      maxAutopilotContinues: 8,
      maxRetainedWorktrees: 2,
    },
    permissions: {
      push: true,
      pullRequests: true,
      allowedUrls: ['https://github.com'],
      secretRefs: [],
    },
    stacking: false,
    slices: [
      {
        id: 'api-contract',
        task: {
          id: 'engineering:task:api-contract',
          version: 2,
        },
        outcome: 'Return the accepted API error contract.',
        acceptance: ['Invalid input returns the repository-standard error.'],
        touches: ['src/api', 'test/api'],
        completionCheck: 'The focused API contract test passes.',
        route: 'backend',
        reviewRequired: false,
        branch: 'kai/fix/api-contract',
        dependsOn: [],
      },
      {
        id: 'ui-error',
        task: {
          id: 'engineering:task:ui-error',
          version: 1,
        },
        outcome: 'Render the accepted API error state.',
        acceptance: ['The client renders the localized error state.'],
        touches: ['src/ui', 'test/ui'],
        completionCheck: 'The named UI error scenario is observed.',
        route: 'frontend',
        reviewRequired: false,
        branch: 'kai/feat/ui-error',
        dependsOn: ['api-contract'],
      },
      {
        id: 'docs-note',
        task: {
          id: 'engineering:task:docs-note',
          version: 1,
        },
        outcome: 'Document the supported error behavior.',
        acceptance: ['The developer reference names the supported behavior.'],
        touches: ['docs/api'],
        completionCheck: 'The reference contains the accepted contract.',
        route: 'backend',
        reviewRequired: false,
        branch: 'kai/docs/error-contract',
        dependsOn: [],
      },
    ],
    ...overrides,
  };
}

function delivered(overrides = {}) {
  return {
    status: 'delivered',
    summary: 'Delivered the required API contract.',
    headSha: '2'.repeat(40),
    prUrl: 'https://github.com/example/repo/pull/42',
    evidence: ['Invalid-input contract scenario observed.'],
    suggestions: [{
      summary: 'Consolidate adjacent response helpers.',
      basis: 'Observed duplicate helpers outside the accepted Task.',
      whyDeferred: 'Broader refactor is not required for acceptance.',
      benefit: 'Reduce future contract drift.',
      costRisk: 'Touches callers outside this Task.',
      priority: 'later',
    }],
    blocker: null,
    nextAction: 'Review pull request 42.',
    ...overrides,
  };
}

function blocked(overrides = {}) {
  return {
    status: 'blocked',
    summary: 'A product decision is required.',
    headSha: null,
    prUrl: null,
    evidence: ['Two existing error presentations conflict.'],
    suggestions: [],
    blocker: {
      kind: 'decision',
      owner: 'product-owner',
      context: [
        'Observation: two repository patterns conflict.',
        'Attempts: inspected both owning paths.',
        'Boundary: choosing one changes accepted product behavior.',
        'Recommendation: select the current design-system pattern.',
        'Resume point: preserved branch kai/feat/ui-error.',
      ].join('\n'),
      ask: 'Which error presentation should be authoritative?',
      answerBy: 'before resuming the UI slice',
      questionRef: 'question:ui-error-pattern',
    },
    nextAction: 'Wait for the named completion authority.',
    ...overrides,
  };
}

function git(cwd, args) {
  const result = spawnSync('git', args, {cwd, encoding: 'utf8'});
  assert.equal(
    result.status,
    0,
    `git ${args.join(' ')} failed:\n${result.stdout}${result.stderr}`,
  );
  return result.stdout.trim();
}

function workspaceFixture() {
  const workspace = mkdtempSync(join(tmpdir(), 'kai-nightshift-'));
  git(workspace, ['init', '--quiet', '--initial-branch=main']);
  git(workspace, ['config', 'user.email', 'nightshift@example.test']);
  git(workspace, ['config', 'user.name', 'Nightshift Test']);
  git(workspace, ['config', 'core.autocrlf', 'false']);
  git(workspace, ['config', 'core.safecrlf', 'false']);
  mkdirSync(join(workspace, 'docs', 'kai'), {recursive: true});
  const direction = [
    '# Vision',
    '',
    'Useful software.',
    '',
    '# Mission',
    '',
    'Serve maintainers.',
    '',
    '# Current Goal',
    '',
    'Deliver bounded unattended engineering work.',
    '',
    '# Out of Scope',
    '',
    '- Production changes.',
    '',
  ].join('\n');
  writeFileSync(join(workspace, 'docs', 'kai', 'DIRECTION.md'), direction);
  writeFileSync(join(workspace, '.gitignore'), '/.kai/\n');
  writeFileSync(join(workspace, 'README.md'), '# Fixture\n');
  git(workspace, ['add', '.']);
  git(workspace, ['commit', '--quiet', '-m', 'fixture']);
  const head = git(workspace, ['rev-parse', 'HEAD']);
  git(workspace, ['update-ref', 'refs/remotes/origin/main', head]);
  mkdirSync(join(workspace, '.kai'), {recursive: true});
  writeFileSync(join(workspace, '.kai', 'manifest.json'), `${JSON.stringify({
    plugin: 'kai-core',
    version: '22.0.0',
    schema_version: 5,
    scaffolded: '2026-10-10',
    workspace_id: `nightshift-${randomUUID()}`,
    placement: 'repo-local',
    workspace_root: '.',
    private_root: '.kai',
    direction: 'docs/kai/DIRECTION.md',
    projects: [{
      id: 'kai',
      path: '.',
      publication_root: 'docs/kai',
    }],
  }, null, 2)}\n`);
  return {
    workspace,
    head,
    directionHash: createHash('sha256').update(direction).digest('hex'),
  };
}

test('Nightshift is an explicit manual workflow over current engineering roles', () => {
  const workflow = readAgent('workflow-nightshift');
  assert.match(workflow, /^model:\s*"[^"]+"$/m);
  assert.match(workflow, /^disable-model-invocation:\s*true$/m);
  assert.match(workflow, /Apply `nightshift-run`/);
  assert.match(workflow, /PREPARE/);
  assert.match(workflow, /EXECUTE/);
  assert.match(workflow, /RECONCILE/);
  for (const role of [
    'eng-builder-frontend',
    'eng-builder-backend',
    'eng-lead-software',
    'eng-reviewer-code',
  ]) {
    assert.match(workflow, new RegExp(role));
  }
  assert.match(workflow, /Never merge, deploy, tag, release/);
  assert.match(workflow, /does not rewrite its own instructions/);
  assert.match(workflow, /automatically create[\s\S]*GitHub issue/i);
});

test('Nightshift skill protects required-first delivery and structured blockers', () => {
  const skill = readSkill('nightshift-run');
  assert.doesNotMatch(skill, /^user-invocable:\s*true$/m);
  assert.match(skill, /Unused time or budget does not create\s+more scope/);
  assert.match(skill, /Required/);
  assert.match(skill, /Blocked/);
  assert.match(skill, /Suggested/);
  assert.match(skill, /question\.open/);
  assert.match(skill, /task\.handoff/);
  assert.match(skill, /attempt\.recover/);
  assert.match(skill, /Observation:/);
  assert.match(skill, /Recommendation:/);
  assert.match(skill, /Resume point:/);
  assert.match(skill, /references\/morning-report\.md/);
  assert.match(skill, /scripts\/nightshift\.mjs/);
});

test('Engineering publication declares the private Nightshift report route', () => {
  const declaration = JSON.parse(readFileSync(
    join(root, 'plugins', 'kai-engineering', 'publication.json'),
    'utf8',
  ));
  assert.ok(declaration.entries.some(entry =>
    entry.type === 'reports'
      && entry.subtype === 'nightshift'
      && entry.privateForm ===
        '.kai/engineering/reports/nightshift/<id>/{drafts,evidence,scratch}'
      && entry.publicForm === 'docs/kai/engineering/reports/nightshift/<id>/'
      && entry.formats.includes('markdown')
      && entry.formats.includes('json')));
});

test('run plans are bounded, dependency-safe, and contain no routing policy', async () => {
  const {validatePlan} = await runner();
  const valid = validatePlan(plan());
  assert.equal(valid.runId, 'night-2026-10-10');
  assert.equal(Object.hasOwn(valid, 'agent'), false);
  assert.equal(Object.hasOwn(valid, 'model'), false);

  assert.throws(
    () => validatePlan(plan({agent: 'eng-builder-backend'})),
    /unexpected.*agent|agent.*unexpected/i,
  );
  const cyclic = plan();
  cyclic.slices[0].dependsOn = ['ui-error'];
  assert.throws(() => validatePlan(cyclic), /cycle/i);
  assert.throws(
    () => validatePlan(plan({stacking: false, slices: [
      {...plan().slices[0], dependsOn: ['missing-slice']},
    ]})),
    /unknown.*depend/i,
  );
});

test('Copilot launch is bounded and leaves agent model ownership intact', async () => {
  const {buildCopilotArgs, profilesForSlice} = await runner();
  assert.deepEqual(profilesForSlice(plan().slices[0]), [
    'eng-builder-backend',
    'eng-lead-software',
  ]);
  assert.deepEqual(profilesForSlice({
    ...plan().slices[1],
    reviewRequired: true,
  }), [
    'eng-builder-frontend',
    'eng-lead-software',
    'eng-reviewer-code',
  ]);
  const args = buildCopilotArgs({
    plan: plan(),
    slice: plan().slices[0],
    profile: 'eng-builder-backend',
    prompt: 'Execute the approved slice.',
    aiCredits: 10,
  });
  assert.deepEqual(args.slice(0, 2), ['--agent', 'eng-builder-backend']);
  for (const flag of [
    '--autopilot',
    '--no-ask-user',
    '--allow-all-tools',
    '--no-auto-update',
    '--max-autopilot-continues',
    '--max-ai-credits',
    '--allow-url',
    '--silent',
    '--prompt',
  ]) {
    assert.ok(args.includes(flag), `expected ${flag}`);
  }
  assert.equal(args.includes('--model'), false);
  assert.equal(args.includes('--allow-all-paths'), false);
  assert.equal(args.includes('--allow-all'), false);
  assert.equal(args.includes('--yolo'), false);
});

test('approved secret references are redacted and undeclared routing stays absent', async () => {
  const {buildCopilotArgs, redactSecrets} = await runner();
  const withSecret = plan({
    permissions: {
      ...plan().permissions,
      secretRefs: ['NIGHTSHIFT_TOKEN'],
    },
  });
  const args = buildCopilotArgs({
    plan: withSecret,
    slice: withSecret.slices[0],
    profile: 'eng-builder-backend',
    prompt: 'Execute the approved slice.',
    aiCredits: 10,
  });
  assert.ok(args.includes('--secret-env-vars'));
  assert.ok(args.includes('NIGHTSHIFT_TOKEN'));
  assert.equal(args.includes('--model'), false);
  assert.equal(
    redactSecrets('token=very-secret-value', ['NIGHTSHIFT_TOKEN'], {
      NIGHTSHIFT_TOKEN: 'very-secret-value',
    }),
    'token=[REDACTED:NIGHTSHIFT_TOKEN]',
  );
});

test('delivered results must match immutable Git state', async () => {
  const {validateSliceResult} = await runner();
  assert.equal(validateSliceResult(delivered(), {
    baseHead: '1'.repeat(40),
    actualHead: '2'.repeat(40),
    clean: true,
  }).status, 'delivered');
  assert.throws(
    () => validateSliceResult(delivered(), {
      baseHead: '1'.repeat(40),
      actualHead: '3'.repeat(40),
      clean: true,
    }),
    /head/i,
  );
  assert.throws(
    () => validateSliceResult(delivered(), {
      baseHead: '1'.repeat(40),
      actualHead: '2'.repeat(40),
      clean: false,
    }),
    /clean/i,
  );
  assert.throws(
    () => validateSliceResult(delivered({prUrl: null}), {
      baseHead: '1'.repeat(40),
      actualHead: '2'.repeat(40),
      clean: true,
    }),
    /pull request|prUrl/i,
  );
});

test('blocked dependencies skip only affected slices', async () => {
  const {classifySlices} = await runner();
  const ledger = {
    slices: {
      'api-contract': {status: 'blocked', result: blocked()},
      'ui-error': {status: 'pending', result: null},
      'docs-note': {status: 'pending', result: null},
    },
  };
  const classification = classifySlices(plan(), ledger);
  assert.deepEqual(classification.ready.map(slice => slice.id), ['docs-note']);
  assert.deepEqual(classification.skipped, [{
    id: 'ui-error',
    reason: 'dependency api-contract is blocked',
  }]);
});

test('morning report separates deliveries, blockers, and suggestions', async () => {
  const {renderMorningReport} = await runner();
  const apiResult = delivered();
  const uiResult = blocked();
  const ledger = {
    schemaVersion: 1,
    runId: 'night-2026-10-10',
    status: 'completed-with-blockers',
    startedAt: '2026-10-10T20:05:00.000Z',
    finishedAt: '2026-10-10T22:00:00.000Z',
    terminalReason: 'no safe ready slices remain',
    observedAiCredits: null,
    slices: {
      'api-contract': {status: 'delivered', result: apiResult},
      'ui-error': {status: 'blocked', result: uiResult},
      'docs-note': {status: 'skipped', result: null, reason: 'run limit'},
    },
  };
  const report = renderMorningReport(plan(), ledger);
  assert.match(report, /^# Nightshift night-2026-10-10$/m);
  assert.match(report, /^## Delivered pull requests$/m);
  assert.match(report, /pull\/42/);
  assert.match(report, /Consolidate adjacent response helpers/);
  assert.match(report, /^## Blocked work$/m);
  assert.match(report, /Which error presentation should be authoritative/);
  assert.match(report, /^## Suggestions for the morning$/m);
  assert.match(report, /^## Run limits$/m);
  assert.match(report, /no safe ready slices remain/);
});

test('run paths stay inside the typed private Nightshift route', async () => {
  const {runPaths} = await runner();
  const paths = runPaths('C:\\workspace', 'night-2026-10-10');
  assert.equal(
    paths.runRelative.replaceAll('\\', '/'),
    '.kai/engineering/reports/nightshift/night-2026-10-10',
  );
  assert.ok(paths.plan.endsWith(join('drafts', 'plan.json')));
  assert.ok(paths.ledger.endsWith(join('drafts', 'ledger.json')));
  assert.ok(paths.report.endsWith(join('drafts', 'report.md')));
});

test('prepare is idempotent and report regeneration replaces the same draft', async () => {
  const {prepareRun, reportRun} = await runner();
  const fixture = workspaceFixture();
  try {
    const approved = plan({
      deadline: '2099-10-11T06:00:00.000Z',
      direction: {
        ...plan().direction,
        sha256: fixture.directionHash,
      },
      base: {
        ...plan().base,
        sha: fixture.head,
      },
    });
    const first = prepareRun({root: fixture.workspace, plan: approved});
    assert.equal(first.created, true);
    assert.equal(first.ledger.status, 'prepared');
    assert.equal(JSON.parse(readFileSync(first.paths.plan, 'utf8')).runId, approved.runId);
    const second = prepareRun({root: fixture.workspace, plan: approved});
    assert.equal(second.created, false);
    const report = reportRun({root: fixture.workspace, runId: approved.runId});
    assert.match(report.report, /# Nightshift night-2026-10-10/);
    const regenerated = reportRun({root: fixture.workspace, runId: approved.runId});
    assert.equal(regenerated.report, report.report);
  } finally {
    rmSync(fixture.workspace, {recursive: true, force: true});
  }
});

test('serial execution continues independent work after a blocker', async () => {
  const {executeRun, prepareRun} = await runner();
  const fixture = workspaceFixture();
  try {
    const approved = plan({
      deadline: '2099-10-11T06:00:00.000Z',
      direction: {
        ...plan().direction,
        sha256: fixture.directionHash,
      },
      base: {
        ...plan().base,
        sha: fixture.head,
      },
    });
    prepareRun({root: fixture.workspace, plan: approved});
    const launched = [];
    const removed = [];
    const result = executeRun({
      root: fixture.workspace,
      runId: approved.runId,
      now: () => new Date('2026-10-10T22:00:00.000Z'),
      runSlice: ({slice, baseHead}) => {
        launched.push(slice.id);
        if (slice.id === 'api-contract') {
          return {
            worktree: join(fixture.workspace, '.blocked-api'),
            actualHead: baseHead,
            clean: true,
            result: blocked(),
          };
        }
        return {
          worktree: join(fixture.workspace, '.delivered-docs'),
          actualHead: '3'.repeat(40),
          clean: true,
          result: delivered({
            headSha: '3'.repeat(40),
            prUrl: 'https://github.com/example/repo/pull/43',
          }),
        };
      },
      removeWorktree: (_projectRoot, path) => removed.push(path),
    });
    assert.deepEqual(launched, ['api-contract', 'docs-note']);
    assert.equal(result.ledger.slices['api-contract'].status, 'blocked');
    assert.equal(result.ledger.slices['api-contract'].worktree.retained, true);
    assert.equal(result.ledger.slices['ui-error'].status, 'skipped');
    assert.match(result.ledger.slices['ui-error'].reason, /dependency api-contract is blocked/);
    assert.equal(result.ledger.slices['docs-note'].status, 'delivered');
    assert.equal(result.ledger.status, 'completed-with-blockers');
    assert.equal(removed.length, 1);
    assert.match(readFileSync(result.paths.report, 'utf8'), /completed-with-blockers/);
  } finally {
    rmSync(fixture.workspace, {recursive: true, force: true});
  }
});
