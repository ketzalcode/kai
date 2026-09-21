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

// Valid typed-dependency "requires" gates (see kai-core-work-item).
export const REQUIRES_STATES = new Set(['in-review', 'completed', 'release-ready', 'shipped']);

// States that are finished: no further role action is expected.
export const TERMINAL = new Set(['shipped', 'completed', 'dropped']);

// Deployment is a human act (see kai-core-operating-rules), so these states are
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

// A packet header in an item thread (see kai-core-peer-communication). Two
// shapes are both live: the bracketed, timestamp-less header existing threads
// already use, and a timestamped unbracketed header:
//   QUESTION [Q-<item-id>-<NN>] — <from-role> → @<to-role>
//   QUESTION Q-<item-id>-<NN> <YYYY-MM-DD-HHMM> - <from-role> -> @<to-role>
//   - status:   <open | answered | escalated>
//   - kind:     <fact | decision | reply | action>
//   - blocking: <yes | no>
// A leading heading/quote/emphasis prefix (`##`, `>`, `*`, backticks) before
// the keyword is tolerated; code-fenced examples are never read as packets.
const HEADER_KEYWORD_RE = /^\s*(?:[#>*_`]+\s*)*\s*(QUESTION|ANSWER|HANDOFF)\b(.*)$/;
const HEADER_BODY_RE = /^\s*(?:\[([^\]]+)\]|([^\s[][\S]*))\s*(?:(\d{4}-\d{2}-\d{2}(?:-\d{4})?)\s*)?[—-]\s*@?([\w.-]+)\s*(?:→|->)\s*@?([\w.-]+)\s*$/;
const FIELD_RE = /^\s*-\s*([A-Za-z_][\w-]*)\s*:\s*(.+?)\s*$/;

// Parse a thread's raw text into every QUESTION/ANSWER packet it carries, then
// reconcile each question against the answers addressed to it. Messages are
// collected first and reconciled by question ID afterward — an ANSWER is never
// treated as ending the parse, which was the historical bug (an appended
// ANSWER left `parseQuestions` reporting the QUESTION's original status).
export function parseThread(raw) {
  const lines = raw.split(/\r?\n/);
  const messages = [];
  let cur = null;
  let fenced = false;
  for (const line of lines) {
    if (/^\s*(```|~~~)/.test(line)) { fenced = !fenced; cur = null; continue; }
    if (fenced) continue;
    const km = line.match(HEADER_KEYWORD_RE);
    if (km) {
      const kind = km[1];
      if (kind === 'HANDOFF') { cur = null; continue; }
      const hb = km[2].match(HEADER_BODY_RE);
      if (!hb) { cur = null; continue; } // keyword present but header malformed: not a packet
      cur = {
        kind,
        id: (hb[1] ?? hb[2] ?? '').trim(),
        from: hb[4],
        to: hb[5],
        timestamp: hb[3] || null,
        fields: {},
      };
      messages.push(cur);
      continue;
    }
    if (!cur) continue;
    const fm = line.match(FIELD_RE);
    if (fm) {
      const value = cleanScalar(fm[2]).replace(/^[`*_]+|[`*_]+$/g, '').trim();
      cur.fields[fm[1].toLowerCase()] = value;
    }
  }

  const questionMsgs = messages.filter((m) => m.kind === 'QUESTION');
  const answerMsgs = messages.filter((m) => m.kind === 'ANSWER');
  const knownIds = new Set(questionMsgs.map((m) => m.id));
  const diagnostics = [];

  const questions = questionMsgs.map((q) => {
    const out = {
      id: q.id, from: q.from, to: q.to,
      status: q.fields.status, kind: q.fields.kind, blocking: q.fields.blocking,
      ask: q.fields.ask, answer_by: q.fields.answer_by, context: q.fields.context,
    };
    const related = answerMsgs.filter((a) => a.id === q.id);
    // The canonical packet (kai-core-peer-communication) carries no `status:`
    // field on ANSWER at all — only `re`/`answer`/`lane`/`provenance`. A
    // status-less ANSWER is therefore a valid legacy packet, not a rejected
    // one; only an *explicit* status other than `answered` (e.g. a draft or
    // escalated packet) is disqualifying. A blank `answer:` never completes a
    // question, whatever its status.
    const hasContent = (a) => typeof a.fields.answer === 'string' && a.fields.answer.trim().length > 0;
    const statusAcceptable = (a) => a.fields.status === undefined || a.fields.status === 'answered';
    const inLane = (a) => a.fields.lane === 'in-lane';
    const partyMatch = (a) => a.from === q.to && a.to === q.from;
    const resolving = related.filter((a) => (
      statusAcceptable(a) && inLane(a) && partyMatch(a) && hasContent(a)
    ));
    for (const a of related) {
      if (resolving.includes(a)) continue;
      let type;
      if (!inLane(a)) type = 'out-of-lane';
      else if (!partyMatch(a)) type = 'party-mismatch';
      else if (!statusAcceptable(a)) type = 'unresolved-status';
      else if (!hasContent(a)) type = 'blank-answer';
      else type = 'unresolved-answer';
      diagnostics.push({ type, id: q.id,
        message: `${a.kind} ${a.id} from ${a.from} does not reconcile (${type.replace(/-/g, ' ')})` });
    }
    if (resolving.length) {
      const distinct = new Set(resolving.map((a) => a.fields.answer ?? ''));
      if (distinct.size > 1) {
        // Contradictory valid answers are never resolved to either side, and
        // they never leave the question sitting on whatever status it
        // happened to declare (including a stale `status: answered` on the
        // QUESTION itself) — a live conflict always forces the question open.
        diagnostics.push({ type: 'conflicting-answer', id: q.id,
          message: `${resolving.length} contradictory in-lane answers for ${q.id}; forcing it open` });
        out.status = 'open';
      } else {
        out.status = 'answered';
        out.answer = resolving[0].fields.answer;
        out.lane = resolving[0].fields.lane;
        out.provenance = resolving[0].fields.provenance;
      }
    }
    return out;
  });

  for (const a of answerMsgs) {
    if (!knownIds.has(a.id)) {
      diagnostics.push({ type: 'orphan-answer', id: a.id,
        message: `ANSWER ${a.id} has no matching QUESTION in this thread` });
    }
  }

  return { questions, answers: answerMsgs, diagnostics, messages };
}

// Backward-compatible view: the array of questions, with status reconciled
// against any answers in the thread. Existing status callers (work-status)
// keep using this; they only ever read the fields already on each question.
export function parseQuestions(raw) {
  return parseThread(raw).questions;
}
