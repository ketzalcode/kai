import {
  closeSync, fsyncSync, fstatSync, linkSync, lstatSync, mkdirSync, openSync, readFileSync,
  renameSync, unlinkSync, writeFileSync,
} from 'node:fs';
import {randomUUID} from 'node:crypto';
import {basename} from 'node:path';
import {RuntimeError} from './contract.mjs';
import {assertWorkspacePath, workspaceManifest} from './evidence-content.mjs';
import {hash} from './report-safety.mjs';
import {renderLanding} from './report-render.mjs';
import {normalized} from '../workspace-path-safety.mjs';

/**
 * Inspector/CLI path contract. No filesystem writes. Item identity is hashed,
 * never interpolated in a filename (case, Windows devices, ADS and traversal
 * cannot alias another item). Optional sequence + SHA-256 select one immutable
 * generation. Readers must re-run this helper, then verify sidecar identity and
 * digests; arbitrary sidecar paths are not trusted capabilities.
 */
export function reportPaths({root, itemId, throughSeq, digest}) {
  workspaceManifest(root);
  if (typeof itemId !== 'string' || itemId.length === 0
    || !itemId.isWellFormed() || Buffer.byteLength(itemId) > 8192) {
    throw new RuntimeError('INVALID_INPUT', 'report itemId must be nonempty well-formed text of at most 8192 bytes');
  }
  const relativeDirectory = `.kai/review/coordination/item-${hash(itemId)}`;
  const directory = assertWorkspacePath(root, relativeDirectory);
  const indexPath = assertWorkspacePath(root, `${relativeDirectory}/index.html`);
  if (throughSeq === undefined && digest === undefined) return {directory, indexPath};
  if (!Number.isSafeInteger(throughSeq) || throughSeq < 0 || !/^[0-9a-f]{64}$/.test(digest ?? '')) {
    throw new RuntimeError('INVALID_INPUT', 'report generation requires a sequence and lowercase SHA-256 digest');
  }
  // Retain 192 digest bits in the filename, all 256 in the sidecar. Chromium on
  // Windows still fails on some >259-character file URLs. Collisions fail closed.
  const stem = `snapshot-${throughSeq}-${digest.slice(0, 48)}`;
  const pathFor = extension => {
    const path = assertWorkspacePath(root, `${relativeDirectory}/${stem}.${extension}`);
    if (process.platform === 'win32' && path.length > 259) {
      throw new RuntimeError('INVALID_INPUT', 'report path exceeds the offline browser limit; use a shorter workspace root');
    }
    return path;
  };
  return {directory, indexPath, path: pathFor('html'), markdownPath: pathFor('md'), metadataPath: pathFor('json')};
}

function readExisting(path) {
  let fd;
  try {
    const stat = lstatSync(path);
    if (stat.isSymbolicLink() || !stat.isFile() || stat.nlink !== 1) {
      throw new RuntimeError('INVALID_INPUT', 'report output must be a regular unshared file');
    }
    fd = openSync(path, 'r');
    const current = fstatSync(fd);
    const bytes = readFileSync(fd);
    const after = fstatSync(fd);
    if (!current.isFile() || current.nlink !== 1 || current.ino !== stat.ino
      || current.dev !== stat.dev || after.mtimeMs !== current.mtimeMs || after.size !== bytes.length) {
      throw new RuntimeError('EVIDENCE_GAP', 'report output changed identity or bytes while reading');
    }
    return bytes;
  } catch (error) {
    if (error.code === 'ENOENT') return null;
    throw error;
  } finally { if (fd !== undefined) closeSync(fd); }
}

function checkExisting(path, bytes) {
  const current = readExisting(path);
  if (current !== null && !current.equals(Buffer.from(bytes))) {
    throw new RuntimeError('EVIDENCE_GAP', 'immutable report output already exists with different bytes or identity');
  }
  return current !== null;
}

export function reportMemberPath({root, itemId, file}) {
  reportPaths({root, itemId});
  if (!/^[a-z0-9-]+\.(html|md|json|lock|new)$/.test(file)) {
    throw new RuntimeError('INVALID_INPUT', 'report member must be a generated basename');
  }
  const path = assertWorkspacePath(root, `.kai/review/coordination/item-${hash(itemId)}/${file}`);
  if (process.platform === 'win32' && path.length > 259) {
    throw new RuntimeError('INVALID_INPUT', 'report member exceeds the offline browser path limit');
  }
  return path;
}

