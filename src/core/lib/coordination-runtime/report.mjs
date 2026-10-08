import {relative} from 'node:path';
import {
  RuntimeError, canonicalJson, subjectEquals, validateHierarchySubject,
} from './contract.mjs';
import {workspaceManifest} from './evidence-content.mjs';
import {privateAdmission} from './migration-files.mjs';
import {normalized} from '../workspace-path-safety.mjs';
import {fileName, persistReportFiles, reportPaths} from './report-paths.mjs';
import {hash, redactReport, snapshotWarning} from './report-safety.mjs';
import {renderCompanions, renderHtml, renderLanding, renderMarkdown} from './report-render.mjs';

export {buildReport} from './report-data.mjs';
export {reportMemberPath} from './report-paths.mjs';
export {reportPaths, renderHtml, renderMarkdown};

function expectedTarget(root, subject) {
  const directory = reportPaths({root, subject}).directory;
  return relative(root, directory).replaceAll('\\', '/');
}

function sameSubject(left, right) {
  return subjectEquals(
    left && {kind: left.kind, id: left.id},
    right && {kind: right.kind, id: right.id},
  );
}

export function writeReport({root, subject, view, target}) {
  validateHierarchySubject(subject, 'report subject');
  const manifest = workspaceManifest(root);
  const privacy = privateAdmission(root);
  if (privacy.errors.length) throw new RuntimeError('INVALID_INPUT', privacy.errors.join('; '));
  if (!target || typeof target !== 'object' || Array.isArray(target)
    || canonicalJson(Object.keys(target).sort()) !== '["accepted_hash","directory"]'
    || target.directory !== expectedTarget(root, subject)
    || !/^[0-9a-f]{64}$/.test(target.accepted_hash ?? '')) {
    throw new RuntimeError('INVALID_INPUT', 'report target must be the validated typed report path with an accepted hash');
  }
  if (!sameSubject(view?.subject, subject) || view.workspace?.id !== manifest.workspace_id
    || view.workspace?.root !== normalized(root)
    || !Number.isSafeInteger(view.subject.version) || view.subject.version < 1
    || !Number.isSafeInteger(view.throughSeq) || view.throughSeq < 0
    || typeof view.generatedAt !== 'string' || !Number.isFinite(Date.parse(view.generatedAt))) {
    throw new RuntimeError('INVALID_INPUT', 'report identity, sequence or generation time does not match workspace/subject');
  }
  const safe = redactReport(view);
  if (target.accepted_hash !== hash(canonicalJson(safe))) {
    throw new RuntimeError('EVIDENCE_GAP', 'report target hash does not accept this exact report view');
  }
  if (safe.inspection && (!sameSubject(safe.inspection.subject, subject)
    || safe.inspection.throughSeq !== safe.throughSeq)) {
    throw new RuntimeError('INVALID_INPUT', 'inspection scope must match the captured report');
  }
  if (!safe.inspection && ((safe.history?.totalMessages ?? 0) > 0 || safe.artifacts?.length)) {
    throw new RuntimeError('EVIDENCE_GAP', 'full captured inspection is required; rebuild this report from its store');
  }
  const html = renderHtml(safe);
  const markdown = renderMarkdown(safe);
  const digest = hash(html);
  const paths = reportPaths({root, subject, throughSeq: safe.throughSeq, digest});
  const companions = renderCompanions(safe, fileName(paths.path));
  const metadata = {
    schema_version: 3,
    kind: 'kai-coordination-report',
    derived: true,
    workspace: safe.workspace,
    subject,
    subject_version: safe.subject.version,
    accepted_hash: target.accepted_hash,
    through_seq: safe.throughSeq,
    generated_at: safe.generatedAt,
    snapshot_warning: snapshotWarning,
    html: {file: fileName(paths.path), digest},
    markdown: {file: fileName(paths.markdownPath), digest: hash(markdown)},
    companions: companions.map(({file, kind, bytes}) => ({file, kind, digest: hash(bytes)})),
    redactions: safe.redactions,
    view_digest: hash(JSON.stringify(safe)),
    view: safe,
  };
  const landing = renderLanding(metadata);
  metadata.landing = {file: 'index.html', digest: hash(landing)};
  return persistReportFiles({
    root,
    subject,
    throughSeq: safe.throughSeq,
    digest,
    html,
    markdown,
    companions,
    landing,
    metadata: `${JSON.stringify(metadata, null, 2)}\n`,
  });
}
