import {execFileSync} from 'node:child_process';
import {canonicalJson, RuntimeError, validateRecord} from './contract.mjs';
import {projectBinding, scanExactFile, verifySubject} from './evidence-content.mjs';
import {artifactPreviewLimits, hash, knownGap} from './report-safety.mjs';

/** Human export only. Indexed exclusive keysets, no OFFSET or suffix recount. */
export function captureHistory(store, itemId, throughSeq, addGap) {
  const statement = store.database.prepare(`
    SELECT e.seq, e.message_id, r.kind, r.id, r.item_id, r.version, r.body
    FROM events e LEFT JOIN records r ON r.kind = 'message' AND r.id = e.message_id
    WHERE e.thread_id = ? AND e.message_id IS NOT NULL AND e.seq < ?
    ORDER BY e.seq DESC LIMIT 50
  `);
  const pages = [];
  let beforeSeq = throughSeq + 1;
  for (;;) {
    const rows = statement.all(itemId, beforeSeq);
    if (!rows.length) break;
    pages.push(rows.map(row => {
      const ref = `message:${row.message_id}`;
      const entry = {ref, eventSeq: Number(row.seq)};
      if (row.id === null) {
        entry.gap = 'Message referenced by this event is missing; no payload invented.';
      } else {
        const record = validateRecord({kind: row.kind, id: row.id, itemId: row.item_id,
          version: row.version, body: JSON.parse(row.body)});
        if (record.itemId !== itemId || record.body.thread_id !== itemId) {
          entry.gap = 'Message item/thread mismatches captured scope; content withheld.';
        } else entry.record = record;
      }
      if (entry.gap) addGap(ref, entry.gap);
      return entry;
    }));
    beforeSeq = Number(rows.at(-1).seq);
    if (rows.length < 50) break;
  }
  return pages;
}

export function captureArtifacts(root, artifacts, addGap) {
  let remaining = artifactPreviewLimits.aggregateBytes;
  return artifacts.flatMap(artifact => {
    if (!artifact.snapshots?.length) return [];
    let artifactRemaining = artifactPreviewLimits.perArtifactBytes;
    let manifestError;
    try {
      if (artifact.manifest_path !== `${artifact.run_directory}/.evidence/${artifact.artifact_id}/manifest.json`
        || scanExactFile(root, artifact.manifest_path).digest !== hash(canonicalJson({
          subject: artifact.subject, snapshots: artifact.snapshots,
        }))) throw new RuntimeError('EVIDENCE_GAP', 'Retained manifest/path does not match registered artifact.');
    } catch (error) {
      if (!knownGap(error)) throw error;
      manifestError = error;
    }
    return artifact.snapshots.map((snapshot, index) => {
      const preview = {ref: artifact.ref, index, path: snapshot.path, retainedPath: snapshot.snapshot_path,
        sourceDigest: snapshot.digest, sourceSize: null, status: artifact.status, encoding: 'utf8', content: null,
        previewState: 'unavailable', previewBytes: 0, omittedBytes: null, limitReasons: []};
      try {
        if (manifestError) throw manifestError;
        if (!snapshot.snapshot_path.startsWith(`${artifact.run_directory}/.evidence/${artifact.artifact_id}/`)) {
          throw new RuntimeError('EVIDENCE_GAP', 'Retained path does not match registered artifact.');
        }
        const budget = Math.min(remaining, artifactRemaining);
        const prefix = Buffer.alloc(budget);
        const decoder = new TextDecoder('utf-8', {fatal: true, ignoreBOM: true});
        let captured = 0;
        let binary = false;
        const classify = (chunk, stream) => {
          if (binary) return;
          try { binary = /[\x00-\x08\x0b\x0c\x0e-\x1f]/.test(decoder.decode(chunk, {stream})); }
          catch (error) {
            if (error.code !== 'ERR_ENCODING_INVALID_ENCODED_DATA') throw error;
            binary = true;
          }
        };
        const identity = scanExactFile(root, snapshot.snapshot_path, chunk => {
          captured += chunk.copy(prefix, captured, 0, Math.min(chunk.length, budget - captured));
          classify(chunk, true);
        });
        if (identity.digest !== snapshot.digest) throw new RuntimeError('EVIDENCE_GAP', 'Retained bytes do not match registered digest.');
        classify(undefined, false);
        const bytes = prefix.subarray(0, captured);
        preview.encoding = binary ? 'latin1' : 'utf8';
        const content = binary ? bytes.toString('latin1')
          : new TextDecoder('utf-8', {fatal: true, ignoreBOM: true}).decode(bytes, {stream: captured < identity.size});
        preview.sourceSize = identity.size;
        preview.previewBytes = Buffer.byteLength(content, preview.encoding);
        preview.omittedBytes = identity.size - preview.previewBytes;
        preview.previewState = !preview.omittedBytes ? 'complete' : preview.previewBytes ? 'limited' : 'omitted';
        preview.content = preview.previewState === 'omitted' ? null : content;
        if (identity.size > budget) {
          if (budget === artifactRemaining) preview.limitReasons.push('artifact-preview-budget');
          if (budget === remaining) preview.limitReasons.push('report-preview-budget');
        }
        if (preview.previewBytes < captured) preview.limitReasons.push('utf8-boundary');
        artifactRemaining -= preview.previewBytes;
        remaining -= preview.previewBytes;
      } catch (error) {
        if (!knownGap(error)) throw error;
        preview.gap = error.message;
        addGap(artifact.ref, `Inert preview unavailable: ${error.message}`);
      }
      return preview;
    });
  });
}

