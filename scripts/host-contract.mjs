#!/usr/bin/env node
// host-contract — apply kai's authoring contract to the advertised inventory
// and prove malformed frontmatter is rejected before release.
//
// `validate-plugin.mjs` proves the source obeys the authoring contract. This
// guard applies the same rules to every agent and skill,
// asserts the resulting discoverable inventory matches a committed golden
// snapshot (so a roster change is explicit and reviewable in the diff), and
// asserts a set of deliberately malformed fixtures are each rejected by the
// loader — the exact class of bug (#23) that shipped while CI stayed green.
//
// It is a deterministic lint heuristic, not a live-host parser. Live validator
// and runtime behavior are measured separately by host-tool-probe.mjs.
//
// Usage:
//   node scripts/host-contract.mjs             verify inventory + README counts
//   node scripts/host-contract.mjs --self-test verify inventory + reject fixtures
//   node scripts/host-contract.mjs --update     rewrite the golden inventory
//
// Exit code: 0 = acceptance holds; non-zero = a violation is printed.

import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseFrontmatter, loaderErrors, stripQuotes, isUserInvocable } from './lib/loader-contract.mjs';
import { sourceAgentFiles, sourceSkillFiles } from './lib/pack-plan.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const GOLDEN = join(ROOT, 'test', 'fixtures', 'inventory.json');
const rel = (p) => p.slice(ROOT.length + 1).replace(/\\/g, '/');

// --- collect entries the way the host discovers them -----------------------
function collect() {
  return [...sourceAgentFiles(ROOT), ...sourceSkillFiles(ROOT)];
}

// Check one entry through Kai's authoring contract. { ok, errors, fm }.
function load(entry) {
  const pf = parseFrontmatter(readFileSync(entry.path, 'utf8'));
  if (!pf.ok) return { ok: false, errors: [`invalid frontmatter: ${pf.reason}`], fm: {} };
  const errs = loaderErrors(entry.kind, entry.id, pf.fm);
  return { ok: errs.length === 0, errors: errs, fm: pf.fm };
}

// The discoverable inventory kai expects: the agent and skill rosters,
// and the user-invocable skill surface (name + argument hint). Loader failures
// are reported separately — a broken entry never silently drops from the roster.
function buildInventory() {
  const entries = collect();
  const loadErrors = [];
  const agents = [];
  const skills = [];
  const userInvocable = [];
  for (const e of entries) {
    const r = load(e);
    if (!r.ok) { loadErrors.push({ file: rel(e.path), errors: r.errors }); continue; }
    if (e.kind === 'agent') agents.push(e.id);
    else {
      skills.push(e.id);
      if (isUserInvocable(r.fm)) {
        userInvocable.push({ name: e.id, argument_hint: stripQuotes(r.fm['argument-hint'] ?? '') });
      }
    }
  }
  agents.sort();
  skills.sort();
  const byName = (a, b) => (a.name > b.name ? 1 : a.name < b.name ? -1 : 0);
  userInvocable.sort(byName);
  const inventory = {
    counts: { agents: agents.length, skills: skills.length },
    agents,
    skills,
    user_invocable_skills: userInvocable,
  };
  return { inventory, loadErrors };
}

const canon = (o) => JSON.stringify(o, null, 2) + '\n';

// --- checks ----------------------------------------------------------------
// Assert the source inventory satisfies Kai's rules and equals the golden.
function checkInventory(errors) {
  const { inventory, loadErrors } = buildInventory();
  for (const le of loadErrors) {
    for (const m of le.errors) errors.push(`${le.file}: kai rejects this entry — ${m}`);
  }
  if (!existsSync(GOLDEN)) {
    errors.push(`${rel(GOLDEN)}: golden inventory is missing — run \`npm run host-contract:update\``);
    return inventory;
  }
  let golden;
  try { golden = JSON.parse(readFileSync(GOLDEN, 'utf8')); }
  catch (e) { errors.push(`${rel(GOLDEN)}: golden inventory is not valid JSON: ${e.message}`); return inventory; }
  if (canon(inventory) !== canon(golden)) {
    errors.push(`${rel(GOLDEN)}: discoverable inventory drifted from the golden snapshot.`);
    diffInventory(golden, inventory).forEach((d) => errors.push(`  ${d}`));
    errors.push('  If this change is intended, run `npm run host-contract:update` and commit the golden.');
  }
  return inventory;
}

// Human-readable roster delta so a reviewer sees exactly what changed.
function diffInventory(golden, live) {
  const out = [];
  const listDelta = (label, a = [], b = []) => {
    const sa = new Set(a);
    const sb = new Set(b);
    for (const x of b) if (!sa.has(x)) out.push(`+ ${label}: ${x}`);
    for (const x of a) if (!sb.has(x)) out.push(`- ${label}: ${x}`);
  };
  listDelta('agent', golden.agents, live.agents);
  listDelta('skill', golden.skills, live.skills);
  const gi = new Map((golden.user_invocable_skills || []).map((s) => [s.name, s.argument_hint]));
  const li = new Map((live.user_invocable_skills || []).map((s) => [s.name, s.argument_hint]));
  for (const [name, hint] of li) {
    if (!gi.has(name)) out.push(`+ user-invocable skill: ${name}`);
    else if (gi.get(name) !== hint) out.push(`~ argument-hint (${name}): "${gi.get(name)}" -> "${hint}"`);
  }
  for (const name of gi.keys()) if (!li.has(name)) out.push(`- user-invocable skill: ${name}`);
  return out;
}

