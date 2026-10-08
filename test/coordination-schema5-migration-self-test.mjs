import assert from 'node:assert/strict';
import {createHash, randomUUID} from 'node:crypto';
import {execFileSync, spawn, spawnSync} from 'node:child_process';
import fs, {
  appendFileSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import {syncBuiltinESMExports} from 'node:module';
import {DatabaseSync} from 'node:sqlite';
import {basename, dirname, join, relative, resolve, sep} from 'node:path';
import test from 'node:test';
import {fileURLToPath, pathToFileURL} from 'node:url';
import {runCLI} from '../src/core/coordinate.mjs';
import {
  canonicalJson,
  validateRecord,
} from '../src/core/lib/coordination-runtime/contract.mjs';
import {
  closeStore,
  openStore,
  readRecord,
} from '../src/core/lib/coordination-runtime/store.mjs';
import {
  migrateWorkspace,
  readLegacyRecords,
} from '../src/core/lib/coordination-runtime/migration.mjs';
import {
  buildMigrationWorksheet,
  migrateWorkspaceV5,
  recoverWorkspaceV5,
  rollbackWorkspaceV5,
  validateMigrationWorksheet,
  v5MigrationLockPath,
} from '../src/core/lib/coordination-runtime/migration-v5.mjs';
import {createNativeHost} from '../src/core/lib/coordination-runtime/native-host.mjs';
import {
  readIssued,
  writeIssued,
} from '../src/core/lib/coordination-runtime/native-capabilities.mjs';
import {checkWorkspace} from '../src/core/workspace-doctor.mjs';
import {inspectRuntime} from '../src/core/lib/coordination-runtime/inspection.mjs';
import {assertWorkspaceWrite} from '../src/core/lib/coordination-runtime/workspace-guard.mjs';
import {
  seedInitiative,
  seedItem,
  seedRecord,
} from './helpers/coordination-runtime-fixture.mjs';

const checkout = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const scratch = join(checkout, '.superpowers', 'schema5-migration-tests');
const NOW = '2026-10-02T12:00:00.000Z';
const ROLES = [
  'eng-lead-architecture',
  'eng-builder-software',
  'eng-reviewer-code',
  'creative-director',
];
const DIRECTION = `# Vision
A composable workspace.

# Mission
Migrate exact source history safely.

# Current Goal
Activate the classified schema 5 hierarchy.

# Out of Scope
Automatic legacy mapping.
`;
const sha256 = value => createHash('sha256').update(value).digest('hex');

mkdirSync(scratch, {recursive: true});

function put(root, path, bytes) {
  const target = join(root, ...path.split('/'));
  mkdirSync(dirname(target), {recursive: true});
  writeFileSync(target, bytes);
  return target;
}

function git(root, args) {
  return execFileSync('git', ['-C', root, ...args], {
    encoding: 'utf8',
    windowsHide: true,
    env: {...process.env, GIT_CONFIG_COUNT: '0'},
    stdio: ['ignore', 'pipe', 'pipe'],
  });
}

function tree(root) {
  const rows = [];
  function walk(current, prefix = '') {
    for (const name of readdirSync(current, {withFileTypes: true})
      .filter(entry => entry.name !== '.git')
      .sort((left, right) => left.name.localeCompare(right.name))) {
      const path = prefix ? `${prefix}/${name.name}` : name.name;
      const absolute = join(current, name.name);
      if (name.isDirectory()) walk(absolute, path);
      else rows.push([path, sha256(readFileSync(absolute))]);
    }
  }
  walk(root);
  return rows;
}

function rawStoreSnapshot(root) {
  const store = openStore({
    path: join(root, '.kai', 'state', 'coordination.sqlite'),
    mode: 'read',
  });
  try {
    return {
      metadata: store.database.prepare('SELECT key,value FROM metadata ORDER BY key').all(),
      records: store.database.prepare(`
        SELECT kind,id,subject_kind,subject_id,version,body
        FROM records ORDER BY kind,id
      `).all(),
      events: store.database.prepare('SELECT * FROM events ORDER BY seq').all(),
      operations: store.database.prepare(`
        SELECT id,payload_digest,receipt FROM operations ORDER BY id
      `).all(),
    };
  } finally {
    closeStore(store);
  }
}

function seedHistoricalDetail(store, itemId) {
  for (const [kind, id, body] of [
    ['question', 'question-old', {
      schema_version: 1,
      question_id: 'question-old',
      item_id: itemId,
      status: 'answered',
      created_at: NOW,
      answered_at: NOW,
    }],
    ['message', 'message-old', {
      schema_version: 1,
      message_id: 'message-old',
      item_id: itemId,
      kind: 'handoff',
      created_at: NOW,
      payload: {did: 'Historical handoff.'},
    }],
    ['approval', 'approval-old', {
      schema_version: 1,
      approval_id: 'approval-old',
      item_id: itemId,
      kind: 'completion',
      accepted: true,
      recorded_at: NOW,
    }],
    ['evidence', 'evidence-old', {
      schema_version: 1,
      evidence_id: 'evidence-old',
      item_id: itemId,
      kind: 'production-verification',
      recorded_at: NOW,
    }],
    ['review', 'review-old', {
      schema_version: 1,
      review_id: 'review-old',
      item_id: itemId,
      verdict: 'approved',
      recorded_at: NOW,
    }],
    ['attempt', 'attempt-old', {
      schema_version: 1,
      attempt_id: 'attempt-old',
      item_id: itemId,
      recovery: {state: 'reconciled', at: NOW},
    }],
  ]) {
    store.database.prepare(`
      INSERT INTO records(kind,id,subject_kind,subject_id,version,body)
      VALUES(?,?,?,?,?,?)
    `).run(kind, id, 'item', itemId, 3, canonicalJson(body));
  }
  for (const [operationId, payload] of [
    ['legacy-question', {kind: 'question.open', payload: {messageId: 'message-old', questionId: 'question-old'}}],
    ['legacy-answer', {kind: 'question.answer', payload: {messageId: 'message-old', questionId: 'question-old'}}],
    ['legacy-handoff', {kind: 'item.handoff', payload: {messageId: 'message-old'}}],
    ['legacy-approval', {kind: 'approval.record', payload: {body: {approval_id: 'approval-old'}}}],
  ]) {
    store.database.prepare(`
      INSERT INTO events(operation_id,subject_kind,subject_id,payload)
      VALUES(?,?,?,?)
    `).run(operationId, 'item', itemId, canonicalJson(payload));
  }
  store.database.prepare('INSERT INTO operations VALUES(?,?,?)').run(
    '00000000-0000-4000-8000-000000000099',
    sha256('historical-operation'),
    canonicalJson({
      ok: true,
      operationId: '00000000-0000-4000-8000-000000000099',
      recordVersion: 7,
      eventSeq: 4,
      data: {historical: true},
    }),
  );
  store.database.prepare('INSERT INTO metadata VALUES(?,?)').run(
    'legacy_marker',
    canonicalJson({source: 'schema-4', at: NOW}),
  );
}

async function schema4Workspace(run, {
  mode = 'repo-local',
  active = false,
  unknownAuthored = true,
  trackedPrivate = false,
  external = false,
} = {}) {
  const caseRoot = mkdtempSync(join(scratch, 'case-'));
  const root = external ? join(caseRoot, 'workspace') : join(caseRoot, 'project');
  const project = external ? join(caseRoot, 'project') : root;
  const backupRoot = join(caseRoot, 'backups');
  const kaiHome = join(caseRoot, 'home');
  const env = {...process.env, KAI_HOME: kaiHome};
  mkdirSync(root, {recursive: true});
  mkdirSync(project, {recursive: true});
  mkdirSync(backupRoot, {recursive: true});
  try {
    git(project, ['init', '--quiet']);
    git(project, ['config', 'core.autocrlf', 'false']);
    put(project, '.gitignore', mode === 'shared'
      ? '/.kai/runs/\n/.kai/review/\n/.kai/archive/\n/.kai/personal/\n'
      : '/.kai/\n');
    put(project, 'docs/kai/README.md', '# Kai\n');
    put(project, 'docs/kai/DIRECTION.md', DIRECTION);
    put(project, 'docs/kai/decisions/accepted-old.md', '# Accepted old decision\n');

    const manifest = {
      plugin: 'kai-core',
      version: 'test',
      schema_version: 4,
      scaffolded: NOW,
      workspace_id: `migration-${randomUUID()}`,
      storage_mode: external ? 'external' : mode,
      workspace_root: external ? root : '.',
      state: '.kai/state',
      runs: '.kai/runs',
      review: '.kai/review',
      archive: '.kai/archive',
      personal: '.kai/personal',
      projects: [{
        id: 'default',
        path: external ? project : '.',
        publication_root: 'docs/kai',
      }],
      areas: [],
    };
    put(root, '.kai/manifest.json', `${JSON.stringify(manifest, null, 2)}\n`);
    put(root, '.kai/state/items/build-api.md', '# Original build-api source\n');
    put(root, '.kai/state/items/ambiguous-scope.md', '# Ambiguous obligation or executable work\n');
    put(root, '.kai/state/initiatives/demo-initiative/northstar.md', '# Historical north star\n');
    put(root, '.kai/runs/old-run.json', canonicalJson({run: 'old-run', status: 'closed'}));
    put(root, '.kai/review/old-review.md', '# Historical review\n');
    put(root, '.kai/engineering/old-draft.md', '# Engineering draft\n');
    put(root, '.kai/creative/old-concept.md', '# Creative concept\n');
    if (unknownAuthored) put(root, '.kai/incubator/unknown-note.md', '# Unknown incubated owner\n');

    if (external) {
      put(caseRoot, 'home/workspaces.json', canonicalJson({
        schema_version: 1,
        workspaces: [{
          project_root: project,
          workspace_root: root,
          workspace_id: manifest.workspace_id,
        }],
      }));
    }

    const store = openStore({
      path: join(root, '.kai', 'state', 'coordination.sqlite'),
      mode: 'create',
    });
    try {
      seedInitiative(store, {
        milestones: [
          {
            id: 'portfolio',
            title: 'Portfolio boundary',
            delivery_class: 'operational',
            required_items: [],
            status: 'active',
          },
          {
            id: 'feature',
            title: 'Migration feature',
            delivery_class: 'product-change',
            required_items: ['build-api'],
            status: 'active',
          },
          {
            id: 'requirement',
            title: 'Migration requirement',
            delivery_class: 'product-change',
            required_items: ['build-api'],
            status: 'active',
          },
          {
            id: 'history',
            title: 'Historical-only milestone',
            delivery_class: 'knowledge',
            required_items: [],
            status: 'completed',
          },
        ],
        updated_at: NOW,
      });
      store.database.prepare(
        "UPDATE records SET version=4 WHERE kind='initiative' AND id='demo-initiative'",
      ).run();
      seedItem(store, {
        id: 'foundation',
        title: 'Completed migration foundation',
        initiative: 'demo-initiative',
        state: 'completed',
        producer_actor: {role: 'eng-builder-software', runId: 'foundation-producer'},
        producing_actors: [{role: 'eng-builder-software', runId: 'foundation-producer'}],
        acceptance_actor: {role: 'eng-reviewer-code', runId: 'foundation-acceptor'},
        updated_at: NOW,
      });
      store.database.prepare(
        "UPDATE records SET version=2 WHERE kind='item' AND id='foundation'",
      ).run();
      seedItem(store, {
        id: 'build-api',
        initiative: 'demo-initiative',
        state: active ? 'deploying' : 'proposed',
        producer_actor: active ? {role: 'eng-builder-software', runId: 'active-run'} : null,
        producing_actors: active ? [{role: 'eng-builder-software', runId: 'active-run'}] : [],
        acceptance_actor: null,
        depends_on: [{item: 'foundation', requires: 'completed'}],
        lease: active ? {
          holder: {role: 'eng-builder-software', runId: 'active-run'},
          token: 'active-lease',
          version_at_grant: 7,
          acquired_at: NOW,
          expires_at: '2099-10-02T12:00:00.000Z',
        } : null,
        updated_at: NOW,
      });
      store.database.prepare(
        "UPDATE records SET version=7 WHERE kind='item' AND id='build-api'",
      ).run();
      seedItem(store, {
        id: 'ambiguous-scope',
        title: 'Could be an obligation or executable work',
        initiative: 'demo-initiative',
        state: 'completed',
        producer_actor: {role: 'eng-builder-software', runId: 'old-producer'},
        producing_actors: [{role: 'eng-builder-software', runId: 'old-producer'}],
        acceptance_actor: {role: 'eng-reviewer-code', runId: 'old-acceptor'},
        required_for_milestone: false,
        updated_at: NOW,
      });
      store.database.prepare(
        "UPDATE records SET version=5 WHERE kind='item' AND id='ambiguous-scope'",
      ).run();
      seedHistoricalDetail(store, 'build-api');
    } finally {
      closeStore(store);
    }

    if (trackedPrivate) {
      git(project, ['add', '-f', '--', relative(project, join(root, '.kai', 'engineering', 'old-draft.md'))]);
    }
    return await run({
      root,
      project,
      backupRoot,
      env,
      manifest,
      caseRoot,
    });
  } finally {
    rmSync(caseRoot, {recursive: true, force: true, maxRetries: 5, retryDelay: 100});
  }
}

function sourceEntry(worksheet, collection, id) {
  return worksheet[collection].find(entry => entry.source.id === id)
    ?? assert.fail(`missing ${collection} source ${id}`);
}

function parentBody({
  id,
  title,
  owner = 'eng-lead-architecture',
  scopeAuthority = owner,
  completionAuthority = 'eng-reviewer-code',
  state = 'active',
  updatedAt = NOW,
  extra,
}) {
  return {
    schema_version: 1,
    id,
    title,
    state,
    completion_disposition: null,
    owner,
    scope_authority: scopeAuthority,
    completion_authority: completionAuthority,
    priority: 1,
    outcome: `Migrate ${title}.`,
    acceptance: [`${title} remains traceable to schema 4.`],
    hold: null,
    created_at: NOW,
    updated_at: updatedAt,
    ...extra,
  };
}

function mapped(record) {
  return {
    disposition: 'mapped',
    primary: {kind: record.kind, id: record.id},
    records: [record],
    reason: 'Explicit operator classification.',
  };
}

function historical(reason) {
  return {
    disposition: 'historical-only',
    primary: null,
    records: [],
    reason,
  };
}

function completeWorksheet(input, {
  backupRoot,
  root,
  project = root,
  env = process.env,
  placement = 'repo-local',
  resolveUnknown = true,
  reconcileActive = true,
} = {}) {
  const worksheet = structuredClone(input);
  worksheet.backup_root = backupRoot;
  const registryPath = join(env.KAI_HOME ?? '', 'workspaces.json');
  worksheet.placement = {
    target: placement,
    project_binding: {
      id: 'default',
      path: placement === 'external' ? project : '.',
      publication_root: 'docs/kai',
      registry_digest: placement === 'external' ? sha256(readFileSync(registryPath)) : null,
    },
  };

  const featureId = 'engineering:feature:migration';
  const requirementId = 'engineering:requirement:migration';
  const ambiguousRequirementId = 'engineering:requirement:ambiguous-scope';
  const taskId = 'engineering:task:build-api';
  const foundationTaskId = 'engineering:task:foundation';

  const initiative = sourceEntry(worksheet, 'epics', 'demo-initiative');
  initiative.classification = mapped(validateRecord({
    kind: 'epic',
    id: 'epic:schema5-activation',
    subject: null,
    version: initiative.source.version,
    body: parentBody({
      id: 'epic:schema5-activation',
      title: initiative.source.body.title,
      updatedAt: initiative.source.body.updated_at,
      extra: {
        direction_ref: worksheet.direction_ref,
        contribution: 'Activates the explicitly classified schema 5 workspace.',
        scope_fit: 'No universal schema-4 hierarchy mapping is assumed.',
        required_features: [featureId],
        optional_features: [],
      },
    }),
  }));

  const portfolio = sourceEntry(worksheet, 'milestones', 'portfolio');
  portfolio.classification = mapped(validateRecord({
    kind: 'epic',
    id: 'epic:portfolio-history',
    subject: null,
    version: 1,
    body: parentBody({
      id: 'epic:portfolio-history',
      title: portfolio.source.body.title,
      updatedAt: initiative.source.body.updated_at,
      extra: {
        direction_ref: worksheet.direction_ref,
        contribution: 'Preserves the explicit legacy portfolio boundary.',
        scope_fit: 'Classified by the operator as a separate Epic.',
        required_features: [],
        optional_features: [],
      },
    }),
  }));

  const feature = sourceEntry(worksheet, 'milestones', 'feature');
  feature.classification = mapped(validateRecord({
    kind: 'feature',
    id: featureId,
    subject: null,
    version: 1,
    body: parentBody({
      id: featureId,
      title: feature.source.body.title,
      updatedAt: initiative.source.body.updated_at,
      extra: {
        pack: 'engineering',
        epic_id: 'epic:schema5-activation',
        required_requirements: [requirementId, ambiguousRequirementId],
        optional_requirements: [],
        depends_on_features: [],
      },
    }),
  }));

  const requirement = sourceEntry(worksheet, 'milestones', 'requirement');
  requirement.classification = mapped(validateRecord({
    kind: 'requirement',
    id: requirementId,
    subject: null,
    version: 1,
    body: parentBody({
      id: requirementId,
      title: requirement.source.body.title,
      updatedAt: initiative.source.body.updated_at,
      extra: {
        pack: 'engineering',
        feature_id: featureId,
        required_tasks: [foundationTaskId, taskId],
        optional_tasks: [],
      },
    }),
  }));
  sourceEntry(worksheet, 'milestones', 'history').classification = historical(
    'Terminal milestone remains immutable migration provenance.',
  );

  const ambiguous = sourceEntry(worksheet, 'items', 'ambiguous-scope');
  ambiguous.classification = mapped(validateRecord({
    kind: 'requirement',
    id: ambiguousRequirementId,
    subject: null,
    version: ambiguous.source.version,
    body: parentBody({
      id: ambiguousRequirementId,
      title: ambiguous.source.body.title,
      state: 'proposed',
      updatedAt: ambiguous.source.body.updated_at,
      extra: {
        pack: 'engineering',
        feature_id: featureId,
        required_tasks: [],
        optional_tasks: [],
      },
    }),
  }));

  const item = sourceEntry(worksheet, 'items', 'build-api');
  const foundation = sourceEntry(worksheet, 'items', 'foundation');
  foundation.classification = mapped(validateRecord({
    kind: 'task',
    id: foundationTaskId,
    subject: null,
    version: foundation.source.version,
    body: {
      schema_version: 1,
      id: foundationTaskId,
      pack: 'engineering',
      feature_id: featureId,
      satisfies: [requirementId],
      title: foundation.source.body.title,
      delivery_class: foundation.source.body.delivery_class,
      state: 'proposed',
      resume_state: foundation.source.body.resume_state,
      scope_authority: foundation.source.body.scope_authority,
      completion_authority: foundation.source.body.completion_authority,
      producer_actor: null,
      producing_actors: [],
      acceptance_actor: null,
      priority: foundation.source.body.priority,
      next_role: foundation.source.body.next_role,
      outcome: foundation.source.body.outcome,
      acceptance: foundation.source.body.acceptance,
      artifact_expectation: foundation.source.body.artifact_expectation,
      artifact_expectation_reason: foundation.source.body.artifact_expectation_reason,
      artifact_class: foundation.source.body.artifact_class,
      durability: foundation.source.body.durability,
      validity_owner: foundation.source.body.validity_owner,
      artifact_targets: foundation.source.body.artifact_targets,
      context_artifacts: foundation.source.body.context_artifacts,
      touches: foundation.source.body.touches,
      depends_on: [],
      lease: null,
      recovery_hold: foundation.source.body.recovery_hold,
      waiting_on_questions: foundation.source.body.waiting_on_questions,
      review_requirements: foundation.source.body.review_requirements,
      change_ref: foundation.source.body.change_ref,
      updated_at: foundation.source.body.updated_at,
    },
  }));
  const active = item.source.body.lease !== null
    || ['in-progress', 'deploying', 'production-verification'].includes(item.source.body.state);
  item.classification = mapped(validateRecord({
    kind: 'task',
    id: taskId,
    subject: null,
    version: item.source.version,
    body: {
      schema_version: 1,
      id: taskId,
      pack: 'engineering',
      feature_id: featureId,
      satisfies: [requirementId],
      title: item.source.body.title,
      delivery_class: item.source.body.delivery_class,
      state: active ? 'blocked' : item.source.body.state,
      resume_state: active ? 'ready' : item.source.body.resume_state,
      scope_authority: item.source.body.scope_authority,
      completion_authority: item.source.body.completion_authority,
      producer_actor: null,
      producing_actors: [],
      acceptance_actor: null,
      priority: item.source.body.priority,
      next_role: item.source.body.next_role,
      outcome: item.source.body.outcome,
      acceptance: item.source.body.acceptance,
      artifact_expectation: item.source.body.artifact_expectation,
      artifact_expectation_reason: item.source.body.artifact_expectation_reason,
      artifact_class: item.source.body.artifact_class,
      durability: item.source.body.durability,
      validity_owner: item.source.body.validity_owner,
      artifact_targets: item.source.body.artifact_targets,
      context_artifacts: item.source.body.context_artifacts,
      touches: item.source.body.touches,
      depends_on: item.source.body.depends_on.map(dependency => ({
        task: dependency.item === 'foundation' ? foundationTaskId : dependency.item,
        requires: dependency.requires,
      })),
      lease: null,
      recovery_hold: null,
      waiting_on_questions: item.source.body.waiting_on_questions,
      review_requirements: item.source.body.review_requirements,
      change_ref: item.source.body.change_ref,
      updated_at: item.source.body.updated_at,
    },
  }));

  for (const entry of worksheet.authored_files) {
    const known = entry.owner_hint;
    const pack = known ?? (resolveUnknown ? 'engineering' : null);
    let action = 'provenance-only';
    let target = null;
    if (entry.path === '.kai/engineering/old-draft.md') {
      action = 'migrate';
      target = '.kai/engineering/spec/migration-draft/drafts/old-draft.md';
    } else if (entry.path === '.kai/creative/old-concept.md') {
      action = 'migrate';
      target = '.kai/creative/concept/migration-concept/drafts/old-concept.md';
    } else if (entry.path === '.kai/incubator/unknown-note.md' && resolveUnknown) {
      action = 'migrate';
      target = '.kai/engineering/spec/incubated-note/drafts/unknown-note.md';
    }
    entry.classification = {
      action,
      pack,
      target,
      ownership_basis: known
        ? `Legacy path explicitly belongs to ${known}.`
        : resolveUnknown
          ? 'Operator assigned the incubated source to engineering.'
          : null,
    };
  }
  for (const entry of worksheet.retained_publications) {
    entry.classification = {
      action: 'retain-in-place',
      reason: 'Accepted public links must remain stable.',
    };
  }
  if (reconcileActive) {
    for (const entry of worksheet.active_work) {
      entry.resolution = {
        status: 'reconciled',
        state: entry.reasons.some(reason => /state|producer|question/i.test(reason))
          ? 'quiesced'
          : 'none',
        lease: 'released',
        grants: entry.reasons.some(reason => /grant/i.test(reason)) ? 'revoked' : 'none',
        recovery: entry.reasons.some(reason => /recovery/i.test(reason))
          ? 'resolved'
          : 'none',
        production: 'abandoned',
        reason: 'Operator reconciled the legacy lease and production action offline.',
      };
    }
  }
  return worksheet;
}

function boundary(name, replacement, run) {
  const original = fs[name];
  fs[name] = (...args) => replacement(original, ...args);
  syncBuiltinESMExports();
  try {
    return run();
  } finally {
    fs[name] = original;
    syncBuiltinESMExports();
  }
}

function interruptReadyBeforeState(run) {
  let stateWrites = 0;
  return boundary('openSync', (original, path, ...args) => {
    if (basename(String(path)) === 'state.json') {
      stateWrites += 1;
      if (stateWrites === 2) {
        throw Object.assign(new Error('interrupt after ready before state'), {code: 'EIO'});
      }
    }
    return original(path, ...args);
  }, run);
}

function interruptPartialInstallBeforeState(root, run) {
  let targetMoved = false;
  let interrupted = false;
  return boundary('renameSync', (original, from, to) => {
    const result = original(from, to);
    if (String(from).includes(`${sep}schema5-files${sep}.kai${sep}`)
      && String(to).startsWith(`${root}${sep}.kai${sep}`)) {
      targetMoved = true;
    }
    return result;
  }, () => boundary('openSync', (original, path, ...args) => {
    if (targetMoved && !interrupted && basename(String(path)) === 'state.json') {
      interrupted = true;
      throw Object.assign(new Error('interrupt after partial install before state'), {code: 'EIO'});
    }
    return original(path, ...args);
  }, run));
}

function interruptManifestBeforeState(root, run) {
  const manifestPath = join(root, '.kai', 'manifest.json');
  let activated = false;
  let interrupted = false;
  return boundary('renameSync', (original, from, to) => {
    const result = original(from, to);
    if (String(to) === manifestPath) activated = true;
    return result;
  }, () => boundary('openSync', (original, path, ...args) => {
    if (activated && !interrupted && basename(String(path)) === 'state.json') {
      interrupted = true;
      throw Object.assign(new Error('interrupt after manifest before state'), {code: 'EIO'});
    }
    return original(path, ...args);
  }, run));
}

function interruptActivatedBeforeCleanup(root, run, message = 'interrupt after activated state') {
  const stagePrefix = `.${basename(root)}.kai-stage-`;
  let interrupted = false;
  return boundary('rmSync', (original, path, options) => {
    if (!interrupted
      && dirname(String(path)) === dirname(root)
      && basename(String(path)).startsWith(stagePrefix)) {
      interrupted = true;
      throw Object.assign(new Error(message), {code: 'EIO'});
    }
    return original(path, options);
  }, run);
}

function interruptLockRelease(root, run, message = 'interrupt before lock release') {
  const lockPath = v5MigrationLockPath(root);
  let interrupted = false;
  return boundary('unlinkSync', (original, path) => {
    if (!interrupted && String(path) === lockPath) {
      interrupted = true;
      throw Object.assign(new Error(message), {code: 'EIO'});
    }
    return original(path);
  }, run);
}

function launchModule(script, args, env = {}) {
  const child = spawn(process.execPath, [
    '--input-type=module',
    '-e',
    script,
  ], {
    cwd: checkout,
    windowsHide: true,
    env: {
      ...process.env,
      ...env,
      KAI_TEST_ARGS: JSON.stringify(args),
    },
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  let stdout = '';
  let stderr = '';
  child.stdout.on('data', chunk => { stdout += chunk; });
  child.stderr.on('data', chunk => { stderr += chunk; });
  return {
    child,
    done: new Promise(resolve => {
      child.on('exit', (code, signal) => resolve({code, signal, stdout, stderr}));
    }),
  };
}

async function waitForPath(path, timeoutMs = 10_000) {
  const deadline = Date.now() + timeoutMs;
  while (!existsSync(path)) {
    if (Date.now() >= deadline) {
      assert.fail(`timed out waiting for ${path}`);
    }
    await new Promise(resolve => setTimeout(resolve, 10));
  }
}

function nativeWriterTokenNames(root) {
  return readdirSync(dirname(root))
    .filter(name => name.includes('.native-writer-') && name.endsWith('.lock'))
    .sort();
}

async function migrateThroughNativeHost({root, backupRoot, env}) {
  const worksheet = completeWorksheet(buildMigrationWorksheet({root, env}), {
    root,
    backupRoot,
    env,
  });
  const runId = randomUUID();
  const host = createNativeHost({
    env: {...env, COPILOT_AGENT_SESSION_ID: runId},
    discover: async () => ({
      roster: ROLES.map(role => ({id: `fixture:${role}`, role, model: null})),
    }),
  });
  const requested = await host.request({
    root,
    body: {type: 'maintenance', action: 'migrate-v5', worksheet},
  });
  const persisted = readIssued(root, 'requests', requested.request.nonce);
  writeIssued(root, 'capabilities', requested.request.nonce, {
    request: persisted,
    receipt: {
      reference: 'synthetic-test-approval',
      captured_at: NOW,
    },
    catalog: {
      roster: ROLES.map(role => ({id: `fixture:${role}`, role, model: null})),
    },
  });
  const receipt = await host.maintenance({
    root,
    verb: 'migrate',
    body: {},
    options: {confirm: true, capability: requested.request.nonce},
    env,
  });
  return {receipt, capability: requested.request.nonce};
}

function assertSchema4Authoritative(root) {
  const manifest = JSON.parse(readFileSync(join(root, '.kai', 'manifest.json'), 'utf8'));
  assert.equal(manifest.schema_version, 4);
}

test('migration-plan is canonical, complete, and read-only', async () =>
  schema4Workspace(async ({root, backupRoot}) => {
    const before = tree(root);
    const statusBefore = git(root, ['status', '--short']);
    const result = await runCLI(['migration-plan', '--root', root]);
    assert.equal(result.exitCode, 0, JSON.stringify(result.result));
    const worksheet = result.result.worksheet;
    assert.deepEqual(Object.keys(worksheet), [
      'schema_version',
      'source_workspace_schema',
      'source_manifest_digest',
      'source_store_digest',
      'backup_inventory',
      'backup_inventory_digest',
      'direction_ref',
      'placement',
      'backup_root',
      'epics',
      'milestones',
      'items',
      'authored_files',
      'retained_publications',
      'active_work',
      'untracking',
    ]);
    assert.equal(worksheet.schema_version, 1);
    assert.equal(worksheet.source_workspace_schema, 4);
    assert.match(worksheet.source_manifest_digest, /^[a-f0-9]{64}$/);
    assert.match(worksheet.source_store_digest, /^[a-f0-9]{64}$/);
    assert.equal(worksheet.backup_inventory.schema_version, 1);
    assert.ok(worksheet.backup_inventory.private_files.some(entry =>
      entry.path === '.kai/manifest.json'
      && entry.type === 'file'
      && /^[a-f0-9]{64}$/.test(entry.digest)));
    assert.ok(worksheet.backup_inventory.private_files.some(entry =>
      entry.path === '.kai/state/coordination.sqlite'
      && entry.type === 'file'));
    assert.equal(
      worksheet.backup_inventory_digest,
      sha256(canonicalJson(worksheet.backup_inventory)),
    );
    assert.deepEqual(worksheet.placement, {target: null, project_binding: null});
    assert.equal(worksheet.backup_root, null);
    assert.ok(worksheet.epics.some(entry => entry.source.id === 'demo-initiative'));
    assert.deepEqual(
      worksheet.milestones.map(entry => entry.source.id),
      ['feature', 'history', 'portfolio', 'requirement'],
    );
    assert.deepEqual(
      worksheet.items.map(entry => entry.source.id),
      ['ambiguous-scope', 'build-api', 'foundation'],
    );
    assert.ok(worksheet.authored_files.some(entry => entry.path === '.kai/incubator/unknown-note.md'));
    assert.ok(worksheet.retained_publications.some(entry =>
      entry.path === 'docs/kai/decisions/accepted-old.md'));
    assert.ok(worksheet.epics.every(entry => entry.classification === null));
    assert.ok(worksheet.milestones.every(entry => entry.classification === null));
    assert.ok(worksheet.items.every(entry => entry.classification === null));
    assert.equal(result.result.worksheetDigest, sha256(canonicalJson(worksheet)));
    assert.deepEqual(tree(root), before);
    assert.equal(git(root, ['status', '--short']), statusBefore);
    assert.equal(existsSync(v5MigrationLockPath(root)), false);
    assert.equal(existsSync(join(root, '.kai', 'core', 'runtime', 'host')), false);

    const completed = completeWorksheet(worksheet, {root, backupRoot});
    assert.doesNotThrow(() => validateMigrationWorksheet({
      root,
      worksheet: completed,
      roles: ROLES,
    }));
  }));

test('migration-plan includes transitional typed hierarchy records without aliasing them', () =>
  schema4Workspace(({root, backupRoot}) => {
    const initial = buildMigrationWorksheet({root});
    const classified = completeWorksheet(initial, {root, backupRoot});
    const typed = ['epics', 'milestones', 'items']
      .flatMap(collection => classified[collection])
      .flatMap(entry => entry.classification.records);
    const store = openStore({
      path: join(root, '.kai', 'state', 'coordination.sqlite'),
      mode: 'write',
    });
    try {
      for (const record of typed) seedRecord(store, record);
    } finally {
      closeStore(store);
    }
    const worksheet = buildMigrationWorksheet({root});
    assert.ok(worksheet.epics.some(entry => entry.source.kind === 'epic'));
    assert.ok(worksheet.milestones.some(entry => entry.source.kind === 'feature'));
    assert.ok(worksheet.milestones.some(entry => entry.source.kind === 'requirement'));
    assert.ok(worksheet.items.some(entry => entry.source.kind === 'task'));
  }));

test('typed Task dependencies migrate from dependency.task without weakening relationship checks', () =>
  schema4Workspace(({root, backupRoot}) => {
    const initial = buildMigrationWorksheet({root});
    const classified = completeWorksheet(initial, {root, backupRoot});
    const taskTemplate = structuredClone(
      sourceEntry(classified, 'items', 'foundation').classification.records[0],
    );
    const dependentTemplate = structuredClone(
      sourceEntry(classified, 'items', 'build-api').classification.records[0],
    );
    const sourceFoundationId = 'engineering:task:typed-source-foundation';
    const sourceDependentId = 'engineering:task:typed-source-dependent';
    taskTemplate.id = sourceFoundationId;
    taskTemplate.body.id = sourceFoundationId;
    taskTemplate.body.depends_on = [];
    dependentTemplate.id = sourceDependentId;
    dependentTemplate.body.id = sourceDependentId;
    dependentTemplate.body.depends_on = [{
      task: sourceFoundationId,
      requires: 'completed',
    }];
    dependentTemplate.body.state = 'proposed';
    dependentTemplate.body.resume_state = null;
    dependentTemplate.body.lease = null;
    dependentTemplate.body.producer_actor = null;
    dependentTemplate.body.producing_actors = [];
    dependentTemplate.body.recovery_hold = null;

    const store = openStore({
      path: join(root, '.kai', 'state', 'coordination.sqlite'),
      mode: 'write',
    });
    try {
      seedRecord(store, taskTemplate);
      seedRecord(store, dependentTemplate);
    } finally {
      closeStore(store);
    }

    const worksheet = completeWorksheet(buildMigrationWorksheet({root}), {
      root,
      backupRoot,
    });
    const typedFoundation = sourceEntry(worksheet, 'items', sourceFoundationId);
    const typedDependent = sourceEntry(worksheet, 'items', sourceDependentId);
    typedFoundation.classification = mapped(taskTemplate);
    typedDependent.classification = mapped(dependentTemplate);
    const requirement = sourceEntry(worksheet, 'milestones', 'requirement')
      .classification.records[0];
    requirement.body.required_tasks.push(sourceFoundationId, sourceDependentId);

    assert.doesNotThrow(() => validateMigrationWorksheet({
      root,
      worksheet,
      roles: ROLES,
    }));
    typedDependent.classification.records[0].body.depends_on = [{
      task: 'engineering:task:missing',
      requires: 'completed',
    }];
    assert.throws(
      () => validateMigrationWorksheet({root, worksheet, roles: ROLES}),
      /unresolved dependency|missing dependency|relationship/i,
    );
  }));

test('schema-1 physical stores stage into schema 2 without rewriting their preserved rows', () =>
  schema4Workspace(({root, backupRoot}) => {
    const source = rawStoreSnapshot(root);
    const databasePath = join(root, '.kai', 'state', 'coordination.sqlite');
    rmSync(databasePath);
    const database = new DatabaseSync(databasePath);
    database.exec(`
      CREATE TABLE metadata (key TEXT PRIMARY KEY, value TEXT NOT NULL);
      CREATE TABLE records (
        kind TEXT NOT NULL,
        id TEXT NOT NULL,
        item_id TEXT,
        version INTEGER NOT NULL,
        body TEXT NOT NULL,
        PRIMARY KEY(kind,id)
      );
      CREATE TABLE events (
        seq INTEGER PRIMARY KEY AUTOINCREMENT,
        operation_id TEXT NOT NULL,
        item_id TEXT,
        payload TEXT NOT NULL,
        thread_id TEXT
      );
      CREATE TABLE operations (
        id TEXT PRIMARY KEY,
        payload_digest TEXT NOT NULL,
        receipt TEXT NOT NULL
      );
    `);
    database.prepare('INSERT INTO metadata VALUES(?,?)').run('schema_version', '1');
    database.prepare('INSERT INTO metadata VALUES(?,?)').run('message_schema_version', '1');
    const recordInsert = database.prepare('INSERT INTO records VALUES(?,?,?,?,?)');
    for (const row of source.records) {
      recordInsert.run(
        row.kind,
        row.id,
        row.subject_kind === 'item' ? row.subject_id : null,
        row.version,
        row.body,
      );
    }
    const eventInsert = database.prepare(
      'INSERT INTO events(seq,operation_id,item_id,payload,thread_id) VALUES(?,?,?,?,?)',
    );
    for (const row of source.events) {
      eventInsert.run(
        row.seq,
        row.operation_id,
        row.subject_kind === 'item' ? row.subject_id : null,
        row.payload,
        row.thread_id,
      );
    }
    const operationInsert = database.prepare('INSERT INTO operations VALUES(?,?,?)');
    for (const row of source.operations) {
      operationInsert.run(row.id, row.payload_digest, row.receipt);
    }
    database.close();

    const worksheet = completeWorksheet(buildMigrationWorksheet({root}), {
      root,
      backupRoot,
    });
    migrateWorkspaceV5({
      root,
      confirm: true,
      worksheet,
      roles: ROLES,
    });
    const store = openStore({
      path: join(root, '.kai', 'core', 'runtime', 'coordination.sqlite'),
      mode: 'read',
    });
    try {
      assert.equal(store.schemaVersion, 2);
      const preserved = JSON.parse(store.database.prepare(`
        SELECT row_json FROM migration_legacy_records
        WHERE kind='item' AND id='build-api'
      `).get().row_json);
      assert.equal(preserved.item_id, 'build-api');
      assert.equal(Object.hasOwn(preserved, 'subject_kind'), false);
    } finally {
      closeStore(store);
    }
  }));

test('complete classification blocks every ambiguity, stale binding, unsafe backup, and inconsistent hierarchy', () =>
  schema4Workspace(({root, backupRoot}) => {
    const plan = buildMigrationWorksheet({root});
    const complete = () => completeWorksheet(plan, {root, backupRoot});

    assert.throws(
      () => validateMigrationWorksheet({root, worksheet: plan, roles: ROLES}),
      /classification|placement|backup/i,
    );
    const unknown = completeWorksheet(plan, {
      root,
      backupRoot,
      resolveUnknown: false,
    });
    assert.throws(
      () => validateMigrationWorksheet({root, worksheet: unknown, roles: ROLES}),
      /unknown|ownership|pack/i,
    );
    const inside = complete();
    inside.backup_root = join(root, 'backup');
    mkdirSync(inside.backup_root, {recursive: true});
    assert.throws(
      () => validateMigrationWorksheet({root, worksheet: inside, roles: ROLES}),
      /backup.*outside|outside.*backup/i,
    );
    const authority = complete();
    sourceEntry(authority, 'milestones', 'feature')
      .classification.records[0].body.owner = 'incubator-owner';
    assert.throws(
      () => validateMigrationWorksheet({root, worksheet: authority, roles: ROLES}),
      /authority|role|owner/i,
    );
    const relationship = complete();
    sourceEntry(relationship, 'milestones', 'requirement')
      .classification.records[0].body.required_tasks = [];
    assert.throws(
      () => validateMigrationWorksheet({root, worksheet: relationship, roles: ROLES}),
      /relationship|task|requirement/i,
    );
    const dependency = complete();
    sourceEntry(dependency, 'items', 'build-api')
      .classification.records[0].body.depends_on = [];
    assert.throws(
      () => validateMigrationWorksheet({root, worksheet: dependency, roles: ROLES}),
      /preserve.*dependency|dependency.*mapping/i,
    );
    const timestamp = complete();
    sourceEntry(timestamp, 'items', 'build-api')
      .classification.records[0].body.updated_at = '2026-10-03T12:00:00.000Z';
    assert.throws(
      () => validateMigrationWorksheet({root, worksheet: timestamp, roles: ROLES}),
      /preserve.*updated_at|updated_at/i,
    );
    const historicalAcceptance = complete();
    const historicalTarget = sourceEntry(
      historicalAcceptance,
      'items',
      'ambiguous-scope',
    ).classification.records[0];
    historicalTarget.body.state = 'completed';
    historicalTarget.body.completion_disposition = 'satisfied';
    assert.throws(
      () => validateMigrationWorksheet({
        root,
        worksheet: historicalAcceptance,
        roles: ROLES,
      }),
      /historical terminal|current acceptance/i,
    );
    const stale = complete();
    appendFileSync(join(root, 'docs', 'kai', 'DIRECTION.md'), '\nChanged goal evidence.\n');
    assert.throws(
      () => validateMigrationWorksheet({root, worksheet: stale, roles: ROLES}),
      /Direction|hash|stale|changed/i,
    );
  }));

test('active leases and in-flight production require an explicit offline reconciliation', () =>
  schema4Workspace(({root, backupRoot}) => {
    const plan = buildMigrationWorksheet({root});
    const buildApi = plan.active_work.find(entry => entry.source.id === 'build-api');
    assert.ok(buildApi);
    assert.ok(buildApi.reasons.some(reason => /lease|deploy/i.test(reason)));
    assert.equal(canonicalJson(plan).includes('active-lease'), false);
    assert.match(
      sourceEntry(plan, 'items', 'build-api').source.body.lease.token_digest,
      /^[a-f0-9]{64}$/,
    );
    const unresolved = completeWorksheet(plan, {
      root,
      backupRoot,
      reconcileActive: false,
    });
    assert.throws(
      () => validateMigrationWorksheet({root, worksheet: unresolved, roles: ROLES}),
      /active|lease|reconcile|production/i,
    );
    const reconciled = completeWorksheet(plan, {root, backupRoot});
    assert.doesNotThrow(() => validateMigrationWorksheet({
      root,
      worksheet: reconciled,
      roles: ROLES,
    }));
    migrateWorkspaceV5({
      root,
      confirm: true,
      worksheet: reconciled,
      roles: ROLES,
    });
    const store = openStore({
      path: join(root, '.kai', 'core', 'runtime', 'coordination.sqlite'),
      mode: 'read',
    });
    try {
      const source = JSON.parse(store.database.prepare(`
        SELECT row_json FROM migration_legacy_records
        WHERE kind='item' AND id='build-api'
      `).get().row_json);
      assert.equal(JSON.parse(source.body).lease.token, 'active-lease');
      const task = readRecord(store, 'task', 'engineering:task:build-api');
      assert.equal(task.body.lease, null);
      assert.equal(task.body.state, 'blocked');
    } finally {
      closeStore(store);
    }
  }, {active: true}));

test('quiescence inventories every nonterminal state plus grants, leases, and recovery', () =>
  schema4Workspace(({root, backupRoot}) => {
    const store = openStore({
      path: join(root, '.kai', 'state', 'coordination.sqlite'),
      mode: 'write',
    });
    const recoveryId = randomUUID();
    try {
      for (const state of [
        'ready',
        'in-progress',
        'in-review',
        'release-ready',
        'deploying',
        'production-verification',
        'blocked',
      ]) {
        seedItem(store, {
          id: `state-${state}`,
          title: `State ${state}`,
          initiative: 'demo-initiative',
          state,
          resume_state: state === 'blocked' ? 'in-progress' : null,
          producer_actor: null,
          producing_actors: [],
          acceptance_actor: null,
          next_role: 'eng-builder-software',
          updated_at: NOW,
        });
      }
      seedItem(store, {
        id: 'recovery-task',
        title: 'Recovery task',
        initiative: 'demo-initiative',
        state: 'blocked',
        resume_state: 'in-progress',
        producer_actor: null,
        producing_actors: [],
        acceptance_actor: null,
        recovery_hold: recoveryId,
        updated_at: NOW,
      });
      seedRecord(store, {
        kind: 'grant',
        id: randomUUID(),
        subject: {kind: 'item', id: 'build-api'},
        version: 1,
        body: {
          status: 'active',
        },
      });
    } finally {
      closeStore(store);
    }

    const plan = buildMigrationWorksheet({root});
    for (const state of [
      'proposed',
      'ready',
      'in-progress',
      'in-review',
      'release-ready',
      'deploying',
      'production-verification',
      'blocked',
    ]) {
      assert.ok(plan.active_work.some(entry =>
        entry.reasons.some(reason => reason.includes(state))),
      `missing quiescence entry for ${state}`);
    }
    assert.ok(plan.active_work.some(entry =>
      entry.source.kind === 'grant'
      && entry.reasons.some(reason => /grant/i.test(reason))));
    assert.ok(plan.active_work.some(entry =>
      entry.source.id === 'recovery-task'
      && entry.reasons.some(reason => /recovery/i.test(reason))));

    const unresolved = completeWorksheet(plan, {
      root,
      backupRoot,
      reconcileActive: false,
    });
    for (const entry of unresolved.items) {
      if (entry.classification === null) {
        entry.classification = historical(
          'Additional nonterminal source is reconciled offline and retained as provenance.',
        );
      }
    }
    assert.throws(
      () => validateMigrationWorksheet({root, worksheet: unresolved, roles: ROLES}),
      error => error.code === 'RECOVERY_REQUIRED'
        && /active|quies|reconcil|state|grant|recovery/i.test(error.message),
    );

    const reconciled = completeWorksheet(plan, {root, backupRoot});
    for (const entry of reconciled.items) {
      if (entry.classification === null) {
        entry.classification = historical(
          'Additional nonterminal source is reconciled offline and retained as provenance.',
        );
      }
    }
    assert.doesNotThrow(() => validateMigrationWorksheet({
      root,
      worksheet: reconciled,
      roles: ROLES,
    }));
  }));

test('quiescence inventories every open typed question regardless of subject or blocking', () =>
  schema4Workspace(({root, backupRoot}) => {
    const questions = [
      {
        id: 'feature-open-question',
        subject: {kind: 'feature', id: 'engineering:feature:migration'},
        blocking: true,
      },
      {
        id: 'requirement-open-question',
        subject: {kind: 'requirement', id: 'engineering:requirement:migration'},
        blocking: false,
      },
      {
        id: 'task-nonblocking-question',
        subject: {kind: 'task', id: 'engineering:task:build-api'},
        blocking: false,
      },
    ];
    const store = openStore({
      path: join(root, '.kai', 'state', 'coordination.sqlite'),
      mode: 'write',
    });
    try {
      for (const question of questions) {
        seedRecord(store, {
          kind: 'question',
          id: question.id,
          subject: question.subject,
          version: 1,
          body: {
            schema_version: 1,
            question_id: question.id,
            subject: question.subject,
            asker: {role: 'eng-lead-architecture', runId: 'question-asker'},
            recipient: 'eng-reviewer-code',
            kind: 'decision',
            blocking: question.blocking,
            status: 'open',
            context: 'Migration quiescence must retain this open question.',
            ask: 'How is this question explicitly reconciled before migration?',
            answer_by: NOW,
            opened_message_id: randomUUID(),
            answer_message_ids: [],
            resolution: null,
          },
        });
      }
    } finally {
      closeStore(store);
    }

    const plan = buildMigrationWorksheet({root});
    for (const question of questions) {
      const active = plan.active_work.find(entry =>
        entry.source.kind === 'question' && entry.source.id === question.id);
      assert.ok(active, `missing ${question.id}`);
      assert.ok(active.reasons.some(reason =>
        reason.includes(question.subject.kind)
        && reason.includes(question.blocking ? 'blocking' : 'nonblocking')));
    }

    const unresolved = completeWorksheet(plan, {
      root,
      backupRoot,
      reconcileActive: false,
    });
    assert.throws(
      () => validateMigrationWorksheet({root, worksheet: unresolved, roles: ROLES}),
      error => error.code === 'RECOVERY_REQUIRED'
        && /question|reconcil|active/i.test(error.message),
    );
    const reconciled = completeWorksheet(plan, {root, backupRoot});
    assert.doesNotThrow(() => validateMigrationWorksheet({
      root,
      worksheet: reconciled,
      roles: ROLES,
    }));
  }));

test('tracked private sources stop with exact operator guidance and require a fresh worksheet', () =>
  schema4Workspace(({root, project, backupRoot}) => {
    const plan = buildMigrationWorksheet({root});
    assert.equal(plan.untracking.length, 1);
    assert.equal(plan.untracking[0].path, '.kai/engineering/old-draft.md');
    assert.match(plan.untracking[0].command, /^git -C .+ rm --cached -- .+old-draft\.md/);
    const worksheet = completeWorksheet(plan, {root, backupRoot});
    assert.throws(
      () => validateMigrationWorksheet({root, worksheet, roles: ROLES}),
      error => error.code === 'RECOVERY_REQUIRED'
        && error.message.includes(plan.untracking[0].command)
        && /fresh worksheet.*capability/i.test(error.message),
    );
    assert.equal(git(project, ['ls-files', '--', '.kai/engineering/old-draft.md']).trim(),
      '.kai/engineering/old-draft.md');
  }, {trackedPrivate: true, unknownAuthored: false}));

test('shared placement requires an explicit target and complete schema-5 privacy before activation', () =>
  schema4Workspace(({root, backupRoot}) => {
    const plan = buildMigrationWorksheet({root});
    assert.deepEqual(plan.placement, {target: null, project_binding: null});
    const worksheet = completeWorksheet(plan, {root, backupRoot});
    assert.throws(
      () => validateMigrationWorksheet({root, worksheet, roles: ROLES}),
      /ignore|privacy|private/i,
    );
    assertSchema4Authoritative(root);
  }, {mode: 'shared', unknownAuthored: false}));

test('external registry changes stale the bound classification', () =>
  schema4Workspace(({root, project, backupRoot, env}) => {
    const plan = buildMigrationWorksheet({root, env});
    assert.deepEqual(plan.placement, {target: null, project_binding: null});
    const worksheet = completeWorksheet(plan, {
      root,
      project,
      backupRoot,
      env,
      placement: 'external',
    });
    assert.doesNotThrow(() => validateMigrationWorksheet({
      root,
      worksheet,
      roles: ROLES,
      env,
    }));
    appendFileSync(join(env.KAI_HOME, 'workspaces.json'), '\n');
    assert.throws(
      () => validateMigrationWorksheet({root, worksheet, roles: ROLES, env}),
      /registry|digest|changed/i,
    );
  }, {external: true, unknownAuthored: false}));

test('backup-first activation preserves source truth, maps every source, and leaves public links in place', () =>
  schema4Workspace(({root, backupRoot}) => {
    const source = rawStoreSnapshot(root);
    const sourceBytes = readFileSync(join(root, '.kai', 'state', 'coordination.sqlite'));
    const itemBytes = readFileSync(join(root, '.kai', 'state', 'items', 'build-api.md'));
    const publicBytes = readFileSync(join(root, 'docs', 'kai', 'decisions', 'accepted-old.md'));
    const worksheet = completeWorksheet(buildMigrationWorksheet({root}), {
      root,
      backupRoot,
    });
    const receipt = migrateWorkspaceV5({
      root,
      confirm: true,
      worksheet,
      roles: ROLES,
    });
    const manifest = JSON.parse(readFileSync(join(root, '.kai', 'manifest.json'), 'utf8'));
    assert.equal(manifest.schema_version, 5);
    assert.equal(manifest.placement, 'repo-local');
    assert.equal(existsSync(join(root, '.kai', 'state')), false);
    assert.equal(existsSync(join(root, '.kai', 'runs')), false);
    assert.equal(existsSync(join(root, '.kai', 'review')), false);
    assert.equal(existsSync(join(root, '.kai', 'archive')), false);
    assert.equal(
      readFileSync(join(root, '.kai', 'engineering', 'spec', 'migration-draft',
        'drafts', 'old-draft.md'), 'utf8'),
      '# Engineering draft\n',
    );
    assert.equal(
      readFileSync(join(root, '.kai', 'creative', 'concept', 'migration-concept',
        'drafts', 'old-concept.md'), 'utf8'),
      '# Creative concept\n',
    );
    assert.deepEqual(
      readFileSync(join(root, 'docs', 'kai', 'decisions', 'accepted-old.md')),
      publicBytes,
    );
    assert.equal(receipt.digest, sha256(canonicalJson(receipt.payload)));
    assert.equal(existsSync(receipt.backupPath), true);
    assert.equal(
      receipt.payload.backup_inventory_digest,
      worksheet.backup_inventory_digest,
    );
    const ready = JSON.parse(
      readFileSync(join(receipt.backupPath, 'ready.json'), 'utf8'),
    );
    assert.equal(ready.digest, sha256(canonicalJson(ready.payload)));
    assert.equal(
      ready.payload.backup_inventory_digest,
      worksheet.backup_inventory_digest,
    );
    assert.equal(receipt.payload.ready_digest, ready.digest);
    assert.deepEqual(
      readFileSync(join(receipt.backupPath, 'private', '.kai', 'state', 'coordination.sqlite')),
      sourceBytes,
    );

    const store = openStore({
      path: join(root, '.kai', 'core', 'runtime', 'coordination.sqlite'),
      mode: 'write',
    });
    try {
      const task = readRecord(store, 'task', 'engineering:task:build-api');
      assert.equal(task.version, 7);
      assert.equal(task.body.updated_at, NOW);
      assert.equal(task.body.acceptance_actor, null);
      assert.deepEqual(task.body.depends_on, [{
        task: 'engineering:task:foundation',
        requires: 'completed',
      }]);
      assert.equal(readRecord(store, 'task', 'engineering:task:foundation').version, 2);
      assert.equal(readRecord(store, 'requirement',
        'engineering:requirement:ambiguous-scope').version, 5);
      assert.equal(store.database.prepare(
        "SELECT COUNT(*) AS count FROM records WHERE kind IN ('initiative','item')",
      ).get().count, 0);
      const map = store.database.prepare(`
        SELECT source_kind,source_id,source_version,target_kind,target_id,target_version,disposition
        FROM migration_id_map ORDER BY source_kind,source_id
      `).all();
      assert.ok(map.some(row => row.source_kind === 'item'
        && row.source_id === 'build-api'
        && row.source_version === 7
        && row.target_kind === 'task'
        && row.target_id === 'engineering:task:build-api'
        && row.target_version === 7));
      assert.ok(map.some(row => row.source_kind === 'milestone'
        && row.source_id === 'demo-initiative/history'
        && row.target_kind === null
        && row.disposition === 'historical-only'));
      const legacyKinds = store.database.prepare(
        'SELECT kind FROM migration_legacy_records ORDER BY kind,id',
      ).all().map(row => row.kind);
      for (const kind of [
        'initiative',
        'item',
        'question',
        'message',
        'approval',
        'evidence',
        'review',
        'attempt',
      ]) {
        assert.ok(legacyKinds.includes(kind), `missing preserved ${kind}`);
      }
      assert.equal(
        canonicalJson(store.database.prepare(
          'SELECT row_json FROM migration_legacy_events ORDER BY source_seq',
        ).all().map(row => JSON.parse(row.row_json))),
        canonicalJson(source.events),
      );
      assert.equal(
        canonicalJson(store.database.prepare(
          'SELECT row_json FROM migration_legacy_operations ORDER BY source_id',
        ).all().map(row => JSON.parse(row.row_json))),
        canonicalJson(source.operations),
      );
      assert.throws(
        () => store.database.prepare(
          "UPDATE migration_legacy_records SET row_json='{}' WHERE kind='item'",
        ).run(),
        /immutable|provenance/i,
      );
      const activation = store.database.prepare(
        "SELECT value FROM metadata WHERE key='migration_v5'",
      ).get();
      assert.ok(activation);
      const baseline = JSON.parse(store.database.prepare(
        "SELECT value FROM metadata WHERE key='migration_v5_baseline'",
      ).get().value);
      assert.equal(baseline.event_count, 1);
      assert.match(baseline.event_digest, /^[a-f0-9]{64}$/);
      const migratedSource = readLegacyRecords(store)
        .find(entry => entry.path === '.kai/state/items/build-api.md');
      assert.ok(migratedSource);
      assert.deepEqual(
        readLegacyRecords(store, {
          sourceId: migratedSource.sourceId,
          includeRaw: true,
        })[0].raw,
        itemBytes,
      );
    } finally {
      closeStore(store);
    }
    const doctor = checkWorkspace(root, {intent: 'coordinate'});
    assert.deepEqual(doctor.errors, [], JSON.stringify(doctor));
    assert.equal(inspectRuntime(root, {intent: 'inspect'}).errors.length, 0);
    assert.equal(existsSync(v5MigrationLockPath(root)), false);
  }));

test('capability binds the exact canonical worksheet and migrate ignores any second payload', async () =>
  schema4Workspace(async ({root, backupRoot, env}) => {
    const worksheet = completeWorksheet(buildMigrationWorksheet({root, env}), {
      root,
      backupRoot,
      env,
    });
    const runId = randomUUID();
    const host = createNativeHost({
      env: {...env, COPILOT_AGENT_SESSION_ID: runId},
      discover: async () => ({
        roster: ROLES.map(role => ({id: `fixture:${role}`, role, model: null})),
      }),
    });
    const requested = await host.request({
      root,
      body: {type: 'maintenance', action: 'migrate-v5', worksheet},
    });
    const persisted = readIssued(root, 'requests', requested.request.nonce);
    assert.equal(persisted.worksheetDigest, sha256(canonicalJson(worksheet)));
    assert.equal(canonicalJson(persisted.scope.worksheet), canonicalJson(worksheet));
    assert.equal(
      persisted.scope.worksheet.backup_inventory_digest,
      worksheet.backup_inventory_digest,
    );
    writeIssued(root, 'capabilities', requested.request.nonce, {
      request: persisted,
      receipt: {
        reference: 'synthetic-test-approval',
        captured_at: NOW,
      },
      catalog: {
        roster: ROLES.map(role => ({id: `fixture:${role}`, role, model: null})),
      },
    });
    const hostRoot = join(root, '.kai', 'core', 'runtime', 'host');
    const requestBytes = readFileSync(join(
      hostRoot,
      'requests',
      `${requested.request.nonce}.json`,
    ));
    const capabilityBytes = readFileSync(join(
      hostRoot,
      'capabilities',
      `${requested.request.nonce}.json`,
    ));
    const issuerKey = readFileSync(join(hostRoot, 'key'));
    const changed = structuredClone(worksheet);
    sourceEntry(changed, 'items', 'build-api').classification.primary.id =
      'engineering:task:not-authorized';
    const receipt = await host.maintenance({
      root,
      verb: 'migrate',
      body: {worksheet: changed},
      options: {confirm: true, capability: requested.request.nonce},
      env,
    });
    assert.equal(receipt.activated, true);
    assert.equal(
      receipt.payload.backup_inventory_digest,
      worksheet.backup_inventory_digest,
    );
    assert.match(receipt.payload.authorization_digest, /^[a-f0-9]{64}$/);
    assert.deepEqual(
      readFileSync(join(receipt.backupPath, 'authorization', 'request.json')),
      requestBytes,
    );
    assert.deepEqual(
      readFileSync(join(receipt.backupPath, 'authorization', 'capability.json')),
      capabilityBytes,
    );
    assert.deepEqual(
      readFileSync(join(receipt.backupPath, 'authorization', 'issuer-key')),
      issuerKey,
    );
    const authorization = JSON.parse(readFileSync(
      join(receipt.backupPath, 'authorization.json'),
      'utf8',
    ));
    assert.equal(
      authorization.digest,
      sha256(canonicalJson(authorization.payload)),
    );
    assert.equal(authorization.payload.capability_id, requested.request.nonce);
    assert.equal(authorization.payload.signing.algorithm, 'hmac-sha256');
    assert.equal(
      authorization.payload.signing.key_digest,
      sha256(issuerKey),
    );
    const store = openStore({
      path: join(root, '.kai', 'core', 'runtime', 'coordination.sqlite'),
      mode: 'read',
    });
    try {
      assert.ok(readRecord(store, 'task', 'engineering:task:build-api'));
      assert.equal(readRecord(store, 'task', 'engineering:task:not-authorized'), null);
    } finally {
      closeStore(store);
    }
    const rolledBack = rollbackWorkspaceV5({root, confirm: true, env});
    assert.equal(rolledBack.rolledBack, true);
    assert.equal(existsSync(hostRoot), false);
    assert.deepEqual(
      readFileSync(join(receipt.backupPath, 'authorization', 'request.json')),
      requestBytes,
    );
  }));

test('interrupted phases remain schema 4 authoritative and recover only from verified state', async t => {
  const scenarios = [
    {
      name: 'before backup',
      intercept(run) {
        return boundary('copyFileSync', () => {
          throw Object.assign(new Error('interrupt before backup'), {code: 'EIO'});
        }, run);
      },
      recover: 'abandon',
      activated: false,
    },
    {
      name: 'after backup',
      intercept(run) {
        return boundary('mkdirSync', (original, path, options) => {
          if (String(path).includes('.kai-stage-')) {
            throw Object.assign(new Error('interrupt after backup'), {code: 'EIO'});
          }
          return original(path, options);
        }, run);
      },
      recover: 'activate',
      activated: true,
    },
    {
      name: 'after staged database',
      intercept(run) {
        return boundary('renameSync', (original, from, to) => {
          if (String(to).endsWith(join('.kai', 'core', 'runtime', 'coordination.sqlite'))) {
            throw Object.assign(new Error('interrupt after staged database'), {code: 'EIO'});
          }
          return original(from, to);
        }, run);
      },
      recover: 'activate',
      activated: true,
    },
    {
      name: 'after database move before manifest',
      intercept(run) {
        return boundary('renameSync', (original, from, to) => {
          if (String(to).endsWith(join('.kai', 'manifest.json'))) {
            throw Object.assign(new Error('interrupt before manifest activation'), {code: 'EIO'});
          }
          return original(from, to);
        }, run);
      },
      recover: 'activate',
      activated: true,
    },
  ];
  for (const scenario of scenarios) {
    await t.test(scenario.name, () => schema4Workspace(({root, backupRoot}) => {
      const worksheet = completeWorksheet(buildMigrationWorksheet({root}), {
        root,
        backupRoot,
      });
      assert.throws(() => scenario.intercept(() => migrateWorkspaceV5({
        root,
        confirm: true,
        worksheet,
        roles: ROLES,
      })), /interrupt/);
      assertSchema4Authoritative(root);
      assert.equal(existsSync(v5MigrationLockPath(root)), true);
      if (scenario.name === 'after backup') {
        put(root, '.kai/core/runtime/host/recovery-capability.json', '{"synthetic":true}\n');
      }
      const recovered = recoverWorkspaceV5({
        root,
        confirm: true,
        action: scenario.recover,
        roles: ROLES,
      });
      assert.equal(recovered.activated, scenario.activated);
      assert.equal(
        JSON.parse(readFileSync(join(root, '.kai', 'manifest.json'), 'utf8')).schema_version,
        scenario.activated ? 5 : 4,
      );
      assert.equal(existsSync(v5MigrationLockPath(root)), false);
    }));
  }
});

test('ready.json is authoritative when its mutable state update crashes', async t => {
  for (const action of ['activate', 'abandon']) {
    await t.test(action, () => schema4Workspace(({root, backupRoot}) => {
      const sourcePath = join(root, '.kai', 'engineering', 'old-draft.md');
      const sourceBytes = readFileSync(sourcePath);
      const worksheet = completeWorksheet(buildMigrationWorksheet({root}), {
        root,
        backupRoot,
      });
      assert.throws(
        () => interruptReadyBeforeState(() => migrateWorkspaceV5({
          root,
          confirm: true,
          worksheet,
          roles: ROLES,
        })),
        /interrupt after ready before state/,
      );
      const lock = JSON.parse(readFileSync(v5MigrationLockPath(root), 'utf8'));
      const state = JSON.parse(readFileSync(join(lock.backup_path, 'state.json'), 'utf8'));
      assert.equal(state.phase, 'locked');
      assert.equal(state.ready_digest, null);
      assert.equal(existsSync(join(lock.backup_path, 'ready.json')), true);
      if (action === 'abandon') appendFileSync(sourcePath, 'concurrent source edit\n');

      const recovered = recoverWorkspaceV5({
        root,
        confirm: true,
        action,
        roles: ROLES,
      });
      assert.equal(recovered.activated, action === 'activate');
      assert.equal(
        JSON.parse(readFileSync(join(root, '.kai', 'manifest.json'), 'utf8')).schema_version,
        action === 'activate' ? 5 : 4,
      );
      if (action === 'abandon') {
        assert.deepEqual(
          readFileSync(sourcePath),
          sourceBytes,
          'abandon must restore the exact immutable schema-4 source',
        );
      }
      assert.equal(existsSync(v5MigrationLockPath(root)), false);
    }));
  }
});

test('database metadata reconstructs missing external staging anchors', () =>
  schema4Workspace(({root, backupRoot}) => {
    const worksheet = completeWorksheet(buildMigrationWorksheet({root}), {
      root,
      backupRoot,
    });
    assert.throws(
      () => boundary('openSync', (original, path, ...args) => {
        if (basename(String(path)) === 'activation-ready.json') {
          throw Object.assign(new Error('interrupt before external staging anchors'), {code: 'EIO'});
        }
        return original(path, ...args);
      }, () => migrateWorkspaceV5({
        root,
        confirm: true,
        worksheet,
        roles: ROLES,
      })),
      /interrupt before external staging anchors/,
    );
    const lock = JSON.parse(readFileSync(v5MigrationLockPath(root), 'utf8'));
    assert.equal(existsSync(join(lock.backup_path, 'activation-ready.json')), false);
    assert.equal(existsSync(join(lock.backup_path, 'receipt.json')), false);
    assert.equal(
      existsSync(join(lock.stage_path, '.kai', 'core', 'runtime', 'coordination.sqlite')),
      true,
    );

    const recovered = recoverWorkspaceV5({
      root,
      confirm: true,
      action: 'activate',
      roles: ROLES,
    });
    assert.equal(recovered.activated, true);
    assert.equal(existsSync(v5MigrationLockPath(root)), false);
  }));

test('partial authored installation is derived from physical inventory, not mutable state', async t => {
  for (const action of ['activate', 'abandon']) {
    await t.test(action, () => schema4Workspace(({root, backupRoot}) => {
      const worksheet = completeWorksheet(buildMigrationWorksheet({root}), {
        root,
        backupRoot,
      });
      const targets = worksheet.authored_files
        .filter(entry => entry.classification.action === 'migrate')
        .map(entry => entry.classification.target);
      assert.throws(
        () => interruptPartialInstallBeforeState(root, () => migrateWorkspaceV5({
          root,
          confirm: true,
          worksheet,
          roles: ROLES,
        })),
        /interrupt after partial install before state/,
      );
      const lock = JSON.parse(readFileSync(v5MigrationLockPath(root), 'utf8'));
      const state = JSON.parse(readFileSync(join(lock.backup_path, 'state.json'), 'utf8'));
      assert.equal(state.phase, 'sources-retired');
      assert.equal(state.installed_targets.length, 0);
      assert.equal(
        targets.filter(path => existsSync(join(root, ...path.split('/')))).length,
        1,
      );

      const recovered = recoverWorkspaceV5({
        root,
        confirm: true,
        action,
        roles: ROLES,
      });
      assert.equal(recovered.activated, action === 'activate');
      assert.equal(
        JSON.parse(readFileSync(join(root, '.kai', 'manifest.json'), 'utf8')).schema_version,
        action === 'activate' ? 5 : 4,
      );
      for (const target of targets) {
        assert.equal(
          existsSync(join(root, ...target.split('/'))),
          action === 'activate',
        );
      }
      assert.equal(existsSync(v5MigrationLockPath(root)), false);
    }));
  }
});

test('manifest activation is authoritative when receipt advances before mutable state', () =>
  schema4Workspace(({root, backupRoot}) => {
    const worksheet = completeWorksheet(buildMigrationWorksheet({root}), {
      root,
      backupRoot,
    });
    assert.throws(
      () => interruptManifestBeforeState(root, () => migrateWorkspaceV5({
        root,
        confirm: true,
        worksheet,
        roles: ROLES,
      })),
      /interrupt after manifest before state/,
    );
    const lock = JSON.parse(readFileSync(v5MigrationLockPath(root), 'utf8'));
    const state = JSON.parse(readFileSync(join(lock.backup_path, 'state.json'), 'utf8'));
    const receipt = JSON.parse(readFileSync(join(lock.backup_path, 'receipt.json'), 'utf8'));
    assert.equal(state.phase, 'db-moved');
    assert.equal(state.receipt.activated, false);
    assert.equal(receipt.activated, true);
    assert.equal(
      JSON.parse(readFileSync(join(root, '.kai', 'manifest.json'), 'utf8')).schema_version,
      5,
    );

    const recovered = recoverWorkspaceV5({
      root,
      confirm: true,
      action: 'activate',
      roles: [],
    });
    assert.equal(recovered.activated, true);
    assert.equal(existsSync(v5MigrationLockPath(root)), false);
  }));

test('activated mutable state resumes only cleanup and lock release', () =>
  schema4Workspace(({root, backupRoot}) => {
    const worksheet = completeWorksheet(buildMigrationWorksheet({root}), {
      root,
      backupRoot,
    });
    assert.throws(
      () => interruptActivatedBeforeCleanup(root, () => migrateWorkspaceV5({
        root,
        confirm: true,
        worksheet,
        roles: ROLES,
      })),
      /interrupt after activated state/,
    );
    const lock = JSON.parse(readFileSync(v5MigrationLockPath(root), 'utf8'));
    const state = JSON.parse(readFileSync(join(lock.backup_path, 'state.json'), 'utf8'));
    assert.equal(state.phase, 'activated');
    assert.equal(state.receipt.activated, true);
    assert.equal(existsSync(lock.stage_path), true);

    const recovered = recoverWorkspaceV5({
      root,
      confirm: true,
      action: 'activate',
      roles: ROLES,
    });
    assert.equal(recovered.activated, true);
    assert.equal(existsSync(lock.stage_path), false);
    assert.equal(existsSync(v5MigrationLockPath(root)), false);
  }));

test('repeated activate recovery is idempotent after another cleanup crash', () =>
  schema4Workspace(({root, backupRoot}) => {
    const worksheet = completeWorksheet(buildMigrationWorksheet({root}), {
      root,
      backupRoot,
    });
    assert.throws(
      () => interruptActivatedBeforeCleanup(root, () => migrateWorkspaceV5({
        root,
        confirm: true,
        worksheet,
        roles: ROLES,
      })),
      /interrupt after activated state/,
    );
    const lock = JSON.parse(readFileSync(v5MigrationLockPath(root), 'utf8'));
    assert.throws(
      () => interruptLockRelease(
        root,
        () => recoverWorkspaceV5({
          root,
          confirm: true,
          action: 'activate',
          roles: ROLES,
        }),
        'interrupt repeated recovery lock release',
      ),
      /interrupt repeated recovery lock release/,
    );
    assert.equal(existsSync(lock.stage_path), false);
    assert.equal(existsSync(v5MigrationLockPath(root)), true);

    const recovered = recoverWorkspaceV5({
      root,
      confirm: true,
      action: 'activate',
      roles: ROLES,
    });
    assert.equal(recovered.activated, true);
    assert.equal(existsSync(lock.stage_path), false);
    assert.equal(existsSync(v5MigrationLockPath(root)), false);
  }));

test('activated abandon routes through baseline-only rollback', () =>
  schema4Workspace(({root, backupRoot}) => {
    const sourceDatabase = readFileSync(join(root, '.kai', 'state', 'coordination.sqlite'));
    const worksheet = completeWorksheet(buildMigrationWorksheet({root}), {
      root,
      backupRoot,
    });
    assert.throws(
      () => interruptActivatedBeforeCleanup(root, () => migrateWorkspaceV5({
        root,
        confirm: true,
        worksheet,
        roles: ROLES,
      })),
      /interrupt after activated state/,
    );

    const recovered = recoverWorkspaceV5({
      root,
      confirm: true,
      action: 'abandon',
      roles: ROLES,
    });
    assert.equal(recovered.rolledBack, true);
    assert.equal(recovered.schemaVersion, 4);
    assert.deepEqual(
      readFileSync(join(root, '.kai', 'state', 'coordination.sqlite')),
      sourceDatabase,
    );
    assert.equal(existsSync(v5MigrationLockPath(root)), false);
  }));

test('activated abandon refuses rollback after the baseline advances', () =>
  schema4Workspace(({root, backupRoot}) => {
    const worksheet = completeWorksheet(buildMigrationWorksheet({root}), {
      root,
      backupRoot,
    });
    assert.throws(
      () => interruptActivatedBeforeCleanup(root, () => migrateWorkspaceV5({
        root,
        confirm: true,
        worksheet,
        roles: ROLES,
      })),
      /interrupt after activated state/,
    );
    const database = new DatabaseSync(
      join(root, '.kai', 'core', 'runtime', 'coordination.sqlite'),
    );
    try {
      database.prepare(`
        INSERT INTO events(operation_id,subject_kind,subject_id,payload)
        VALUES(?,?,?,?)
      `).run(
        randomUUID(),
        'task',
        'engineering:task:build-api',
        canonicalJson({kind: 'adversarial.post-activation-event'}),
      );
    } finally {
      database.close();
    }

    assert.throws(
      () => recoverWorkspaceV5({
        root,
        confirm: true,
        action: 'abandon',
        roles: ROLES,
      }),
      error => error.code === 'RECOVERY_REQUIRED'
        && /event|baseline|reconcil/i.test(error.message),
    );
    assert.equal(
      JSON.parse(readFileSync(join(root, '.kai', 'manifest.json'), 'utf8')).schema_version,
      5,
    );
    assert.equal(existsSync(v5MigrationLockPath(root)), true);
  }));

test('contradictory staged and live anchors fail without deleting either authority', () =>
  schema4Workspace(({root, backupRoot}) => {
    const worksheet = completeWorksheet(buildMigrationWorksheet({root}), {
      root,
      backupRoot,
    });
    assert.throws(
      () => boundary('renameSync', (original, from, to) => {
        if (String(from).includes(`${sep}schema5-files${sep}.kai${sep}`)
          && String(to).startsWith(`${root}${sep}.kai${sep}`)) {
          throw Object.assign(new Error('interrupt before target install'), {code: 'EIO'});
        }
        return original(from, to);
      }, () => migrateWorkspaceV5({
        root,
        confirm: true,
        worksheet,
        roles: ROLES,
      })),
      /interrupt before target install/,
    );
    const lock = JSON.parse(readFileSync(v5MigrationLockPath(root), 'utf8'));
    const target = worksheet.authored_files
      .find(entry => entry.classification.action === 'migrate')
      .classification.target;
    const staged = join(lock.stage_path, 'schema5-files', ...target.split('/'));
    const live = join(root, ...target.split('/'));
    mkdirSync(dirname(live), {recursive: true});
    writeFileSync(live, readFileSync(staged));
    const liveBefore = tree(root);
    const stageBefore = tree(lock.stage_path);

    assert.throws(
      () => recoverWorkspaceV5({
        root,
        confirm: true,
        action: 'abandon',
        roles: ROLES,
      }),
      error => error.code === 'RECOVERY_REQUIRED'
        && /ambiguous|anchor|authority|contradict/i.test(error.message),
    );
    assert.deepEqual(tree(root), liveBefore);
    assert.deepEqual(tree(lock.stage_path), stageBefore);
    assert.equal(existsSync(v5MigrationLockPath(root)), true);
  }));

test('staging uses only frozen verified bytes and live drift aborts before activation', () =>
  schema4Workspace(({root, backupRoot}) => {
    const sourcePath = join(root, '.kai', 'engineering', 'old-draft.md');
    const original = readFileSync(sourcePath);
    const worksheet = completeWorksheet(buildMigrationWorksheet({root}), {
      root,
      backupRoot,
    });
    let drifted = false;
    assert.throws(
      () => boundary('mkdirSync', (originalMkdir, path, options) => {
        const result = originalMkdir(path, options);
        if (!drifted && String(path).includes('.kai-stage-')) {
          drifted = true;
          appendFileSync(sourcePath, 'concurrent live edit\n');
        }
        return result;
      }, () => migrateWorkspaceV5({
        root,
        confirm: true,
        worksheet,
        roles: ROLES,
      })),
      error => error.code === 'RECOVERY_REQUIRED'
        && /source|drift|changed|snapshot/i.test(error.message),
    );
    const lock = JSON.parse(readFileSync(v5MigrationLockPath(root), 'utf8'));
    assert.deepEqual(
      readFileSync(join(
        lock.stage_path,
        'schema5-files',
        '.kai',
        'engineering',
        'spec',
        'migration-draft',
        'drafts',
        'old-draft.md',
      )),
      original,
      'staging must use the frozen backup, not mutable live bytes',
    );
    assertSchema4Authoritative(root);
    const abandoned = recoverWorkspaceV5({
      root,
      confirm: true,
      action: 'abandon',
      roles: ROLES,
    });
    assert.equal(abandoned.abandoned, true);
    assert.deepEqual(
      readFileSync(sourcePath),
      original,
      'abandon restores the exact immutable schema-4 source snapshot',
    );
  }));

test('backup verification rejects unlisted files even when listed bytes are intact', () =>
  schema4Workspace(({root, backupRoot}) => {
    const worksheet = completeWorksheet(buildMigrationWorksheet({root}), {
      root,
      backupRoot,
    });
    assert.throws(() => boundary('mkdirSync', (original, path, options) => {
      if (String(path).includes('.kai-stage-')) {
        throw Object.assign(new Error('interrupt after backup'), {code: 'EIO'});
      }
      return original(path, options);
    }, () => migrateWorkspaceV5({
      root,
      confirm: true,
      worksheet,
      roles: ROLES,
    })), /interrupt after backup/);
    const lock = JSON.parse(readFileSync(v5MigrationLockPath(root), 'utf8'));
    put(lock.backup_path, 'private/.kai/unlisted-injection.txt', 'not in the plan\n');
    assert.throws(
      () => recoverWorkspaceV5({
        root,
        confirm: true,
        action: 'activate',
        roles: ROLES,
      }),
      error => error.code === 'RECOVERY_REQUIRED'
        && /backup|extra|inventory|unlisted/i.test(error.message),
    );
    assertSchema4Authoritative(root);
  }));

test('tampered or unverified external backup cannot activate', () =>
  schema4Workspace(({root, backupRoot}) => {
    const worksheet = completeWorksheet(buildMigrationWorksheet({root}), {
      root,
      backupRoot,
    });
    assert.throws(() => boundary('mkdirSync', (original, path, options) => {
      if (String(path).includes('.kai-stage-')) {
        throw Object.assign(new Error('interrupt after backup'), {code: 'EIO'});
      }
      return original(path, options);
    }, () => migrateWorkspaceV5({
      root,
      confirm: true,
      worksheet,
      roles: ROLES,
    })), /interrupt/);
    const lock = JSON.parse(readFileSync(v5MigrationLockPath(root), 'utf8'));
    const privateManifest = join(lock.backup_path, 'private', '.kai', 'manifest.json');
    appendFileSync(privateManifest, '\nTAMPERED\n');
    assert.throws(
      () => recoverWorkspaceV5({
        root,
        confirm: true,
        action: 'activate',
        roles: ROLES,
      }),
      error => error.code === 'RECOVERY_REQUIRED' && /backup|digest|tamper/i.test(error.message),
    );
    assertSchema4Authoritative(root);
  }));

test('rollback trusts the capability-bound inventory, not mutable snapshot metadata', async t => {
  for (const attack of ['missing listed file', 'extra unlisted file']) {
    await t.test(attack, () => schema4Workspace(({root, backupRoot}) => {
      const worksheet = completeWorksheet(buildMigrationWorksheet({root}), {
        root,
        backupRoot,
      });
      const receipt = migrateWorkspaceV5({
        root,
        confirm: true,
        worksheet,
        roles: ROLES,
      });
      const snapshotPath = join(receipt.backupPath, 'snapshot.json');
      if (attack === 'missing listed file') {
        const victim = '.kai/state/items/build-api.md';
        if (existsSync(snapshotPath)) {
          const mutable = JSON.parse(readFileSync(snapshotPath, 'utf8'));
          mutable.private_files = mutable.private_files.filter(entry => entry.path !== victim);
          writeFileSync(snapshotPath, canonicalJson(mutable));
        } else {
          writeFileSync(snapshotPath, canonicalJson({
            schema_version: 1,
            private_files: [],
            public_files: [],
            registry: null,
            git_tracking: [],
          }));
        }
        rmSync(join(receipt.backupPath, 'private', ...victim.split('/')));
      } else {
        put(
          receipt.backupPath,
          'private/.kai/state/items/unlisted-injection.md',
          '# not authorized by the plan\n',
        );
      }
      assert.throws(
        () => rollbackWorkspaceV5({root, confirm: true}),
        error => error.code === 'RECOVERY_REQUIRED'
          && /backup|inventory|missing|extra|unlisted|digest/i.test(error.message),
      );
      assert.equal(
        JSON.parse(readFileSync(join(root, '.kai', 'manifest.json'), 'utf8'))
          .schema_version,
        5,
      );
    }));
  }
});

test('tampered recovery state cannot replace the capability-bound worksheet', () =>
  schema4Workspace(({root, backupRoot}) => {
    const worksheet = completeWorksheet(buildMigrationWorksheet({root}), {
      root,
      backupRoot,
    });
    assert.throws(() => boundary('renameSync', (original, from, to) => {
      if (String(to).endsWith(join('.kai', 'core', 'runtime', 'coordination.sqlite'))) {
        throw Object.assign(new Error('interrupt after staged database'), {code: 'EIO'});
      }
      return original(from, to);
    }, () => migrateWorkspaceV5({
      root,
      confirm: true,
      worksheet,
      roles: ROLES,
    })), /interrupt/);
    const lock = JSON.parse(readFileSync(v5MigrationLockPath(root), 'utf8'));
    const statePath = join(lock.backup_path, 'state.json');
    const state = JSON.parse(readFileSync(statePath, 'utf8'));
    state.worksheet.backup_root = join(backupRoot, 'different');
    writeFileSync(statePath, canonicalJson(state));
    assert.throws(
      () => recoverWorkspaceV5({
        root,
        confirm: true,
        action: 'activate',
        roles: ROLES,
      }),
      error => error.code === 'RECOVERY_REQUIRED'
        && /state.*worksheet|lock.*worksheet/i.test(error.message),
    );
    assertSchema4Authoritative(root);
  }));

test('abandon rejects state-nominated unrelated paths before live activation', () =>
  schema4Workspace(({root, backupRoot}) => {
    const worksheet = completeWorksheet(buildMigrationWorksheet({root}), {
      root,
      backupRoot,
    });
    assert.throws(() => boundary('mkdirSync', (original, path, options) => {
      if (String(path).includes('.kai-stage-')) {
        throw Object.assign(new Error('interrupt after backup'), {code: 'EIO'});
      }
      return original(path, options);
    }, () => migrateWorkspaceV5({
      root,
      confirm: true,
      worksheet,
      roles: ROLES,
    })), /interrupt after backup/);
    const unrelated = join(dirname(root), 'unrelated-user-data.txt');
    writeFileSync(unrelated, 'must survive tampered abandon state\n');
    const lock = JSON.parse(readFileSync(v5MigrationLockPath(root), 'utf8'));
    const statePath = join(lock.backup_path, 'state.json');
    const state = JSON.parse(readFileSync(statePath, 'utf8'));
    state.installed_targets = [{
      path: '../unrelated-user-data.txt',
      type: 'file',
      digest: sha256(readFileSync(unrelated)),
      size: readFileSync(unrelated).length,
    }];
    writeFileSync(statePath, canonicalJson(state));
    assert.throws(
      () => recoverWorkspaceV5({
        root,
        confirm: true,
        action: 'abandon',
        roles: ROLES,
      }),
      error => error.code === 'RECOVERY_REQUIRED'
        && /state|target|inventory|tamper|binding/i.test(error.message),
    );
    assert.equal(
      readFileSync(unrelated, 'utf8'),
      'must survive tampered abandon state\n',
    );
    assert.equal(existsSync(v5MigrationLockPath(root)), true);
    assertSchema4Authoritative(root);
  }));

test('post-install abandon rejects jointly tampered state and receipt inventories', async t => {
  const cases = [
    {
      name: 'parent traversal',
      mutate({root, state, receipt}) {
        const path = join(dirname(root), 'round3-parent-victim.txt');
        writeFileSync(path, 'parent victim must survive\n');
        const bytes = readFileSync(path);
        const entry = {
          path: '../round3-parent-victim.txt',
          type: 'file',
          digest: sha256(bytes),
          size: bytes.length,
        };
        receipt.payload.schema5_files.authored_targets.push(entry);
        state.installed_targets.push(entry);
        return {path, bytes};
      },
    },
    {
      name: 'in-root unrelated file',
      mutate({root, state, receipt}) {
        const path = put(root, '.kai/round3-unrelated.txt', 'in-root victim must survive\n');
        const bytes = readFileSync(path);
        const entry = {
          path: '.kai/round3-unrelated.txt',
          type: 'file',
          digest: sha256(bytes),
          size: bytes.length,
        };
        receipt.payload.schema5_files.authored_targets.push(entry);
        state.installed_targets.push(entry);
        return {path, bytes};
      },
    },
    {
      name: 'extra typed entry',
      mutate({root, state, receipt}) {
        const relativePath =
          '.kai/engineering/spec/round3-extra/drafts/unrelated.md';
        const path = put(root, relativePath, 'extra typed victim must survive\n');
        const bytes = readFileSync(path);
        const entry = {
          path: relativePath,
          type: 'file',
          digest: sha256(bytes),
          size: bytes.length,
        };
        receipt.payload.schema5_files.authored_targets.push(entry);
        state.installed_targets.push(entry);
        return {path, bytes};
      },
    },
    {
      name: 'altered digest',
      mutate({root, state, receipt}) {
        const entry = receipt.payload.schema5_files.authored_targets[0];
        const stateEntry = state.installed_targets.find(candidate =>
          candidate.path === entry.path);
        entry.digest = 'f'.repeat(64);
        stateEntry.digest = entry.digest;
        const path = join(root, ...entry.path.split('/'));
        return {path, bytes: readFileSync(path)};
      },
    },
  ];

  for (const scenario of cases) {
    await t.test(scenario.name, () => schema4Workspace(({root, backupRoot}) => {
      const worksheet = completeWorksheet(buildMigrationWorksheet({root}), {
        root,
        backupRoot,
      });
      const manifestPath = join(root, '.kai', 'manifest.json');
      assert.throws(
        () => boundary('renameSync', (original, from, to) => {
          if (String(to) === manifestPath) {
            throw Object.assign(new Error('stop after db move'), {code: 'EIO'});
          }
          return original(from, to);
        }, () => migrateWorkspaceV5({
          root,
          confirm: true,
          worksheet,
          roles: ROLES,
        })),
        /stop after db move/,
      );
      const lock = JSON.parse(readFileSync(v5MigrationLockPath(root), 'utf8'));
      const statePath = join(lock.backup_path, 'state.json');
      const receiptPath = join(lock.backup_path, 'receipt.json');
      const state = JSON.parse(readFileSync(statePath, 'utf8'));
      const receipt = JSON.parse(readFileSync(receiptPath, 'utf8'));
      const victim = scenario.mutate({root, state, receipt});
      receipt.digest = sha256(canonicalJson(receipt.payload));
      state.receipt = receipt;
      writeFileSync(receiptPath, canonicalJson(receipt));
      writeFileSync(statePath, canonicalJson(state));
      assert.throws(
        () => recoverWorkspaceV5({
          root,
          confirm: true,
          action: 'abandon',
          roles: ROLES,
        }),
        error => error.code === 'RECOVERY_REQUIRED'
          && /anchor|receipt|state|inventory|path|digest|binding/i.test(error.message),
      );
      assert.deepEqual(readFileSync(victim.path), victim.bytes);
      assert.equal(existsSync(v5MigrationLockPath(root)), true);
      assertSchema4Authoritative(root);
    }));
  }
});

test('physical migration anchors recover safely when mutable state is downgraded', async t => {
  const scenarios = [
    {
      name: 'after source retirement',
      interrupt({authoredTarget}, run) {
        return boundary('renameSync', (original, from, to) => {
          if (String(to) === authoredTarget
            && String(from).includes(`${sep}schema5-files${sep}`)) {
            throw Object.assign(new Error('stop after source retirement'), {code: 'EIO'});
          }
          return original(from, to);
        }, run);
      },
    },
    {
      name: 'after database install',
      interrupt({manifestPath}, run) {
        return boundary('renameSync', (original, from, to) => {
          if (String(to) === manifestPath) {
            throw Object.assign(new Error('stop after database install'), {code: 'EIO'});
          }
          return original(from, to);
        }, run);
      },
    },
    {
      name: 'after manifest activation',
      interrupt(_paths, run) {
        let receiptOpens = 0;
        return boundary('openSync', (original, path, ...args) => {
          if (typeof path === 'string' && path.endsWith('receipt.json')) {
            receiptOpens += 1;
            if (receiptOpens === 2) {
              throw Object.assign(new Error('stop after manifest activation'), {code: 'EIO'});
            }
          }
          return original(path, ...args);
        }, run);
      },
    },
  ];

  for (const scenario of scenarios) {
    await t.test(scenario.name, () => schema4Workspace(({root, backupRoot}) => {
      const worksheet = completeWorksheet(buildMigrationWorksheet({root}), {
        root,
        backupRoot,
      });
      const manifestPath = join(root, '.kai', 'manifest.json');
      const authoredTarget = join(
        root,
        '.kai',
        'engineering',
        'spec',
        'migration-draft',
        'drafts',
        'old-draft.md',
      );
      assert.throws(
        () => scenario.interrupt({manifestPath, authoredTarget}, () =>
          migrateWorkspaceV5({
            root,
            confirm: true,
            worksheet,
            roles: ROLES,
          })),
        /stop after/,
      );
      const lock = JSON.parse(readFileSync(v5MigrationLockPath(root), 'utf8'));
      const retiredRoot = join(lock.stage_path, 'retired');
      assert.equal(existsSync(retiredRoot), true);
      const statePath = join(lock.backup_path, 'state.json');
      const state = JSON.parse(readFileSync(statePath, 'utf8'));
      state.phase = 'locked';
      state.ready_digest = null;
      state.receipt = null;
      state.installed_targets = [];
      state.database_installed = null;
      writeFileSync(statePath, canonicalJson(state));

      const recovered = recoverWorkspaceV5({
        root,
        confirm: true,
        action: 'abandon',
        roles: ROLES,
      });
      assert.equal(recovered.abandoned === true || recovered.rolledBack === true, true);
      assert.equal(existsSync(v5MigrationLockPath(root)), false);
      assert.equal(
        JSON.parse(readFileSync(manifestPath, 'utf8')).schema_version,
        4,
      );
      assert.equal(existsSync(retiredRoot), false);
    }));
  }
});

test('atomic replacement is preflighted before any live schema-4 tree mutation', () =>
  schema4Workspace(({root, backupRoot}) => {
    const manifestPath = join(root, '.kai', 'manifest.json');
    const sourcePath = join(root, '.kai', 'engineering', 'old-draft.md');
    const manifestBytes = readFileSync(manifestPath);
    const sourceBytes = readFileSync(sourcePath);
    const worksheet = completeWorksheet(buildMigrationWorksheet({root}), {
      root,
      backupRoot,
    });
    assert.throws(
      () => boundary('renameSync', (original, from, to) => {
        if (existsSync(to)) {
          throw Object.assign(new Error('atomic replacement unavailable'), {code: 'EPERM'});
        }
        return original(from, to);
      }, () => migrateWorkspaceV5({
        root,
        confirm: true,
        worksheet,
        roles: ROLES,
      })),
      /atomic replacement unavailable/,
    );
    assert.deepEqual(readFileSync(manifestPath), manifestBytes);
    assert.deepEqual(readFileSync(sourcePath), sourceBytes);
    assert.equal(
      existsSync(join(root, '.kai', 'core', 'runtime', 'coordination.sqlite')),
      false,
    );
    recoverWorkspaceV5({
      root,
      confirm: true,
      action: 'abandon',
      roles: ROLES,
    });
  }));

test('manifest activation attempts one atomic replacement and never renames old authority away', () =>
  schema4Workspace(({root, backupRoot}) => {
    const manifestPath = join(root, '.kai', 'manifest.json');
    const manifestBytes = readFileSync(manifestPath);
    const worksheet = completeWorksheet(buildMigrationWorksheet({root}), {
      root,
      backupRoot,
    });
    let replacementAttempts = 0;
    assert.throws(
      () => boundary('renameSync', (original, from, to) => {
        if (String(to) === manifestPath) {
          replacementAttempts += 1;
          throw Object.assign(new Error('manifest replacement failure'), {code: 'EPERM'});
        }
        return original(from, to);
      }, () => migrateWorkspaceV5({
        root,
        confirm: true,
        worksheet,
        roles: ROLES,
      })),
      /manifest replacement failure/,
    );
    assert.equal(replacementAttempts, 1);
    assert.deepEqual(readFileSync(manifestPath), manifestBytes);
    const lock = JSON.parse(readFileSync(v5MigrationLockPath(root), 'utf8'));
    assert.equal(existsSync(join(lock.stage_path, 'schema4-manifest.json')), false);
    recoverWorkspaceV5({
      root,
      confirm: true,
      action: 'abandon',
      roles: ROLES,
    });
    assert.deepEqual(readFileSync(manifestPath), manifestBytes);
  }));

test('manifest activation without the final receipt remains recoverable and never claims success early', async () =>
  schema4Workspace(async ({root, backupRoot}) => {
    const worksheet = completeWorksheet(buildMigrationWorksheet({root}), {
      root,
      backupRoot,
    });
    let receiptOpens = 0;
    assert.throws(() => boundary('openSync', (original, path, ...args) => {
      if (typeof path === 'string' && path.endsWith('receipt.json')) {
        receiptOpens += 1;
        if (receiptOpens === 2) {
          throw Object.assign(new Error('interrupt after manifest before receipt'), {code: 'EIO'});
        }
      }
      return original(path, ...args);
    }, () => migrateWorkspaceV5({
      root,
      confirm: true,
      worksheet,
      roles: ROLES,
    })), /interrupt after manifest/);
    assert.equal(
      JSON.parse(readFileSync(join(root, '.kai', 'manifest.json'), 'utf8')).schema_version,
      5,
    );
    assert.throws(
      () => assertWorkspaceWrite(
        join(root, '.kai', 'core', 'runtime', 'coordination.sqlite'),
      ),
      error => error.code === 'RECOVERY_REQUIRED',
    );
    assert.ok(checkWorkspace(root, {intent: 'coordinate'}).errors.some(error =>
      /incomplete schema-5 migration|RECOVERY_REQUIRED/i.test(error)));
    const lock = JSON.parse(readFileSync(v5MigrationLockPath(root), 'utf8'));
    assert.equal(JSON.parse(readFileSync(join(lock.backup_path, 'receipt.json'), 'utf8')).activated, false);
    const recovered = await runCLI([
      'recover',
      '--root',
      root,
      '--confirm',
      '--action',
      'activate',
      '--capability',
      randomUUID(),
    ], {
      host: {
        async maintenance() {
          return recoverWorkspaceV5({
            root,
            confirm: true,
            action: 'activate',
            roles: ROLES,
          });
        },
      },
    });
    assert.equal(recovered.exitCode, 0, JSON.stringify(recovered.result));
    assert.equal(recovered.result.activated, true);
    assert.equal(JSON.parse(readFileSync(join(lock.backup_path, 'receipt.json'), 'utf8')).activated, true);
    assert.equal(existsSync(v5MigrationLockPath(root)), false);
  }));

test('abandon preserves concurrent authored targets and an unowned schema-5 database', async t => {
  for (const kind of ['authored target', 'database']) {
    await t.test(kind, () => schema4Workspace(({root, backupRoot}) => {
      const worksheet = completeWorksheet(buildMigrationWorksheet({root}), {
        root,
        backupRoot,
      });
      const authoredTarget = join(
        root,
        '.kai',
        'engineering',
        'spec',
        'migration-draft',
        'drafts',
        'old-draft.md',
      );
      const database = join(root, '.kai', 'core', 'runtime', 'coordination.sqlite');
      let injected = false;
      assert.throws(() => boundary('renameSync', (original, from, to) => {
        const result = original(from, to);
        if (!injected && String(to).includes(`${sep}retired${sep}`)) {
          injected = true;
          put(
            root,
            kind === 'database'
              ? '.kai/core/runtime/coordination.sqlite'
              : '.kai/engineering/spec/migration-draft/drafts/old-draft.md',
            kind === 'database' ? 'concurrent database bytes' : 'concurrent authored bytes',
          );
        }
        return result;
      }, () => migrateWorkspaceV5({
        root,
        confirm: true,
        worksheet,
        roles: ROLES,
      })), /collision|both staged and live/i);
      recoverWorkspaceV5({
        root,
        confirm: true,
        action: 'abandon',
        roles: ROLES,
      });
      assert.equal(
        readFileSync(kind === 'database' ? database : authoredTarget, 'utf8'),
        kind === 'database' ? 'concurrent database bytes' : 'concurrent authored bytes',
      );
      assertSchema4Authoritative(root);
    }));
  }
});

test('abandon refuses to delete migration-owned targets replaced by digest or type', async t => {
  for (const kind of ['authored digest', 'authored type', 'database digest']) {
    await t.test(kind, () => schema4Workspace(({root, backupRoot}) => {
      const worksheet = completeWorksheet(buildMigrationWorksheet({root}), {
        root,
        backupRoot,
      });
      const authoredTarget = join(
        root,
        '.kai',
        'engineering',
        'spec',
        'migration-draft',
        'drafts',
        'old-draft.md',
      );
      const database = join(root, '.kai', 'core', 'runtime', 'coordination.sqlite');
      const manifestPath = join(root, '.kai', 'manifest.json');
      assert.throws(
        () => boundary('renameSync', (original, from, to) => {
          if (String(to) === manifestPath) {
            throw Object.assign(new Error('stop before activation'), {code: 'EIO'});
          }
          return original(from, to);
        }, () => migrateWorkspaceV5({
          root,
          confirm: true,
          worksheet,
          roles: ROLES,
        })),
        /stop before activation/,
      );
      const replaced = kind.startsWith('authored') ? authoredTarget : database;
      rmSync(replaced, {recursive: true, force: true});
      if (kind === 'authored type') {
        mkdirSync(replaced, {recursive: true});
        put(replaced, 'concurrent.txt', 'concurrent directory replacement\n');
      } else {
        writeFileSync(replaced, `concurrent ${kind} replacement\n`);
      }
      assert.throws(
        () => recoverWorkspaceV5({
          root,
          confirm: true,
          action: 'abandon',
          roles: ROLES,
        }),
        error => error.code === 'RECOVERY_REQUIRED'
          && /owned|target|database|digest|type|changed|replace/i.test(error.message),
      );
      if (kind === 'authored type') {
        assert.equal(fs.lstatSync(replaced).isDirectory(), true);
        assert.equal(
          readFileSync(join(replaced, 'concurrent.txt'), 'utf8'),
          'concurrent directory replacement\n',
        );
      } else {
        assert.equal(
          readFileSync(replaced, 'utf8'),
          `concurrent ${kind} replacement\n`,
        );
      }
      assertSchema4Authoritative(root);
    }));
  }
});

test('rollback restores schema 4 only at the activation event baseline', () =>
  schema4Workspace(({root, backupRoot}) => {
    const sourceDatabase = readFileSync(join(root, '.kai', 'state', 'coordination.sqlite'));
    const worksheet = completeWorksheet(buildMigrationWorksheet({root}), {
      root,
      backupRoot,
    });
    const receipt = migrateWorkspaceV5({
      root,
      confirm: true,
      worksheet,
      roles: ROLES,
    });
    const rolledBack = rollbackWorkspaceV5({root, confirm: true});
    assert.equal(rolledBack.rolledBack, true);
    assert.equal(
      JSON.parse(readFileSync(join(root, '.kai', 'manifest.json'), 'utf8')).schema_version,
      4,
    );
    assert.deepEqual(
      readFileSync(join(root, '.kai', 'state', 'coordination.sqlite')),
      sourceDatabase,
    );
    assert.equal(existsSync(receipt.backupPath), true);
  }));

test('rollback holds its filesystem lock and exclusive SQLite barrier across authority switch', () =>
  schema4Workspace(({root, backupRoot}) => {
    const worksheet = completeWorksheet(buildMigrationWorksheet({root}), {
      root,
      backupRoot,
    });
    migrateWorkspaceV5({
      root,
      confirm: true,
      worksheet,
      roles: ROLES,
    });
    const databasePath = join(root, '.kai', 'core', 'runtime', 'coordination.sqlite');
    const manifestPath = join(root, '.kai', 'manifest.json');
    let switchObserved = false;
    let filesystemLockObserved = false;
    let hostWriterLockObserved = false;
    let sqliteBarrierObserved = false;
    const result = boundary('renameSync', (original, from, to) => {
      if (String(to) === manifestPath && String(from).includes('rollback-')) {
        switchObserved = true;
        assert.throws(
          () => assertWorkspaceWrite(databasePath),
          error => {
            filesystemLockObserved = error.code === 'RECOVERY_REQUIRED';
            return filesystemLockObserved;
          },
        );
        assert.throws(
          () => writeIssued(root, 'requests', randomUUID(), {
            kind: 'adversarial-host-write',
          }),
          error => {
            hostWriterLockObserved = error.code === 'RECOVERY_REQUIRED';
            return hostWriterLockObserved;
          },
        );
        const contender = new DatabaseSync(databasePath);
        try {
          contender.exec('PRAGMA busy_timeout=50');
          try {
            contender.prepare(`
              INSERT INTO events(operation_id,subject_kind,subject_id,payload)
              VALUES(?,?,?,?)
            `).run(
              randomUUID(),
              'task',
              'engineering:task:build-api',
              canonicalJson({kind: 'adversarial.concurrent-write'}),
            );
          } catch (error) {
            sqliteBarrierObserved = /busy|locked/i.test(error.message);
          }
        } finally {
          contender.close();
        }
      }
      return original(from, to);
    }, () => rollbackWorkspaceV5({root, confirm: true}));
    assert.equal(result.rolledBack, true);
    assert.equal(switchObserved, true);
    assert.equal(filesystemLockObserved, true);
    assert.equal(hostWriterLockObserved, true);
    assert.equal(sqliteBarrierObserved, true);
  }));

test('native writer admission deterministically closes both rollback interleavings', async t => {
  const writerScript = String.raw`
    import fs from 'node:fs';
    import {syncBuiltinESMExports} from 'node:module';
    const args = JSON.parse(process.env.KAI_TEST_ARGS);
    const pause = () => {
      fs.writeFileSync(args.marker, 'ready');
      const wait = new Int32Array(new SharedArrayBuffer(4));
      while (!fs.existsSync(args.release)) Atomics.wait(wait, 0, 0, 10);
    };
    if (args.mode === 'before-recheck') {
      const original = fs.renameSync;
      fs.renameSync = (from, to) => {
        const result = original(from, to);
        if (String(to).includes('.native-writer-')
          && String(to).endsWith('.lock')
          && !String(to).includes('.pending-')) pause();
        return result;
      };
    } else {
      const original = fs.openSync;
      fs.openSync = (path, ...rest) => {
        if (String(path) === args.target) pause();
        return original(path, ...rest);
      };
    }
    syncBuiltinESMExports();
    const {writeIssued} = await import(args.capabilitiesUrl);
    let result;
    try {
      writeIssued(args.root, 'requests', args.id, args.payload);
      result = {ok: true};
    } catch (error) {
      result = {ok: false, code: error.code ?? null, message: error.message};
    }
    fs.writeFileSync(args.result, JSON.stringify(result));
  `;
  const rollbackScript = String.raw`
    import fs from 'node:fs';
    const args = JSON.parse(process.env.KAI_TEST_ARGS);
    const {rollbackWorkspaceV5} = await import(args.migrationUrl);
    let output;
    try {
      output = {
        ok: true,
        result: rollbackWorkspaceV5({
          root: args.root,
          confirm: true,
          env: process.env,
        }),
      };
    } catch (error) {
      output = {ok: false, code: error.code ?? null, message: error.message};
    }
    fs.writeFileSync(args.result, JSON.stringify(output));
  `;
  const capabilitiesUrl = pathToFileURL(join(
    checkout,
    'src',
    'core',
    'lib',
    'coordination-runtime',
    'native-capabilities.mjs',
  )).href;
  const migrationUrl = pathToFileURL(join(
    checkout,
    'src',
    'core',
    'lib',
    'coordination-runtime',
    'migration-v5.mjs',
  )).href;

  for (const scenario of [
    {
      mode: 'before-recheck',
      writerOk: false,
      writerCode: 'RECOVERY_REQUIRED',
      captured: false,
    },
    {
      mode: 'before-write',
      writerOk: true,
      writerCode: null,
      captured: true,
    },
  ]) {
    await t.test(scenario.mode, () => schema4Workspace(async ({
      root,
      backupRoot,
      env,
    }) => {
      await migrateThroughNativeHost({root, backupRoot, env});
      const id = randomUUID();
      const marker = join(backupRoot, `${scenario.mode}-writer-ready`);
      const release = join(backupRoot, `${scenario.mode}-writer-release`);
      const writerResultPath = join(backupRoot, `${scenario.mode}-writer-result.json`);
      const rollbackResultPath = join(backupRoot, `${scenario.mode}-rollback-result.json`);
      const target = join(
        root,
        '.kai',
        'core',
        'runtime',
        'host',
        'requests',
        `${id}.json`,
      );
      const writer = launchModule(writerScript, {
        mode: scenario.mode,
        root,
        id,
        payload: {kind: 'deterministic-writer-race', mode: scenario.mode},
        marker,
        release,
        result: writerResultPath,
        target,
        capabilitiesUrl,
      }, env);
      await waitForPath(marker);
      const tokens = nativeWriterTokenNames(root);
      if (tokens.length !== 1) {
        writeFileSync(release, 'continue');
        await writer.done;
      }
      assert.equal(tokens.length, 1, `expected one writer token, got ${tokens.join(', ')}`);
      const rollback = launchModule(rollbackScript, {
        root,
        result: rollbackResultPath,
        migrationUrl,
      }, env);
      await waitForPath(v5MigrationLockPath(root));
      await new Promise(resolve => setTimeout(resolve, 100));
      assert.equal(
        existsSync(rollbackResultPath),
        false,
        'rollback must drain the admitted writer before completing',
      );
      writeFileSync(release, 'continue');
      const [writerExit, rollbackExit] = await Promise.all([
        writer.done,
        rollback.done,
      ]);
      assert.equal(writerExit.code, 0, writerExit.stderr || writerExit.stdout);
      assert.equal(rollbackExit.code, 0, rollbackExit.stderr || rollbackExit.stdout);
      const writerResult = JSON.parse(readFileSync(writerResultPath, 'utf8'));
      const rollbackResult = JSON.parse(readFileSync(rollbackResultPath, 'utf8'));
      assert.equal(writerResult.ok, scenario.writerOk, JSON.stringify(writerResult));
      assert.equal(writerResult.code ?? null, scenario.writerCode);
      assert.equal(rollbackResult.ok, true, JSON.stringify(rollbackResult));
      const captured = existsSync(join(
        rollbackResult.result.rollbackAuditPath,
        'host',
        'requests',
        `${id}.json`,
      ));
      assert.equal(captured, scenario.captured);
      assertSchema4Authoritative(root);
      assert.equal(existsSync(v5MigrationLockPath(root)), false);
      assert.deepEqual(nativeWriterTokenNames(root), []);
    }));
  }
});

test('rollback returns RECOVERY_REQUIRED after the first schema-5 event', () =>
  schema4Workspace(({root, backupRoot}) => {
    const worksheet = completeWorksheet(buildMigrationWorksheet({root}), {
      root,
      backupRoot,
    });
    migrateWorkspaceV5({
      root,
      confirm: true,
      worksheet,
      roles: ROLES,
    });
    const store = openStore({
      path: join(root, '.kai', 'core', 'runtime', 'coordination.sqlite'),
      mode: 'write',
    });
    try {
      store.database.prepare(`
        INSERT INTO events(operation_id,subject_kind,subject_id,payload)
        VALUES(?,?,?,?)
      `).run(
        randomUUID(),
        'task',
        'engineering:task:build-api',
        canonicalJson({
          kind: 'task.update',
          actor: {role: 'eng-lead-architecture', runId: 'new-schema5-run'},
          timestamp: NOW,
        }),
      );
    } finally {
      closeStore(store);
    }
    assert.throws(
      () => rollbackWorkspaceV5({root, confirm: true}),
      error => error.code === 'RECOVERY_REQUIRED'
        && /event|baseline|reconcil/i.test(error.message),
    );
    assert.equal(
      JSON.parse(readFileSync(join(root, '.kai', 'manifest.json'), 'utf8')).schema_version,
      5,
    );
  }));

function schema3Item() {
  return `---
id: build-api
title: Build API
initiative: demo-initiative
version: 7
state: proposed
owner: operator
scope_authority: eng-lead-architecture
completion_authority: eng-reviewer-code
delivery_class: product-change
priority: 1
next_role: eng-builder-software
outcome: Preserve two-step migration.
acceptance:
  - Explicit schema 5 classification succeeds.
artifact_expectation: none
artifact_expectation_reason: No authored artifact is owed.
artifact_class: null
durability: null
validity_owner: null
artifact_targets: []
context_artifacts: []
touches: []
depends_on: []
lease: null
waiting_on_questions: []
review_requirements: []
completed_reviews: []
required_for_milestone: true
change_ref: null
updated: ${NOW}
---
Historical schema 3 item.
`;
}

test('schema 3 remains inspectable and advances through the existing schema 4 step before schema 5', () =>
  schema4Workspace(({root, backupRoot}) => {
    rmSync(join(root, '.kai'), {recursive: true, force: true});
    put(root, '.kai/manifest.json', `${JSON.stringify({
      plugin: 'kai-core',
      version: 'test',
      schema_version: 3,
      scaffolded: NOW,
      workspace_id: `migration-${randomUUID()}`,
      storage_mode: 'repo-local',
      workspace_root: '.',
      state: '.kai/state',
      runs: '.kai/runs',
      review: '.kai/review',
      archive: '.kai/archive',
      personal: '.kai/personal',
      projects: [{id: 'default', path: '.', publication_root: 'docs/kai'}],
      areas: [],
    }, null, 2)}\n`);
    put(root, '.kai/state/initiatives/demo-initiative/initiative.md', `---
id: demo-initiative
title: Demo initiative
status: active
owner: eng-lead-architecture
scope:
  - schema migration
milestones:
  - id: portfolio
    title: Portfolio boundary
    delivery_class: operational
    required_items: []
    status: active
  - id: feature
    title: Migration feature
    delivery_class: product-change
    required_items: []
    status: active
  - id: requirement
    title: Migration requirement
    delivery_class: product-change
    required_items: []
    status: active
  - id: history
    title: Historical-only milestone
    delivery_class: knowledge
    required_items: []
    status: active
backlog: []
north_star_ref: .kai/state/initiatives/demo-initiative/northstar.md
updated: ${NOW}
---
Schema 3 initiative.
`);
    put(root, '.kai/state/initiatives/demo-initiative/northstar.md', '# Historical north star\n');
    put(root, '.kai/state/items/build-api.md', schema3Item());
    put(
      root,
      '.kai/state/items/foundation.md',
      schema3Item()
        .replace('id: build-api', 'id: foundation')
        .replace('title: Build API', 'title: Migration foundation'),
    );
    put(
      root,
      '.kai/state/items/ambiguous-scope.md',
      schema3Item()
        .replace('id: build-api', 'id: ambiguous-scope')
        .replace('title: Build API', 'title: Ambiguous scope'),
    );
    put(root, '.kai/state/items/unmapped.md', 'not valid coordination frontmatter\n');
    const before = inspectRuntime(root, {intent: 'inspect'});
    assert.equal(before.errors.length, 0);
    const first = migrateWorkspace({
      root,
      confirm: true,
      roles: ROLES,
    });
    assert.equal(first.activated, true);
    assert.equal(
      JSON.parse(readFileSync(join(root, '.kai', 'manifest.json'), 'utf8')).schema_version,
      4,
    );
    const plan = buildMigrationWorksheet({root});
    const worksheet = completeWorksheet(plan, {root, backupRoot});
    const unresolved = worksheet.items.find(entry => entry.source.record_available === false);
    assert.ok(unresolved, 'quarantined schema-3 source must appear in the worksheet');
    unresolved.classification = historical(
      'Malformed historical source remains immutable provenance only.',
    );
    const result = migrateWorkspaceV5({
      root,
      confirm: true,
      worksheet,
      roles: ROLES,
    });
    assert.equal(result.activated, true);
    assert.equal(
      JSON.parse(readFileSync(join(root, '.kai', 'manifest.json'), 'utf8')).schema_version,
      5,
    );
    const store = openStore({
      path: join(root, '.kai', 'core', 'runtime', 'coordination.sqlite'),
      mode: 'read',
    });
    try {
      assert.ok(store.database.prepare(`
        SELECT 1 FROM migration_id_map
        WHERE source_kind='item' AND source_id='build-api'
          AND target_kind='task' AND target_id='engineering:task:build-api'
      `).get());
      assert.ok(store.database.prepare(`
        SELECT 1 FROM migration_sources
        WHERE path='.kai/state/items/build-api.md'
      `).get());
      assert.ok(store.database.prepare(`
        SELECT 1 FROM migration_id_map
        WHERE source_kind='item' AND source_id LIKE 'source:%'
          AND target_kind IS NULL AND disposition='historical-only'
      `).get());
    } finally {
      closeStore(store);
    }
  }, {unknownAuthored: false}));

test.after(() => {
  rmSync(scratch, {recursive: true, force: true, maxRetries: 5, retryDelay: 100});
});
