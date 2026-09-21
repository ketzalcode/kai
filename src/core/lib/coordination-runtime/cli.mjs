import {existsSync} from 'node:fs';
import {resolveWorkspaceRoot} from '../workspace-resolve.mjs';
import {RuntimeError, validateCommand} from './contract.mjs';
import {migrationManifest, safePath, DATABASE, sourceSnapshot, exactFile, hash} from './migration-files.mjs';
import {assertWorkspaceWrite} from './workspace-guard.mjs';
import {openStore, closeStore, listAllRecords, readStoreSummary} from './store.mjs';
import {projectContext, readDetail, readMessages} from './context.mjs';
import {inspectRuntime} from './inspection.mjs';
import {buildReport, writeReport} from './report.mjs';
import {readLegacyRecords} from './migration.mjs';
import {hashArtifact} from './evidence.mjs';

const fail = (code, message) => { throw new RuntimeError(code, message); };
const reads = new Set(['inspect', 'status', 'context', 'detail', 'messages', 'export', 'legacy', 'hash']);
const required = (options, name) => options[name] ?? fail('INVALID_INPUT', `--${name} is required`);

export async function execute({verb, options, body, host, cwd, env}) {
  const resolved = resolveWorkspaceRoot({explicitRoot: options.root, cwd, env});
  if (!resolved.ok) fail('INVALID_INPUT', resolved.reason);
  const {root} = resolved;
  const manifest = migrationManifest(root, [3, 4], env);
  const path = safePath(root, DATABASE);
  const base = {ok: true, mode: verb, root, schemaVersion: manifest.schema_version, storeExists: existsSync(path)};
  if (reads.has(verb)) {
    if (verb === 'inspect') {
      let runtime = null;
      if (manifest.schema_version === 4 && base.storeExists) {
        const store = openStore({path, mode: 'read'});
        try { runtime = readStoreSummary(store); } finally { closeStore(store); }
      }
      return {...base, runtime, ...(options.deep ? {inspection: inspectRuntime(root, {env, intent: 'inspect'})} : {})};
    }
    if (manifest.schema_version === 3) {
      if (verb === 'legacy') {
        if (options.raw && !options.source) fail('INVALID_INPUT', 'raw legacy reads require one --source ID');
        const sources = sourceSnapshot(root).map(source => ({...source, sourceId: hash(source.path), status: 'historical-unverified'}))
          .filter(source => !options.source || source.sourceId === options.source);
        if (options.source && sources.length !== 1) fail('EVIDENCE_GAP', 'legacy source identity does not exist');
        return {...base, sources: sources.map(source => ({...source, ...(options.raw ? {
          raw: exactFile(root, source.path).toString('base64'), rawEncoding: 'base64',
        } : {})}))};
      }
      if (verb === 'status') {
        const {collect} = await import('../../work-status.mjs');
        return {...base, status: collect(root)};
      }
      fail('SCHEMA_MISMATCH', 'schema 3 supports inspect/status/legacy only; explicitly migrate for runtime detail');
    }
    if (!base.storeExists) fail('SCHEMA_MISMATCH', 'coordination store is missing; use explicit authorized init');
    const store = openStore({path, mode: 'read'});
    try {
      if (verb === 'status') return {...base, items: listAllRecords(store, {kind: 'item'})};
      if (verb === 'context') return {...base, context: projectContext(store, {
        itemId: required(options, 'item'), maxBytes: options['max-bytes'], recentLimit: options['recent-limit'],
      })};
      if (verb === 'detail') return {...base, record: readDetail(store, {kind: required(options, 'kind'), id: required(options, 'id')})};
      if (verb === 'messages') return {...base, ...readMessages(store, {
        threadId: required(options, 'item'), beforeSeq: options['before-seq'], limit: options.limit,
      })};
      if (verb === 'legacy') return {...base, sources: readLegacyRecords(store, {
        sourceId: options.source, includeRaw: options.raw ?? false,
      }).map(source => ({...source, ...(source.raw ? {raw: source.raw.toString('base64'), rawEncoding: 'base64'} : {})}))};
      if (verb === 'hash') return {...base, subject: hashArtifact({root, relativePath: required(options, 'path')})};
      if (verb === 'export') {
        const itemId = required(options, 'item');
        const view = buildReport(store, {itemId});
        return {...base, report: writeReport({root, itemId, view})};
      }
    } finally { closeStore(store); }
  }
  if (manifest.schema_version !== 4 && !['request', 'authorize', 'receipt', 'capabilities', 'migrate', 'recover', 'rollback'].includes(verb)) {
    fail('SCHEMA_MISMATCH', 'schema 3 is inspect-only; use explicit offline migration');
  }
  if (verb === 'apply') validateCommand(body);
  if (!host) {
    const {createNativeHost} = await import('./native-host.mjs');
    host = createNativeHost({env});
  }
  if (['request', 'authorize', 'receipt', 'capture', 'capabilities', 'prepare'].includes(verb)) {
    return {...base, ...await host[verb]({root, body, options})};
  }
  if (['init', 'migrate', 'recover', 'rollback', 'repair'].includes(verb)) {
    const result = await host.maintenance({root, verb, body, options, env});
    return {...base, ...result, schemaVersion: migrationManifest(root, [3, 4], env).schema_version,
      storeExists: existsSync(path)};
  }
  assertWorkspaceWrite(path, {requirePrivate: true});
  if (!base.storeExists) fail('SCHEMA_MISMATCH', 'coordination store is missing; use explicit authorized init');
  const store = openStore({path, mode: 'write'});
  try {
    if (verb === 'delegate') return {...base, ...await host.delegate({root, store, body, options})};
    if (verb === 'claim') return {...base, ...await host.claim({root, store, options})};
    if (verb === 'plan') return {...base, ...await host.plan({root, store, itemId: required(options, 'item')})};
    return await host.apply({root, store, command: body, options});
  } finally { closeStore(store); }
}
