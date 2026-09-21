import {existsSync, readdirSync} from 'node:fs';
import {basename} from 'node:path';
import {migrationManifest, privateAdmission, safePath, exactFile, sourceSnapshot, DATABASE, LOCK} from './migration-files.mjs';
import {openStore, closeStore, readRecord, readSnapshot} from './store.mjs';
import {readLegacyRecords, verifyMigration} from './migration.mjs';
import {inspectReportIndex, reportPaths} from './report-paths.mjs';
import {TERMINAL} from '../coordination.mjs';
import {projectContext} from './context.mjs';
import {itemStateSatisfies} from './engine.mjs';

/**
 * Never opens with create/write mode, migrates, repairs, or reads views as state.
 *
 * `intent: 'inspect'` treats an absent schema-4 store as a reported condition
 * rather than a failure: a scaffolded schema-4 manifest legitimately has no
 * database until the authorized `init` runs, and inspecting that window is how
 * an operator confirms the scaffold before creating the store. `coordinate`
 * intent keeps refusing it, because a coordinated write has nowhere to land.
 */
export function inspectRuntime(root, {env = process.env, intent = 'coordinate'} = {}) {
  const result = {errors: [], warnings: [], migrations: [], runtime: null};
  if (!['inspect', 'coordinate'].includes(intent)) {
    result.errors.push('workspace intent must be inspect or coordinate');
    return result;
  }
  let store;
  try {
    const manifest = migrationManifest(root, [3, 4], env);
    if (existsSync(safePath(root, LOCK))) {
      result.migrations.push('incomplete/competing migration; explicit offline recovery required');
      result.warnings.push('migration lock exists; coordinated writes are held');
    }
    if (manifest.schema_version === 3) {
      result.migrations.push('schema 3 is inspect-only; explicit offline schema 4 migration required for coordination');
      if (existsSync(safePath(root, DATABASE))) result.warnings.push('unactivated database is not authority; inspect migration recovery');
      return result;
    }
    result.errors.push(...privateAdmission(root).errors);
    if (!existsSync(safePath(root, DATABASE))) {
      if (intent === 'inspect') {
        result.warnings.push('schema 4 coordination database does not exist yet; this is the expected state before the authorized init and inspection will not create it');
      } else {
        result.errors.push('schema 4 coordination database is missing; inspection will not create it');
      }
      return result;
    }
    exactFile(root, DATABASE);
    store = openStore({path: safePath(root, DATABASE), mode: 'read'});
    readSnapshot(store, () => {
      const throughSeq = Number(store.database.prepare('SELECT COALESCE(MAX(seq),0) AS seq FROM events').get().seq);
      const items = [];
      const findings = [];
      const add = (item, section, headline, why, path = DATABASE) =>
        findings.push({section, item, tier: 'derived', headline, why, path});
      for (const row of store.database.prepare("SELECT id FROM records WHERE kind='item' ORDER BY id").all()) {
        try { items.push(readRecord(store, 'item', row.id)); }
        catch (error) { add(row.id, 'integrity', 'runtime record is malformed', error.message); }
      }
      const sources = readLegacyRecords(store);
      for (const source of sources.filter(s => s.status === 'quarantined')) {
        result.warnings.push(`quarantined ${source.kind}/${source.declaredId ?? source.path}: ${source.issues.join('; ')}`);
        add(source.declaredId ?? source.path, 'integrity', `quarantined legacy ${source.kind}`, source.issues.join('; '), source.path);
      }
      for (const item of items) {
        if (item.body.state === 'blocked') add(item.id, 'blocked', 'recorded lifecycle is blocked', 'Resolve recorded blockers through authorized runtime commands.');
        if (['release-ready', 'deploying', 'production-verification'].includes(item.body.state)) {
          add(item.id, 'needs-you', 'recorded lifecycle waits on an operator', 'No deployment or production action is inferred.');
        }
        for (const dep of item.body.depends_on) {
          const upstream = items.find(i => i.id === dep.item);
          if (!upstream) add(item.id, 'integrity', 'dependency is missing or quarantined', dep.item);
          else if (!TERMINAL.has(item.body.state) && !itemStateSatisfies(upstream, dep.requires)) {
            add(item.id, 'blocked', 'dependency gate is not satisfied', `${dep.item} requires ${dep.requires}`);
          }
        }
        try { projectContext(store, {itemId: item.id}); }
        catch (error) { add(item.id, 'unknown', 'runtime context/evidence gap', error.message); }
        try {
          const report = inspectReportIndex({root, itemId: item.id});
          const paths = reportPaths({root, itemId: item.id});
          if (!report) {
            if (existsSync(paths.directory) && readdirSync(paths.directory).length) {
              result.warnings.push(`partial/old derived report for ${item.id}: no complete owned index`);
            }
          } else {
            const metadata = report.metadata;
            if (metadata.through_seq !== throughSeq || metadata.item.version !== item.version) {
              result.warnings.push(`stale derived report for ${item.id}: source sequence ${metadata.through_seq}, live ${throughSeq}; item version ${metadata.item.version}, live ${item.version}`);
            }
            const selected = new Set(['index.html', basename(report.paths.metadataPath), metadata.html.file,
              metadata.markdown.file, ...metadata.companions.map(c => c.file)]);
            const others = readdirSync(paths.directory).filter(file => !selected.has(file));
            if (others.length) result.warnings.push(`older or partial derived output remains for ${item.id}; selected complete generation alone was verified`);
          }
        } catch (error) { result.warnings.push(`changed/incomplete derived report for ${item.id}: ${error.message}`); }
      }
      result.runtime = {throughSeq, items, findings, sources};
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
