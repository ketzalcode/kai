import {RuntimeError} from './contract.mjs';
import {workspaceManifest} from './evidence-content.mjs';
import {privateAdmission} from './migration-files.mjs';
import {normalized} from '../workspace-path-safety.mjs';
import {fileName, persistReportFiles, reportPaths} from './report-paths.mjs';
import {hash, redactReport, snapshotWarning} from './report-safety.mjs';
import {renderCompanions, renderHtml, renderLanding, renderMarkdown} from './report-render.mjs';

export {buildReport} from './report-data.mjs';
export {reportMemberPath} from './report-paths.mjs';
export {reportPaths, renderHtml, renderMarkdown};

/**
 * Write derived private files only; no store, events, registry mutation or host
 * runtime is required. Sidecar schema 2:
 * {kind:"kai-coordination-report", schema_version:2, derived:true,
 *  workspace:{id,root}, item:{id,version}, through_seq, generated_at,
 *  snapshot_warning, html:{file,digest}, markdown:{file,digest},
 *  companions:[{file,kind,digest}], redactions, landing:{file,digest},
 *  view_digest, view:ReportView}.
 * Generation files are immutable UTF-8; the stable landing is replaceable.
 * Digests are SHA-256 over exact file bytes, except
 * view_digest over JSON.stringify(view). Sidecar is written last as the bundle
 * completion marker, before the stable index is selected. An interrupted export
 * may leave derived files; it is not a multi-file transaction. The index's last
 * marker binds the sidecar excluding its landing field to avoid a digest cycle.
 * Not authoritative evidence, acceptance or a self-authenticating attestation.
 * Inspectors compare DB identity/sequence separately from hashes.
 * The bundle is private workspace evidence, so it is admitted under the same
 * Git-privacy rule as a coordinated write: a workspace whose private Git
 * metadata drifted refuses export rather than writing an evidence bundle into
 * a trackable directory. Export never admits the paths itself; only explicit
 * authorized maintenance does that.
 */
export function writeReport({root, itemId, view}) {
  const manifest = workspaceManifest(root);
  const privacy = privateAdmission(root);
  if (privacy.errors.length) throw new RuntimeError('INVALID_INPUT', privacy.errors.join('; '));
  if (view?.item?.id !== itemId || view.workspace?.id !== manifest.workspace_id
    || view.workspace?.root !== normalized(root)
    || !Number.isSafeInteger(view.throughSeq) || view.throughSeq < 0
    || typeof view.generatedAt !== 'string' || !Number.isFinite(Date.parse(view.generatedAt))) {
    throw new RuntimeError('INVALID_INPUT', 'report identity, sequence or generation time does not match workspace/item');
  }
  const safe = redactReport(view);
  if (safe.inspection && (safe.inspection.threadId !== itemId || safe.inspection.throughSeq !== safe.throughSeq)) {
    throw new RuntimeError('INVALID_INPUT', 'inspection scope must match the captured report');
  }
  if (!safe.inspection && ((safe.history?.totalMessages ?? 0) > 0 || safe.artifacts?.length)) {
    throw new RuntimeError('EVIDENCE_GAP', 'full captured inspection is required; rebuild this report from its store');
  }
  const html = renderHtml(safe);
  const markdown = renderMarkdown(safe);
  const digest = hash(html);
  const paths = reportPaths({root, itemId, throughSeq: view.throughSeq, digest});
  const companions = renderCompanions(safe, fileName(paths.path));
  const metadata = {
    schema_version: 2, kind: 'kai-coordination-report', derived: true,
    workspace: safe.workspace, item: {id: itemId, version: safe.item.version},
    through_seq: safe.throughSeq, generated_at: safe.generatedAt,
    snapshot_warning: snapshotWarning,
    html: {file: fileName(paths.path), digest},
    markdown: {file: fileName(paths.markdownPath), digest: hash(markdown)},
    companions: companions.map(({file, kind, bytes}) => ({file, kind, digest: hash(bytes)})),
    redactions: safe.redactions,
    view_digest: hash(JSON.stringify(safe)), view: safe,
  };
  const landing = renderLanding(metadata);
  metadata.landing = {file: 'index.html', digest: hash(landing)};
  return persistReportFiles({
    root, itemId, throughSeq: safe.throughSeq, digest, html, markdown, companions, landing,
    metadata: `${JSON.stringify(metadata, null, 2)}\n`,
  });
}
