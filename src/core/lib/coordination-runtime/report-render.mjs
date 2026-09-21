import {createHash} from 'node:crypto';
import {
  artifactPreviewNotice, artifactPreviewPolicy,
  escapeHtml as h, escapeMarkdown as m, generatedLink, hash, redactReport,
  redactionNotice, referenceAnchor as anchor, snapshotWarning,
} from './report-safety.mjs';

const text = value => value === null || value === undefined ? 'unavailable'
  : typeof value === 'object' ? JSON.stringify(value, null, 2) : String(value);
const actor = value => value ? `${value.role} · run ${value.runId}` : 'unavailable';
const paragraph = value => ({type: 'paragraph', text: text(value)});
const table = (caption, headers, rows) => ({type: 'table', caption, headers, rows});
const detail = (title, blocks) => ({type: 'details', title, blocks});
const recordDetail = record => detail(`Full registry metadata: ${record.ref ?? record.id ?? 'record'}`,
  [{type: 'pre', text: text(record)}]);
const row = (cells, ref = null) => ({cells, ref});
const cell = (value, ref = null, href = null) => ({text: text(value), ref, href});
const link = (label, href) => ({type: 'link', text: label, href});
const refs = values => (values ?? []).map(ref => cell(ref, ref));
const refsCell = values => ({refs: refs(values)});
const unavailable = 'unavailable';
const money = cost => cost && typeof cost === 'object'
  && Number.isFinite(cost.amount) && /^[A-Z]{3}$/.test(cost.currency ?? '')
  && ['attempt', 'session-cumulative'].includes(cost.scope)
  ? `${cost.currency} ${cost.amount} · ${cost.scope} · session ${text(cost.sessionId)}`
  : unavailable;
const usage = value => value
  ? `${text(value.totalPremiumRequests)} premium-request units; ${text(value.totalNanoAiu)} nano-AIU; ${text(value.scope)}; session ${text(value.sessionId)}`
  : unavailable;
const provenance = record => record.provenance?.tier ?? 'declared';

export function inspectionPaths(view) {
  const digest = createHash('sha256');
  const add = value => digest.update(`${JSON.stringify(value)}\n`);
  add([view.workspace, view.item?.id, view.throughSeq, view.generatedAt,
    view.inspection?.threadId, view.inspection?.throughSeq, view.inspection?.previewBudget]);
  for (const page of view.inspection?.messagePages ?? []) {
    add(['message-page', page.length]);
    for (const entry of page) add(entry);
  }
  for (const preview of view.inspection?.artifactPreviews ?? []) add(preview);
  const key = digest.digest('hex').slice(0, 32);
  return {
    histories: (view.inspection?.messagePages ?? []).map((_, i) => `history-${key}-${i + 1}.html`),
    artifacts: (view.inspection?.artifactPreviews ?? []).map((_, i) => `artifact-${key}-${i + 1}.html`),
  };
}

function verdictTable(title, records) {
  return table(title, ['Record / verdict', 'Actor / independence', 'Revision / integrity', 'Evidence references'],
    records.map(r => row([
      cell(`${r.ref}\n${r.kind}: ${r.verdict ?? r.decision ?? r.outcome}\nProvenance: ${provenance(r)}\n${r.reason ?? ''}`),
      cell(`${actor(r.reviewer ?? r.authority)}\nIndependence: ${r.independent === null ? 'not an independent review' : r.independent ? 'independent' : 'not independent'}`),
      cell(`${r.status} · ${r.integrity}\nCriteria ${r.criteria_ref}\nDeclared time ${r.created_at}\nPersisted event ${text(r.eventSeq)}`),
      refsCell(r.evidence_refs),
    ], r.ref)));
}

