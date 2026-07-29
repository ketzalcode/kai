#!/usr/bin/env node
// Contract validator for the kai plugin. Guards what the plugin sells:
//   • structure — frontmatter, name==path, SKILL.md presence, resolvable
//     agent/skill and `inherit` references, and plugin.json paths;
//   • release hygiene — plugin.json and package.json declare the same version;
//   • host-tool allowlist — every declared `tools:` entry is a real host tool;
//   • workspace-contract consistency — the managed .gitignore block, the
//     .kai/runs areas, initiative artifact directories, and the library/<type>
//     set stay in sync across the manifest schema and scaffolds;
//   • fixtures — the sample repository-mode manifest matches the schema.
// Dependency-free (Node built-ins only) so CI runs it with no install step.
//
// Run: `node scripts/validate-plugin.mjs` (or `npm run validate`).
// Exit code 0 = contract valid; 1 = one or more violations printed.

import { readFileSync, readdirSync, existsSync, statSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  parseFrontmatter, stripQuotes, loaderErrors,
} from './lib/loader-contract.mjs';

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
// Frontmatter + host-loader contract (shared with host-contract.mjs)
// ---------------------------------------------------------------------------
for (const f of allFiles) {
  const raw = readFileSync(f.path, 'utf8');
  const pf = parseFrontmatter(raw);
  if (!pf.ok) { err(rel(f.path), `invalid frontmatter: ${pf.reason}`); continue; }
  f.fm = pf.fm;
  for (const msg of loaderErrors(f.kind, f.id, f.fm)) err(rel(f.path), msg);
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
    // plugin.json and package.json must carry the same version — a release
    // bumps both together (see AGENTS.md -> "Releasing this plugin").
    const pkgPath = join(ROOT, 'package.json');
    if (existsSync(pkgPath)) {
      let pkg;
      try { pkg = JSON.parse(readFileSync(pkgPath, 'utf8')); }
      catch (e) { err('package.json', `invalid JSON: ${e.message}`); }
      if (pkg) {
        if (!pj.version) err('plugin.json', 'missing "version"');
        if (!pkg.version) err('package.json', 'missing "version"');
        if (pj.version && pkg.version && pj.version !== pkg.version) {
          err('plugin.json', `version "${pj.version}" must equal package.json version "${pkg.version}" (bump both together on release)`);
        }
      }
    }
  }
}

// ---------------------------------------------------------------------------
// Host-tool allowlist is enforced per entry by `loaderErrors` (shared contract).
// Adding a genuinely new host tool is a deliberate edit to SUPPORTED_TOOLS in
// scripts/lib/loader-contract.mjs.
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// Contract consistency — the workspace contract is described in several files
// that must not drift apart. Structural checks stay green when, say, a new run
// area is added to the manifest but forgotten in a scaffold; these catch it.
// ---------------------------------------------------------------------------
const readIf = (p) => (existsSync(p) ? readFileSync(p, 'utf8') : null);
const conventions = readIf(join(ROOT, 'skills/workspace-conventions/SKILL.md'));
const onboarding = readIf(join(ROOT, 'skills/workspace-onboarding/SKILL.md'));
const wsInit = readIf(join(ROOT, 'agents/workflow-workspace-init.agent.md'));
const initiativeInit = readIf(join(ROOT, 'agents/workflow-initiative-init.agent.md'));
const gitignore = readIf(join(ROOT, '.gitignore'));

