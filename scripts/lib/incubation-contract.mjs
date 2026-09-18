import { existsSync, readdirSync } from 'node:fs';
import { join, posix } from 'node:path';

export const INCUBATOR_DIR = 'incubator';

export const MANIFEST_FILES = Object.freeze([
  'plugin.json', 'package.json', 'package-lock.json',
]);

// Every directory under `incubator/`, not only `kai-*`. The isolation rules are
// about the location, not the name: something parked under another name is
// still parked, and a gate that only looked at `kai-*` would let it escape.
export function incubatedPackageDirs(root) {
  const base = join(root, INCUBATOR_DIR);
  if (!existsSync(base)) return [];
  return readdirSync(base, { withFileTypes: true })
    .filter(entry => entry.isDirectory())
    .map(entry => entry.name)
    .sort();
}

// Every manifest anywhere under `incubator/`. Checking only the top level would
// leave `incubator/<pkg>/nested/plugin.json` installable while the gate passed.
export function incubatedManifestPaths(root, manifests = MANIFEST_FILES) {
  const base = join(root, INCUBATOR_DIR);
  if (!existsSync(base)) return [];
  const found = [];
  const walk = (dir, rel) => {
    for (const entry of readdirSync(dir, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))) {
      const next = rel ? `${rel}/${entry.name}` : entry.name;
      if (entry.isDirectory()) walk(join(dir, entry.name), next);
      else if (manifests.includes(entry.name)) found.push(`${INCUBATOR_DIR}/${next}`);
    }
  };
  walk(base, '');
  return found;
}


export function incubatedIds(root, kind) {
  if (kind !== 'agent' && kind !== 'skill') throw new TypeError('unknown component kind');
  const ids = new Set();
  for (const pkg of incubatedPackageDirs(root)) {
    const base = join(root, INCUBATOR_DIR, pkg, kind === 'agent' ? 'agents' : 'skills');
    if (!existsSync(base)) continue;
    for (const entry of readdirSync(base, { withFileTypes: true })) {
      if (kind === 'agent') {
        if (entry.isFile() && entry.name.endsWith('.agent.md')) {
          ids.add(entry.name.slice(0, -'.agent.md'.length));
        }
      } else if (entry.isDirectory() && existsSync(join(base, entry.name, 'SKILL.md'))) {
        ids.add(entry.name);
      }
    }
  }
  return ids;
}

export function documentationReferenceExists(id, sourcePath, activeIds, inactiveIds) {
  if (activeIds.has(id)) return true;
  const source = posix.normalize(sourcePath.replace(/\\/g, '/'));
  const historical = [
    'docs/proposals/', 'docs/superpowers/', 'docs/kai/reports/',
    'docs/reference/skill-evaluation/research-before-coding/',
  ].some(prefix => source.startsWith(prefix)) ||
    [
      'docs/reference/skill-evaluation/engineering-inventory.md',
      'docs/reference/skill-evaluation/samples/diagrams/guide-current.md',
    ].includes(source);
  return historical && inactiveIds.has(id);
}