function sectionsFor(view) {
  const destinations = inspectionPaths(view);
  const messageLinks = new Map((view.inspection?.messagePages ?? []).flatMap((page, i) =>
    page.map(entry => [entry.ref, `${destinations.histories[i]}#${anchor(entry.ref)}`])));
  const decisions = view.decisions ?? [];
  const currentDecisions = decisions.filter(d => ['current', 'conflict'].includes(d.status));
  const historicalDecisions = decisions.filter(d => !['current', 'conflict'].includes(d.status));
  const reviews = view.reviews ?? [];
  const activeReviews = reviews.filter(r => ['current', 'conflict'].includes(r.status));
  const oldReviews = reviews.filter(r => !['current', 'conflict'].includes(r.status));
  const gaps = (view.gaps ?? []).map(g => typeof g === 'string' ? {message: g} : g);
  const history = view.history ?? {};
  const questions = view.questions ?? [];
  const messageRows = (view.messages ?? []).map(message => row([
    cell(message.ref ?? message.id), cell(`Event ${text(message.eventSeq)} · declared ${text(message.created_at)}`),
    cell(`${message.sender_role ?? unavailable} · run ${message.sender_run ?? unavailable}\n${message.kind ?? unavailable}`),
    cell(`${message.payloadExcerpt?.text ?? text(message.payload)}${message.payloadExcerpt?.truncated ? '\n[Limited preview; full payload retained in store.]' : ''}`),
    {refs: [...refs([...(message.artifact_refs ?? []), ...(message.evidence_refs ?? [])]),
      ...(messageLinks.has(message.ref) ? [cell('Full message', null, messageLinks.get(message.ref))] : [])]},
  ], message.ref));
  const questionTable = (title, entries) => table(title,
    ['Question', 'Context / ask / deadline', 'Disposition / resolution'], entries.map(q => row([
      cell(q.ref), cell(`${q.context}\n${q.ask}\nAnswer by: ${q.answer_by}`),
      cell(`${q.disposition} · ${q.status}\n${q.resolution?.answer ?? 'No resolution recorded'}`),
    ], q.ref)));
  const attempts = (view.attempts ?? []).flatMap(a => {
    const observations = a.observations ?? [];
    const requested = table(`Attempt ${a.id ?? unavailable}`,
      ['Identity / status', 'Requested role / profile / model / effort', 'Context / independence'], [row([
        cell(`${a.ref ?? unavailable}\n${a.status ?? a.disposition ?? unavailable}\nItem version ${text(a.item_version)} · declared ${text(a.created_at)}`),
        cell(`${actor(a.target)}\nProfile ${text(a.profile)}\nModel ${text(a.requested_model)}\nEffort ${text(a.requested_effort)}`),
        cell(`${text(a.context)}\nResume from ${text(a.resume_from)}\nSession ${text(a.resume_session_id)}\nIndependence key ${text(a.independence_key)}`),
      ], a.ref)]);
    const observed = table('Observed host measurements — no totals',
      ['Observation / provenance', 'Observed role / profile / model / effort', 'Tokens / duration', 'Currency cost / usage'],
      observations.length ? observations.map(o => row([
        cell(`${o.observationId}\nProvenance: observed\n${o.source} · captured ${o.capturedAt}\n${o.facts.status} / ${o.facts.liveness}\nSession ${text(o.facts.sessionId)}`),
        cell(`${text(o.facts.actualRole)}\n${text(o.facts.actualProfile)}\nModel ${text(o.facts.actualModel)}\nEffort ${text(o.facts.actualEffort)}`),
        cell(`Input ${text(o.facts.inputTokens)}\nOutput ${text(o.facts.outputTokens)}\nDuration ${text(o.facts.durationMs)} ms\nExit ${text(o.facts.exitCode)}`),
        cell(`Cost ${money(o.facts.cost)}\nUsage ${usage(o.facts.usage)}`),
      ])) : [row([cell('No host observation'), cell('Model unavailable'), cell('Tokens / duration unavailable'),
        cell(`Cost ${money(a.cost)} · usage unavailable`)])]);
    return [requested, observed, paragraph(`Attempt gaps: ${(a.gaps ?? []).join(', ') || 'none recorded'}`), recordDetail(a)];
  });
  const sections = [
    {
      id: 'outcome', title: 'Outcome and current state', blocks: [
        paragraph(view.item?.outcome ?? 'Outcome unavailable'),
        table('Recorded state and authority', ['Recorded lifecycle', 'Current proof checks', 'Authority / revision'], [row([
          cell(view.item?.state), cell(`${view.integrity?.status ?? 'unavailable'} — not a new acceptance decision`),
          cell(`Scope ${text(view.item?.scope_authority)}\nCompletion ${text(view.item?.completion_authority)}\nVersion ${text(view.item?.version)}\nCriteria ${text(view.item?.criteriaRef)}`),
        ])]),
        table('Blockers — terminal follow-ups do not reopen lifecycle', ['Reference', 'Required action'],
          (view.blockers ?? []).map(b => row([cell(b.ref), cell(b.ask ?? b.context ?? b.kind)]))),
        table('Evidence gaps and limitations', ['Severity / reference', 'Gap'],
          gaps.map(g => row([cell(`${g.severity ?? 'gap'} · ${g.ref ?? ''}`), cell(g.message)]))),
      ],
    },
    {
      id: 'changes', title: 'Changes and important decisions', blocks: [
        paragraph(`Declared scope — not verified changes: ${(view.item?.touches ?? []).join(', ') || 'none recorded'}`),
        paragraph('Git paths below are derived read-only from exact registered base/head in the bound project, with renames disabled (add/delete pairs). Recorded artifact revisions are not a diff. No before/after change semantics are inferred for non-Git evidence.'),
        table('Changed paths and recorded revision evidence',
          ['Path / source', 'Recorded status / provenance', 'Exact revision'],
          (view.changes ?? []).map(c => row([
            cell(`${c.path}\n${c.ref}`),
            cell(`${c.kind === 'git' ? 'Git changed path' : 'Recorded artifact revision'} · ${c.status}\nProvenance: ${c.provenance}`),
            cell(c.kind === 'git' ? `Project ${c.projectId}\nBase ${c.base}\nHead ${c.head}` : `SHA-256 ${c.digest}`),
          ]))),
        table('Latest recorded handoff rationale — declared, not verified changes',
          ['Handoff', 'Recorded excerpt', 'Full retained message'],
          (view.messages ?? []).filter(message => message.kind === 'handoff').slice(-1).map(message => row([
            cell(message.ref), cell(message.payloadExcerpt?.text ?? text(message.payload)),
            cell('Full message', null, messageLinks.get(message.ref)),
          ]))),
        paragraph('Important decisions below retain recorded rationale; report generation supplies no new approval. Full handoff rationale remains reachable in the addressed thread section.'),
        verdictTable('Current decisions', currentDecisions),
        ...currentDecisions.map(recordDetail),
        detail(`Historical / superseded decisions (${historicalDecisions.length})`,
          [verdictTable('Historical decisions — not reaccepted by this report', historicalDecisions),
            ...historicalDecisions.map(recordDetail)]),
      ],
    },
    {
      id: 'coverage', title: 'Criteria-to-evidence coverage and exact artifacts', blocks: [
        paragraph('Coverage is explicit, not inferred from a model response, lifecycle state or item-level approval. Pending means not supplied yet; a broken positive claim is a gap.'),
        table('Acceptance criteria and exact support', ['Criterion', 'Coverage', 'Verdicts / evidence'],
          (view.criteria ?? []).map(c => row([
            cell(c.text), cell(`${c.status}\n${c.explanation ?? ''}`),
            refsCell([...(c.verdictRefs ?? []), ...(c.evidenceRefs ?? [])]),
          ]))),
        detail('Required reviews, artifacts and dependencies (complete metadata)',
          [{type: 'pre', text: text(view.obligations)}]),
      ],
    },
    {
      id: 'artifacts', title: 'Exact artifacts and retained references', blocks: [
        paragraph('Registered source locations remain inert text. Linked previews display captured retained bytes as escaped text or hex, never executable HTML, images or downloads. These redacted derivatives do not confer acceptance.'),
        paragraph(artifactPreviewPolicy),
        ...(view.artifacts?.length ? view.artifacts.flatMap(a => [
          table(a.title ?? a.ref, ['Artifact / producer', 'Exact subject / criteria', 'Status / classification'], [row([
            cell(`${a.ref}\n${actor(a.producer)}`), cell(`${text(a.subject)}\nCriteria ${text(a.criteria_ref)}`),
            cell(`${a.status} · ${a.integrity}\nProvenance: declared\n${a.classification} · ${a.media_type}`),
          ], a.ref)]),
          table('Retained snapshot identities', ['Source path', 'SHA-256 digest', 'Retained path'],
            (a.snapshots ?? []).map(s => row([cell(s.path), cell(s.digest), cell(s.snapshot_path)]))),
          paragraph(`Retained manifest: ${text(a.manifest_path)}`),
          ...(view.inspection?.artifactPreviews ?? []).flatMap((p, i) => p.ref === a.ref
            ? [paragraph(artifactPreviewNotice(p)),
              link(p.gap ? 'Preview unavailable — inspect recorded gap'
                : p.previewState === 'omitted' ? 'No preview — inspect presentation limitation' : 'Inert retained preview', destinations.artifacts[i])]
            : []),
          recordDetail(a),
          ...((a.assets ?? []).flatMap(asset => [
            paragraph(`Asset ${asset.asset_id}: ${asset.disposition} / ${asset.validity} · canonical target ${asset.target}`),
            detail('Asset disposition and validity history', [{type: 'pre', text: text(asset)}]),
          ])),
        ]) : [paragraph('No registered artifacts. Artifact obligations remain visible above.')]),
      ],
    },
    {
      id: 'reviews', title: 'Independent verdicts and uncertainty', blocks: [
        verdictTable('Current reviews', activeReviews),
        ...activeReviews.map(recordDetail),
        detail(`Historical / superseded reviews (${oldReviews.length})`,
          [verdictTable('Historical reviews — original verdict retained, not current acceptance', oldReviews),
            ...oldReviews.map(recordDetail)]),
        verdictTable('Evidence provenance and outcomes', view.evidence ?? []),
        ...(view.evidence ?? []).map(recordDetail),
      ],
    },
    {
      id: 'history', title: 'Addressed thread and execution history', blocks: [
        questionTable('Unresolved questions and terminal follow-ups', questions.filter(q => q.status === 'open')),
        detail(`Addressed questions (${questions.filter(q => q.status === 'answered').length})`,
          [questionTable('Addressed history', questions.filter(q => q.status === 'answered')),
            ...questions.filter(q => q.status === 'answered').map(recordDetail)]),
        paragraph(`Recent message preview: ${view.messages?.length ?? 0} of ${text(history.totalMessages)}. ${history.limitation ?? 'Full history remains in the coordination store.'}`),
        detail('Recent messages (limited preview)', [table('Recent messages in persisted event order',
          ['Message', 'Chronology', 'Sender / kind', 'Payload excerpt', 'References'], messageRows)]),
        ...(destinations.histories.length ? [link('Full and older messages', destinations.histories[0])]
          : [paragraph('No captured messages. No live data is fetched by this document.')]),
        detail('Captured history scope', [paragraph(`Sequence cursor: ${text(history.cursor)}. Captured item/thread only, through sequence ${view.throughSeq}.`)]),
      ],
    },
    {
      id: 'attempts', title: 'Attempts, models and usage', blocks: [
        paragraph('Requested is not observed. Unknown models, tokens, duration and costs remain unavailable. Premium-request units and nano-AIU are not dollars. Session-cumulative checkpoints overlap: no sums, currency conversion or per-attempt attribution is performed.'),
        ...(attempts.length ? attempts : [paragraph('No attempts recorded. Observed model and cost unavailable.')]),
        detail(`Effect intent / outcome history (${view.effects?.length ?? 0})`,
          (view.effects ?? []).map(recordDetail)),
      ],
    },
  ];
  const artifacts = sections.find(s => s.id === 'artifacts');
  sections.find(s => s.id === 'coverage').blocks.push(...artifacts.blocks);
  return sections.filter(s => s !== artifacts);
}

