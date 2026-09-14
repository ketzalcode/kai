import { existsSync, readdirSync } from 'node:fs';
import { join, posix } from 'node:path';

export function incubatedIds(root, kind) {
  if (kind !== 'agent' && kind !== 'skill') throw new TypeError('unknown component kind');
  const base = join(root, 'incubator', 'kai-engineering',
    kind === 'agent' ? 'agents' : 'skills');
  if (!existsSync(base)) return new Set();
  const entries = readdirSync(base, { withFileTypes: true });
  return new Set(entries.filter(entry => kind === 'agent'
    ? entry.isFile() && entry.name.endsWith('.agent.md')
    : entry.isDirectory() && existsSync(join(base, entry.name, 'SKILL.md')))
    .map(entry => kind === 'agent' ? entry.name.slice(0, -'.agent.md'.length) : entry.name));
}

export function documentationReferenceExists(id, sourcePath, activeIds, inactiveIds) {
  if (activeIds.has(id)) return true;
  const source = posix.normalize(sourcePath.replace(/\\/g, '/'));
  const historical = [
    'docs/proposals/', 'docs/superpowers/', 'docs/kai/reports/',
    'docs/reference/skill-evaluation/research-before-coding/',
  ].some(prefix => source.startsWith(prefix)) ||
    source === 'docs/reference/skill-evaluation/engineering-inventory.md';
  return historical && inactiveIds.has(id);
}
