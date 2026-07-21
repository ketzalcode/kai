#!/usr/bin/env node
// Structural validator for the kai plugin. Guards the contract the plugin
// sells: every agent/skill has valid frontmatter, its declared `name` matches
// its path, and every cross-reference to another agent or skill resolves.
// Dependency-free (Node built-ins only) so CI runs it with no install step.
//
// Run: `node scripts/validate-plugin.mjs` (or `npm run validate`).
// Exit code 0 = contract valid; 1 = one or more violations printed.

import { readFileSync, readdirSync, existsSync, statSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const errors = [];
const err = (file, msg) => errors.push({ file, msg });

const rel = (p) => p.slice(ROOT.length + 1).replace(/\\/g, '/');

// ---------------------------------------------------------------------------
// Collect agents and skills
// ---------------------------------------------------------------------------
const agentsDir = join(ROOT, 'agents');
const skillsDir = join(ROOT, 'skills');

const agentFiles = readdirSync(agentsDir)
  .filter((f) => f.endsWith('.agent.md'))
  .map((f) => ({
    id: f.replace(/\.agent\.md$/, ''),
    kind: 'agent',
    path: join(agentsDir, f),
  }));

// Any non-.gitkeep, non-*.agent.md file under agents/ is a mistake.
for (const f of readdirSync(agentsDir)) {
  if (f === '.gitkeep' || f.endsWith('.agent.md')) continue;
  if (statSync(join(agentsDir, f)).isFile()) {
    err(`agents/${f}`, 'unexpected file in agents/ (expected <name>.agent.md)');
  }
}

const skillFiles = [];
for (const d of readdirSync(skillsDir)) {
  const dirPath = join(skillsDir, d);
  if (!statSync(dirPath).isDirectory()) continue;
  const skillPath = join(dirPath, 'SKILL.md');
  if (!existsSync(skillPath)) {
    err(`skills/${d}`, 'skill folder is missing SKILL.md');
    continue;
  }
  skillFiles.push({ id: d, kind: 'skill', path: skillPath });
}

const allFiles = [...agentFiles, ...skillFiles];
const agentIds = new Set(agentFiles.map((a) => a.id));
const skillIds = new Set(skillFiles.map((s) => s.id));

// ---------------------------------------------------------------------------
// Frontmatter checks
// ---------------------------------------------------------------------------
function parseFrontmatter(raw) {
  const lines = raw.split(/\r?\n/);
  if (lines[0] !== '---') return { ok: false, reason: 'file does not start with `---`' };
  let end = -1;
  for (let i = 1; i < lines.length; i++) {
    if (lines[i] === '---') { end = i; break; }
  }
  if (end === -1) return { ok: false, reason: 'no closing `---` for frontmatter' };
  const fm = {};
  for (const line of lines.slice(1, end)) {
    const m = line.match(/^([A-Za-z0-9_]+):\s?(.*)$/);
    if (m) fm[m[1]] = m[2];
  }
  return { ok: true, fm };
}

const stripQuotes = (s) => {
  const t = (s ?? '').trim();
  if ((t.startsWith('"') && t.endsWith('"')) || (t.startsWith("'") && t.endsWith("'"))) {
    return t.slice(1, -1);
  }
  return t;
};

for (const f of allFiles) {
  const raw = readFileSync(f.path, 'utf8');
  const pf = parseFrontmatter(raw);
  if (!pf.ok) { err(rel(f.path), `invalid frontmatter: ${pf.reason}`); continue; }
  const { fm } = pf;

  const name = stripQuotes(fm.name);
  if (!name) err(rel(f.path), 'frontmatter is missing `name`');
  else if (name !== f.id) {
    err(rel(f.path), `frontmatter name "${name}" must equal ${f.kind} id "${f.id}"`);
  }

  if (!stripQuotes(fm.description)) err(rel(f.path), 'frontmatter `description` is missing or empty');

  if (fm.tools === undefined) {
    err(rel(f.path), 'frontmatter is missing `tools`');
  } else {
    const t = fm.tools.trim();
    if (!(t.startsWith('[') && t.endsWith(']'))) {
      err(rel(f.path), 'frontmatter `tools` must be an inline array like [a, b]');
    } else if (t.replace(/[[\]\s]/g, '') === '') {
      err(rel(f.path), 'frontmatter `tools` array is empty');
    }
  }
}

// ---------------------------------------------------------------------------
// Cross-reference integrity
// ---------------------------------------------------------------------------
const refScanFiles = [
  ...allFiles.map((f) => f.path),
  join(ROOT, 'AGENTS.md'),
  join(ROOT, 'README.md'),
].filter(existsSync);

// Backtick tokens with an agent-role prefix are unambiguous agent references;
// no domain terms start with these prefixes.
const AGENT_REF = /`((?:principal|workflow|director|persona)-[a-z0-9-]+)`/g;
// A kai identifier is kebab-case with at least one hyphen (skill/agent shape).
const KEBAB = /^[a-z][a-z0-9]*(?:-[a-z0-9]+)+$/;

for (const p of refScanFiles) {
  const raw = readFileSync(p, 'utf8');
  const r = rel(p);

  for (const m of raw.matchAll(AGENT_REF)) {
    if (!agentIds.has(m[1])) err(r, `references unknown agent \`${m[1]}\``);
  }

  // A backticked kai-identifier that follows the verb "inherit(s)" on a line
  // must resolve to a real skill or agent (catches renamed/removed contracts).
  // Only tokens after the verb are checked, so lifecycle states like
  // `in-review` that merely share the line are not misread as references.
  for (const line of raw.split(/\r?\n/)) {
    const verb = line.match(/inherits?\b/i);
    if (!verb) continue;
    const after = verb.index + verb[0].length;
    for (const m of line.matchAll(/`([^`]+)`/g)) {
      if (m.index < after) continue;
      const tok = m[1];
      if (!KEBAB.test(tok)) continue;
      if (!skillIds.has(tok) && !agentIds.has(tok)) {
        err(r, `"inherit" line references unknown skill/agent \`${tok}\``);
      }
    }
  }
}

// ---------------------------------------------------------------------------
// plugin.json
// ---------------------------------------------------------------------------
const pjPath = join(ROOT, 'plugin.json');
if (!existsSync(pjPath)) {
  err('plugin.json', 'missing');
} else {
  let pj;
  try {
    pj = JSON.parse(readFileSync(pjPath, 'utf8'));
  } catch (e) {
    err('plugin.json', `invalid JSON: ${e.message}`);
  }
  if (pj) {
    for (const key of ['agents', 'skills']) {
      if (!pj[key]) err('plugin.json', `missing "${key}" path`);
      else if (!existsSync(join(ROOT, pj[key]))) {
        err('plugin.json', `"${key}" path "${pj[key]}" does not exist`);
      }
    }
  }
}

// ---------------------------------------------------------------------------
// Report
// ---------------------------------------------------------------------------
const counts = `${agentFiles.length} agents, ${skillFiles.length} skills`;
if (errors.length === 0) {
  console.log(`\u2713 kai plugin contract valid (${counts})`);
  process.exit(0);
}
console.error(`\u2717 kai plugin contract: ${errors.length} error(s) (${counts})\n`);
for (const e of errors) console.error(`  ${e.file}: ${e.msg}`);
process.exit(1);
