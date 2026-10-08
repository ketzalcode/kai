import{createRequire as __cr}from'node:module';const require=__cr(import.meta.url);
import {
  projectContext,
  readLegacyRecords,
  taskStateSatisfies,
  verifyMigration
} from "./chunk-KN2NB5DE.mjs";
import {
  DATABASE,
  LOCK,
  assertWorkspacePath,
  closeStore,
  exactFile,
  inspectGitPrivacy,
  migrationManifest,
  openHistoricalStore,
  openStore,
  privateAdmission,
  readDirection,
  readRecord,
  readSnapshot,
  readStoreSummary,
  safePath,
  schema5MigrationLockPath,
  sourceSnapshot,
  workspaceManifest
} from "./chunk-S4A2HMCB.mjs";
import {
  COORDINATION_DATABASE,
  WORKSPACE_SCHEMA_VERSION,
  normalized,
  parseTypedArtifactRoute,
  privateArtifactDirectory,
  readWorkspaceManifest,
  validateSchema5Manifest
} from "./chunk-2WT4K7YK.mjs";
import {
  RuntimeError,
  canonicalJson,
  subjectEquals,
  validateHierarchySubject
} from "./chunk-XLDNBMDG.mjs";
import {
  TERMINAL
} from "./chunk-ITUOITH3.mjs";

// src/core/lib/coordination-runtime/inspection.mjs
import { existsSync, readdirSync } from "node:fs";
import { basename as basename2 } from "node:path";

// src/core/lib/coordination-runtime/report-paths.mjs
import {
  closeSync,
  fsyncSync,
  fstatSync,
  linkSync,
  lstatSync,
  mkdirSync,
  openSync,
  readFileSync,
  renameSync,
  unlinkSync,
  writeFileSync
} from "node:fs";
import { basename } from "node:path";

