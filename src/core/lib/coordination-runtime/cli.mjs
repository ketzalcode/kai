import {existsSync} from 'node:fs';
import {resolveWorkspaceRoot} from '../workspace-resolve.mjs';
import {
  RuntimeError,
  subjectRef,
  validateCommand,
  validateTaskSubject,
} from './contract.mjs';
import {safePath} from './evidence-content.mjs';
import {
  assertWorkspaceWrite,
  readWorkspaceContract,
} from './workspace-guard.mjs';
import {
  COORDINATION_DATABASE,
} from '../workspace-layout.mjs';
import {
  openStore,
  closeStore,
  readSnapshot,
  readStoreSummary,
} from './store.mjs';
import {readDetail, readMessages} from './context.mjs';
import {inspectRuntime} from './inspection.mjs';
import {buildReport} from './report.mjs';
import {hashArtifact} from './evidence.mjs';
import {
  taskContext,
  taskStatus,
} from './task-view.mjs';

const fail = (code, message) => { throw new RuntimeError(code, message); };
const reads = new Set([
  'inspect',
  'status',
  'context',
  'detail',
  'messages',
  'export',
  'hash',
]);
const required = (options, name) => options[name] ?? fail('INVALID_INPUT', `--${name} is required`);
const taskSubject = options => validateTaskSubject({
  kind: required(options, 'kind'),
  id: required(options, 'id'),
});

async function installedRoles(host, root, env) {
  let selected = host;
  if (!selected) {
    const {createNativeHost} = await import('./native-host.mjs');
    selected = createNativeHost({env});
  }
  if (!selected?.capabilities) return [];
  let result;
  try {
    result = await selected.capabilities({root});
  } catch (error) {
    if (error instanceof RuntimeError
      && new Set(['ROLE_UNAVAILABLE', 'UNSUPPORTED_HOST']).has(error.code)) {
      return [];
    }
    throw error;
  }
  const roster = result?.discovery?.roster;
  if (!Array.isArray(roster)) return [];
  return [...new Set(roster
    .map(entry => entry?.role)
    .filter(role => typeof role === 'string' && role !== ''))].sort();
}

export async function execute({verb, options, body, host, cwd, env}) {
  const resolved = resolveWorkspaceRoot({explicitRoot: options.root, cwd, env});
  if (!resolved.ok) fail(resolved.code ?? 'INVALID_INPUT', resolved.reason);
  const {root} = resolved;
  const manifest = readWorkspaceContract(root, {env});
  const database = COORDINATION_DATABASE;
  const path = safePath(root, database);
  const base = {ok: true, mode: verb, root, schemaVersion: manifest.schema_version, storeExists: existsSync(path)};
  if (reads.has(verb)) {
    if (verb === 'inspect') {
      let runtime = null;
      if (base.storeExists) {
        const store = openStore({path, mode: 'read'});
        try { runtime = readStoreSummary(store); } finally { closeStore(store); }
      }
      return {...base, runtime, ...(options.deep ? {inspection: inspectRuntime(root, {env, intent: 'inspect'})} : {})};
    }
    if (!base.storeExists) fail('RECOVERY_REQUIRED', 'coordination store is missing; use the standalone workspace initializer');
    const store = openStore({path, mode: 'read'});
    try {
      const roles = ['status', 'context'].includes(verb)
        ? await installedRoles(host, root, env)
        : [];
      if (verb === 'status') {
        return readSnapshot(store, () => ({
          ...base,
          status: taskStatus(store, {roles}),
        }));
      }
      if (verb === 'context') {
        return readSnapshot(store, () => ({
          ...base,
          context: taskContext(store, {
            subject: taskSubject(options),
            maxBytes: options['max-bytes'],
            recentLimit: options['recent-limit'],
          }),
        }));
      }
      if (verb === 'detail') {
        return readSnapshot(store, () => ({
          ...base,
          record: readDetail(store, {
            kind: required(options, 'kind'),
            id: required(options, 'id'),
          }),
        }));
      }
      if (verb === 'messages') {
        return readSnapshot(store, () => {
          const subject = taskSubject(options);
          const record = readDetail(store, subject);
          return {
            ...base,
            ...readMessages(store, {
              subject,
              threadId: subjectRef(subject, record.version),
              basisVersion: record.version,
              beforeSeq: options['before-seq'],
              limit: options.limit,
            }),
          };
        });
      }
      if (verb === 'hash') return {...base, subject: hashArtifact({root, relativePath: required(options, 'path')})};
      if (verb === 'export') {
        const subject = taskSubject(options);
        return readSnapshot(store, () => ({
          ...base,
          report: buildReport(store, {subject}),
        }));
      }
    } finally { closeStore(store); }
  }
  if (verb === 'apply') validateCommand(body);
  if (!base.storeExists) fail('RECOVERY_REQUIRED', 'coordination store is missing; use the standalone workspace initializer');
  assertWorkspaceWrite(path, {requirePrivate: true, env});
  if (['request', 'authorize', 'receipt', 'capture', 'capabilities', 'prepare'].includes(verb)) {
    const admitted = openStore({path, mode: 'read'});
    closeStore(admitted);
  }
  if (!host) {
    const {createNativeHost} = await import('./native-host.mjs');
    host = createNativeHost({env});
  }
  if (['request', 'authorize', 'receipt', 'capture', 'capabilities', 'prepare'].includes(verb)) {
    return {...base, ...await host[verb]({root, body, options})};
  }
  const store = openStore({path, mode: 'write'});
  try {
    if (verb === 'delegate') return {...base, ...await host.delegate({root, store, body, options})};
    if (verb === 'claim') return {...base, ...await host.claim({root, store, options})};
    return await host.apply({root, store, command: body, options});
  } finally { closeStore(store); }
}