const css = `
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

function allRefs(sections) {
  const result = new Set();
  function walk(blocks) {
    for (const block of blocks) {
      if (block.type === 'table') block.rows.forEach(r => { if (r.ref) result.add(r.ref); });
      if (block.type === 'details') walk(block.blocks);
    }
  }
  sections.forEach(section => walk(section.blocks));
  return result;
}

export function renderHtml(input) {
  const view = redactReport(input);
  const sections = sectionsFor(view);
  const targets = allRefs(sections);
  const renderCell = value => value.refs
    ? value.refs.map(renderCell).join('<br>') || 'None recorded'
    : generatedLink(value.href) ? `<a href="${h(value.href)}">${h(value.text)}</a>`
    : value.ref && targets.has(value.ref)
      ? `<a href="#${anchor(value.ref)}">${h(value.text)}</a>` : h(value.text);
  function blocksHtml(blocks) {
    return blocks.map(block => {
      if (block.type === 'paragraph') return `<p>${h(block.text)}</p>`;
      if (block.type === 'link') return `<p>${generatedLink(block.href) ? `<a href="${h(block.href)}">${h(block.text)}</a>` : h(block.text)}</p>`;
      if (block.type === 'pre') return `<pre>${h(block.text)}</pre>`;
      if (block.type === 'details') return `<details><summary>${h(block.title)}</summary>${blocksHtml(block.blocks)}</details>`;
      return `<table><caption>${h(block.caption)}</caption><thead><tr>${block.headers.map(header => `<th scope="col">${h(header)}</th>`).join('')}</tr></thead><tbody>${
        block.rows.length ? block.rows.map(r => `<tr${r.ref ? ` id="${anchor(r.ref)}"` : ''}>${r.cells.map((c, i) =>
          `<td data-label="${h(block.headers[i])}">${renderCell(c)}</td>`).join('')}</tr>`).join('')
          : `<tr><td colspan="${block.headers.length}">None recorded.</td></tr>`}</tbody></table>`;
    }).join('\n');
  }
  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<meta http-equiv="Content-Security-Policy" content="default-src 'none'; script-src 'none'; style-src 'unsafe-inline'; img-src 'none'; connect-src 'none'; media-src 'none'; object-src 'none'; frame-src 'none'; base-uri 'none'; form-action 'none'">
<title>Coordination evidence report</title><style>${css}</style></head><body>
<a class="skip" href="#main">Skip to report</a><header><p>CORE · OFFLINE COORDINATION REPORT</p>
<h1>Coordination evidence report</h1>
${subjectHtml(view)}
<p class="status-strip">${h(statusLine(view))}</p>
<p class="stamp">Workspace ${h(view.workspace?.id)} · item ${h(view.item?.id)} · version ${h(view.item?.version)}<br>Through sequence ${h(view.throughSeq)} · generated <time datetime="${h(view.generatedAt)}">${h(view.generatedAt)}</time></p>
<p class="warning">${h(snapshotWarning)}</p>
<p class="stamp">${h(redactionNotice(view))}</p>
<nav aria-label="Report sections">${sections.map(s => `<a href="#${s.id}">${h(s.title)}</a>`).join('')}</nav></header>
<main id="main" tabindex="-1">${sections.map(s => `<section id="${s.id}" aria-labelledby="${s.id}-heading"><h2 id="${s.id}-heading">${h(s.title)}</h2>${blocksHtml(s.blocks)}</section>`).join('\n')}</main>
<footer><p>Derived private report. No authoritative state was changed by export. Artifact content is not embedded or executed.</p></footer></body></html>
`;
}