// src/core/lib/coordination-runtime/report-safety.mjs
import { createHash } from "node:crypto";
var hash = (value) => createHash("sha256").update(value).digest("hex");
var escapeHtml = (value) => String(value ?? "unavailable").replace(
  /[&<>"']/g,
  (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[character]
);
var knownGap = (error) => error instanceof RuntimeError && ["EVIDENCE_GAP", "AUTHORITY_REQUIRED", "INVALID_INPUT"].includes(error.code);
var tokenKey = (key) => /^token$|lease.*token$/i.test(key);
function possibleBearerSuffix(text2, secret) {
  const prefix = secret.slice(0, Math.min(text2.length, secret.length - 1));
  const fallback = new Uint32Array(prefix.length);
  let matched = 0;
  for (let i = 1; i < prefix.length; i++) {
    while (matched && prefix[i] !== prefix[matched]) matched = fallback[matched - 1];
    if (prefix[i] === prefix[matched]) matched++;
    fallback[i] = matched;
  }
  matched = 0;
  for (let i = text2.length - prefix.length; i < text2.length; i++) {
    while (matched && text2[i] !== prefix[matched]) matched = fallback[matched - 1];
    if (text2[i] === prefix[matched]) matched++;
  }
  return matched;
}
function redactPreview(preview, secrets, notice) {
  const text2 = preview.content;
  if (!secrets.size) return { content: text2, boundaryWithheldBytes: 0 };
  const patterns = new Set(secrets);
  if (preview.encoding === "latin1") {
    for (const secret of secrets) patterns.add(Buffer.from(secret.slice(0, text2.length + 1)).toString("latin1"));
  }
  const masked = new Uint8Array(text2.length);
  const mark = (start, end, flag) => {
    if (preview.encoding === "utf8") {
      if (/[\uDC00-\uDFFF]/.test(text2[start]) && /[\uD800-\uDBFF]/.test(text2[start - 1])) start--;
      if (/[\uD800-\uDBFF]/.test(text2[end - 1]) && /[\uDC00-\uDFFF]/.test(text2[end])) end++;
    }
    for (let i = start; i < end; i++) if (!masked[i]) masked[i] = flag;
  };
  let boundaryStart = text2.length;
  for (const secret of patterns) {
    let markedThrough = 0;
    for (let start = text2.indexOf(secret); start !== -1; start = text2.indexOf(secret, start + 1)) {
      mark(Math.max(start, markedThrough), start + secret.length, 1);
      markedThrough = start + secret.length;
      notice.occurrences++;
    }
    if (preview.previewState === "limited") {
      boundaryStart = Math.min(boundaryStart, text2.length - possibleBearerSuffix(text2, secret));
    }
  }
  let boundaryWithheldBytes = 0;
  if (boundaryStart < text2.length) {
    mark(boundaryStart, text2.length, 2);
    for (let start = 0; start < text2.length; ) {
      if (masked[start] !== 2) {
        start++;
        continue;
      }
      let end = start + 1;
      while (masked[end] === 2) end++;
      boundaryWithheldBytes += Buffer.byteLength(text2.slice(start, end), preview.encoding);
      start = end;
    }
    if (boundaryWithheldBytes) notice.boundaries++;
  }
  const parts = [];
  for (let start = 0; start < text2.length; ) {
    let end = start;
    let flags = 0;
    const withheld = !!masked[start];
    while (end < text2.length && !!masked[end] === withheld) flags |= masked[end++];
    parts.push(!withheld ? text2.slice(start, end) : flags & 2 ? "[withheld possible bearer-boundary]" : "[redacted bearer]");
    start = end;
  }
  return { content: parts.join(""), boundaryWithheldBytes };
}
function redaction(value) {
  const secrets = /* @__PURE__ */ new Set();
  const notice = { fields: 0, occurrences: 0, boundaries: 0 };
  const previews = new Set(value?.inspection?.artifactPreviews ?? []);
  function find(entry) {
    if (!entry || typeof entry !== "object") return;
    for (const [key, child] of Object.entries(entry)) {
      if (tokenKey(key) && typeof child === "string" && child) secrets.add(child);
      else find(child);
    }
  }
  find(value);
  function cleanText(entry, replaceKnown = true) {
    if (replaceKnown) for (const secret of secrets) entry = entry.replaceAll(secret, () => {
      notice.occurrences++;
      return "[redacted bearer]";
    });
    entry = entry.replace(/\bBearer\s+[A-Za-z0-9._~+/-]+=*/gi, () => {
      notice.occurrences++;
      return "[redacted bearer]";
    }).replace(/("(?:token|[^"]*lease[^"]*token)"\s*:\s*")([^"]+)(")/gi, (match, start, value2, end) => {
      if (value2 === "[redacted bearer]") return match;
      notice.occurrences++;
      return `${start}[redacted bearer]${end}`;
    });
    return entry;
  }
  function clean(entry) {
    if (typeof entry === "string") return cleanText(entry);
    if (Array.isArray(entry)) return entry.map(clean);
    if (!entry || typeof entry !== "object") return entry;
    const preview = previews.has(entry) && typeof entry.content === "string" ? redactPreview(entry, secrets, notice) : null;
    const result = Object.fromEntries(Object.entries(entry).filter(([key]) => {
      if (!tokenKey(key)) return true;
      notice.fields++;
      return false;
    }).map(([key, child]) => [key, preview && key === "content" ? cleanText(preview.content, false) : clean(child)]));
    if (preview?.boundaryWithheldBytes) {
      result.boundaryWithheldBytes = (entry.boundaryWithheldBytes ?? 0) + preview.boundaryWithheldBytes;
    }
    return result;
  }
  return { value: clean(value), notice };
}
function redactReport(value) {
  const result = redaction(value);
  const boundaries = (value.redactions?.boundaries ?? 0) + result.notice.boundaries;
  return { ...result.value, redactions: {
    fields: (value.redactions?.fields ?? 0) + result.notice.fields,
    occurrences: (value.redactions?.occurrences ?? 0) + result.notice.occurrences,
    ...boundaries || value.redactions?.boundaries !== void 0 ? { boundaries } : {}
  } };
}
var redactionNotice = (view) => {
  const { fields = 0, occurrences = 0, boundaries = 0 } = view.redactions ?? {};
  return fields || occurrences || boundaries ? `Redactions applied: ${fields} bearer fields omitted; ${occurrences} known bearer occurrences replaced across captured content.` + (boundaries ? ` Conservative boundary withholding: ${boundaries} truncated preview suffixes could continue as known bearers; withheld without inspecting omitted bytes, not confirmed secret occurrences.` : "") + " Digests identify retained originals; previews are redacted derivatives. Secret detection is not exhaustive." : "No supported bearer redactions detected in captured content; this is not a guarantee of secret removal.";
};
var generatedLink = (value) => typeof value === "string" && /^[a-z0-9-]+\.html(?:#[a-z0-9-]+)?$/.test(value);
var artifactPreviewLimits = Object.freeze({ perArtifactBytes: 64 * 1024, aggregateBytes: 1024 * 1024 });
var snapshotWarning = "Snapshot \u2014 not live. Recorded lifecycle is historical truth, not a new acceptance or shipping decision. Current proof checks and their gaps are listed; historical proof is not reaccepted. Files can change after generation.";

// src/core/lib/coordination-runtime/report-render.mjs
var text = (value) => value === null || value === void 0 ? "unavailable" : typeof value === "object" ? JSON.stringify(value, null, 2) : String(value);
var css = `
:root{color-scheme:light dark;--bg:#f4f6f8;--ink:#172c3d;--paper:#fff;--line:#a9b7c2;--muted:#425b70;--accent:#174d85}
*{box-sizing:border-box}html{font:16px/1.55 system-ui,sans-serif;background:var(--bg);color:var(--ink)}
body{margin:0}header,main,footer{max-width:1200px;margin:auto;padding:24px}header{border-bottom:3px solid var(--accent)}
h1{font-size:clamp(1.45rem,3vw,2.25rem);line-height:1.25}h2{font-size:1.4rem;margin:0 0 16px}
p,td,th,h1,h2,summary,a,pre{overflow-wrap:anywhere;word-break:normal;min-width:0}
section{background:var(--paper);border:1px solid var(--line);border-radius:10px;padding:24px;margin:0 0 24px;min-width:0}
nav{display:flex;flex-wrap:wrap;gap:8px 20px;margin-top:18px}a{color:var(--accent);text-underline-offset:3px}
.stamp{color:var(--muted)}.warning{border-left:4px solid var(--accent);padding:8px 12px;background:var(--paper)}
.subject{color:var(--muted);font-size:.95rem;display:-webkit-box;-webkit-box-orient:vertical;-webkit-line-clamp:2;overflow:hidden}.status-strip{font-weight:650;background:var(--paper);border:1px solid var(--line);padding:12px}
.skip{position:absolute;left:12px;top:-200px;padding:8px;background:var(--paper);z-index:2}.skip:focus{top:10px}
:focus-visible{outline:3px solid var(--accent);outline-offset:4px}
table{width:100%;table-layout:fixed;border-collapse:collapse;margin:18px 0;font-size:.93rem}
caption{text-align:left;font-weight:700;margin:0 0 8px}th,td{text-align:left;vertical-align:top;padding:10px;border:1px solid var(--line);white-space:pre-wrap}
th{background:var(--bg)}td a{display:inline-block}details{border:1px solid var(--line);border-radius:6px;padding:12px;margin:14px 0}
summary{cursor:pointer;font-weight:650}pre{white-space:pre-wrap;font-size:.86rem;max-width:100%;margin:14px 0}
@media(max-width:600px){header,main,footer{padding:12px}section{padding:14px;margin-bottom:16px}table,thead,tbody,tr,th,td{display:block;width:100%}thead{position:absolute;width:1px;height:1px;clip-path:inset(50%);overflow:hidden}tr{border:1px solid var(--line);margin:12px 0}td{border:0;border-bottom:1px solid var(--line);padding:8px}td:last-child{border-bottom:0}td::before{content:attr(data-label);display:block;font-weight:700;color:var(--muted)}caption{display:block}details{padding:9px}}
@media(prefers-color-scheme:dark){:root{--bg:#121b23;--ink:#ecf1f5;--paper:#1b2935;--line:#728697;--muted:#c0d1df;--accent:#9dc8ff}}
@media print{.skip,nav{display:none}section{break-inside:avoid}details{border-color:#888}}
`;
function statusLine(view) {
  const blockers = view.blockers?.length ?? 0;
  return `Recorded state: ${text(view.subject?.state)} \xB7 Proof checks: ${view.integrity?.status ?? "unavailable"} (not acceptance) \xB7 Blockers: ${blockers}${blockers ? " \u2014 inspect required actions below." : " recorded; check pending criteria and gaps before acting."}`;
}
function subjectHtml(view) {
  const full = text(view.subject?.title);
  const chars = [...full];
  return `<p class="subject">Subject: ${escapeHtml(chars.length > 140 ? `${chars.slice(0, 137).join("")}\u2026` : full)}</p><details><summary>Full recorded subject</summary><p>${escapeHtml(full)}</p></details>`;
}
function offlinePage(view, title, contents, links = []) {
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<meta http-equiv="Content-Security-Policy" content="default-src 'none'; script-src 'none'; style-src 'unsafe-inline'; img-src 'none'; connect-src 'none'; media-src 'none'; object-src 'none'; frame-src 'none'; base-uri 'none'; form-action 'none'">
<title>${escapeHtml(title)}</title><style>${css}</style></head><body><a class="skip" href="#main">Skip to report</a>
<header><h1>${escapeHtml(title)}</h1>${subjectHtml(view)}<p class="status-strip">${escapeHtml(statusLine(view))}</p>
<p class="stamp">Workspace ${escapeHtml(view.workspace?.id)} \xB7 ${escapeHtml(view.subject?.kind)} ${escapeHtml(view.subject?.id)} \xB7 through sequence ${escapeHtml(view.throughSeq)} \xB7 generated ${escapeHtml(view.generatedAt)}</p>
<p class="warning">${escapeHtml(snapshotWarning)}</p><p>${escapeHtml(redactionNotice(view))}</p>
<nav aria-label="Offline inspection">${links.filter((l) => generatedLink(l.href)).map((l) => `<a href="${escapeHtml(l.href)}">${escapeHtml(l.text)}</a>`).join(" ")}</nav></header>
<main id="main" tabindex="-1">${contents}</main></body></html>
`;
}
function renderLanding(metadata) {
  return offlinePage(
    metadata.view,
    "Coordination evidence report",
    "<section><h2>Stable offline entry point</h2><p>This landing selects the most recently exported complete generation, not live state. Older immutable snapshots are retained. Opening a captured report does not run evidence.</p></section>",
    [{ text: "Open captured report", href: metadata.html.file }]
  ) + `<!-- kai-current ${metadata.through_seq} ${metadata.html.digest} ${hash(JSON.stringify({ ...metadata, landing: void 0 }))} -->
`;
}

// src/core/lib/coordination-runtime/report-paths.mjs
function reportRoute(subject) {
  validateHierarchySubject(subject, "report subject");
  const slug = subject.id.split(":").at(-1);
  return {
    pack: "core",
    type: "reports",
    id: `${subject.kind}-${slug}-${hash(canonicalJson(subject)).slice(0, 12)}`,
    lifecycle: "evidence"
  };
}
function relativeDirectory(subject) {
  const relative = privateArtifactDirectory(reportRoute(subject));
  const parsed = parseTypedArtifactRoute(relative);
  if (parsed.visibility !== "private" || parsed.routes.length !== 1 || parsed.routes[0].members.length !== 0) {
    throw new RuntimeError("INVALID_INPUT", "coordination report route must be one complete typed private path");
  }
  return relative;
}
function sameSubject(left, right) {
  try {
    return subjectEquals(
      left && { kind: left.kind, id: left.id },
      right && { kind: right.kind, id: right.id }
    );
  } catch {
    return false;
  }
}
function reportPaths({ root, subject, throughSeq, digest }) {
  workspaceManifest(root);
  validateHierarchySubject(subject, "report subject");
  const relative = relativeDirectory(subject);
  const directory = assertWorkspacePath(root, relative);
  const indexPath = assertWorkspacePath(root, `${relative}/index.html`);
  if (throughSeq === void 0 && digest === void 0) {
    return { directory, indexPath, subject };
  }
  if (!Number.isSafeInteger(throughSeq) || throughSeq < 0 || !/^[0-9a-f]{64}$/.test(digest ?? "")) {
    throw new RuntimeError("INVALID_INPUT", "report generation requires a sequence and lowercase SHA-256 digest");
  }
  const stem = `snapshot-${throughSeq}-${digest.slice(0, 48)}`;
  const pathFor = (extension) => {
    const path = assertWorkspacePath(root, `${relative}/${stem}.${extension}`);
    if (process.platform === "win32" && path.length > 259) {
      throw new RuntimeError("INVALID_INPUT", "report path exceeds the offline browser limit; use a shorter workspace root");
    }
    return path;
  };
  return {
    directory,
    indexPath,
    path: pathFor("html"),
    markdownPath: pathFor("md"),
    metadataPath: pathFor("json"),
    subject
  };
}
function readExisting(path) {
  let fd;
  try {
    const stat = lstatSync(path);
    if (stat.isSymbolicLink() || !stat.isFile() || stat.nlink !== 1) {
      throw new RuntimeError("INVALID_INPUT", "report output must be a regular unshared file");
    }
    fd = openSync(path, "r");
    const current = fstatSync(fd);
    const bytes = readFileSync(fd);
    const after = fstatSync(fd);
    if (!current.isFile() || current.nlink !== 1 || current.ino !== stat.ino || current.dev !== stat.dev || after.mtimeMs !== current.mtimeMs || after.size !== bytes.length) {
      throw new RuntimeError("EVIDENCE_GAP", "report output changed identity or bytes while reading");
    }
    return bytes;
  } catch (error) {
    if (error.code === "ENOENT") return null;
    throw error;
  } finally {
    if (fd !== void 0) closeSync(fd);
  }
}
function reportMemberPath({ root, subject, file }) {
  reportPaths({ root, subject });
  if (!/^[a-z0-9-]+\.(html|md|json|lock|new)$/.test(file)) {
    throw new RuntimeError("INVALID_INPUT", "report member must be a generated basename");
  }
  const path = assertWorkspacePath(root, `${relativeDirectory(subject)}/${file}`);
  if (process.platform === "win32" && path.length > 259) {
    throw new RuntimeError("INVALID_INPUT", "report member exceeds the offline browser path limit");
  }
  return path;
}
function ownedLanding(root, subject, indexPath) {
  const bytes = readExisting(indexPath);
  if (bytes === null) return null;
  const reject = () => {
    throw new RuntimeError(
      "EVIDENCE_GAP",
      "stable index is unrecognized, changed, incomplete or belongs to another workspace/subject"
    );
  };
  const match = /<!-- kai-current (\d+) ([a-f0-9]{64}) ([a-f0-9]{64}) -->\n$/.exec(bytes.toString("utf8"));
  if (!match) reject();
  const paths = reportPaths({
    root,
    subject,
    throughSeq: Number(match[1]),
    digest: match[2]
  });
  let metadata;
  try {
    metadata = JSON.parse(readExisting(paths.metadataPath));
  } catch {
    reject();
  }
  const manifest = workspaceManifest(root);
  if (metadata?.schema_version !== 3 || metadata.kind !== "kai-coordination-report" || metadata.derived !== true || metadata.workspace?.id !== manifest.workspace_id || metadata.workspace?.root !== normalized(root) || !sameSubject(metadata.subject, subject) || metadata.through_seq !== Number(match[1]) || metadata.html?.digest !== match[2] || metadata.html?.file !== basename(paths.path) || metadata.markdown?.file !== basename(paths.markdownPath) || !Array.isArray(metadata.companions) || metadata.landing?.file !== "index.html" || hash(bytes) !== metadata.landing.digest || match[3] !== hash(JSON.stringify({ ...metadata, landing: void 0 })) || metadata.view_digest !== hash(JSON.stringify(metadata.view)) || !bytes.equals(Buffer.from(renderLanding(metadata)))) {
    reject();
  }
  for (const member of [metadata.html, metadata.markdown, ...metadata.companions]) {
    const retained = readExisting(reportMemberPath({ root, subject, file: member.file }));
    if (retained === null || hash(retained) !== member.digest) reject();
  }
  return bytes;
}
function inspectReportIndex({ root, subject }) {
  const { indexPath } = reportPaths({ root, subject });
  const bytes = ownedLanding(root, subject, indexPath);
  if (bytes === null) return null;
  const match = /<!-- kai-current (\d+) ([a-f0-9]{64}) ([a-f0-9]{64}) -->\n$/.exec(bytes.toString("utf8"));
  const paths = reportPaths({
    root,
    subject,
    throughSeq: Number(match[1]),
    digest: match[2]
  });
  const metadata = JSON.parse(readExisting(paths.metadataPath));
  const view = metadata.view;
  if (view?.schema_version !== 2 || view.workspace?.id !== metadata.workspace.id || view.workspace?.root !== metadata.workspace.root || !sameSubject(view.subject, subject) || view.subject.version !== metadata.subject_version || view.throughSeq !== metadata.through_seq || view.generatedAt !== metadata.generated_at || view.inspection && (!sameSubject(view.inspection.subject, subject) || view.inspection.throughSeq !== metadata.through_seq)) {
    throw new RuntimeError("EVIDENCE_GAP", "selected report view identity does not match its workspace/subject/generation");
  }
  const members = [metadata.html, metadata.markdown, ...metadata.companions];
  if (new Set(members.map((member) => member.file)).size !== members.length) {
    throw new RuntimeError("EVIDENCE_GAP", "selected report contains duplicate members");
  }
  return { paths, metadata };
}

// src/core/lib/coordination-runtime/inspection.mjs
function inspectRuntime(root, { env = process.env, intent = "coordinate" } = {}) {
  const result = { errors: [], warnings: [], migrations: [], runtime: null };
  if (!["inspect", "coordinate"].includes(intent)) {
    result.errors.push("workspace intent must be inspect or coordinate");
    return result;
  }
  let store;
  try {
    const current = readWorkspaceManifest(root);
    if (current.ok && current.manifest.schema_version === WORKSPACE_SCHEMA_VERSION) {
      const validation = validateSchema5Manifest(root, current.manifest, { env });
      result.errors.push(...validation.errors);
      const privacy = inspectGitPrivacy(root, current.manifest.placement);
      result.errors.push(...privacy.errors, ...privacy.missing.map((path) => `private workspace path must be ignored: ${path}`));
      if (current.manifest.placement === "repo-local" && !privacy.gitRoot) {
        result.errors.push("repo-local placement requires a readable Git work tree");
      }
      result.warnings.push(...privacy.warnings);
      try {
        readDirection({ workspaceRoot: root, manifest: current.manifest });
      } catch (error) {
        result.errors.push(error.message);
      }
      if (result.errors.length) return result;
      const databasePath2 = safePath(root, COORDINATION_DATABASE);
      if (!existsSync(databasePath2)) {
        result.errors.push(`schema 5 coordination database is missing at ${COORDINATION_DATABASE}`);
        return result;
      }
      exactFile(root, COORDINATION_DATABASE);
      store = openStore({ path: databasePath2, mode: "read" });
      result.runtime = readStoreSummary(store);
      if (existsSync(schema5MigrationLockPath(root))) {
        result.migrations.push("incomplete schema-5 migration; explicit recovery required");
        result.warnings.push("schema-5 activation receipt is incomplete; runtime writes remain held");
        if (intent === "coordinate") {
          result.errors.push("incomplete schema-5 migration prevents coordinated writes");
        }
      }
      return result;
    }
    const manifest = migrationManifest(root, [3, 4], env);
    if (existsSync(schema5MigrationLockPath(root))) {
      result.migrations.push("incomplete schema-5 migration; explicit offline recovery required");
      result.warnings.push("schema-5 migration lock exists; coordinated writes remain held");
    }
    if (existsSync(safePath(root, LOCK))) {
      result.migrations.push("incomplete/competing migration; explicit offline recovery required");
      result.warnings.push("migration lock exists; coordinated writes are held");
    }
    if (manifest.schema_version === 3) {
      result.migrations.push("schema 3 is inspect-only; first run its explicit historical schema-4 migration, then classify schema 4 for schema 5");
      if (existsSync(safePath(root, DATABASE))) result.warnings.push("unactivated database is not authority; inspect migration recovery");
      return result;
    }
    result.errors.push(...privateAdmission(root).errors);
    if (!existsSync(safePath(root, DATABASE))) {
      if (intent === "inspect") {
        result.warnings.push("schema 4 coordination database is absent; this historical workspace remains read-only and inspection will not create it");
      } else {
        result.errors.push("schema 4 is read-only; explicit offline schema 5 migration is required and inspection will not create a database");
      }
      return result;
    }
    exactFile(root, DATABASE);
    const databasePath = safePath(root, DATABASE);
    try {
      store = openStore({ path: databasePath, mode: "read" });
    } catch (error) {
      if (error?.code !== "SCHEMA_MISMATCH") throw error;
      store = openHistoricalStore({
        path: databasePath,
        expectedStoreVersion: 1
      });
    }
    readSnapshot(store, () => {
      const throughSeq = Number(store.database.prepare("SELECT COALESCE(MAX(seq),0) AS seq FROM events").get().seq);
      const records = [];
      const findings = [];
      const add = (item, section, headline, why, path = DATABASE) => findings.push({ section, item, tier: "derived", headline, why, path });
      for (const row of store.database.prepare(
        "SELECT kind, id FROM records WHERE kind IN ('item', 'task') ORDER BY kind, id"
      ).all()) {
        try {
          records.push(readRecord(store, row.kind, row.id));
        } catch (error) {
          add(row.id, "integrity", "runtime record is malformed", error.message);
        }
      }
      const sources = readLegacyRecords(store);
      for (const source of sources.filter((s) => s.status === "quarantined")) {
        result.warnings.push(`quarantined ${source.kind}/${source.declaredId ?? source.path}: ${source.issues.join("; ")}`);
        add(source.declaredId ?? source.path, "integrity", `quarantined legacy ${source.kind}`, source.issues.join("; "), source.path);
      }
      for (const record of records) {
        if (record.body.state === "blocked") add(record.id, "blocked", "recorded lifecycle is blocked", "Resolve recorded blockers through authorized runtime commands.");
        if (["release-ready", "deploying", "production-verification"].includes(record.body.state)) {
          add(record.id, "needs-you", "recorded lifecycle waits on an operator", "No deployment or production action is inferred.");
        }
        for (const dep of record.body.depends_on) {
          const dependencyId = dep.task ?? dep.item;
          const upstream = records.find((candidate) => candidate.kind === record.kind && candidate.id === dependencyId);
          if (!upstream) add(record.id, "integrity", "dependency is missing or quarantined", dependencyId);
          else if (!TERMINAL.has(record.body.state) && !taskStateSatisfies(upstream, dep.requires)) {
            add(record.id, "blocked", "dependency gate is not satisfied", `${dependencyId} requires ${dep.requires}`);
          }
        }
        if (record.kind !== "task") continue;
        const subject = { kind: "task", id: record.id };
        try {
          projectContext(store, { subject });
        } catch (error) {
          add(record.id, "unknown", "runtime context/evidence gap", error.message);
        }
        try {
          const report = inspectReportIndex({ root, subject });
          const paths = reportPaths({ root, subject });
          if (!report) {
            if (existsSync(paths.directory) && readdirSync(paths.directory).length) {
              result.warnings.push(`partial/old derived report for ${record.id}: no complete owned index`);
            }
          } else {
            const metadata = report.metadata;
            if (metadata.through_seq !== throughSeq || metadata.subject_version !== record.version) {
              result.warnings.push(`stale derived report for ${record.id}: source sequence ${metadata.through_seq}, live ${throughSeq}; subject version ${metadata.subject_version}, live ${record.version}`);
            }
            const selected = /* @__PURE__ */ new Set([
              "index.html",
              basename2(report.paths.metadataPath),
              metadata.html.file,
              metadata.markdown.file,
              ...metadata.companions.map((c) => c.file)
            ]);
            const others = readdirSync(paths.directory).filter((file) => !selected.has(file));
            if (others.length) result.warnings.push(`older or partial derived output remains for ${record.id}; selected complete generation alone was verified`);
          }
        } catch (error) {
          result.warnings.push(`changed/incomplete derived report for ${record.id}: ${error.message}`);
        }
      }
      result.runtime = { throughSeq, records, findings, sources };
    });
    if (manifest.coordination_migration) {
      try {
        const { plan } = verifyMigration(root, { env });
        const live = new Map(sourceSnapshot(root).map((e) => [e.path, e.digest]));
        for (const file of plan.files.filter((f) => f.path !== ".kai/manifest.json")) {
          if (live.get(file.path) !== file.digest) result.warnings.push(`legacy source/view drift: ${file.path}; not imported as current authority`);
        }
      } catch (error) {
        result.warnings.push(`migration backup/receipt gap: ${error.message}`);
      }
    }
  } catch (error) {
    result.errors.push(error.message);
  } finally {
    closeStore(store);
  }
  return result;
}

export {
  hash,
  knownGap,
  redactReport,
  artifactPreviewLimits,
  snapshotWarning,
  inspectRuntime
};
