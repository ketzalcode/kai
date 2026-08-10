// Shared coordination-record parsing.
//
// `workspace-doctor` validates these records and `work-status` reports on them.
// They must never disagree about what a record *says*, so both read it through
// this module — a second parser would be a second truth, which is precisely the
// failure the status report exists to surface.
//
// Node built-ins only; this module is imported by checks that CI runs with no
// install step.

// Canonical lifecycle states.
export const LIFECYCLE = new Set([
  'proposed', 'ready', 'in-progress', 'in-review', 'blocked', 'completed',
  'release-ready', 'deploying', 'production-verification', 'shipped', 'dropped',
]);

// States at or past in-review require a change_ref bound to the implementation.
export const NEEDS_CHANGE_REF = new Set([
  'in-review', 'release-ready', 'deploying', 'production-verification', 'shipped',
]);

// Valid typed-dependency "requires" gates (see work-coordination).
export const REQUIRES_STATES = new Set(['in-review', 'completed', 'release-ready', 'shipped']);

// States that are finished: no further role action is expected.
export const TERMINAL = new Set(['shipped', 'completed', 'dropped']);

// Deployment is a human act (see team-operating-rules), so these states are
// waiting on the operator by definition, not on any kai role.
export const OPERATOR_GATED = new Set(['release-ready', 'deploying', 'production-verification']);

export function frontmatter(raw) {
  const lines = raw.split(/\r?\n/);
  if (lines[0] !== '---') return null;
  let end = -1;
  for (let i = 1; i < lines.length; i++) { if (lines[i] === '---') { end = i; break; } }
  if (end === -1) return null;
  return lines.slice(1, end);
}

// Normalize a raw YAML scalar: unwrap surrounding quotes, else strip a trailing
// ` # comment`. (Comments inside a quoted value are preserved.)
export function cleanScalar(raw) {
  let s = (raw ?? '').trim();
  if ((s.startsWith('"') && s.endsWith('"')) || (s.startsWith("'") && s.endsWith("'"))) {
    return s.slice(1, -1);
  }
  const h = s.indexOf(' #');
  if (h !== -1) s = s.slice(0, h).trim();
  return s;
}

export function scalar(fmLines, key) {
  for (const l of fmLines) {
    const m = l.match(new RegExp(`^${key}:\\s?(.*)$`));
    if (m) return cleanScalar(m[1]);
  }
  return undefined;
}

export const isNull = (v) => v === undefined || v === '' || v === 'null' || v === '~' || v === '—';

export const unquote = (s) => {
  const t = (s ?? '').trim();
  return (t.startsWith('"') && t.endsWith('"')) || (t.startsWith("'") && t.endsWith("'"))
    ? t.slice(1, -1) : t;
};

// Extract typed dependencies ({item, requires}) under a top-level `depends_on:`.
export function dependsOn(fmLines) {
  const out = [];
  let inBlock = false;
  let cur = null;
  for (const l of fmLines) {
    if (/^depends_on:\s*(\[\])?\s*$/.test(l)) { inBlock = true; continue; }
    if (inBlock) {
      if (/^\S/.test(l)) break; // dedented to next top-level key
      const mi = l.match(/^\s*-\s*item:\s*(.+?)\s*$/);
      if (mi) { cur = { item: cleanScalar(mi[1]), requires: undefined }; out.push(cur); continue; }
      const mr = l.match(/^\s*requires:\s*(.+?)\s*$/);
      if (mr && cur) cur.requires = cleanScalar(mr[1]);
    }
  }
  return out;
}

// Read holder/token/version_at_grant/expires from the `lease:` block.
export function lease(fmLines) {
  const out = { holder: undefined, token: undefined, versionAtGrant: undefined, expires: undefined };
  let inBlock = false;
  for (const l of fmLines) {
    if (/^lease:\s*$/.test(l)) { inBlock = true; continue; }
    if (inBlock) {
      if (/^\S/.test(l)) break;
      const h = l.match(/^\s*holder:\s?(.*)$/);
      const t = l.match(/^\s*token:\s?(.*)$/);
      const v = l.match(/^\s*version_at_grant:\s?(.*)$/);
      const e = l.match(/^\s*expires:\s?(.*)$/);
      if (h) out.holder = h[1].trim();
      if (t) out.token = t[1].trim();
      if (v) out.versionAtGrant = v[1].trim();
      if (e) out.expires = e[1].trim();
    }
  }
  return out;
}

