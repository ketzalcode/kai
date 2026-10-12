#!/usr/bin/env node
// Generates docs/reference/agents-and-skills.md from agent and skill frontmatter.
//
// The catalog used to live in README.md as a 223-line hand-maintained table, so
// every new agent needed a second, easily-forgotten edit and the prose drifted
// from what the host actually reads. Now the description column IS the shipped
// `description:` frontmatter — the same text the host uses to decide when the
// agent fires — so the catalog cannot describe a capability the plugin does not
// declare.
//
// Grouping stays here rather than in frontmatter: it is editorial, and adding a
// `category:` key to 94 files would widen the host-loader contract for a
// docs-only concern. The CATEGORIES table below is the single source of that
// judgment, and coverage is enforced — a new agent or skill fails the build
// until it is filed under exactly one heading.
//
// The unified build imports catalogContent(). It is the only command that writes
// or checks the committed catalog.

import { readFileSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseFrontmatter, stripQuotes, isUserInvocable } from '../src/core/lib/loader-contract.mjs';
import { sourceAgentFiles, sourceSkillFiles, PUBLISHED_PACKS } from './lib/pack-plan.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');

// ---------------------------------------------------------------------------
// Editorial grouping. Every agent and skill must appear exactly once.
// ---------------------------------------------------------------------------
const CATEGORIES = [
  {
    kind: 'agent',
    title: 'Engineering',
    blurb: 'Implement bounded frontend and backend work, explicitly coordinate a complete change, or run approved unattended delivery.',
    members: [
      'eng-lead-software', 'eng-builder-frontend', 'eng-builder-backend',
      'eng-nightshift',
    ],
  },
  {
    kind: 'agent',
    title: 'Technical writing',
    blurb: 'Engineering-owned documentation, editorial assessment, and source-language localization preparation.',
    members: ['eng-lead-technical-writing'],
  },
  {
    kind: 'agent',
    title: 'Creative',
    blurb: 'Design and video judgment from supplied needs and evidence, plus bounded demo production from approved direction and existing media.',
    members: [
      'creative-lead-design', 'creative-lead-video',
      'creative-operator-demo-production',
    ],
  },
  {
    kind: 'agent',
    title: 'Implementation review',
    blurb: 'Selective independent code review. Implementers retain ownership of their changed-behavior tests.',
    members: ['eng-reviewer-code'],
  },
  {
    kind: 'skill',
    title: 'Workspace',
    blurb: 'Resolve private schema-6 workspaces and validate Core publication vocabulary.',
    members: [
      'kai-core-workspace-paths',
      'kai-core-workspace-onboarding',
      'kai-core-workspace-reonboard',
      'kai-core-workspace-publication',
    ],
  },
  {
    kind: 'skill',
    title: 'Task execution',
    blurb: 'Define standalone Task authority, execution, acting, and granting.',
    members: [
      'kai-core-work-task', 'kai-core-work-acting', 'kai-core-work-granting',
    ],
  },
  {
    kind: 'skill',
    title: 'Project management',
    blurb: 'Own Direction, Epic, Feature, Requirement, priority, holds, dependencies, closure, and Task handoff.',
    members: [
      'project-management-create-epic',
      'project-management-work-hierarchy',
      'project-management-work-stewardship',
      'project-management-workspace-publication',
    ],
  },
  {
    kind: 'skill',
    title: 'Pack publication',
    blurb: 'Own package vocabularies that validate typed private work and accepted public knowledge.',
    members: [
      'engineering-workspace-publication', 'creative-workspace-publication',
    ],
  },
  {
    kind: 'skill',
    title: 'Operating contracts',
    blurb: 'Shared operating, communication, and activity guidance.',
    members: [
      'kai-core-operating-rules', 'kai-core-work-activity',
      'kai-core-peer-communication',
    ],
  },
  {
    kind: 'skill',
    title: 'Contributor tools',
    blurb: 'Optional feedback and lean Kai agent/skill authoring guidance.',
    members: [
      'kai-feedback', 'kai-create-agent', 'kai-create-skill',
    ],
  },
  {
    kind: 'skill',
    title: 'Engineering craft',
    blurb: 'Lean development, shared and domain coding standards, bounded evidence, explicit delivery, and useful visuals.',
    members: [
      'software-development', 'coding-standards',
      'frontend-coding-standards', 'backend-coding-standards',
      'nightshift-run',
      'research-before-coding',
      'pr-sizing', 'pr-delivery', 'pr-review', 'pr-review-comments',
      'onboard-to-codebase', 'build-diagrams',
    ],
  },
  {
    kind: 'skill',
    title: 'Engineering automation',
    blurb: 'Investigate platform feasibility and install approved repository automation without assuming one host or agent runtime.',
    members: ['setup-agentic-repository-maintenance'],
  },
  {
    kind: 'skill',
    title: 'Creative methods',
    blurb: 'Structural and visual mockups, block diagrams, measured narration operations, and declared-focus rendering.',
    members: [
      'mockups-ascii', 'mockups-html', 'html-block-diagrams',
      'video-align-narration', 'video-render-zoom',
    ],
  },
  {
    kind: 'skill',
    title: 'Content grounding',
    blurb: 'Claim safety for creative content.',
    members: ['content-grounding'],
  },
];

