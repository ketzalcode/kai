// Shared authoring contract for kai's agent/skill frontmatter.
//
// Single source of truth for what kai declares and requires of its own entries,
// not for how a Copilot host parses them; no file here can hold that authority.
// Host behaviour is measured by scripts/host-tool-probe.mjs. Both guards import
// this contract so they cannot drift from each other:
//   • validate-plugin.mjs — proves the shipped source obeys the contract;
//   • host-contract.mjs    — builds the expected discoverable inventory and
//     proves malformed kai frontmatter is rejected before release.
//
// Dependency-free (no imports) so any host/runner can load it.

// Kai's declared tool vocabulary is a lint heuristic, not a host allowlist.
// Whether a live host recognises a name is a separate, measured question.
export const SUPPORTED_TOOLS = new Set([
  // Documented primary aliases. Live 1.0.79 and 1.0.81 probes exercised these
  // capabilities in both direct and delegated custom-agent launches.
  'execute', 'read', 'edit', 'search', 'agent', 'web', 'todo',
  'ask_user',                                // operator interaction
  'skill',                                   // inherited skill loading
  'read_agent', 'write_agent',               // peer transport
  'web_search',                              // search-only web access
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

// The authoring contract for a single kai entry.
export function loaderErrors(kind, id, fm) {
  const out = [];

  const name = stripQuotes(fm.name);
  if (!name) out.push('frontmatter is missing `name`');
  else if (name !== id) out.push(`frontmatter name "${name}" must equal ${kind} id "${id}"`);

  if (!stripQuotes(fm.description)) out.push('frontmatter `description` is missing or empty');

  // Kai requires a non-empty explicit list so least privilege is declared
  // rather than inherited through the host's omission or wildcard semantics.
  if (fm.tools === undefined) {
    out.push('kai requires an explicit non-empty frontmatter `tools` array');
  } else if (!isInlineArray(fm.tools)) {
    out.push('frontmatter `tools` must be an inline array like [a, b]');
  } else if (isEmptyInlineArray(fm.tools)) {
    out.push('kai requires the frontmatter `tools` array to be non-empty');
  } else {
    for (const tool of parseToolList(fm.tools) || []) {
      if (!SUPPORTED_TOOLS.has(tool)) {
        out.push(`declares "${tool}", which is not in kai's tool vocabulary (SUPPORTED_TOOLS)`);
      }
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
