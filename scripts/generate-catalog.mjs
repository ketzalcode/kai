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
// Run: `node scripts/generate-catalog.mjs`          (write)
//      `node scripts/generate-catalog.mjs --check`  (fail on drift; used by npm test)

import { readFileSync, writeFileSync, readdirSync, existsSync, statSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseFrontmatter, stripQuotes, isUserInvocable } from './lib/loader-contract.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const OUT = join(ROOT, 'docs', 'reference', 'agents-and-skills.md');

// ---------------------------------------------------------------------------
// Editorial grouping. Every agent and skill must appear exactly once.
// ---------------------------------------------------------------------------
const CATEGORIES = [
  {
    kind: 'agent',
    title: 'Workspace foundation',
    blurb: 'Set a workspace up and keep its structure honest.',
    members: ['workflow-workspace-init', 'workflow-initiative-init', 'workflow-self-check'],
  },
  {
    kind: 'agent',
    title: 'Direction',
    blurb: 'The two front doors. Everything else is reachable through them.',
    members: ['director-executive-assistant', 'director-chief-of-staff'],
  },
  {
    kind: 'agent',
    title: 'Engineering',
    blurb: 'Technical design and implementation. The architect and manager are situational.',
    members: [
      'principal-swe-architect', 'principal-swe-manager', 'principal-swe-frontend',
      'principal-swe-backend', 'principal-swe-infra', 'principal-data-engineer',
    ],
  },
  {
    kind: 'agent',
    title: 'Delivery',
    blurb: 'The release gate. kai never performs the deployment itself.',
    members: ['workflow-ship'],
  },
  {
    kind: 'agent',
    title: 'Trust & reliability',
    blurb: 'Independent judgment on security, privacy, reliability, and live incidents.',
    members: [
      'principal-security', 'principal-privacy-compliance', 'principal-sre',
      'workflow-incident-response',
    ],
  },
  {
    kind: 'agent',
    title: 'Document review',
    blurb: 'One orchestrator that fans a document out to the review lenses and aggregates the verdict.',
    members: ['workflow-doc-review'],
  },
  {
    kind: 'agent',
    title: 'Product',
    blurb: 'Need, scope, interaction design, documentation, and brand.',
    members: [
      'principal-product-manager', 'principal-product-strategist', 'principal-product-designer',
      'principal-technical-writer', 'principal-brand-designer', 'workflow-localization',
    ],
  },
  {
    kind: 'agent',
    title: 'Customer operations',
    blurb: 'Post-sale outcomes and bounded support intake.',
    members: ['principal-customer-success', 'workflow-support-triage'],
  },
  {
    kind: 'agent',
    title: 'Revenue & go-to-market',
    blurb: 'Pre-sale motion and the commercial operating model. Only you accept terms.',
    members: [
      'principal-sales', 'principal-solutions-architect', 'principal-revenue-operations',
      'principal-demand-generation', 'principal-partnerships',
    ],
  },
  {
    kind: 'agent',
    title: 'Growth, analytics & monetization',
    blurb: 'Lifecycle diagnosis, metric validity, experiment integrity, and price.',
    members: [
      'principal-growth', 'principal-data-analytics', 'workflow-experiment-review',
      'principal-pricing-monetization', 'workflow-customer-feedback',
    ],
  },
  {
    kind: 'agent',
    title: 'AI research to product',
    blurb: 'Track the live AI landscape, then turn a finding into something buildable.',
    members: ['principal-ai-researcher', 'principal-ai-applied-engineer'],
  },
  {
    kind: 'agent',
    title: 'Learning & content',
    blurb: 'Author lessons, package existing material, or steward a whole path.',
    members: [
      'instructor-tutor', 'instructor-teacher', 'instructor-path-mentor',
      'workflow-course-to-audio',
    ],
  },
  {
    kind: 'agent',
    title: 'Product exploration & web evaluation',
    blurb: 'Look at a real surface — as a tester, an auditor, or a particular kind of user.',
    members: [
      'workflow-product-explore', 'principal-product-marketing', 'principal-qa-ui',
      'principal-seo', 'persona-ux-first-time-user', 'persona-professional-trainer',
      'persona-professional-nutritionist',
    ],
  },
  {
    kind: 'agent',
    title: 'Content & distribution',
    blurb: 'Turn product intelligence into platform-native content. Never auto-publishes.',
    members: ['principal-linkedin-strategist', 'principal-video-director'],
  },
  {
    kind: 'agent',
    title: 'Personal',
    blurb: 'Your voice, your career, your week. Workspace-local and gitignored.',
    members: [
      'persona-self', 'principal-engineer-career-mentor', 'workflow-weekly-pulse',
      'workflow-proactive-scan',
    ],
  },
  {
    kind: 'skill',
    title: 'Workspace & scope',
    blurb: 'The shared contracts every acting agent inherits: where work goes, and what it may change.',
    members: [
      'team-operating-rules', 'workspace-conventions', 'workspace-onboarding',
      'work-coordination', 'definition-of-done', 'scope-discipline',
      'initiative-stewardship', 'peer-communication', 'product-exploration',
      'product-marketing-intelligence',
    ],
  },
  {
    kind: 'skill',
    title: 'Engineering craft',
    blurb: 'Per-change discipline every `principal-swe-*` agent inherits.',
    members: [
      'coding-style', 'research-before-coding', 'pr-sizing', 'onboard-to-codebase',
      'build-diagrams',
    ],
  },
  {
    kind: 'skill',
    title: 'Document review',
    blurb: 'The method plus the lenses behind `workflow-doc-review`.',
    members: [
      'doc-review-rigor', 'review-rationale', 'review-alternatives', 'review-risks-scope',
      'review-success-metrics', 'review-security-privacy', 'review-performance-scale',
      'review-dependencies', 'review-rollout-operability', 'review-ux-accessibility',
    ],
  },
  {
    kind: 'skill',
    title: 'Product design',
    blurb: 'Design-system grounding and human-confirmable mockups, with the frontend seam.',
    members: ['design-grounding', 'ui-mockup'],
  },
  {
    kind: 'skill',
    title: 'Web & content',
    blurb: 'Browser-run plumbing and the claim-safety contract creative agents inherit.',
    members: [
      'web-evaluation', 'web-content-extraction', 'content-grounding', 'linkedin-content',
      'video-direction', 'pulse-digest',
    ],
  },
  {
    kind: 'skill',
    title: 'Lessons & writing',
    blurb: 'Turn markdown into lessons, audio, or your own voice.',
    members: ['generate-audio', 'generate-html-lesson', 'extract-writing-style'],
  },
  {
    kind: 'skill',
    title: 'Personal',
    blurb: 'The private methods behind the executive assistant. Never autonomous.',
    members: ['personal-agenda', 'executive-consultation', 'decision-brief', 'proactive-scan'],
  },
];