// ---------------------------------------------------------------------------
// Read the shipped surface
// ---------------------------------------------------------------------------
function readAll(root = ROOT) {
  const items = new Map();
  for (const entry of sourceAgentFiles(root)) {
    const pf = parseFrontmatter(readFileSync(entry.path, 'utf8'));
    if (!pf.ok) throw new Error(`${entry.rel}: ${pf.reason}`);
    items.set(entry.id, { id: entry.id, kind: 'agent', pack: entry.pack, fm: pf.fm, path: entry.rel });
  }
  for (const entry of sourceSkillFiles(root)) {
    const pf = parseFrontmatter(readFileSync(entry.path, 'utf8'));
    if (!pf.ok) throw new Error(`${entry.rel}: ${pf.reason}`);
    items.set(entry.id, { id: entry.id, kind: 'skill', pack: entry.pack, fm: pf.fm, path: entry.rel });
  }

  return items;
}

// A description is a single YAML scalar, but it is prose: it can carry pipes
// (which would break the table) and escaped unicode from the JSON-ish quoting.
function cell(text) {
  return text
    .replace(/\\u([0-9a-fA-F]{4})/g, (_, h) => String.fromCharCode(parseInt(h, 16)))
    .replace(/\\"/g, '"')
    .replace(/\s+/g, ' ')
    .replace(/\|/g, '\\|')
    .trim();
}

function build(items) {
  const filed = new Map();
  const problems = [];
  for (const cat of CATEGORIES) {
    for (const m of cat.members) {
      const item = items.get(m);
      if (!item) { problems.push(`"${m}" is listed under "${cat.title}" but no such ${cat.kind} ships`); continue; }
      if (item.kind !== cat.kind) problems.push(`"${m}" is a ${item.kind} but is filed under the ${cat.kind} section "${cat.title}"`);
      if (filed.has(m)) problems.push(`"${m}" is filed twice: "${filed.get(m)}" and "${cat.title}"`);
      else filed.set(m, cat.title);
    }
  }
  for (const [id, item] of items) {
    if (!filed.has(id)) problems.push(`${item.path} is not filed under any catalog category (add it to CATEGORIES in tools/generate-catalog.mjs)`);
  }
  if (problems.length) {
    const e = new Error('catalog coverage is incomplete');
    e.problems = problems;
    throw e;
  }

  const agents = [...items.values()].filter((i) => i.kind === 'agent').length;
  const skills = [...items.values()].filter((i) => i.kind === 'skill').length;
  const invocable = [...items.values()].filter((i) => i.kind === 'skill' && isUserInvocable(i.fm)).length;
  const unpublished = [...items.values()].filter(item => !PUBLISHED_PACKS.includes(item.pack));
  if (unpublished.length) {
    const e = new Error('the catalog lists a component from a package the default marketplace does not carry');
    e.problems = unpublished.map(item => `${item.path} belongs to kai-${item.pack}, which is not in PUBLISHED_PACKS`);
    throw e;
  }

  const out = [];
  out.push('[kai](../../README.md) / [Docs](../README.md) / Agents & skills');
  out.push('');
  out.push('# Agents & skills');
  out.push('');
  out.push('<!-- GENERATED FILE — do not edit by hand.');
  out.push('     Source: agent/skill frontmatter + the CATEGORIES table in');
  out.push('     tools/generate-catalog.mjs. Regenerate with `npm run build`;');
  out.push('     `npm run build:check` fails if this file drifts. -->');
  out.push('');
  out.push(`The repository ships **${agents} agents** and **${skills} skills**.`);
  out.push('');
  out.push(`The default marketplace supplies **${agents} agents** and **${skills} skills** through core, optional project management, engineering, and creative (${invocable} skills are directly user-invocable when their owning package is installed). A default listing is not a release or runtime-readiness certification.`);
  out.push('');
  out.push('Each description is the source agent or skill\'s own `description:`.');
  out.push('Capabilities parked under [`incubator/`](../../incubator/README.md) are');
  out.push('deliberately absent from this catalog: they are not installed, not loaded,');
  out.push('and not available through any install path.');
  out.push('');
  out.push('- **Need the system boundaries?** [Architecture](../architecture.md) maps packages, authority, runtime, and hosts.');
  out.push('');

  for (const kind of ['agent', 'skill']) {
    out.push(kind === 'agent' ? '## Agents' : '## Skills');
    out.push('');
    if (kind === 'skill') {
      out.push('Skills are methods and contracts. Most are not invoked directly —');
      out.push('an acting agent loads each one on demand, at the exact instruction that needs it.');
      out.push('');
    }
    for (const cat of CATEGORIES.filter((c) => c.kind === kind)) {
      out.push(`### ${cat.title}`);
      out.push('');
      out.push(cat.blurb);
      out.push('');
      out.push('| Name | Package | What it owns |');
      out.push('| ---- | ------- | ------------ |');
      for (const m of cat.members) {
        const item = items.get(m);
        const link = `../../${item.path}`;
        out.push(`| [\`${m}\`](${link}) | \`kai-${item.pack}\` | ${cell(stripQuotes(item.fm.description || ''))} |`);
      }
      out.push('');
    }
  }

  out.push('---');
  out.push('');
  out.push('**Next:** [Architecture](../architecture.md) · [Workspace model](../workspaces.md) ·');
  out.push('[Development process](../development-process.md)');
  out.push('');
  return out.join('\n');
}

export function catalogContent(root = ROOT) {
  return build(readAll(root));
}

// ---------------------------------------------------------------------------
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  console.error('catalog generation is owned by `npm run build` and `npm run build:check`');
  process.exit(1);
}
