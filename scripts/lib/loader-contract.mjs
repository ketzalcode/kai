// Shared host-loader contract for the kai plugin.
//
// This is the single source of truth for how a Copilot host parses and accepts
// an agent/skill's frontmatter. Both guards import it so they can never drift:
//   • validate-plugin.mjs — proves the shipped source obeys the contract;
//   • host-contract.mjs    — mirrors the host loader to build the discoverable
//     inventory and prove malformed frontmatter is rejected before release.
//
// Dependency-free (no imports) so any host/runner can load it.

// Every declared tool must be a name the Copilot host actually exposes. Adding a
// genuinely new host tool is a deliberate edit here; a typo or an unsupported
// generic alias (read / search / write) is caught before release.
export const SUPPORTED_TOOLS = new Set([
  'view', 'create', 'edit', 'grep', 'glob', // files & content
  // Shell. `bash` does NOT map per-OS: on Windows the host silently drops it
  // and grants no shell at all, while `shell` resolves to the platform's
  // terminal (measured -- an agent declaring only `bash` got view/skill/sql and
  // no way to run anything). Declaring both is the portable form, and an
  // unrecognised name costs nothing because the host ignores it.
  'bash', 'shell',
  'ask_user',                                // operator interaction
  'task', 'read_agent', 'write_agent',       // sub-agents / peer transport
  'web_fetch', 'web_search',                 // web
  'session_store_sql',                       // session store
  'playwright',                              // browser MCP
]);

// Skill-only affordances — their presence on an agent signals a copy-paste error.
export const SKILL_ONLY_KEYS = ['argument-hint', 'user-invocable', 'allowed-tools'];

export function parseFrontmatter(raw) {
  const lines = raw.split(/\r?\n/);
  if (lines[0] !== '---') return { ok: false, reason: 'file does not start with `---`' };
  let end = -1;
  for (let i = 1; i < lines.length; i++) {
    if (lines[i] === '---') { end = i; break; }
  }
  if (end === -1) return { ok: false, reason: 'no closing `---` for frontmatter' };
  const fm = {};
  for (const line of lines.slice(1, end)) {
    const m = line.match(/^([A-Za-z0-9_-]+):\s?(.*)$/);
    if (m) fm[m[1]] = m[2];
  }
  return { ok: true, fm };
}

export const stripQuotes = (s) => {
  const t = (s ?? '').trim();
  if ((t.startsWith('"') && t.endsWith('"')) || (t.startsWith("'") && t.endsWith("'"))) {
    return t.slice(1, -1);
  }
  return t;
};

const isInlineArray = (v) => {
  const t = (v ?? '').trim();
  return t.startsWith('[') && t.endsWith(']');
};
const isEmptyInlineArray = (v) => (v ?? '').replace(/[[\]\s]/g, '') === '';
// A scalar frontmatter value must not begin an inline array. Checking only the
// leading `[` catches YAML-valid variants a strict `[...]` match would miss,
// e.g. `[foo] # comment` or a multiline flow array — all rejected by the host.
const startsInlineArray = (v) => (v ?? '').trim().startsWith('[');

export function parseToolList(rawTools) {
  const t = (rawTools ?? '').trim();
  if (!(t.startsWith('[') && t.endsWith(']'))) return null;
  return t.slice(1, -1).split(',').map((x) => stripQuotes(x)).filter(Boolean);
}

// The loader contract for a single entry. Returns the list of violation messages
// the host would reject the entry for (empty = the host loads it cleanly).
export function loaderErrors(kind, id, fm) {
  const out = [];

  const name = stripQuotes(fm.name);
  if (!name) out.push('frontmatter is missing `name`');
  else if (name !== id) out.push(`frontmatter name "${name}" must equal ${kind} id "${id}"`);

  if (!stripQuotes(fm.description)) out.push('frontmatter `description` is missing or empty');

  // tools: required on every agent and skill, a non-empty inline array of names
  // the host exposes.
  if (fm.tools === undefined) {
    out.push('frontmatter is missing `tools`');
  } else if (!isInlineArray(fm.tools)) {
    out.push('frontmatter `tools` must be an inline array like [a, b]');
  } else if (isEmptyInlineArray(fm.tools)) {
    out.push('frontmatter `tools` array is empty');
  } else {
    for (const tool of parseToolList(fm.tools) || []) {
      if (!SUPPORTED_TOOLS.has(tool)) out.push(`declares unsupported tool "${tool}" (not in the host allowlist)`);
    }
  }

  // argument-hint is a user-invocation affordance (skills). It must be a single
  // quoted/plain scalar — an inline array is silently rejected by the Copilot
  // CLI host when it loads the skill.
  if (fm['argument-hint'] !== undefined) {
    if (startsInlineArray(fm['argument-hint'])) {
      out.push('frontmatter `argument-hint` must be a quoted scalar string, not an inline array');
    } else if (!stripQuotes(fm['argument-hint'])) {
      out.push('frontmatter `argument-hint` is present but empty');
    }
  }

  // user-invocable, when present, must be a boolean literal.
  if (fm['user-invocable'] !== undefined) {
    const uv = fm['user-invocable'].trim();
    if (uv !== 'true' && uv !== 'false') out.push('frontmatter `user-invocable` must be `true` or `false`');
  }

  // Schema separation: the skill-only affordances are invalid on an agent.
  if (kind === 'agent') {
    for (const k of SKILL_ONLY_KEYS) {
      if (fm[k] !== undefined) out.push(`frontmatter key \`${k}\` is skill-only and not valid on an agent`);
    }
  }

  return out;
}

// True when a skill is exposed as a user-invocable affordance by the host.
export const isUserInvocable = (fm) => (fm['user-invocable'] ?? '').trim() === 'true';