export function captureChanges(root, artifacts, addGap) {
  const changes = [];
  const seen = new Set();
  for (const artifact of artifacts) {
    if (artifact.subject.kind !== 'git') {
      for (const entry of artifact.snapshots) changes.push({
        ref: artifact.ref, kind: 'recorded-revision', path: entry.path, digest: entry.digest,
        status: artifact.status, provenance: 'declared',
      });
      continue;
    }
    const key = canonicalJson([artifact.project_id, artifact.subject]);
    if (seen.has(key)) continue;
    seen.add(key);
    try {
      verifySubject(root, artifact.subject, artifact.project_id);
      const {projectRoot} = projectBinding(root, artifact.project_id);
      const env = Object.fromEntries(Object.entries(process.env).filter(([name]) => !/^GIT_/i.test(name)));
      const bytes = execFileSync('git', ['--no-pager', '-C', projectRoot,
        'diff', '--no-ext-diff', '--no-textconv', '--no-renames', '--name-status', '-z',
        artifact.subject.base, artifact.subject.head, '--'], {
        encoding: 'utf8', windowsHide: true, stdio: ['ignore', 'pipe', 'pipe'], maxBuffer: 64 * 1024 * 1024,
        env: {...env, GIT_NO_REPLACE_OBJECTS: '1', GIT_OPTIONAL_LOCKS: '0', GIT_TERMINAL_PROMPT: '0', GIT_NO_LAZY_FETCH: '1'},
      });
      const fields = bytes.split('\0');
      if (fields.pop() !== '' || fields.length % 2) throw new RuntimeError('EVIDENCE_GAP', 'Malformed Git path listing.');
      for (let i = 0; i < fields.length; i += 2) changes.push({
        ref: artifact.ref, kind: 'git', projectId: artifact.project_id, ...artifact.subject,
        path: fields[i + 1], status: fields[i], provenance: 'derived',
      });
    } catch (error) {
      if (error instanceof RuntimeError && !knownGap(error)) throw error;
      addGap(artifact.ref, `Git changed paths unavailable: ${error instanceof RuntimeError ? error.message : 'read-only Git inspection failed'}`);
    }
  }
  return changes;
}
