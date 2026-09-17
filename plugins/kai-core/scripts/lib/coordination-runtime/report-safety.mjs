import {createHash} from 'node:crypto';
import {RuntimeError} from './contract.mjs';

export const hash = value => createHash('sha256').update(value).digest('hex');
export const escapeHtml = value => String(value ?? 'unavailable').replace(/[&<>"']/g,
  character => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'}[character]));
export const escapeMarkdown = value => escapeHtml(value)
  .replace(/([\\`*_[\]{}()#+.!|~-])/g, '\\$1')
  .replace(/:/g, '&#58;').replace(/@/g, '&#64;').replace(/\r?\n/g, '<br>');
export const knownGap = error => error instanceof RuntimeError
  && ['EVIDENCE_GAP', 'AUTHORITY_REQUIRED', 'INVALID_INPUT'].includes(error.code);
const tokenKey = key => /^token$|lease.*token$/i.test(key);

// Longest suffix that could continue as a known secret. Work/storage are bounded
// by the captured prefix, even when a bearer is longer or highly repetitive.
function possibleBearerSuffix(text, secret) {
  const prefix = secret.slice(0, Math.min(text.length, secret.length - 1));
  const fallback = new Uint32Array(prefix.length);
  let matched = 0;
  for (let i = 1; i < prefix.length; i++) {
    while (matched && prefix[i] !== prefix[matched]) matched = fallback[matched - 1];
    if (prefix[i] === prefix[matched]) matched++;
    fallback[i] = matched;
  }
  matched = 0;
  for (let i = text.length - prefix.length; i < text.length; i++) {
    while (matched && text[i] !== prefix[matched]) matched = fallback[matched - 1];
    if (text[i] === prefix[matched]) matched++;
  }
  return matched;
}

function redactPreview(preview, secrets, notice) {
  const text = preview.content;
  if (!secrets.size) return {content: text, boundaryWithheldBytes: 0};
  const patterns = new Set(secrets);
  if (preview.encoding === 'latin1') {
    // Binary byte strings may contain UTF-8 bearers too. No unbounded source or
    // lookahead is retained; a longer pattern cannot fit inside this prefix.
    for (const secret of secrets) patterns.add(Buffer.from(secret.slice(0, text.length + 1)).toString('latin1'));
  }
  // Union matches before replacing anything, so overlapping complete bearers
  // cannot be split into raw fragments by boundary withholding.
  const masked = new Uint8Array(text.length);
  const mark = (start, end, flag) => {
    if (preview.encoding === 'utf8') {
      if (/[\uDC00-\uDFFF]/.test(text[start]) && /[\uD800-\uDBFF]/.test(text[start - 1])) start--;
      if (/[\uD800-\uDBFF]/.test(text[end - 1]) && /[\uDC00-\uDFFF]/.test(text[end])) end++;
    }
    for (let i = start; i < end; i++) if (!masked[i]) masked[i] = flag;
  };
  let boundaryStart = text.length;
  for (const secret of patterns) {
    let markedThrough = 0;
    for (let start = text.indexOf(secret); start !== -1; start = text.indexOf(secret, start + 1)) {
      mark(Math.max(start, markedThrough), start + secret.length, 1);
      markedThrough = start + secret.length;
      notice.occurrences++;
    }
    if (preview.previewState === 'limited') {
      boundaryStart = Math.min(boundaryStart, text.length - possibleBearerSuffix(text, secret));
    }
  }
  let boundaryWithheldBytes = 0;
  if (boundaryStart < text.length) {
    mark(boundaryStart, text.length, 2);
    for (let start = 0; start < text.length;) {
      if (masked[start] !== 2) { start++; continue; }
      let end = start + 1;
      while (masked[end] === 2) end++;
      boundaryWithheldBytes += Buffer.byteLength(text.slice(start, end), preview.encoding);
      start = end;
    }
    if (boundaryWithheldBytes) notice.boundaries++;
  }
  const parts = [];
  for (let start = 0; start < text.length;) {
    let end = start;
    let flags = 0;
    const withheld = !!masked[start];
    while (end < text.length && !!masked[end] === withheld) flags |= masked[end++];
    parts.push(!withheld ? text.slice(start, end) : flags & 2
      ? '[withheld possible bearer-boundary]' : '[redacted bearer]');
    start = end;
  }
  return {content: parts.join(''), boundaryWithheldBytes};
}

/** Strip bearer fields and occurrences of known bearer values, including prose. */
export function redaction(value) {
  const secrets = new Set();
  const notice = {fields: 0, occurrences: 0, boundaries: 0};
  const previews = new Set(value?.inspection?.artifactPreviews ?? []);
  function find(entry) {
    if (!entry || typeof entry !== 'object') return;
    for (const [key, child] of Object.entries(entry)) {
      if (tokenKey(key) && typeof child === 'string' && child) secrets.add(child);
      else find(child);
    }
  }
  find(value);
  function cleanText(entry, replaceKnown = true) {
    if (replaceKnown) for (const secret of secrets) entry = entry.replaceAll(secret, () => {
      notice.occurrences++;
      return '[redacted bearer]';
    });
    entry = entry.replace(/\bBearer\s+[A-Za-z0-9._~+/-]+=*/gi, () => {
      notice.occurrences++;
      return '[redacted bearer]';
    }).replace(/("(?:token|[^"]*lease[^"]*token)"\s*:\s*")([^"]+)(")/gi, (match, start, value, end) => {
      if (value === '[redacted bearer]') return match;
      notice.occurrences++;
      return `${start}[redacted bearer]${end}`;
    });
    return entry;
  }
  function clean(entry) {
    if (typeof entry === 'string') return cleanText(entry);
    if (Array.isArray(entry)) return entry.map(clean);
    if (!entry || typeof entry !== 'object') return entry;
    const preview = previews.has(entry) && typeof entry.content === 'string'
      ? redactPreview(entry, secrets, notice) : null;
    const result = Object.fromEntries(Object.entries(entry)
      .filter(([key]) => {
        if (!tokenKey(key)) return true;
        notice.fields++;
        return false;
      }).map(([key, child]) => [key, preview && key === 'content' ? cleanText(preview.content, false) : clean(child)]));
    if (preview?.boundaryWithheldBytes) {
      result.boundaryWithheldBytes = (entry.boundaryWithheldBytes ?? 0) + preview.boundaryWithheldBytes;
    }
    return result;
  }
  return {value: clean(value), notice};
}

export const redact = value => redaction(value).value;
export function redactReport(value) {
  const result = redaction(value);
  const boundaries = (value.redactions?.boundaries ?? 0) + result.notice.boundaries;
  return {...result.value, redactions: {
    fields: (value.redactions?.fields ?? 0) + result.notice.fields,
    occurrences: (value.redactions?.occurrences ?? 0) + result.notice.occurrences,
    ...(boundaries || value.redactions?.boundaries !== undefined ? {boundaries} : {}),
  }};
}
export const redactionNotice = view => {
  const {fields = 0, occurrences = 0, boundaries = 0} = view.redactions ?? {};
  return fields || occurrences || boundaries
    ? `Redactions applied: ${fields} bearer fields omitted; ${occurrences} known bearer occurrences replaced across captured content.`
      + (boundaries ? ` Conservative boundary withholding: ${boundaries} truncated preview suffixes could continue as known bearers; withheld without inspecting omitted bytes, not confirmed secret occurrences.` : '')
      + ' Digests identify retained originals; previews are redacted derivatives. Secret detection is not exhaustive.'
    : 'No supported bearer redactions detected in captured content; this is not a guarantee of secret removal.';
};
export const generatedLink = value => typeof value === 'string'
  && /^[a-z0-9-]+\.html(?:#[a-z0-9-]+)?$/.test(value);
export const referenceAnchor = ref => `ref-${hash(ref).slice(0, 32)}`;

export const artifactPreviewLimits = Object.freeze({perArtifactBytes: 64 * 1024, aggregateBytes: 1024 * 1024});
export const artifactPreviewPolicy = 'Artifact preview budgets: 64 KiB per artifact (shared by bundle members), 1 MiB across this report, measured in source bytes before redaction/encoding. Full retained files, SHA-256 identities, required questions/criteria and full message history are not truncated by these budgets.';
export function artifactPreviewNotice(preview) {
  if (preview.gap) return `Preview unavailable — evidence gap: ${preview.gap}`;
  if (!preview.previewState) return 'Legacy preview metadata: byte budget and completeness unavailable; rebuild the report.';
  const count = `${preview.previewBytes} of ${preview.sourceSize} source bytes captured; ${preview.omittedBytes} bytes omitted.`
    + (preview.boundaryWithheldBytes ? ` Conservative boundary withholding: ${preview.boundaryWithheldBytes} captured source bytes replaced as a possible known-bearer prefix; the omitted continuation was not inspected. These bytes still spend the source-prefix budget.` : '');
  if (preview.previewState === 'complete') return `Complete preview. ${count}`;
  return `Presentation limitation — ${preview.previewState === 'omitted' ? 'No preview: budget cannot supply a complete text character or any source bytes.' : 'Limited prefix preview; remainder not embedded.'} ${count} Limits: ${preview.limitReasons.join(', ')}. This is not a failed source acceptance or an evidence gap; full retained-file identity was verified.`;
}

export const snapshotWarning = 'Snapshot — not live. Recorded lifecycle is historical truth, not a new acceptance or shipping decision. Current proof checks and their gaps are listed; historical proof is not reaccepted. Files can change after generation.';