// The README status stamp advertises the roster size; it must mirror the live,
// linted inventory so the quickstart never claims a roster that fails.
function checkReadmeCounts(errors, inventory) {
  const readmePath = join(ROOT, 'README.md');
  if (!existsSync(readmePath)) { errors.push('README.md is missing'); return; }
  const readme = readFileSync(readmePath, 'utf8');
  // Scope to the `## Status` section so a compare/changelog phrase can't match.
  const start = readme.indexOf('## Status');
  let section = readme;
  if (start !== -1) {
    const nextHeading = readme.indexOf('\n## ', start + 1);
    section = readme.slice(start, nextHeading === -1 ? readme.length : nextHeading);
  }
  const m = section.match(/\*\*(\d+)\s+agents\s+and\s+(\d+)\s+skills\*\*/);
  if (!m) { errors.push('README.md `## Status`: could not find the "**N agents and M skills**" status stamp'); return; }
  const a = Number(m[1]);
  const s = Number(m[2]);
  if (a !== inventory.counts.agents || s !== inventory.counts.skills) {
    errors.push(`README.md status stamp says ${a} agents / ${s} skills but the loadable inventory has ${inventory.counts.agents} agents / ${inventory.counts.skills} skills`);
  }
}

// Every `npm run <script>` the README documents must exist in package.json, so
// the quickstart never points at a command that isn't there.
function checkReadmeScripts(errors) {
  const readmePath = join(ROOT, 'README.md');
  const pkgPath = join(ROOT, 'package.json');
  if (!existsSync(readmePath)) { errors.push('README.md is missing'); return; }
  if (!existsSync(pkgPath)) { errors.push('package.json is missing'); return; }
  const readme = readFileSync(readmePath, 'utf8');
  let scripts;
  try { scripts = JSON.parse(readFileSync(pkgPath, 'utf8')).scripts || {}; }
  catch (e) { errors.push(`package.json is not valid JSON: ${e.message}`); return; }
  const referenced = new Set([...readme.matchAll(/npm run ([a-z][a-z0-9:-]*)/g)].map((x) => x[1]));
  for (const name of referenced) {
    if (!(name in scripts)) errors.push(`README.md references \`npm run ${name}\` but package.json has no such script`);
  }
}

// Malformed fixtures the loader must reject. Each carries the expected reason.
const INVALID_FIXTURES = [
  { file: 'argument-hint-array.skill.md', kind: 'skill', re: /argument-hint.*inline array/i },
  { file: 'tools-not-array.skill.md', kind: 'skill', re: /tools.*inline array/i },
  { file: 'unsupported-tool.agent.md', kind: 'agent', re: /not in kai's tool vocabulary/i },
  { file: 'skill-key-on-agent.agent.md', kind: 'agent', re: /skill-only/i },
  { file: 'model-array.agent.md', kind: 'agent', re: /model.*quoted scalar string/i },
  { file: 'model-non-string.agent.md', kind: 'agent', re: /model.*quoted scalar string/i },
  { file: 'name-mismatch.agent.md', kind: 'agent', re: /name .* must equal/i },
];

function checkInvalidFixtures(errors) {
  const dir = join(ROOT, 'test', 'fixtures', 'host-loader', 'invalid');
  for (const fx of INVALID_FIXTURES) {
    const p = join(dir, fx.file);
    if (!existsSync(p)) { errors.push(`missing malformed fixture ${rel(p)}`); continue; }
    // The fixture id is the file's base name minus its kind suffix.
    const id = fx.file.replace(/\.(agent|skill)\.md$/, '');
    const pf = parseFrontmatter(readFileSync(p, 'utf8'));
    const errs = pf.ok ? loaderErrors(fx.kind, id, pf.fm) : [`invalid frontmatter: ${pf.reason}`];
    if (errs.length === 0) {
      errors.push(`malformed fixture ${fx.file} was NOT rejected by the loader (it must fail)`);
    } else if (!errs.some((m) => fx.re.test(m))) {
      errors.push(`malformed fixture ${fx.file} rejected, but not for the expected reason ${fx.re} (got: ${errs.join('; ')})`);
    }
  }
}

// --- run -------------------------------------------------------------------
const argv = process.argv.slice(2);

if (argv.includes('--update')) {
  const { inventory, loadErrors } = buildInventory();
  if (loadErrors.length) {
    console.error('✗ cannot update golden: entries fail the loader contract:');
    for (const le of loadErrors) for (const m of le.errors) console.error(`  ${le.file}: ${m}`);
    process.exit(1);
  }
  writeFileSync(GOLDEN, canon(inventory));
  console.log(`✓ wrote golden inventory (${inventory.counts.agents} agents, ${inventory.counts.skills} skills) to ${rel(GOLDEN)}`);
  process.exit(0);
}

const errors = [];
const inventory = checkInventory(errors);
checkReadmeCounts(errors, inventory);
checkReadmeScripts(errors);
if (argv.includes('--self-test')) checkInvalidFixtures(errors);

if (errors.length === 0) {
  const mode = argv.includes('--self-test') ? ' + malformed fixtures rejected' : '';
  console.log(`✓ kai frontmatter acceptance: ${inventory.counts.agents} agents, ${inventory.counts.skills} skills lint cleanly, inventory matches golden${mode}`);
  process.exit(0);
}
console.error(`✗ kai frontmatter acceptance: ${errors.length} violation(s)\n`);
for (const e of errors) console.error(`  ${e}`);
process.exit(1);
