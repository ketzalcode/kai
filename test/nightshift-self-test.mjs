import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {randomUUID} from 'node:crypto';
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
  agentProfileModelErrors,
  agentTaxonomyErrors,
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
    goal: {
      outcome: 'Deliver bounded unattended engineering work.',
      acceptance: ['Every delivered slice satisfies its Task acceptance.'],
    },
    tasks: [
      {id: 'engineering:task:api-contract', version: 2},
      {id: 'engineering:task:ui-error', version: 1},
      {id: 'engineering:task:docs-note', version: 1},
    ],
    planningProjection: null,
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
    evidenceExpectations: [
      'Map each accepted criterion to an exact revision and observable result.',
    ],
    ...overrides,
  };
}

function slice(overrides = {}) {
  return {
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
    baseHead: '1'.repeat(40),
    pullRequestBase: 'main',
    ...overrides,
  };
}

function nightshiftSliceDecision(overrides = {}) {
  return {
    status: 'slice',
    summary: 'The API contract is the next required outcome.',
    slice: slice(),
    blocker: null,
    nextAction: 'Launch the backend builder.',
    ...overrides,
  };
}

function nightshiftComplete(overrides = {}) {
  return {
    status: 'complete',
    summary: 'The approved outcome is satisfied.',
    slice: null,
    blocker: null,
    nextAction: 'Render the morning report.',
    ...overrides,
  };
}

