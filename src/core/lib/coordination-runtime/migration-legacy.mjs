import {basename} from 'node:path';
import {
  frontmatter, scalar, listBlock, mapListBlock, lease, isNull, parseThread, parseStamp, TERMINAL,
} from '../coordination.mjs';
import {validateRecord} from './contract.mjs';
import {hash, fileFingerprint, safePath, fail} from './migration-files.mjs';
import {existsSync} from 'node:fs';

const nullable = v => isNull(v) ? null : v;
const METADATA_LIMIT = 64 * 1024;
const retired = role => /^(product-|gtm-|personal-|kai-product-|kai-go-to-market-)/.test(role ?? '');
export const roleKnown = (role, roles) => role === 'operator' || (!retired(role) && roles.includes(role));
function block(lines, key) {
  const start = lines.findIndex(l => l.startsWith(`${key}:`));
  if (start < 0) return [];
  const out = [];
  for (const line of lines.slice(start + 1)) { if (/^\S/.test(line)) break; out.push(line); }
  return out;
}
function section(text, heading) {
  return new RegExp(`(?:^|\\n)## ${heading}\\s*\\r?\\n([\\s\\S]*?)(?=\\n## |$)`).exec(text)?.[1].trim();
}
function timestamp(value) {
  const parsed = parseStamp(value);
  return parsed === null ? null : new Date(parsed).toISOString();
}
function scalarShape(raw, {emptyList = false} = {}) {
  const value = raw.trim();
  if (emptyList && value === '[]') return true;
  if (!value || value === '~') return false;
  if (/^"[^"\r\n]*"$|^'[^'\r\n]*'$/.test(value)) return true;
  return !/^[\[\]{}|>&*!?#"'%-]|:\s|[\r\n\t]/.test(value);
}
function collection(lines, key, issues, {keys = null, emptyLists = []} = {}) {
  const head = lines.find(l => l.startsWith(`${key}:`));
  const body = block(lines, key).filter(l => l.trim() && !/^\s*#/.test(l));
  if (!head || !new RegExp(`^${key}:\\s*(\\[\\])?\\s*$`).test(head)
    || (scalar(lines, key) === '[]' && body.length) || (scalar(lines, key) === '' && !body.length)) {
    issues.push(`unsupported or indeterminate ${key} collection shape`);
    return [];
  }
  let valid = true, current = null;
  const complete = () => { if (current && keys.some(k => !current.has(k))) valid = false; };
  for (const line of body) {
    if (!keys) {
      const value = /^ {2}- (.+)$/.exec(line)?.[1];
      if (!value || !scalarShape(value)) valid = false;
      continue;
    }
    const start = /^ {2}- ([a-z_]+):\s?(.*)$/.exec(line);
    const continuation = /^ {4}([a-z_]+):\s?(.*)$/.exec(line);
    if (start) {
      complete(); current = new Set();
      if (start[1] !== keys[0]) valid = false;
    }
    const entry = start ?? continuation;
    if (!entry || !current || !keys.includes(entry[1]) || current.has(entry[1])
      || !scalarShape(entry[2], {emptyList: emptyLists.includes(entry[1])})) {
      valid = false;
    }
    if (entry && current) current.add(entry[1]);
  }
  complete();
  if (!valid) {
    issues.push(`malformed, partial or nested ${key} collection`);
    return [];
  }
  return keys ? mapListBlock(lines, key) : listBlock(lines, key);
}
function headerMetadata(lines, kind, issues) {
  const fields = {};
  const declarations = new Map();
  for (const line of lines) {
    const match = /^([a-z_]+):/.exec(line);
    if (!match) {
      if (/^\S/.test(line)) issues.push('unsupported or malformed top-level metadata');
      continue;
    }
    const key = match[1];
    const values = declarations.get(key) ?? [];
    if (values.length) issues.push(`ambiguous duplicate field ${key}`);
    values.push(scalar([line], key));
    declarations.set(key, values);
    fields[key] = values[0];
  }
  let identityUnresolved = ['id', 'slug'].some(key => (declarations.get(key)?.length ?? 0) > 1);
  if (kind === 'initiative' && fields.id && fields.slug && fields.id !== fields.slug) {
    issues.push('ambiguous id versus declared slug');
    identityUnresolved = true;
  }
  const lifecycle = ['state', 'status'].flatMap(key => declarations.get(key) ?? []);
  const lifecycleAmbiguous = new Set(lifecycle).size > 1
    || ['state', 'status'].some(key => (declarations.get(key)?.length ?? 0) > 1);
  const declaredState = fields[kind === 'initiative' ? 'status' : 'state'] ?? null;
  if (lifecycleAmbiguous) issues.push('ambiguous or conflicting lifecycle declarations');
  if (declaredState === null || isNull(declaredState)) issues.push(`missing explicit ${kind} lifecycle`);
  return {fields, declaredState, producerRun: fields.producer_run ?? null,
    updated: fields.updated ?? fields.updated_at ?? null, metadataSupported: issues.length === 0,
    identityUnresolved, lifecycleAmbiguous,
    terminalHistory: lifecycle.some(state => TERMINAL.has(state) || state === 'archived')};
}
function parseSource(root, entry, roles) {
  const candidate = /\.md$/i.test(entry.path);
  const file = candidate ? fileFingerprint(root, entry.path, {prefixBytes: METADATA_LIMIT}) : null;
  if (file && (file.digest !== entry.digest || file.size !== entry.size)) fail('RECOVERY_REQUIRED', 'legacy source changed during parsing');
  const text = file?.prefix.toString('utf8') ?? '';
  const invalidEncoding = file && !file.prefix.equals(Buffer.from(text));
  // Full-line YAML comments are trivia for both validation and shared consumers.
  // Exact source spelling, including comments, remains in the external backup.
  const fm = frontmatter(text)?.filter(line => !/^\s*#/.test(line)) ?? null;
  const archivedItem = entry.path.startsWith('.kai/archive/') && fm
    && (scalar(fm, 'type') === 'work-item' || (scalar(fm, 'id') && scalar(fm, 'initiative') && scalar(fm, 'state') && scalar(fm, 'version')));
  const kind = (entry.path.startsWith('.kai/state/items/') && !/\/README\.md$/i.test(entry.path)) || archivedItem ? 'item'
    : entry.path.startsWith('.kai/state/threads/') && !/\/README\.md$/i.test(entry.path) ? 'thread'
      : /\/initiative\.md$/.test(entry.path) || (/\/northstar\.md$/.test(entry.path) && fm) ? 'initiative'
        : /backlog\.md$/.test(entry.path) ? 'backlog'
          : fm && scalar(fm, 'asset_id') ? 'asset' : 'archive';
  const source = {sourceId: hash(entry.path), path: entry.path, digest: entry.digest,
    kind, declaredId: fm ? nullable(scalar(fm, kind === 'asset' ? 'asset_id' : 'id'))
      ?? (kind === 'initiative' ? nullable(scalar(fm, 'slug')) : null) : null, size: entry.size,
    parsed: {}, issues: [], status: 'archived', version: 1, record: null};
  if (fm && !invalidEncoding && ['item', 'initiative'].includes(kind)) {
    source.parsed = headerMetadata(fm, kind, source.issues);
  }
  if (candidate && (entry.size > METADATA_LIMIT || invalidEncoding)
    && (kind !== 'archive' || text.startsWith('---'))) {
    source.status = 'quarantined';
    source.issues.push('unsupported encoding or oversized coordination metadata; 64 KiB limit, exact bytes retained externally');
    // An incomplete header cannot establish an identity. Never derive one from a filename.
    if (!fm || invalidEncoding) {
      source.declaredId = null;
      source.parsed.identityUnresolved = true;
    }
    else if (!source.parsed.fields) source.parsed = {declaredState: scalar(fm, 'state') ?? scalar(fm, 'status') ?? null,
      fields: Object.fromEntries(fm.filter(l => /^[a-z_]+:/.test(l)).map(l => {
        const key = l.slice(0, l.indexOf(':')); return [key, scalar(fm, key)];
      }))};
    source.parsed.metadataSupported = false;
    return source;
  }
  if (kind === 'thread') {
    const thread = parseThread(text);
    source.parsed = {...thread, messages: thread.messages.map(m => ({...m, senderRun: m.fields.sender_run ?? null}))};
    source.declaredId = fm ? nullable(scalar(fm, 'id')) : null;
    source.parsed.itemId = fm ? nullable(scalar(fm, 'item_id')) ?? basename(entry.path, '.md') : basename(entry.path, '.md');
    source.issues.push(...thread.diagnostics.map(d => `${d.type}: ${d.message}`));
    // Legacy packets are preserved, never installed as authenticated runtime messages.
    if (thread.messages.length) source.issues.push('legacy thread requires explicit revalidation; roles alone do not prove run identity or current answers');
    if (/\b(?:QUESTION|ANSWER|HANDOFF)\b/.test(text) && !thread.messages.length) source.issues.push('unparsed legacy thread packet');
    if (source.issues.length) source.status = 'quarantined';
    return source;
  }
  if (!['item', 'initiative'].includes(kind)) {
    source.parsed = {declaredState: fm ? scalar(fm, 'state') ?? scalar(fm, 'status') ?? null : null};
    if (kind === 'asset') {
      source.declaredId = nullable(scalar(fm, 'asset_id'));
      source.parsed.metadata = Object.fromEntries(fm.filter(l => /^[a-z_]+:/.test(l)).map(l => {
        const key = l.slice(0, l.indexOf(':')); return [key, scalar(fm, key)];
      }));
      source.issues.push('legacy asset validity/acceptance is historical and requires fresh runtime evidence');
      source.status = 'quarantined';
    }
    if (kind === 'backlog') {
      source.parsed.entries = text.split(/\r?\n/).filter(l => /^\|/.test(l)).map(l => l.split('|').slice(1, -1).map(s => s.trim()))
        .filter(c => c.length >= 3 && c[0] && !/^(id|[-: ]+)$/i.test(c[0]))
        .map(c => ({id: c[0], title: c[1], status: c[2], rawCells: c}));
    }
    return source;
  }
  source.status = 'quarantined';
  if (!fm) {
    source.parsed = {identityUnresolved: true, metadataSupported: false};
    source.issues.push('malformed frontmatter');
    return source;
  }
  const {fields} = source.parsed;
  const seen = new Set(Object.keys(fields));
  if (kind === 'initiative') {
    source.declaredId ??= nullable(fields.slug);
    source.parsed.milestones = block(fm, 'milestones');
  }
  if (!source.declaredId) source.issues.push('missing declared original ID');
  const declaredLease = lease(fm);
  if ((!isNull(fields.lease) && fields.lease !== '') || !isNull(declaredLease.holder)
    || !isNull(declaredLease.token) || /^(in-progress|deploying|production-verification)$/.test(fields.state ?? '')) {
    fail('RECOVERY_REQUIRED', `offline migration refuses active or unreconciled work: ${entry.path}`);
  }
  for (const key of ['owner', 'scope_authority', 'completion_authority', 'next_role', 'validity_owner']) {
    if (!isNull(fields[key]) && !roleKnown(fields[key], roles)) source.issues.push(`unresolved or retired ${key}: ${fields[key]}`);
  }
  if (kind === 'item' && TERMINAL.has(fields.state)) source.issues.push('historical terminal acceptance is unverifiable; retain lifecycle without reopening it');
  if (archivedItem) source.issues.push('archived work identity/version is historical, never new dispatchable work');
  if (kind === 'initiative' && ['completed', 'shipped', 'archived', 'dropped'].includes(fields.status)) {
    source.issues.push('historical terminal initiative closure is unverified');
  }
  if (kind === 'item' && fields.state !== 'proposed') source.issues.push('legacy advancement needs explicit scope revalidation; no current approval imported');
  const requireField = key => { if (!seen.has(key)) source.issues.push(`missing explicit ${key}`); };
  const checkedCollection = (lines, key, options) => {
    const issues = [];
    const value = collection(lines, key, issues, options);
    if (issues.length) source.parsed.metadataSupported = false;
    source.issues.push(...issues);
    return value;
  };
  const list = key => checkedCollection(fm, key);
  const mapList = (key, keys, emptyLists = []) => checkedCollection(fm, key, {keys, emptyLists});
  const collections = new Set(kind === 'item'
    ? ['acceptance', 'artifact_targets', 'context_artifacts', 'touches', 'depends_on', 'waiting_on_questions', 'review_requirements', 'completed_reviews']
    : ['scope', 'milestones', 'backlog']);
  for (const key of seen) {
    if (!collections.has(key) && block(fm, key).some(l => l.trim() && !/^\s*#/.test(l))) {
      source.issues.push(`unsupported nested ${key} metadata`);
      source.parsed.metadataSupported = false;
    }
  }
  let body;
  if (kind === 'item') {
    for (const key of ['owner', 'scope_authority', 'completion_authority', 'lease', 'change_ref', 'required_for_milestone', 'depends_on', 'review_requirements', 'completed_reviews']) requireField(key);
    const reviews = mapList('review_requirements', ['role', 'kind']);
    source.parsed.completedReviews = mapList('completed_reviews', ['role', 'kind', 'evidence', 'verdict', 'timestamp', 'change_ref']);
    if (source.parsed.completedReviews.length) source.issues.push('historical reviews retained, not current acceptance');
    const dependencies = mapList('depends_on', ['item', 'requires']);
    if (fields.review_requirements !== '' && fields.review_requirements !== '[]') source.issues.push('unsupported review requirements');
    reviews.forEach(r => { if (!roleKnown(r.role, roles)) source.issues.push(`unavailable reviewer ${r.role}`); });
    if (!isNull(fields.change_ref)) source.issues.push('legacy revision needs explicit artifact registration');
    if (!['true', 'false', 'yes', 'no'].includes(fields.required_for_milestone)) source.issues.push('unknown milestone requirement');
    body = {
      schema_version: 1, id: source.declaredId, title: fields.title, initiative: fields.initiative,
      delivery_class: fields.delivery_class, state: fields.state, resume_state: null,
      scope_authority: fields.scope_authority, completion_authority: fields.completion_authority,
      producer_actor: null, producing_actors: [], acceptance_actor: null, priority: Number(fields.priority),
      next_role: nullable(fields.next_role), outcome: fields.outcome ?? section(text, 'Outcome'),
      acceptance: seen.has('acceptance') ? list('acceptance')
        : section(text, 'Acceptance')?.split(/\r?\n/).map(l => /^- \[[ x]\] (.+)$/.exec(l)?.[1]) ?? [],
      artifact_expectation: fields.artifact_expectation, artifact_expectation_reason: nullable(fields.artifact_expectation_reason),
      artifact_class: nullable(fields.artifact_class), durability: nullable(fields.durability),
      validity_owner: nullable(fields.validity_owner), artifact_targets: list('artifact_targets'),
      context_artifacts: list('context_artifacts'), touches: list('touches'), depends_on: dependencies,
      lease: null, recovery_hold: null, waiting_on_questions: list('waiting_on_questions'),
      required_for_milestone: ['true', 'yes'].includes(fields.required_for_milestone),
      review_requirements: reviews, change_ref: null, updated_at: timestamp(fields.updated_at ?? fields.updated),
    };
    if (body.waiting_on_questions.length) source.issues.push('unresolved legacy blocking questions');
    if (fields.producer_run || fields.producer_actor || fields.producing_actors) source.issues.push('declared production history needs explicit revalidation');
    for (const path of [...body.context_artifacts, ...body.artifact_targets]) {
      try {
        if (path.startsWith('project:')) { source.issues.push(`project artifact requires explicit revalidation: ${path}`); continue; }
        if (!existsSync(safePath(root, path))) source.issues.push(`missing artifact: ${path}`);
      } catch { source.issues.push(`unsafe artifact: ${path}`); }
    }
  } else {
    const milestones = mapList('milestones', ['id', 'title', 'delivery_class', 'required_items', 'status'], ['required_items']).map(m => ({
      id: m.id, title: m.title, delivery_class: m.delivery_class,
      required_items: m.required_items === '[]' ? [] : null, status: m.status,
    }));
    const backlog = mapList('backlog', ['id', 'title', 'status', 'item_id', 'reason']).map(b => ({
      id: b.id, title: b.title, status: b.status, item_id: nullable(b.item_id), reason: nullable(b.reason),
    }));
    source.parsed.terminalMilestones = milestones.some(m => TERMINAL.has(m.status));
    if (source.parsed.terminalMilestones) source.issues.push('historical terminal milestone closure is unverified');
    const scopeBlock = block(fm, 'scope');
    let scopeCurrent;
    if (scopeBlock.some(l => /^ {2}current:/.test(l))) {
      const nested = scopeBlock.map(l => l.slice(2));
      if (fields.scope !== '' || scopeBlock.some(l => l.trim() && !l.startsWith('  '))
        || nested.filter(l => /^\S/.test(l) && !/^#/.test(l)).length !== 1) {
        source.issues.push('unsupported scope mapping'); source.parsed.metadataSupported = false;
      }
      const issues = [];
      scopeCurrent = collection(nested, 'current', issues);
      if (issues.length) source.parsed.metadataSupported = false;
      source.issues.push(...issues.map(i => `scope: ${i}`));
    } else scopeCurrent = list('scope');
    body = {schema_version: 1, id: source.declaredId, title: fields.title, status: fields.status,
      owner: fields.owner, scope: {current: scopeCurrent}, milestones, backlog,
      north_star_ref: fields.north_star_ref ?? entry.path, updated_at: timestamp(fields.updated_at ?? fields.updated)};
    try { if (!existsSync(safePath(root, body.north_star_ref))) source.issues.push('missing north star'); }
    catch { source.issues.push('unsafe north star'); }
  }
  const version = kind === 'item' ? Number(fields.version) : Number(fields.version ?? 1);
  try {
    source.record = validateRecord({kind, id: source.declaredId, itemId: kind === 'item' ? source.declaredId : null, version, body});
  } catch (error) { source.issues.push(error.message); source.record = null; }
  if (!source.issues.length) source.status = 'converted';
  return source;
}

export function parseLegacySources(root, files, roles) {
  const sources = files.map(entry => parseSource(root, entry, roles));
  const identities = new Map();
  for (const source of sources) {
    if (!source.declaredId || !['item', 'initiative'].includes(source.kind)) continue;
    const key = `${source.kind}/${source.declaredId}`;
    const group = identities.get(key) ?? [];
    group.push(source); identities.set(key, group);
  }
  for (const group of identities.values()) {
    if (group.length > 1) group.forEach(s => { s.issues.push('ambiguous duplicate declared ID'); s.status = 'quarantined'; });
  }
  for (const source of sources.filter(s => s.kind === 'item')) {
    if (sources.some(s => s.kind === 'thread' && s.parsed.itemId === source.declaredId && s.issues.length)) {
      source.issues.push('legacy thread has unresolved authority/history'); source.status = 'quarantined';
    }
  }
  let changed;
  do {
    changed = false;
    const safe = new Map(sources.filter(s => s.status === 'converted').map(s => [`${s.kind}/${s.declaredId}`, s]));
    for (const s of safe.values()) {
      if (s.kind === 'initiative') {
        const references = [...s.record.body.milestones.flatMap(m => m.required_items),
          ...s.record.body.backlog.map(b => b.item_id).filter(Boolean)];
        if (references.some(id => !safe.has(`item/${id}`))) {
          s.issues.push('unresolved milestone/backlog item reference'); s.status = 'quarantined'; changed = true;
        }
      }
      if (s.kind !== 'item') continue;
      const body = s.record.body;
      if (!safe.has(`initiative/${body.initiative}`) || body.depends_on.some(d => !safe.has(`item/${d.item}`))) {
        s.issues.push('unresolved initiative or dependency'); s.status = 'quarantined'; changed = true;
      }
      const visiting = new Set();
      const visit = id => {
        if (visiting.has(id)) return true;
        visiting.add(id);
        const cycle = (safe.get(`item/${id}`)?.record.body.depends_on ?? []).some(d => visit(d.item));
        visiting.delete(id); return cycle;
      };
      if (visit(s.declaredId)) { s.issues.push('dependency cycle'); s.status = 'quarantined'; changed = true; }
    }
  } while (changed);
  return sources;
}
