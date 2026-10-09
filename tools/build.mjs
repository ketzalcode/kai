#!/usr/bin/env node

import {
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import {dirname, join, relative, resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {catalogContent} from './generate-catalog.mjs';
import {
  COMMITTED_PACKS,
  HOOKS_FILE,
  PACKS_DIR,
  materializePacks,
  normalizeLF,
  packPluginName,
  parseGeneratedKey,
  planManifests,
  publicationContract,
  publicationSkillForPack,
  syncPublicationTableRegion,
} from './lib/pack-plan.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const MARKETPLACE = '.github/plugin/marketplace.json';
const CATALOG = 'docs/reference/agents-and-skills.md';

const json = value => `${JSON.stringify(value, null, 2)}\n`;
const repoPath = path => path.replace(/\\/g, '/');
const absolute = (root, rel) => join(root, ...rel.split('/'));

function readJson(root, rel) {
  return JSON.parse(readFileSync(absolute(root, rel), 'utf8'));
}

function plannedPackFiles(root, version) {
  const materialized = materializePacks({
    root,
    version,
    packs: COMMITTED_PACKS,
  });
  return new Map([...materialized].filter(([key]) => {
    const entry = parseGeneratedKey(key);
    return entry
      && !['agent', 'skill', 'skill-companion'].includes(entry.kind);
  }).map(([key, content]) => [`${PACKS_DIR}/${key}`, content]));
}

function marketplacePlan(root, version) {
  const marketplace = readJson(root, MARKETPLACE);
  const manifests = new Map(planManifests({
    root,
    version,
    packs: COMMITTED_PACKS,
  }).map(entry => [entry.name, entry.manifest]));
  return {
    ...marketplace,
    metadata: {...marketplace.metadata, version},
    plugins: marketplace.plugins.map(plugin => {
      const manifest = manifests.get(plugin.name);
      if (!manifest) {
        throw new Error(`${MARKETPLACE} names unknown generated plugin ${plugin.name}`);
      }
      return {
        ...plugin,
        source: `./${PACKS_DIR}/${plugin.name}`,
        description: manifest.description,
        version,
      };
    }),
  };
}

export function buildPlan(root = ROOT) {
  const packageJson = readJson(root, 'package.json');
  const version = packageJson.version;
  if (typeof version !== 'string' || !version.trim()) {
    throw new Error('package.json must declare a non-empty version');
  }

  const rootPlugin = readJson(root, 'plugin.json');
  const plan = new Map([
    ['plugin.json', json({...rootPlugin, version})],
    [MARKETPLACE, json(marketplacePlan(root, version))],
  ]);

  for (const [path, content] of plannedPackFiles(root, version)) {
    plan.set(path, normalizeLF(content));
  }

  for (const pack of COMMITTED_PACKS) {
    const contract = publicationContract(pack, root);
    const rel = repoPath(relative(root, contract.skillPath));
    const body = readFileSync(contract.skillPath, 'utf8');
    plan.set(rel, syncPublicationTableRegion(body, contract));
  }

  const catalog = catalogContent(root);
  plan.set(CATALOG, catalog.endsWith('\n') ? catalog : `${catalog}\n`);
  return new Map([...plan].sort(([left], [right]) => left.localeCompare(right)));
}

function walkFiles(root, rel) {
  const base = absolute(root, rel);
  if (!existsSync(base)) return [];
  const files = [];
  const walk = (dir, prefix) => {
    for (const entry of readdirSync(dir, {withFileTypes: true})
      .sort((left, right) => left.name.localeCompare(right.name))) {
      const next = prefix ? `${prefix}/${entry.name}` : entry.name;
      const path = join(dir, entry.name);
      if (entry.isDirectory()) walk(path, next);
      else files.push(`${rel}/${next}`);
    }
  };
  walk(base, '');
  return files;
}

function ownedGeneratedPaths(root) {
  const owned = new Set(['plugin.json', MARKETPLACE, CATALOG]);
  for (const pack of COMMITTED_PACKS) {
    const base = `${PACKS_DIR}/${packPluginName(pack)}`;
    for (const name of ['plugin.json', 'package.json', 'package-lock.json', HOOKS_FILE]) {
      const rel = `${base}/${name}`;
      if (existsSync(absolute(root, rel))) owned.add(rel);
    }
    for (const rel of walkFiles(root, `${base}/scripts`)) owned.add(rel);
    owned.add(`${base}/skills/${publicationSkillForPack(pack)}/SKILL.md`);
  }
  return [...owned].sort();
}

export function checkPlan(root, plan = buildPlan(root)) {
  const drift = [];
  for (const [rel, expected] of plan) {
    const path = absolute(root, rel);
    if (!existsSync(path)) {
      drift.push(`missing:    ${rel}`);
      continue;
    }
    if (normalizeLF(readFileSync(path, 'utf8')) !== normalizeLF(expected)) {
      drift.push(`differs:    ${rel}`);
    }
  }
  for (const rel of ownedGeneratedPaths(root)) {
    if (!plan.has(rel)) drift.push(`unexpected: ${rel}`);
  }
  return {ok: drift.length === 0, drift};
}

export function writePlan(root, plan = buildPlan(root)) {
  for (const [rel, content] of plan) {
    const path = absolute(root, rel);
    mkdirSync(dirname(path), {recursive: true});
    writeFileSync(path, content);
  }
  const removed = [];
  for (const rel of ownedGeneratedPaths(root)) {
    if (plan.has(rel)) continue;
    rmSync(absolute(root, rel), {force: true});
    removed.push(rel);
  }
  return {written: plan.size, removed};
}

function run() {
  const write = process.argv.includes('--write');
  const check = process.argv.includes('--check');
  if (write === check) {
    console.error('usage: node tools/build.mjs --write|--check');
    process.exit(1);
  }

  const plan = buildPlan(ROOT);
  if (write) {
    const result = writePlan(ROOT, plan);
    console.log(`\u2713 build: wrote ${result.written} generated file(s)`
      + `${result.removed.length ? ` and removed ${result.removed.length} stale file(s)` : ''}`);
    return;
  }

  const result = checkPlan(ROOT, plan);
  if (result.ok) {
    console.log('\u2713 build:check: generated consumer and release artifacts are current');
    return;
  }
  console.error(`\u2717 build:check: ${result.drift.length} generated drift(s)`);
  for (const entry of result.drift) console.error(`  ${entry}`);
  process.exit(1);
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  run();
}
