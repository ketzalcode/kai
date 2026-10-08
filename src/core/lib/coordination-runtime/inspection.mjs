import {existsSync, readdirSync} from 'node:fs';
import {basename} from 'node:path';
import {migrationManifest, privateAdmission, safePath, exactFile, sourceSnapshot, DATABASE, LOCK} from './migration-files.mjs';
import {readWorkspaceManifest, validateSchema5Manifest} from '../workspace-resolve.mjs';
import {COORDINATION_DATABASE, WORKSPACE_SCHEMA_VERSION} from '../workspace-layout.mjs';
import {inspectGitPrivacy} from '../workspace-git-privacy.mjs';
import {readDirection} from '../direction.mjs';
import {
  closeStore,
  openHistoricalStore,
  openStore,
  readRecord,
  readSnapshot,
  readStoreSummary,
} from './store.mjs';
import {readLegacyRecords, verifyMigration} from './migration.mjs';
import {inspectReportIndex, reportPaths} from './report-paths.mjs';
import {TERMINAL} from '../coordination.mjs';
import {projectContext} from './context.mjs';
import {taskStateSatisfies} from './engine.mjs';

/**
 * Never opens with create/write mode, migrates, repairs, or reads views as state.
 *
 * Historical schema-3/4 stores are read-only. `intent: 'inspect'` reports an
 * absent historical store without creating one; `coordinate` keeps refusing
 * because only an explicit offline schema-5 migration may activate writes.
 */