// A flat scalar list (`key:` followed by `  - value` lines, or `key: []`).
export function listBlock(fmLines, key) {
  const out = [];
  let inBlock = false;
  for (const l of fmLines) {
    if (new RegExp(`^${key}:\\s*(\\[\\])?\\s*$`).test(l)) {
      if (/\[\]\s*$/.test(l)) return out;
      inBlock = true;
      continue;
    }
    if (inBlock) {
      if (/^\S/.test(l)) break;
      const m = l.match(/^\s*-\s*(.+?)\s*$/);
      if (m) out.push(cleanScalar(m[1]));
    }
  }
  return out;
}

// A list of `- key: value` maps (review_requirements, completed_reviews). A new
// entry starts at each `- `; subsequent indented `key: value` lines extend it.
export function mapListBlock(fmLines, key) {
  const out = [];
  let inBlock = false;
  let cur = null;
  for (const l of fmLines) {
    if (new RegExp(`^${key}:\\s*(\\[\\])?\\s*$`).test(l)) {
      if (/\[\]\s*$/.test(l)) return out;
      inBlock = true;
      continue;
    }
    if (inBlock) {
      if (/^\S/.test(l)) break;
      const start = l.match(/^\s*-\s*([A-Za-z_][\w-]*):\s?(.*)$/);
      if (start) { cur = { [start[1]]: cleanScalar(start[2]) }; out.push(cur); continue; }
      const kv = l.match(/^\s*([A-Za-z_][\w-]*):\s?(.*)$/);
      if (kv && cur) cur[kv[1]] = cleanScalar(kv[2]);
    }
  }
  return out;
}

// Accepts `YYYY-MM-DD-HHMM`, `YYYY-MM-DD`, or anything Date.parse understands.
export function parseStamp(s) {
  const t = unquote(s);
  let mm = t.match(/^(\d{4})-(\d{2})-(\d{2})-(\d{2})(\d{2})$/);
  if (mm) return Date.UTC(+mm[1], +mm[2] - 1, +mm[3], +mm[4], +mm[5]);
  mm = t.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (mm) return Date.UTC(+mm[1], +mm[2] - 1, +mm[3]);
  const d = Date.parse(t);
  return Number.isNaN(d) ? null : d;
}

// A QUESTION packet in an item thread (see peer-communication):
//   QUESTION [Q-<item-id>-<NN>] — <from-role> → @<to-role>
//   - status:   <open | answered | escalated>
//   - kind:     <fact | decision | reply | action>
//   - blocking: <yes | no>
// Only the header and the fields that follow it are read; prose is ignored.
export function parseQuestions(raw) {
  const out = [];
  const lines = raw.split(/\r?\n/);
  let cur = null;
  let fenced = false;
  for (const l of lines) {
    if (/^\s*(```|~~~)/.test(l)) { fenced = !fenced; cur = null; continue; }
    if (fenced) continue;
    const h = l.match(/^\s*(?:[#*_`>\s]*)QUESTION\s*\[([^\]]+)\]\s*[—-]\s*(.+?)\s*(?:→|->)\s*@?([\w@-]+)/);
    if (h) {
      cur = { id: h[1].trim(), from: h[2].trim(), to: h[3].trim(), status: undefined, kind: undefined, blocking: undefined };
      out.push(cur);
      continue;
    }
    if (!cur) continue;
    if (/^\s*(?:[#*_`>\s]*)(QUESTION|ANSWER|HANDOFF)\b/.test(l)) { cur = null; continue; }
    const f = l.match(/^\s*-\s*(status|kind|blocking|ask|answer_by)\s*:\s*(.+?)\s*$/i);
    if (f) cur[f[1].toLowerCase()] = cleanScalar(f[2]).replace(/^[`*_]+|[`*_]+$/g, '').trim();
  }
  return out;
}