function ownedLanding(root, itemId, indexPath) {
  const bytes = readExisting(indexPath);
  if (bytes === null) return null;
  const reject = () => { throw new RuntimeError('EVIDENCE_GAP', 'stable index is unrecognized, changed, incomplete or belongs to another workspace/item'); };
  const match = /<!-- kai-current (\d+) ([a-f0-9]{64}) ([a-f0-9]{64}) -->\n$/.exec(bytes.toString('utf8'));
  if (!match) reject();
  const paths = reportPaths({root, itemId, throughSeq: Number(match[1]), digest: match[2]});
  let metadata;
  try { metadata = JSON.parse(readExisting(paths.metadataPath)); } catch { reject(); }
  const manifest = workspaceManifest(root);
  if (metadata?.schema_version !== 2 || metadata.kind !== 'kai-coordination-report' || metadata.derived !== true
    || metadata.workspace?.id !== manifest.workspace_id || metadata.workspace?.root !== normalized(root)
    || metadata.item?.id !== itemId || metadata.through_seq !== Number(match[1])
    || metadata.html?.digest !== match[2] || metadata.html?.file !== basename(paths.path)
    || metadata.markdown?.file !== basename(paths.markdownPath) || !Array.isArray(metadata.companions)
    || metadata.landing?.file !== 'index.html' || hash(bytes) !== metadata.landing.digest
    || match[3] !== hash(JSON.stringify({...metadata, landing: undefined}))
    || metadata.view_digest !== hash(JSON.stringify(metadata.view))
    || !bytes.equals(Buffer.from(renderLanding(metadata)))) reject();
  for (const member of [metadata.html, metadata.markdown, ...metadata.companions]) {
    const retained = readExisting(reportMemberPath({root, itemId, file: member.file}));
    if (retained === null || hash(retained) !== member.digest) reject();
  }
  return bytes;
}

/** Read-only inspection shares the writer's exact ownership/member contract. */
export function inspectReportIndex({root, itemId}) {
  const {indexPath} = reportPaths({root, itemId});
  const bytes = ownedLanding(root, itemId, indexPath);
  if (bytes === null) return null;
  const match = /<!-- kai-current (\d+) ([a-f0-9]{64}) ([a-f0-9]{64}) -->\n$/.exec(bytes.toString('utf8'));
  const paths = reportPaths({root, itemId, throughSeq: Number(match[1]), digest: match[2]});
  const metadata = JSON.parse(readExisting(paths.metadataPath));
  const view = metadata.view;
  if (view?.schema_version !== 1 || view.workspace?.id !== metadata.workspace.id
    || view.workspace?.root !== metadata.workspace.root || view.item?.id !== itemId
    || view.item?.version !== metadata.item.version || view.throughSeq !== metadata.through_seq
    || view.generatedAt !== metadata.generated_at
    || (view.inspection && (view.inspection.threadId !== itemId || view.inspection.throughSeq !== metadata.through_seq))) {
    throw new RuntimeError('EVIDENCE_GAP', 'selected report view identity does not match its workspace/item/generation');
  }
  const members = [metadata.html, metadata.markdown, ...metadata.companions];
  if (new Set(members.map(m => m.file)).size !== members.length) {
    throw new RuntimeError('EVIDENCE_GAP', 'selected report contains duplicate members');
  }
  return {paths, metadata};
}

/** Immutable files first, sidecar last, then an owned atomic landing replacement.
 * The exclusive writer lock coordinates report writers, not arbitrary OS users.
 * This is not a DB/filesystem transaction or an adversarial filesystem CAS.
 */
export function persistReportFiles({root, itemId, throughSeq, digest, html, markdown, metadata, companions, landing}) {
  let paths = reportPaths({root, itemId, throughSeq, digest});
  const files = [
    [paths.path, html], [paths.markdownPath, markdown],
    ...companions.map(c => [reportMemberPath({root, itemId, file: c.file}), c.bytes]),
    [paths.metadataPath, metadata],
  ];
  // Reject all pre-existing collisions before writing any member of the bundle.
  files.forEach(([path, bytes]) => checkExisting(path, bytes));
  mkdirSync(paths.directory, {recursive: true});
  paths = reportPaths({root, itemId, throughSeq, digest});
  const member = file => reportMemberPath({root, itemId, file});
  const lock = member('current.lock');
  let lockFd;
  try { lockFd = openSync(lock, 'wx', 0o600); }
  catch (error) {
    if (error.code === 'EEXIST') throw new RuntimeError('STORE_BUSY', 'report landing writer lock exists; no automatic stale-lock removal', true);
    throw error;
  }
  let stage;
  let staged = false;
  try {
    stage = member(`index-${randomUUID()}.new`);
    const previous = ownedLanding(root, itemId, paths.indexPath);
    for (const [path, bytes] of files) {
      // Recheck containment immediately before exclusive creation.
      member(basename(path));
      try { writeFileSync(path, bytes, {flag: 'wx', mode: 0o600}); }
      catch (error) {
        if (error.code !== 'EEXIST') throw error;
        checkExisting(path, bytes);
      }
    }
    if (previous?.equals(Buffer.from(landing))) return {...paths, throughSeq, digest};
    const fd = openSync(stage, 'wx', 0o600);
    staged = true;
    try { writeFileSync(fd, landing); fsyncSync(fd); } finally { closeSync(fd); }
    paths = reportPaths({root, itemId, throughSeq, digest});
    if (previous === null) {
      // Atomic no-replace first publication. Never rename over an unknown index.
      linkSync(stage, paths.indexPath);
      unlinkSync(stage);
    } else {
      checkExisting(paths.indexPath, previous);
      if (!ownedLanding(root, itemId, paths.indexPath)?.equals(previous)) {
        throw new RuntimeError('EVIDENCE_GAP', 'stable index changed during export');
      }
      renameSync(stage, paths.indexPath);
    }
    staged = false;
  } finally {
    try { if (staged) unlinkSync(stage); }
    finally { closeSync(lockFd); unlinkSync(lock); }
  }
  return {...paths, throughSeq, digest};
}

export const fileName = path => basename(path);