export function inspectRuntime(root, {env = process.env, intent = 'coordinate'} = {}) {
  const result = {errors: [], warnings: [], migrations: [], runtime: null};
  if (!['inspect', 'coordinate'].includes(intent)) {
    result.errors.push('workspace intent must be inspect or coordinate');
    return result;
  }
  let store;
  try {
    const current = readWorkspaceManifest(root);
    if (current.ok && current.manifest.schema_version === WORKSPACE_SCHEMA_VERSION) {
      const validation = validateSchema5Manifest(root, current.manifest, {env});
      result.errors.push(...validation.errors);
      const privacy = inspectGitPrivacy(root, current.manifest.placement);
      result.errors.push(...privacy.errors, ...privacy.missing.map(path =>
        `private workspace path must be ignored: ${path}`));
      if (current.manifest.placement === 'repo-local' && !privacy.gitRoot) {
        result.errors.push('repo-local placement requires a readable Git work tree');
      }
      result.warnings.push(...privacy.warnings);
      try { readDirection({workspaceRoot: root, manifest: current.manifest}); }
      catch (error) { result.errors.push(error.message); }
      if (result.errors.length) return result;
      const databasePath = safePath(root, COORDINATION_DATABASE);
      if (!existsSync(databasePath)) {
        result.errors.push(`schema 5 coordination database is missing at ${COORDINATION_DATABASE}`);
        return result;
      }
      exactFile(root, COORDINATION_DATABASE);
      store = openStore({path: databasePath, mode: 'read'});
      result.runtime = readStoreSummary(store);
      return result;
    }
    const manifest = migrationManifest(root, [3, 4], env);
    if (existsSync(safePath(root, LOCK))) {
      result.migrations.push('incomplete/competing migration; explicit offline recovery required');
      result.warnings.push('migration lock exists; coordinated writes are held');
    }
    if (manifest.schema_version === 3) {
      result.migrations.push('schema 3 is inspect-only; explicit offline schema 5 migration required for coordination');
      if (existsSync(safePath(root, DATABASE))) result.warnings.push('unactivated database is not authority; inspect migration recovery');
      return result;
    }
    result.errors.push(...privateAdmission(root).errors);
    if (!existsSync(safePath(root, DATABASE))) {
      if (intent === 'inspect') {
        result.warnings.push('schema 4 coordination database is absent; this historical workspace remains read-only and inspection will not create it');
      } else {
        result.errors.push('schema 4 is read-only; explicit offline schema 5 migration is required and inspection will not create a database');
      }
      return result;
    }
    exactFile(root, DATABASE);
    const databasePath = safePath(root, DATABASE);
    try {
      store = openStore({path: databasePath, mode: 'read'});
    } catch (error) {
      if (error?.code !== 'SCHEMA_MISMATCH') throw error;
      store = openHistoricalStore({
        path: databasePath,
        expectedStoreVersion: 1,
      });
    }
    readSnapshot(store, () => {
      const throughSeq = Number(store.database.prepare('SELECT COALESCE(MAX(seq),0) AS seq FROM events').get().seq);
      const records = [];
      const findings = [];
      const add = (item, section, headline, why, path = DATABASE) =>
        findings.push({section, item, tier: 'derived', headline, why, path});
      for (const row of store.database.prepare(
        "SELECT kind, id FROM records WHERE kind IN ('item', 'task') ORDER BY kind, id",
      ).all()) {
        try { records.push(readRecord(store, row.kind, row.id)); }
        catch (error) { add(row.id, 'integrity', 'runtime record is malformed', error.message); }
      }
      const sources = readLegacyRecords(store);
      for (const source of sources.filter(s => s.status === 'quarantined')) {
        result.warnings.push(`quarantined ${source.kind}/${source.declaredId ?? source.path}: ${source.issues.join('; ')}`);
        add(source.declaredId ?? source.path, 'integrity', `quarantined legacy ${source.kind}`, source.issues.join('; '), source.path);
      }
      for (const record of records) {
        if (record.body.state === 'blocked') add(record.id, 'blocked', 'recorded lifecycle is blocked', 'Resolve recorded blockers through authorized runtime commands.');
        if (['release-ready', 'deploying', 'production-verification'].includes(record.body.state)) {
          add(record.id, 'needs-you', 'recorded lifecycle waits on an operator', 'No deployment or production action is inferred.');
        }
        for (const dep of record.body.depends_on) {
          const dependencyId = dep.task ?? dep.item;
          const upstream = records.find(candidate =>
            candidate.kind === record.kind && candidate.id === dependencyId);
          if (!upstream) add(record.id, 'integrity', 'dependency is missing or quarantined', dependencyId);
          else if (!TERMINAL.has(record.body.state) && !taskStateSatisfies(upstream, dep.requires)) {
            add(record.id, 'blocked', 'dependency gate is not satisfied', `${dependencyId} requires ${dep.requires}`);
          }
        }
        if (record.kind !== 'task') continue;
        const subject = {kind: 'task', id: record.id};
        try { projectContext(store, {subject}); }
        catch (error) { add(record.id, 'unknown', 'runtime context/evidence gap', error.message); }
        try {
          const report = inspectReportIndex({root, subject});
          const paths = reportPaths({root, subject});
          if (!report) {
            if (existsSync(paths.directory) && readdirSync(paths.directory).length) {
              result.warnings.push(`partial/old derived report for ${record.id}: no complete owned index`);
            }
          } else {
            const metadata = report.metadata;
            if (metadata.through_seq !== throughSeq || metadata.subject_version !== record.version) {
              result.warnings.push(`stale derived report for ${record.id}: source sequence ${metadata.through_seq}, live ${throughSeq}; subject version ${metadata.subject_version}, live ${record.version}`);
            }
            const selected = new Set(['index.html', basename(report.paths.metadataPath), metadata.html.file,
              metadata.markdown.file, ...metadata.companions.map(c => c.file)]);
            const others = readdirSync(paths.directory).filter(file => !selected.has(file));
            if (others.length) result.warnings.push(`older or partial derived output remains for ${record.id}; selected complete generation alone was verified`);
          }
        } catch (error) { result.warnings.push(`changed/incomplete derived report for ${record.id}: ${error.message}`); }
      }
      result.runtime = {throughSeq, records, findings, sources};
    });
    if (manifest.coordination_migration) {
      try {
        const {plan} = verifyMigration(root, {env});
        const live = new Map(sourceSnapshot(root).map(e => [e.path, e.digest]));
        for (const file of plan.files.filter(f => f.path !== '.kai/manifest.json')) {
          if (live.get(file.path) !== file.digest) result.warnings.push(`legacy source/view drift: ${file.path}; not imported as current authority`);
        }
      } catch (error) { result.warnings.push(`migration backup/receipt gap: ${error.message}`); }
    }
  } catch (error) { result.errors.push(error.message); }
  finally { closeStore(store); }
  return result;
}