export function renderMarkdown(input) {
  const view = redactReport(input);
  const sections = sectionsFor(view);
  const cellText = value => value.refs ? value.refs.map(cellText).join('<br>') || 'None recorded'
    : generatedLink(value.href) ? `[${m(value.text)}](${value.href})` : m(value.text);
  function blocksMarkdown(blocks) {
    return blocks.map(block => {
      if (block.type === 'paragraph') return m(block.text);
      if (block.type === 'link') return generatedLink(block.href) ? `[${m(block.text)}](${block.href})` : m(block.text);
      if (block.type === 'pre') return `<pre>${h(block.text)}</pre>`;
      if (block.type === 'details') return `<details><summary>${h(block.title)}</summary>\n\n${blocksMarkdown(block.blocks)}\n\n</details>`;
      return `**${m(block.caption)}**\n\n| ${block.headers.map(m).join(' | ')} |\n| ${block.headers.map(() => '---').join(' | ')} |\n${
        block.rows.length ? block.rows.map(r => `| ${r.cells.map(cellText).join(' | ')} |`).join('\n')
          : `| None recorded ${block.headers.slice(1).map(() => '| ').join('')}|`}`;
    }).join('\n\n');
  }
  return `# Coordination evidence report\n\nSubject: ${m(view.item?.title)}\n\n${m(statusLine(view))}\n\nWorkspace ${m(view.workspace?.id)} · item ${m(view.item?.id)} · version ${m(view.item?.version)}\n\nThrough sequence ${m(view.throughSeq)} · generated ${m(view.generatedAt)}\n\n${m(snapshotWarning)}\n\n${m(redactionNotice(view))}\n\n${
    sections.map(s => `## ${m(s.title)}\n\n${blocksMarkdown(s.blocks)}`).join('\n\n')}\n`;
}

