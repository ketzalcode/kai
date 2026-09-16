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

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseFrontmatter, stripQuotes, isUserInvocable } from './lib/loader-contract.mjs';
import { sourceAgentFiles, sourceSkillFiles } from './lib/pack-plan.mjs';

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
    blurb: 'Delivery coordination, on explicit request. Nothing has to be routed through it.',
    members: ['director-chief-of-staff'],
  },
  {
    kind: 'agent',
    title: 'Engineering',
    blurb: 'Direct technical decisions and complete implementations. Architecture is situational; domain methods do not require separate agents.',
    members: [
      'eng-lead-architecture', 'eng-builder-software', 'eng-builder-platform',
    ],
  },
  {
    kind: 'agent',
    title: 'Intake & delivery',
    blurb: 'Bounded investigation, PR preparation, and release evidence. Direct calls work without a team pipeline; coordinated wiring is separate. Kai never merges or deploys itself.',
    members: ['eng-advisor-investigation', 'workflow-pull-request', 'workflow-ship'],
  },
  {
    kind: 'agent',
    title: 'Trust & reliability',
    blurb: 'Independent judgment on security, privacy, reliability, and live incidents.',
    members: [
      'eng-reviewer-security', 'eng-reviewer-privacy-compliance', 'eng-reviewer-reliability',
      'workflow-incident-response',
    ],
  },
  {
    kind: 'agent',
    title: 'Product',
    blurb: 'Discovery, scope, evidence, analytics, product-led growth, and independent product assessment. UI and brand design belong to creative.',
    members: [
      'principal-product-manager', 'principal-product-strategist',
      'principal-data-analytics', 'workflow-customer-feedback',
      'workflow-experiment-review', 'workflow-product-explore',
      'persona-ux-first-time-user', 'principal-growth',
      'persona-professional-nutritionist', 'persona-professional-trainer',
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
      'workflow-creative-demo-production',
    ],
  },
  {
    kind: 'agent',
    title: 'Revenue',
    blurb: 'Sales, pricing, partnerships, revenue operations, customer success, and support intake from supplied evidence. Only you accept terms or contact customers.',
    members: [
      'principal-sales', 'principal-pricing-monetization', 'principal-partnerships',
      'principal-revenue-operations', 'principal-customer-success', 'workflow-support-triage',
    ],
  },
  {
    kind: 'agent',
    title: 'Solution architecture',
    blurb: 'Revenue-owned pre-sales technical fit and solution design, not implementation or commercial commitments.',
    members: ['principal-solutions-architect'],
  },
  {
    kind: 'agent',
    title: 'Learning & career development',
    blurb: 'Teach supplied topics, package source-faithful lessons, steward learning paths, and mentor IC engineering careers. Markdown, HTML, and audio are separate outcomes.',
    members: [
      'instructor-tutor', 'instructor-teacher', 'instructor-path-mentor',
      'principal-engineer-career-mentor', 'workflow-course-to-audio',
    ],
  },
  {
    kind: 'agent',
    title: 'Marketing',
    blurb: 'Positioning, campaigns, LinkedIn content, and search assessments from supplied facts and evidence. Never auto-publishes.',
    members: [
      'principal-product-marketing', 'principal-demand-generation',
      'principal-linkedin-strategist', 'principal-seo',
    ],
  },
  {
    kind: 'agent',
    title: 'Implementation & system review',
    blurb: 'Independent code review and browser/API/CLI/system acceptance. Implementers retain ownership of their regression tests.',
    members: ['eng-reviewer-code', 'eng-reviewer-quality'],
  },
  {
    kind: 'agent',
    title: 'Personal assistance',
    blurb: 'Your own tasks, briefings, and drafts. Invoked directly; never a router.',
    members: ['personal-assistant', 'persona-self'],
  },
  {
    kind: 'agent',
    title: 'Private workspace signals',
    blurb: 'Core-owned weekly synthesis and explicitly requested signal scans.',
    members: [
      'workflow-weekly-pulse', 'workflow-proactive-scan',
    ],
  },
  {
    kind: 'skill',
    title: 'Workspace & scope',
    blurb: 'The shared contracts every acting agent loads: where work goes, and what it may change.',
    members: [
      'kai-core-operating-rules', 'kai-core-workspace-paths', 'kai-core-workspace-initiative', 'kai-core-workspace-onboarding',
      'kai-core-work-activity', 'kai-core-fleet-observation', 'kai-core-definition-of-done', 'kai-core-scope-discipline',
      'kai-core-no-self-remediation',
      'kai-core-issue-analysis', 'kai-core-initiative-stewardship', 'kai-core-peer-communication',
      'kai-core-contract-v1',
    ],
  },
  {
    kind: 'skill',
    title: 'Product exploration',
    blurb: 'Neutral maps from supplied evidence or an authorized live surface, without design or scope judgment.',
    members: ['product-exploration'],
  },
  {
    kind: 'skill',
    title: 'Work coordination & artifacts',
    blurb: 'How an acting agent claims, leases, and tracks a work item, and how it produces and closes the artifacts that work leaves behind.',
    members: [
      'kai-core-work-acting', 'kai-core-work-granting', 'kai-core-work-item',
      'kai-core-asset-producing', 'kai-core-asset-closing',
    ],
  },
  {
    kind: 'skill',
    title: 'Agent authoring',
    blurb: 'Classify, name, scope, and validate a new or redesigned Kai role before it joins the fleet.',
    members: ['kai-core-create-agent'],
  },
  {
    kind: 'skill',
    title: 'Engineering craft',
    blurb: 'Task-local methods for authorized implementation, bounded evidence, requested orientation, delivery decomposition, and useful visuals.',
    members: [
      'coding-style', 'research-before-coding', 'pr-sizing', 'kai-core-pr-delivery',
      'onboard-to-codebase', 'build-diagrams',
    ],
  },
  {
    kind: 'skill',
    title: 'Design grounding',
    blurb: 'The shared design-system grounding contract, with the frontend seam.',
    members: ['kai-core-design-grounding'],
  },
  {
    kind: 'skill',
    title: 'Creative methods',
    blurb: 'Structural and visual mockups, block diagrams, measured narration operations, and declared-focus rendering.',
    members: [
      'mockups-ascii', 'mockups-html', 'html-block-diagrams',
      'video-create-narration', 'video-align-narration', 'video-render-zoom',
    ],
  },
  {
    kind: 'skill',
    title: 'Marketing methods',
    blurb: 'Grounded intelligence and LinkedIn drafts with provenance, claim ledgers, and optional personal voicing.',
    members: ['product-marketing-intelligence', 'linkedin-content'],
  },
  {
    kind: 'skill',
    title: 'Web & content',
    blurb: 'Browser-run plumbing, content methods, and shared claim safety.',
    members: [
      'kai-core-web-evaluation', 'kai-core-web-content-extraction', 'kai-core-content-grounding',
      'kai-core-pulse-digest',
    ],
  },
  {
    kind: 'skill',
    title: 'Learning method & shared audio',
    blurb: 'Learning owns the offline HTML lesson method; core owns the separately confirmed audio utility. Neither output proves the other exists.',
    members: ['kai-core-generate-audio', 'generate-html-lesson'],
  },
  {
    kind: 'skill',
    title: 'Assistant methods',
    blurb: 'The private methods behind the personal assistant and persona-self. Never autonomous.',
    members: ['personal-agenda', 'decision-brief', 'extract-writing-style', 'write-in-user-voice'],
  },
  {
    kind: 'skill',
    title: 'Operator signals',
    blurb: 'Core\'s own reading of what the team records need a human for, plus the runner-invoked notification contract.',
    members: ['kai-core-proactive-scan'],
  },
];

// ---------------------------------------------------------------------------
// Read the shipped surface
// ---------------------------------------------------------------------------
function readAll() {
  const items = new Map();
  for (const entry of sourceAgentFiles(ROOT)) {
    const pf = parseFrontmatter(readFileSync(entry.path, 'utf8'));
    if (!pf.ok) throw new Error(`${entry.rel}: ${pf.reason}`);
    items.set(entry.id, { id: entry.id, kind: 'agent', fm: pf.fm, path: entry.rel });
  }
  for (const entry of sourceSkillFiles(ROOT)) {
    const pf = parseFrontmatter(readFileSync(entry.path, 'utf8'));
    if (!pf.ok) throw new Error(`${entry.rel}: ${pf.reason}`);
    items.set(entry.id, { id: entry.id, kind: 'skill', fm: pf.fm, path: entry.rel });
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
  out.push(`kai ships **${agents} agents** and **${skills} skills** (${invocable} of the skills are directly user-invocable; the rest load on demand, routed by the agents that need them at the step that needs each one).`);
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
      out.push('Skills are methods and contracts. Most are not invoked directly —');
      out.push('an acting agent loads each one on demand, at the exact instruction that needs it.');
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
        const link = `../../${item.path}`;
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
