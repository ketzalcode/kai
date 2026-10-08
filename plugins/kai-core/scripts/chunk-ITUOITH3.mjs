import{createRequire as __cr}from'node:module';const require=__cr(import.meta.url);

// src/core/lib/coordination.mjs
var TASK_LIFECYCLE = /* @__PURE__ */ new Set([
  "proposed",
  "ready",
  "in-progress",
  "in-review",
  "blocked",
  "completed",
  "release-ready",
  "deploying",
  "production-verification",
  "shipped",
  "dropped"
]);
var TASK_NEEDS_CHANGE_REF = /* @__PURE__ */ new Set([
  "in-review",
  "release-ready",
  "deploying",
  "production-verification",
  "shipped"
]);
var TASK_DEPENDENCY_STATES = /* @__PURE__ */ new Set([
  "in-review",
  "completed",
  "release-ready",
  "shipped"
]);
var TASK_TERMINAL_STATES = /* @__PURE__ */ new Set(["shipped", "completed", "dropped"]);
var TASK_OPERATOR_GATED_STATES = /* @__PURE__ */ new Set([
  "release-ready",
  "deploying",
  "production-verification"
]);
var LIFECYCLE = TASK_LIFECYCLE;
var NEEDS_CHANGE_REF = TASK_NEEDS_CHANGE_REF;
var REQUIRES_STATES = TASK_DEPENDENCY_STATES;
var TERMINAL = TASK_TERMINAL_STATES;
var OPERATOR_GATED = TASK_OPERATOR_GATED_STATES;
function frontmatter(raw) {
  const lines = raw.split(/\r?\n/);
  if (lines[0] !== "---") return null;
  let end = -1;
  for (let i = 1; i < lines.length; i++) {
    if (lines[i] === "---") {
      end = i;
      break;
    }
  }
  if (end === -1) return null;
  return lines.slice(1, end);
}
function cleanScalar(raw) {
  let s = (raw ?? "").trim();
  if (s.startsWith('"') && s.endsWith('"') || s.startsWith("'") && s.endsWith("'")) {
    return s.slice(1, -1);
  }
  const h = s.indexOf(" #");
  if (h !== -1) s = s.slice(0, h).trim();
  return s;
}
function scalar(fmLines, key) {
  for (const l of fmLines) {
    const m = l.match(new RegExp(`^${key}:\\s?(.*)$`));
    if (m) return cleanScalar(m[1]);
  }
  return void 0;
}
var isNull = (v) => v === void 0 || v === "" || v === "null" || v === "~" || v === "\u2014";
var unquote = (s) => {
  const t = (s ?? "").trim();
  return t.startsWith('"') && t.endsWith('"') || t.startsWith("'") && t.endsWith("'") ? t.slice(1, -1) : t;
};
function dependsOn(fmLines) {
  const out = [];
  let inBlock = false;
  let cur = null;
  for (const l of fmLines) {
    if (/^depends_on:\s*(\[\])?\s*$/.test(l)) {
      inBlock = true;
      continue;
    }
    if (inBlock) {
      if (/^\S/.test(l)) break;
      const mi = l.match(/^\s*-\s*item:\s*(.+?)\s*$/);
      if (mi) {
        cur = { item: cleanScalar(mi[1]), requires: void 0 };
        out.push(cur);
        continue;
      }
      const mr = l.match(/^\s*requires:\s*(.+?)\s*$/);
      if (mr && cur) cur.requires = cleanScalar(mr[1]);
    }
  }
  return out;
}
function lease(fmLines) {
  const out = { holder: void 0, token: void 0, versionAtGrant: void 0, expires: void 0 };
  let inBlock = false;
  for (const l of fmLines) {
    if (/^lease:\s*$/.test(l)) {
      inBlock = true;
      continue;
    }
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
function listBlock(fmLines, key) {
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
function mapListBlock(fmLines, key) {
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
      if (start) {
        cur = { [start[1]]: cleanScalar(start[2]) };
        out.push(cur);
        continue;
      }
      const kv = l.match(/^\s*([A-Za-z_][\w-]*):\s?(.*)$/);
      if (kv && cur) cur[kv[1]] = cleanScalar(kv[2]);
    }
  }
  return out;
}
function parseStamp(s) {
  const t = unquote(s);
  let mm = t.match(/^(\d{4})-(\d{2})-(\d{2})-(\d{2})(\d{2})$/);
  if (mm) return Date.UTC(+mm[1], +mm[2] - 1, +mm[3], +mm[4], +mm[5]);
  mm = t.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (mm) return Date.UTC(+mm[1], +mm[2] - 1, +mm[3]);
  const d = Date.parse(t);
  return Number.isNaN(d) ? null : d;
}
var HEADER_KEYWORD_RE = /^\s*(?:[#>*_`]+\s*)*\s*(QUESTION|ANSWER|HANDOFF)\b(.*)$/;
var HEADER_BODY_RE = /^\s*(?:\[([^\]]+)\]|([^\s[][\S]*))\s*(?:(\d{4}-\d{2}-\d{2}(?:-\d{4})?)\s*)?[—-]\s*@?([\w.-]+)\s*(?:→|->)\s*@?([\w.-]+)\s*$/;
var FIELD_RE = /^\s*-\s*([A-Za-z_][\w-]*)\s*:\s*(.+?)\s*$/;
function parseThread(raw) {
  const lines = raw.split(/\r?\n/);
  const messages = [];
  let cur = null;
  let fenced = false;
  for (const line of lines) {
    if (/^\s*(```|~~~)/.test(line)) {
      fenced = !fenced;
      cur = null;
      continue;
    }
    if (fenced) continue;
    const km = line.match(HEADER_KEYWORD_RE);
    if (km) {
      const kind = km[1];
      if (kind === "HANDOFF") {
        cur = null;
        continue;
      }
      const hb = km[2].match(HEADER_BODY_RE);
      if (!hb) {
        cur = null;
        continue;
      }
      cur = {
        kind,
        id: (hb[1] ?? hb[2] ?? "").trim(),
        from: hb[4],
        to: hb[5],
        timestamp: hb[3] || null,
        fields: {}
      };
      messages.push(cur);
      continue;
    }
    if (!cur) continue;
    const fm = line.match(FIELD_RE);
    if (fm) {
      const value = cleanScalar(fm[2]).replace(/^[`*_]+|[`*_]+$/g, "").trim();
      cur.fields[fm[1].toLowerCase()] = value;
    }
  }
  const questionMsgs = messages.filter((m) => m.kind === "QUESTION");
  const answerMsgs = messages.filter((m) => m.kind === "ANSWER");
  const knownIds = new Set(questionMsgs.map((m) => m.id));
  const diagnostics = [];
  const questions = questionMsgs.map((q) => {
    const out = {
      id: q.id,
      from: q.from,
      to: q.to,
      status: q.fields.status,
      kind: q.fields.kind,
      blocking: q.fields.blocking,
      ask: q.fields.ask,
      answer_by: q.fields.answer_by,
      context: q.fields.context
    };
    const related = answerMsgs.filter((a) => a.id === q.id);
    const hasContent = (a) => typeof a.fields.answer === "string" && a.fields.answer.trim().length > 0;
    const statusAcceptable = (a) => a.fields.status === void 0 || a.fields.status === "answered";
    const inLane = (a) => a.fields.lane === "in-lane";
    const partyMatch = (a) => a.from === q.to && a.to === q.from;
    const resolving = related.filter((a) => statusAcceptable(a) && inLane(a) && partyMatch(a) && hasContent(a));
    for (const a of related) {
      if (resolving.includes(a)) continue;
      let type;
      if (!inLane(a)) type = "out-of-lane";
      else if (!partyMatch(a)) type = "party-mismatch";
      else if (!statusAcceptable(a)) type = "unresolved-status";
      else if (!hasContent(a)) type = "blank-answer";
      else type = "unresolved-answer";
      diagnostics.push({
        type,
        id: q.id,
        message: `${a.kind} ${a.id} from ${a.from} does not reconcile (${type.replace(/-/g, " ")})`
      });
    }
    if (resolving.length) {
      const distinct = new Set(resolving.map((a) => a.fields.answer ?? ""));
      if (distinct.size > 1) {
        diagnostics.push({
          type: "conflicting-answer",
          id: q.id,
          message: `${resolving.length} contradictory in-lane answers for ${q.id}; forcing it open`
        });
        out.status = "open";
      } else {
        out.status = "answered";
        out.answer = resolving[0].fields.answer;
        out.lane = resolving[0].fields.lane;
        out.provenance = resolving[0].fields.provenance;
      }
    }
    return out;
  });
  for (const a of answerMsgs) {
    if (!knownIds.has(a.id)) {
      diagnostics.push({
        type: "orphan-answer",
        id: a.id,
        message: `ANSWER ${a.id} has no matching QUESTION in this thread`
      });
    }
  }
  return { questions, answers: answerMsgs, diagnostics, messages };
}

export {
  TASK_LIFECYCLE,
  TASK_NEEDS_CHANGE_REF,
  TASK_DEPENDENCY_STATES,
  TASK_TERMINAL_STATES,
  LIFECYCLE,
  NEEDS_CHANGE_REF,
  REQUIRES_STATES,
  TERMINAL,
  OPERATOR_GATED,
  frontmatter,
  cleanScalar,
  scalar,
  isNull,
  unquote,
  dependsOn,
  lease,
  listBlock,
  mapListBlock,
  parseStamp,
  parseThread
};