// ---------------------------------------------------------------------------
// Read the shipped surface
// ---------------------------------------------------------------------------
function readAll() {
  const items = new Map();
  const agentsDir = join(ROOT, 'agents');
  for (const f of readdirSync(agentsDir).filter((n) => n.endsWith('.agent.md'))) {
    const id = f.replace(/\.agent\.md$/, '');
    const pf = parseFrontmatter(readFileSync(join(agentsDir, f), 'utf8'));
    if (!pf.ok) throw new Error(`agents/${f}: ${pf.reason}`);
    items.set(id, { id, kind: 'agent', fm: pf.fm, path: `agents/${f}` });
  }
  const skillsDir = join(ROOT, 'skills');
  for (const d of readdirSync(skillsDir)) {
    const p = join(skillsDir, d, 'SKILL.md');
    if (!statSync(join(skillsDir, d)).isDirectory() || !existsSync(p)) continue;
    const pf = parseFrontmatter(readFileSync(p, 'utf8'));
    if (!pf.ok) throw new Error(`skills/${d}/SKILL.md: ${pf.reason}`);
    items.set(d, { id: d, kind: 'skill', fm: pf.fm, path: `skills/${d}/SKILL.md` });
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
    if (!filed.has(id)) problems.push(`${item.path} is not filed under any catalog category (add it to CATEGORIES in scripts/generate-catalog.mjs)`);
  }
  if (problems.length) {
    const e = new Error('catalog coverage is incomplete');
    e.problems = problems;
    throw e;
  }

  const agents = [...items.values()].filter((i) => i.kind === 'agent').length;
  const skills = [...items.values()].filter((i) => i.kind === 'skill').length;
  const invocable = [...items.values()].filter((i) => i.kind === 'skill' && isUserInvocable(i.fm)).length;

  const out = [];
  out.push('[kai](../../README.md) / [Docs](../README.md) / Agents & skills');
  out.push('');
  out.push('# Agents & skills');
  out.push('');
  out.push('<!-- GENERATED FILE — do not edit by hand.');
  out.push('     Source: agent/skill frontmatter + the CATEGORIES table in');
  out.push('     scripts/generate-catalog.mjs. Regenerate with `npm run docs:generate`;');
  out.push('     `npm test` fails if this file drifts from the shipped surface. -->');
  out.push('');
  out.push(`kai ships **${agents} agents** and **${skills} skills** (${invocable} of the skills are directly user-invocable; the rest are inherited by the agents that need them).`);
  out.push('');
  out.push('Each description below is the agent or skill\'s own shipped `description:` —');
  out.push('the exact text the host reads when deciding whether to fire it. You do not');
  out.push('need to learn this page. Ask a front door for an outcome and it routes; come');
  out.push('here when you want to know who owns a particular judgment.');
  out.push('');
  out.push('- **Not sure who to ask?** [How kai works](../how-kai-works.md) has the trigger table.');
  out.push('- **Want to see it running?** [`examples/e2e-feature-delivery/`](../../examples/e2e-feature-delivery/).');
  out.push('');

  for (const kind of ['agent', 'skill']) {
    out.push(kind === 'agent' ? '## Agents' : '## Skills');
    out.push('');
    if (kind === 'skill') {
      out.push('Skills are methods and contracts. Most are inherited by an agent rather than');
      out.push('invoked directly — the agent names them on its `**Inherits:**` line.');
      out.push('');
    }
    for (const cat of CATEGORIES.filter((c) => c.kind === kind)) {
      out.push(`### ${cat.title}`);
      out.push('');
      out.push(cat.blurb);
      out.push('');
      out.push('| Name | What it owns |');
      out.push('| ---- | ------------ |');
      for (const m of cat.members) {
        const item = items.get(m);
        const link = item.kind === 'agent' ? `../../agents/${m}.agent.md` : `../../skills/${m}/SKILL.md`;
        out.push(`| [\`${m}\`](${link}) | ${cell(stripQuotes(item.fm.description || ''))} |`);
      }
      out.push('');
    }
  }

  out.push('---');
  out.push('');
  out.push('**Next:** [How kai works](../how-kai-works.md) · [Workspace model](../workspaces.md) ·');
  out.push('[Getting started](../getting-started.md)');
  out.push('');
  return out.join('\n');
}

// ---------------------------------------------------------------------------
const check = process.argv.includes('--check');
let content;
try {
  content = build(readAll());
} catch (e) {
  console.log(`\u2717 generate-catalog: ${e.message}`);
  for (const p of e.problems || []) console.log(`    ${p}`);
  process.exit(1);
}

const norm = (s) => s.replace(/\r\n/g, '\n');
if (check) {
  if (!existsSync(OUT)) {
    console.log('\u2717 docs:check: docs/reference/agents-and-skills.md is missing (run `npm run docs:generate`)');
    process.exit(1);
  }
  if (norm(readFileSync(OUT, 'utf8')) !== norm(content)) {
    console.log('\u2717 docs:check: docs/reference/agents-and-skills.md is stale (run `npm run docs:generate` and commit the result)');
    process.exit(1);
  }
  console.log('\u2713 docs:check: the generated agent/skill catalog matches the shipped surface');
} else {
  mkdirSync(dirname(OUT), { recursive: true });
  writeFileSync(OUT, content.endsWith('\n') ? content : `${content}\n`);
  console.log('\u2713 wrote docs/reference/agents-and-skills.md');
}
