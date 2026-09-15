import { existsSync, readdirSync } from 'node:fs';
import { join, posix } from 'node:path';

export function incubatedIds(root, kind) {
  if (kind !== 'agent' && kind !== 'skill') throw new TypeError('unknown component kind');
  const incubator = join(root, 'incubator');
  if (!existsSync(incubator)) return new Set();
  const ids = new Set();
  for (const owner of readdirSync(incubator, { withFileTypes: true })
    .filter(entry => entry.isDirectory() && entry.name.startsWith('kai-'))
    .sort((a, b) => a.name.localeCompare(b.name))) {
    const base = join(incubator, owner.name, kind === 'agent' ? 'agents' : 'skills');
    if (!existsSync(base)) continue;
    for (const entry of readdirSync(base, { withFileTypes: true })
      .sort((a, b) => a.name.localeCompare(b.name))) {
      if (kind === 'agent' && entry.isFile() && entry.name.endsWith('.agent.md')) {
        ids.add(entry.name.slice(0, -'.agent.md'.length));
      } else if (kind === 'skill' && entry.isDirectory()
        && existsSync(join(base, entry.name, 'SKILL.md'))) {
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
      'docs/reference/skill-evaluation/creative-foundation-baseline-2026-09-13.md',
      'docs/reference/skill-evaluation/samples/diagrams/guide-current.md',
      'docs/reference/skill-evaluation/creative-foundation/grounding/current/SKILL.md',
      'docs/reference/skill-evaluation/creative-foundation/grounding/candidate/SKILL.md',
      'docs/reference/skill-evaluation/creative-foundation/scope/current/SKILL.md',
      'docs/reference/skill-evaluation/creative-foundation/scope/candidate/SKILL.md',
      'docs/reference/skill-evaluation/creative-foundation/mockups-ascii/current/SKILL.md',
    ].includes(source);
  return historical && inactiveIds.has(id);
}