function event(sequence, type, payload) {
  return {
    schemaVersion: 1,
    eventId: `00000000-0000-4000-8000-${String(sequence).padStart(12, '0')}`,
    runId: 'night-2026-10-10',
    sequence,
    type,
    at: `2026-10-10T2${sequence}:00:00.000Z`,
    payload,
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
    schema_version: 6,
    scaffolded: '2026-10-10',
    workspace_id: `nightshift-${randomUUID()}`,
    placement: 'repo-local',
    workspace_root: '.',
    private_root: '.kai',
    projects: [{
      id: 'kai',
      path: '.',
      publication_root: 'docs/kai',
    }],
  }, null, 2)}\n`);
  return {
    workspace,
    head,
  };
}

test('Nightshift is an explicit manual workflow over current engineering roles', () => {
  const workflow = readAgent('eng-nightshift');
  assert.match(workflow, /^model:\s*"gpt-5\.6-sol"$/m);
  assert.match(workflow, /\*\*Primary profile:\*\* technical-judgment/);
  assert.match(workflow, /^model:\s*"[^"]+"$/m);
  assert.match(workflow, /^disable-model-invocation:\s*true$/m);
  assert.match(workflow, /Apply `nightshift-run`/);
  assert.match(workflow, /PREPARE/);
  assert.match(workflow, /EXECUTE/);
  assert.match(workflow, /RECONCILE/);
  for (const role of ['eng-lead-software', 'eng-reviewer-code']) {
    assert.match(workflow, new RegExp(role));
  }
  assert.match(workflow, /Never merge, deploy, tag, release/);
  assert.match(workflow, /does not rewrite its own instructions/);
  assert.match(workflow, /automatically create[\s\S]*GitHub issue/i);
});

test('eng-nightshift is a named capability with technical-judgment model policy', () => {
  assert.deepEqual(agentTaxonomyErrors({
    id: 'eng-nightshift',
    pack: 'engineering',
  }), []);
  assert.deepEqual(agentProfileModelErrors({
    id: 'eng-nightshift',
    body: '**Primary profile:** technical-judgment',
    fm: {model: '"gpt-5.6-sol"'},
  }), []);
  assert.match(agentTaxonomyErrors({
    id: 'eng-nightshift',
    pack: 'core',
  }).join('\n'), /belongs to kai-engineering/i);
});

test('software lead stays generic and caller-agnostic', () => {
  const lead = readAgent('eng-lead-software');
  assert.doesNotMatch(lead, /Nightshift|eng-nightshift/i);
  assert.match(lead, /Own one complete authorized software change/);
  assert.match(lead, /Apply `pr-sizing` after integration/);
  assert.match(lead, /Apply `pr-delivery`/);
});

test('Nightshift skill protects required-first delivery and structured blockers', () => {
  const skill = readSkill('nightshift-run');
  assert.ok(skill.split('\n').length <= 140, 'nightshift-run must stay lean');
  assert.doesNotMatch(skill, /^user-invocable:\s*true$/m);
  assert.match(skill, /Unused time or budget does not create\s+more\s+scope/);
  assert.match(skill, /Required/);
  assert.match(skill, /Blocked/);
  assert.match(skill, /Suggested/);
  assert.match(skill, /question\.open/);
  assert.match(skill, /task\.handoff/);
  assert.match(skill, /`eng-nightshift` owns run judgment/);
  assert.match(skill, /generic `eng-lead-software`/);
  assert.match(skill, /runner never decomposes the goal/);
  assert.match(skill, /Append one event/);
  assert.match(skill, /references\/morning-report\.md/);
  assert.match(skill, /scripts\/nightshift\.mjs/);
  assert.doesNotMatch(skill, /"status":\s*"delivered/);
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

test('run admission is bounded and contains no up-front slice or routing policy', async () => {
  const {validatePlan} = await runner();
  const valid = validatePlan(plan());
  assert.equal(valid.runId, 'night-2026-10-10');
  assert.equal(Object.hasOwn(valid, 'agent'), false);
  assert.equal(Object.hasOwn(valid, 'model'), false);
  assert.equal(Object.hasOwn(valid, 'slices'), false);
  assert.equal(valid.planningProjection, null);
  assert.deepEqual(validatePlan(plan({
    planningProjection: {
      summary: 'Approved Requirement projection.',
      references: ['project-management:requirement/engineering:requirement:nightshift@2'],
    },
  })).planningProjection.references, [
    'project-management:requirement/engineering:requirement:nightshift@2',
  ]);

  assert.throws(
    () => validatePlan(plan({agent: 'eng-builder-backend'})),
    /unexpected.*agent|agent.*unexpected/i,
  );
  assert.throws(
    () => validatePlan(plan({slices: [slice()]})),
    /unexpected.*slices|slices.*unexpected/i,
  );
});

test('Copilot launch is bounded and leaves agent model ownership intact', async () => {
  const {buildCopilotArgs, profilesForSlice} = await runner();
  assert.deepEqual(profilesForSlice(slice()), [
    'eng-builder-backend',
    'eng-lead-software',
  ]);
  assert.deepEqual(profilesForSlice({
    ...slice({route: 'frontend'}),
    reviewRequired: true,
  }), [
    'eng-builder-frontend',
    'eng-lead-software',
    'eng-reviewer-code',
  ]);
  const args = buildCopilotArgs({
    plan: plan(),
    slice: slice(),
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

test('uncapped credits require explicit admission and omit the CLI ceiling', async () => {
  const {validatePlan, buildCopilotArgs, renderMorningReport} = await runner();
  const approved = plan({limits: {...plan().limits, maxAiCredits: null}});
  assert.equal(validatePlan(approved).limits.maxAiCredits, null);
  for (const maxAiCredits of [undefined, 0, -1, Infinity, 'unlimited']) {
    assert.throws(() => validatePlan(plan({
      limits: {...plan().limits, maxAiCredits},
    })), /maxAiCredits/);
  }
  const args = buildCopilotArgs({
    plan: approved,
    profile: 'eng-builder-backend',
    prompt: 'Execute the approved slice.',
    aiCredits: null,
  });
  assert.equal(args.includes('--max-ai-credits'), false);
  assert.ok(args.includes('--max-autopilot-continues'));
  assert.throws(() => buildCopilotArgs({
    plan: plan(),
    profile: 'eng-builder-backend',
    prompt: 'Execute the approved slice.',
    aiCredits: null,
  }), /credit/i);
  assert.match(renderMorningReport(approved, []), /no credit ceiling approved/);
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
    slice: slice(),
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

test('Nightshift decisions append one slice at a time', async () => {
  const {validateNightshiftDecision} = await runner();
  const decision = validateNightshiftDecision(nightshiftSliceDecision(), {
    plan: plan(),
    events: [],
  });
  assert.equal(decision.status, 'slice');
  assert.equal(decision.slice.id, 'api-contract');
  assert.throws(
    () => validateNightshiftDecision(nightshiftSliceDecision({
      slice: slice({baseHead: '9'.repeat(40)}),
    }), {plan: plan(), events: []}),
    /baseHead.*approved base|unknown delivered head/i,
  );
  assert.equal(validateNightshiftDecision(nightshiftComplete(), {
    plan: plan(),
    events: [],
  }).status, 'complete');
});

test('morning report separates deliveries, blockers, and suggestions', async () => {
  const {renderMorningReport} = await runner();
  const apiResult = delivered();
  const uiResult = blocked();
  const events = [
    event(1, 'run.prepared', {summary: 'Approved'}),
    event(2, 'slice.delivered', {
      slice: slice(),
      result: apiResult,
      worktree: {path: 'removed', retained: false},
    }),
    event(3, 'slice.blocked', {
      slice: slice({
        id: 'ui-error',
        task: {id: 'engineering:task:ui-error', version: 1},
        outcome: 'Render the accepted API error state.',
        branch: 'kai/feat/ui-error',
        route: 'frontend',
      }),
      result: uiResult,
      worktree: {path: 'C:\\worktrees\\ui-error', retained: true},
    }),
    event(4, 'run.completed', {reason: 'approved outcome satisfied'}),
  ];
  const report = renderMorningReport(plan(), events);
  assert.match(report, /^# Nightshift night-2026-10-10$/m);
  assert.match(report, /^## Delivered pull requests$/m);
  assert.match(report, /pull\/42/);
  assert.match(report, /Consolidate adjacent response helpers/);
  assert.match(report, /^## Blocked work$/m);
  assert.match(report, /Which error presentation should be authoritative/);
  assert.match(report, /^## Suggestions for the morning$/m);
  assert.match(report, /^## Run limits$/m);
  assert.match(report, /approved outcome satisfied/);
});

test('run paths stay inside the typed private Nightshift route', async () => {
  const {runPaths} = await runner();
  const paths = runPaths('C:\\workspace', 'night-2026-10-10');
  assert.equal(
    paths.runRelative.replaceAll('\\', '/'),
    '.kai/engineering/reports/nightshift/night-2026-10-10',
  );
  assert.ok(paths.plan.endsWith(join('drafts', 'plan.json')));
  assert.ok(paths.events.endsWith(join('evidence', 'events.jsonl')));
  assert.ok(paths.report.endsWith(join('drafts', 'report.md')));
});

test('worktrees stay in the project ignored worktree directory', async () => {
  const {worktreePath} = await runner();
  const fixture = workspaceFixture();
  try {
    writeFileSync(join(fixture.workspace, '.gitignore'), '/.kai/\n/.worktrees/\n');
    assert.equal(
      worktreePath(fixture.workspace, 'night-2026-10-10', 'api-contract'),
      join(fixture.workspace, '.worktrees', 'nightshift', 'night-2026-10-10', 'api-contract'),
    );
    writeFileSync(join(fixture.workspace, '.gitignore'), '/.kai/\n');
    assert.throws(
      () => worktreePath(fixture.workspace, 'night-2026-10-10', 'api-contract'),
      /ignored/i,
    );
  } finally {
    rmSync(fixture.workspace, {recursive: true, force: true});
  }
});

test('prepare is idempotent and report regeneration replaces the same draft', async () => {
  const {prepareRun, reportRun} = await runner();
  const fixture = workspaceFixture();
  try {
    const approved = plan({
      deadline: '2099-10-11T06:00:00.000Z',
      base: {
        ...plan().base,
        sha: fixture.head,
      },
    });
    const first = prepareRun({root: fixture.workspace, plan: approved});
    assert.equal(first.created, true);
    assert.equal(first.events.length, 1);
    assert.equal(first.events[0].type, 'run.prepared');
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
      base: {
        ...plan().base,
        sha: fixture.head,
      },
    });
    prepareRun({root: fixture.workspace, plan: approved});
    const launched = [];
    const removed = [];
    const decisions = [
      nightshiftSliceDecision({
        slice: slice({baseHead: fixture.head}),
      }),
      nightshiftSliceDecision({
        summary: 'Documentation remains required and is independent.',
        slice: slice({
          id: 'docs-note',
          task: {id: 'engineering:task:docs-note', version: 1},
          outcome: 'Document the supported error behavior.',
          acceptance: ['The developer reference names the supported behavior.'],
          touches: ['docs/api'],
          completionCheck: 'The reference contains the accepted contract.',
          branch: 'kai/docs/error-contract',
          baseHead: fixture.head,
        }),
      }),
      nightshiftComplete(),
    ];
    const result = executeRun({
      root: fixture.workspace,
      runId: approved.runId,
      now: () => new Date('2026-10-10T22:00:00.000Z'),
      decideNext: () => decisions.shift(),
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
    assert.equal(result.state.slices.find(item => item.slice.id === 'api-contract').status, 'blocked');
    assert.equal(result.state.slices.find(item => item.slice.id === 'api-contract').worktree.retained, true);
    assert.equal(result.state.slices.find(item => item.slice.id === 'docs-note').status, 'delivered');
    assert.equal(result.state.status, 'completed-with-blockers');
    assert.equal(removed.length, 1);
    assert.match(readFileSync(result.paths.report, 'utf8'), /completed-with-blockers/);
    assert.ok(result.events.every((entry, index) => entry.sequence === index + 1));
  } finally {
    rmSync(fixture.workspace, {recursive: true, force: true});
  }
});

test('uncapped execution propagates no ceiling and still stops at the PR limit', async () => {
  const {executeRun, prepareRun} = await runner();
  const fixture = workspaceFixture();
  try {
    const approved = plan({
      deadline: '2099-10-11T06:00:00.000Z',
      base: {...plan().base, sha: fixture.head},
      limits: {...plan().limits, maxAiCredits: null, maxPullRequests: 1},
    });
    prepareRun({root: fixture.workspace, plan: approved});
    const credits = [];
    const result = executeRun({
      root: fixture.workspace,
      runId: approved.runId,
      now: () => new Date('2026-10-10T22:00:00.000Z'),
      decideNext: ({aiCredits}) => {
        credits.push(aiCredits);
        return nightshiftSliceDecision({slice: slice({baseHead: fixture.head})});
      },
      runSlice: ({aiCredits}) => {
        credits.push(aiCredits);
        return {
          worktree: join(fixture.workspace, '.delivered-api'),
          actualHead: '2'.repeat(40),
          clean: true,
          result: delivered(),
        };
      },
      removeWorktree: () => {},
    });
    assert.deepEqual(credits, [null, null]);
    assert.equal(result.state.slices.length, 1);
    assert.equal(result.state.terminalReason, 'pull-request/launch limit reached');
  } finally {
    rmSync(fixture.workspace, {recursive: true, force: true});
  }
});