const toSet = (arr) => new Set(arr);
const setEq = (a, b) => a && b && a.size === b.size && [...a].every((x) => b.has(x));
const dirTokens = (s) => toSet([...s.matchAll(/([a-z][a-z0-9-]*)\//g)].map((m) => m[1]).filter((d) => d !== 'library' && d !== 'runs'));

// 1. The managed .gitignore block installed by onboarding must be byte-identical
//    to the one committed in the repo .gitignore.
function managedBlock(text) {
  if (!text) return null;
  const start = text.indexOf('# >>> kai workspace');
  const endMarker = text.indexOf('# <<< kai workspace');
  if (start === -1 || endMarker === -1) return null;
  const endLine = text.indexOf('\n', endMarker);
  const block = text.slice(start, endLine === -1 ? text.length : endLine);
  return block.split(/\r?\n/).map((l) => l.replace(/\s+$/, '')).join('\n');
}
const giBlock = managedBlock(gitignore);
const obBlock = managedBlock(onboarding);
if (giBlock === null) err('.gitignore', 'missing the managed "# >>> kai workspace" block');
if (obBlock === null) err('skills/workspace-onboarding/SKILL.md', 'missing the managed gitignore block template');
if (giBlock && obBlock && giBlock !== obBlock) {
  err('.gitignore', 'managed gitignore block differs from the workspace-onboarding template (they must stay identical)');
}

// 2. The .kai/runs areas must match across the manifest schema and the two
//    scaffolds that create the run directories.
const mAreasM = conventions && conventions.match(/"areas":\s*\[([^\]]*)\]/);
const mAreas = mAreasM ? toSet(mAreasM[1].split(',').map((x) => stripQuotes(x)).filter(Boolean)) : null;
const obAreasM = onboarding && onboarding.match(/\n\s*(qa\/[^\n]*)\n/);
const obAreas = obAreasM ? dirTokens(obAreasM[1]) : null;
const wiAreasM = wsInit && wsInit.match(/runs\/\{([^}]*)\}/s);
const wiAreas = wiAreasM ? dirTokens(wiAreasM[1]) : null;
if (!mAreas) err('skills/workspace-conventions/SKILL.md', 'could not locate the manifest "areas" list');
if (!obAreas) err('skills/workspace-onboarding/SKILL.md', 'could not locate the runs/ area scaffold');
if (!wiAreas) err('agents/workflow-workspace-init.agent.md', 'could not locate the runs/ area scaffold');
if (mAreas && obAreas && !setEq(mAreas, obAreas)) {
  err('skills/workspace-onboarding/SKILL.md', `runs/ areas ${JSON.stringify([...obAreas].sort())} differ from manifest areas ${JSON.stringify([...mAreas].sort())}`);
}
if (mAreas && wiAreas && !setEq(mAreas, wiAreas)) {
  err('agents/workflow-workspace-init.agent.md', `runs/ areas ${JSON.stringify([...wiAreas].sort())} differ from manifest areas ${JSON.stringify([...mAreas].sort())}`);
}

// 2b. Every concrete `.kai/runs/<area>/` literal in a shipped agent or skill must
//     resolve to a registered run area. Placeholder segments like
//     `.kai/runs/<area>/` never match — the capture requires a lowercase letter,
//     not `<` — so only real, hard-coded area names are checked. The trailing
//     lookahead accepts a path separator or any word boundary (backtick, quote,
//     whitespace, punctuation, end), so `.kai/runs/self-check` without a trailing
//     slash is still caught. This flags an agent inventing an unregistered area.
if (mAreas) {
  const AREA_LITERAL = /\.kai[/\\]runs[/\\]([a-z][a-z0-9-]+)(?=[/\\`'"\s.,;:)\]]|$)/g;
  for (const f of allFiles) {
    const raw = readFileSync(f.path, 'utf8');
    const seen = new Set();
    for (const m of raw.matchAll(AREA_LITERAL)) {
      if (mAreas.has(m[1]) || seen.has(m[1])) continue;
      seen.add(m[1]);
      err(rel(f.path), `references unregistered run area \`.kai/runs/${m[1]}/\` (add it to the manifest areas list or use a registered area)`);
    }
  }
}