function statusLine(view) {
  const blockers = view.blockers?.length ?? 0;
  return `Recorded state: ${text(view.item?.state)} · Proof checks: ${view.integrity?.status ?? 'unavailable'} (not acceptance) · Blockers: ${blockers}${blockers ? ' — inspect required actions below.' : ' recorded; check pending criteria and gaps before acting.'}`;
}

function subjectHtml(view) {
  const full = text(view.item?.title);
  const chars = [...full];
  return `<p class="subject">Subject: ${h(chars.length > 140 ? `${chars.slice(0, 137).join('')}…` : full)}</p><details><summary>Full recorded subject</summary><p>${h(full)}</p></details>`;
}

function offlinePage(view, title, contents, links = []) {
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<meta http-equiv="Content-Security-Policy" content="default-src 'none'; script-src 'none'; style-src 'unsafe-inline'; img-src 'none'; connect-src 'none'; media-src 'none'; object-src 'none'; frame-src 'none'; base-uri 'none'; form-action 'none'">
<title>${h(title)}</title><style>${css}</style></head><body><a class="skip" href="#main">Skip to report</a>
<header><h1>${h(title)}</h1>${subjectHtml(view)}<p class="status-strip">${h(statusLine(view))}</p>
<p class="stamp">Workspace ${h(view.workspace?.id)} · item ${h(view.item?.id)} · through sequence ${h(view.throughSeq)} · generated ${h(view.generatedAt)}</p>
<p class="warning">${h(snapshotWarning)}</p><p>${h(redactionNotice(view))}</p>
<nav aria-label="Offline inspection">${links.filter(l => generatedLink(l.href)).map(l => `<a href="${h(l.href)}">${h(l.text)}</a>`).join(' ')}</nav></header>
<main id="main" tabindex="-1">${contents}</main></body></html>\n`;
}

export function renderCompanions(view, reportFile) {
  const paths = inspectionPaths(view);
  const back = {text: 'Back to captured report', href: reportFile};
  const messages = (view.inspection?.messagePages ?? []).map((page, i) => {
    const links = [back];
    if (i > 0) links.push({text: 'Newer messages', href: paths.histories[i - 1]});
    if (i < paths.histories.length - 1) links.push({text: 'Older messages', href: paths.histories[i + 1]});
    const bytes = offlinePage(view, 'Captured message history',
      `<p>Full retained message records, newest events first. Provenance: declared durable thread. Page ${i + 1} of ${paths.histories.length}. Missing records are gaps, not empty payloads.</p>` +
      page.map(entry => `<section id="${anchor(entry.ref)}"><h2>${h(entry.ref)} · event ${h(entry.eventSeq)}</h2><pre>${h(entry.gap ?? text(entry.record))}</pre></section>`).join(''), links);
    return {file: paths.histories[i], kind: 'messages', bytes};
  });
  const artifacts = (view.inspection?.artifactPreviews ?? []).map((preview, i) => {
    const content = preview.encoding === 'latin1' && preview.content !== null
      ? Buffer.from(preview.content, 'latin1').toString('hex').match(/.{1,64}/g)?.join('\n') ?? ''
      : preview.content;
    const bytes = offlinePage(view, 'Inert retained artifact preview', `<section><h2>Captured retained bytes</h2>
<p>Provenance: derived preview of declared artifact ${h(preview.ref)} · ${h(preview.status)}.</p>
<p>Source ${h(preview.path)} · retained ${h(preview.retainedPath)} · registered full-source SHA-256 ${h(preview.sourceDigest)} · verified retained size ${h(preview.sourceSize)} bytes. This is not a prefix or preview digest.</p>
<p>${h(artifactPreviewPolicy)}</p><p>${h(artifactPreviewNotice(preview))}</p>
<p>${h(preview.encoding === 'latin1' ? 'Hexadecimal representation of captured bytes only (redaction before encoding).' : 'Escaped UTF-8 of captured bytes only. Markup is text, never executed.')}</p>
<pre>${h(preview.gap ?? content ?? 'No preview embedded.')}</pre></section>`, [back]);
    return {file: paths.artifacts[i], kind: 'artifact-preview', bytes};
  });
  return [...messages, ...artifacts];
}

export function renderLanding(metadata) {
  return offlinePage(metadata.view, 'Coordination evidence report',
    '<section><h2>Stable offline entry point</h2><p>This landing selects the most recently exported complete generation, not live state. Older immutable snapshots are retained. Opening a captured report does not run evidence.</p></section>',
    [{text: 'Open captured report', href: metadata.html.file}])
    + `<!-- kai-current ${metadata.through_seq} ${metadata.html.digest} ${hash(JSON.stringify({...metadata, landing: undefined}))} -->\n`;
}