// 3. The library/<type>/ set must match across the conventions "Library types"
//    table and the two library scaffolds.
function libTypesFromTable(text) {
  if (!text) return null;
  const start = text.indexOf('### Library types');
  if (start === -1) return null;
  const rest = text.slice(start + 1);
  const nextHeading = rest.search(/\n#{2,3} /);
  const section = nextHeading === -1 ? rest : rest.slice(0, nextHeading);
  return toSet([...section.matchAll(/`library\/([a-z0-9-]+)\/`/g)].map((m) => m[1]));
}
const obLibM = onboarding && onboarding.match(/\nlibrary\/\r?\n([\s\S]*?)\r?\npersonal\//);
const obLib = obLibM ? dirTokens(obLibM[1]) : null;
const wiLibM = wsInit && wsInit.match(/library\/\{([^}]*)\}/s);
const wiLib = wiLibM ? dirTokens(wiLibM[1]) : null;
const tableLib = libTypesFromTable(conventions);
if (!tableLib) err('skills/workspace-conventions/SKILL.md', 'could not locate the "Library types" table');
if (tableLib && !obLib) err('skills/workspace-onboarding/SKILL.md', 'could not locate the library/ scaffold');
if (tableLib && !wiLib) err('agents/workflow-workspace-init.agent.md', 'could not locate the library/ scaffold');
if (tableLib && obLib && !setEq(tableLib, obLib)) {
  err('skills/workspace-onboarding/SKILL.md', `library/ types ${JSON.stringify([...obLib].sort())} differ from the conventions Library types table ${JSON.stringify([...tableLib].sort())}`);
}
if (tableLib && wiLib && !setEq(tableLib, wiLib)) {
  err('agents/workflow-workspace-init.agent.md', `library/ types ${JSON.stringify([...wiLib].sort())} differ from the conventions Library types table ${JSON.stringify([...tableLib].sort())}`);
}

// 4. Initiative artifact directories must match between the canonical workspace
//    tree and the bounded workflow that creates an initiative.
const conventionArtifactsM = conventions && conventions.match(/artifacts\/\r?\n([\s\S]*?)\r?\n├─ library\//);
const conventionArtifacts = conventionArtifactsM ? dirTokens(conventionArtifactsM[1]) : null;
const wiArtifactsM = initiativeInit && initiativeInit.match(/initiatives\/<slug>\/artifacts\/\r?\n([\s\S]*?)\r?\ncoordination\//);
const wiArtifacts = wiArtifactsM ? dirTokens(wiArtifactsM[1]) : null;
if (!conventionArtifacts) {
  err('skills/workspace-conventions/SKILL.md', 'could not locate the initiative artifacts/ scaffold');
}
if (!wiArtifacts) {
  err('agents/workflow-initiative-init.agent.md', 'could not locate the initiative artifacts/ scaffold');
}
if (conventionArtifacts && wiArtifacts && !setEq(conventionArtifacts, wiArtifacts)) {
  err('agents/workflow-initiative-init.agent.md', `initiative artifact directories ${JSON.stringify([...wiArtifacts].sort())} differ from workspace conventions ${JSON.stringify([...conventionArtifacts].sort())}`);
}

// ---------------------------------------------------------------------------
// Fixtures — a self-contained repository-mode workspace manifest that must match
// the documented schema and canonical areas, with no machine-specific paths.
// ---------------------------------------------------------------------------
const REQUIRED_MANIFEST_KEYS = ['plugin', 'version', 'schema_version', 'scaffolded', 'workspace_mode', 'workspace_root', 'kai', 'runs', 'coordination', 'initiatives', 'library', 'personal', 'areas'];
const fixtureManifest = join(ROOT, 'test/fixtures/repo-workspace/.kai/manifest.json');
if (existsSync(fixtureManifest)) {
  const fr = 'test/fixtures/repo-workspace/.kai/manifest.json';
  let fx;
  try { fx = JSON.parse(readFileSync(fixtureManifest, 'utf8')); }
  catch (e) { err(fr, `invalid JSON: ${e.message}`); }
  if (fx) {
    for (const k of REQUIRED_MANIFEST_KEYS) {
      if (!(k in fx)) err(fr, `manifest missing required key "${k}"`);
    }
    if (fx.plugin !== 'kai') err(fr, 'manifest "plugin" must be "kai"');
    if (!Number.isInteger(fx.schema_version)) {
      err(fr, 'manifest "schema_version" must be an integer');
    }
    if (fx.workspace_mode === 'repository' && fx.workspace_root !== '.') {
      err(fr, 'repository-mode "workspace_root" must be "."');
    }
    for (const [k, v] of Object.entries(fx)) {
      if (typeof v === 'string' && /^[A-Za-z]:[\\/]|^\/[A-Za-z]/.test(v)) {
        err(fr, `manifest value for "${k}" looks like a machine-specific absolute path`);
      }
    }
    if (mAreas && !setEq(toSet(fx.areas || []), mAreas)) {
      err(fr, 'fixture manifest areas differ from the documented manifest areas');
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
