import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  agentProfileModelErrors,
  agentRoutingErrors,
  routedSkills,
  sourceAgentFiles,
  sourceSkillFiles,
} from '../scripts/lib/pack-plan.mjs';
import { parseScreenplay } from '../scripts/demo-capture.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const finalCreativeSkills = [
  'html-block-diagrams',
  'mockups-ascii',
  'mockups-html',
  'video-align-narration',
  'video-render-zoom',
];
const inactiveCreativeSkills = [
  'create-product-demo',
  'demo-capture',
  'demo-narrate',
  'demo-zoom',
  'ui-mockup',
  'video-direction',
];
const targetIds = [
  'creative-lead-design',
  'creative-lead-video',
  'workflow-creative-demo-production',
];
const knownSkills = new Set([
  ...sourceSkillFiles(root)
    .filter(entry => entry.pack === 'core')
    .map(entry => entry.id),
  ...finalCreativeSkills,
]);
const knownAgents = new Set([
  ...sourceAgentFiles(root).map(entry => entry.id),
  ...targetIds,
]);

function parseAgent(id) {
  const path = join(root, 'plugins', 'kai-creative', 'agents', `${id}.agent.md`);
  assert.ok(existsSync(path), `${id}: expected agent file ${path}`);
  const body = readFileSync(path, 'utf8').replace(/\r\n/g, '\n');
  const frontmatter = body.match(/^---\n([\s\S]*?)\n---\n/);
  assert.ok(frontmatter, `${id}: expected YAML frontmatter`);
  const field = name => frontmatter[1].match(new RegExp(`^${name}:\\s*(.+)$`, 'm'))?.[1];
  return {
    id,
    path,
    body,
    fm: {
      name: field('name'),
      description: field('description'),
      model: field('model'),
      tools: JSON.parse(field('tools')),
    },
  };
}

function collectedActiveCreativeRoutes(body) {
  const routes = new Set(routedSkills(body));
  return finalCreativeSkills.filter(skill => routes.has(skill)).sort();
}

function withExtraRoute(agent, sentence) {
  return {
    ...agent,
    body: `${agent.body.trimEnd()}\n\n${sentence}\n`,
  };
}

function screenplayExamples(agent) {
  return [...agent.body.matchAll(/```json\s*([\s\S]*?)```/g)]
    .map(match => match[1].trim())
    .filter(source => JSON.parse(source).schema === 'kai.demo-screenplay/v1');
}

function assertContract(agent, {
  model,
  profile,
  tools,
  requiredRoutes,
  allowedActiveCreativeRoutes,
  bodyPatterns,
}) {
  assert.equal(agent.fm.name, agent.id);
  assert.equal(agent.fm.model, `"${model}"`);
  assert.deepEqual(agent.fm.tools, tools, `${agent.id}: tools must stay least-privilege`);
  assert.ok(!agent.fm.tools.some(tool =>
    ['agent', 'read_agent', 'write_agent'].includes(tool)),
  `${agent.id}: operator/core coordination dispatches roles`);
  assert.match(agent.fm.description, /^".*(Use|Runs|Produces|Directs|Designs).*"$/);
  assert.match(agent.body, new RegExp(
    `^\\*\\*Primary profile:\\*\\* ${profile}$`, 'm',
  ));
  assert.deepEqual(
    agentProfileModelErrors({ id: agent.id, body: agent.body, fm: agent.fm }),
    [],
    `${agent.id}: profile/model contract`,
  );
  assert.deepEqual(agentRoutingErrors({
    id: agent.id,
    body: agent.body,
    tools: agent.fm.tools,
    knownSkills,
    knownAgents,
  }), [], `${agent.id}: on-demand routing contract`);
  assert.doesNotMatch(agent.body, /^\*\*Inherits:\*\*/m);

  const routes = new Set(routedSkills(agent.body));
  for (const route of requiredRoutes) {
    assert.ok(routes.has(route), `${agent.id}: must route ${route} where needed`);
  }
  for (const route of inactiveCreativeSkills) {
    assert.ok(!routes.has(route), `${agent.id}: must not route inactive ${route}`);
  }
  assert.deepEqual(
    collectedActiveCreativeRoutes(agent.body),
    [...allowedActiveCreativeRoutes].sort(),
    `${agent.id}: active creative routes must stay within ${allowedActiveCreativeRoutes.join(', ') || '(none)'}`,
  );
  const normalizedBody = agent.body.replace(/\s+/g, ' ');
  for (const pattern of bodyPatterns) {
    assert.match(normalizedBody, pattern, `${agent.id}: missing ${pattern}`);
  }

  const lines = agent.body.split('\n').length;
  assert.ok(lines <= 250,
    `${agent.id}: expected at most 250 authored lines, got ${lines}`);
  assert.ok(agent.body.length < 20_000,
    `${agent.id}: expected under 20000 characters, got ${agent.body.length}`);
}

const design = parseAgent('creative-lead-design');
const designContract = {
  model: 'claude-opus-5',
  profile: 'judgment',
  tools: ['playwright', 'execute', 'read', 'edit', 'search', 'ask_user', 'skill'],
  requiredRoutes: [
    'kai-core-contract-v1',
    'kai-core-operating-rules',
    'kai-core-workspace-paths',
    'kai-core-work-acting',
    'kai-core-work-activity',
    'kai-core-design-grounding',
    'kai-core-scope-discipline',
    'mockups-ascii',
    'mockups-html',
    'html-block-diagrams',
  ],
  allowedActiveCreativeRoutes: [
    'html-block-diagrams',
    'mockups-ascii',
    'mockups-html',
  ],
  bodyPatterns: [
    /interaction design[\s\S]*visual identity/i,
    /PM\/steward[\s\S]{0,100}exact revision/i,
    /frontend[\s\S]{0,100}feasibility[\s\S]{0,100}new tokens/i,
    /QA remains independent/i,
    /REVIEW[\s\S]{0,400}findings[\s\S]{0,120}(do not|never) repair/i,
    /adequate supplied[\s\S]{0,120}without a full design system/i,
    /only the alternatives the decision needs/i,
    /interactive.prototype request.{0,100}outside this base/i,
    /operator[\s\S]{0,100}(adopts|adoption)/i,
    /never own product priority or positioning/i,
    /never emit production frontend code/i,
  ],
};
assertContract(design, designContract);

const video = parseAgent('creative-lead-video');
const videoScreenplays = screenplayExamples(video);
assert.ok(videoScreenplays.length > 0,
  'creative-lead-video: expected at least one fenced screenplay example');
for (const [index, source] of videoScreenplays.entries()) {
  assert.doesNotThrow(
    () => parseScreenplay(source),
    `creative-lead-video: fenced screenplay example ${index + 1} must satisfy the real parser`,
  );
}
const videoContract = {
  model: 'claude-opus-5',
  profile: 'judgment',
  tools: ['execute', 'read', 'edit', 'search', 'ask_user', 'skill'],
  requiredRoutes: [
    'kai-core-contract-v1',
    'kai-core-operating-rules',
    'kai-core-workspace-paths',
    'kai-core-work-acting',
    'kai-core-work-activity',
    'kai-core-content-grounding',
  ],
  allowedActiveCreativeRoutes: [],
  bodyPatterns: [
    /story, scene, script, and screenplay craft/i,
    /only the requested outputs/i,
    /product_context\.json[\s\S]{0,100}sole factual authority/i,
    /existing[\s\S]{0,160}generated[\s\S]{0,160}capture-required[\s\S]{0,160}reference-only/i,
    /source timeline[\s\S]{0,140}recorded footage/i,
    /visual_span[\s\S]{0,120}start_after[\s\S]{0,160}(timestamp|offset)/i,
    /do not record, render, synthesize, mix, or publish/i,
    /no five-file quota/i,
    /no storyboarding skill/i,
  ],
};
assertContract(video, videoContract);

const production = parseAgent('workflow-creative-demo-production');
const productionContract = {
  model: 'claude-sonnet-5',
  profile: 'procedure',
  tools: ['execute', 'read', 'edit', 'ask_user', 'skill'],
  requiredRoutes: [
    'kai-core-contract-v1',
    'kai-core-operating-rules',
    'kai-core-workspace-paths',
    'kai-core-work-acting',
    'kai-core-work-activity',
    'video-align-narration',
    'video-render-zoom',
  ],
  allowedActiveCreativeRoutes: [
    'video-align-narration',
    'video-render-zoom',
  ],
  bodyPatterns: [
    /starts only from supplied media and approved direction/i,
    /missing recording or take is an input gap/i,
    /do not call `creative-lead-video` automatically/i,
    /zoom and narration are optional/i,
    /parent of this agent's `agents\/` directory[\s\S]{0,100}provider root/i,
    /never[\s\S]{0,80}(cwd|working directory)/i,
    /scripts\/demo-format\.mjs/,
    /exact helper status[\s\S]{0,100}INCOMPLETE/i,
    /step-ID[\s\S]{0,120}not[\s\S]{0,100}file bytes/i,
    /captions[\s\S]{0,120}declared[\s\S]{0,100}not inspected/i,
    /word budget[\s\S]{0,120}forecast/i,
    /exit zero[\s\S]{0,100}INCOMPLETE/i,
    /does not establish[\s\S]{0,120}(visible|readable)/i,
    /no external publication/i,
  ],
};
assertContract(production, productionContract);

assert.throws(
  () => assertContract(
    withExtraRoute(design, 'Invoke `video-render-zoom` when a production focus effect would help.'),
    designContract,
  ),
  /creative-lead-design: active creative routes must stay within/,
  'design contract should reject a forbidden active production route',
);

assert.throws(
  () => assertContract(
    withExtraRoute(video, 'Invoke `video-render-zoom` when spoken copy needs production output.'),
    videoContract,
  ),
  /creative-lead-video: active creative routes must stay within/,
  'video contract should reject a forbidden active production route',
);

const routedFinalSkills = new Set(
  [design, video, production].flatMap(agent => routedSkills(agent.body)),
);
assert.deepEqual(
  finalCreativeSkills.filter(skill => routedFinalSkills.has(skill)).sort(),
  finalCreativeSkills,
  'the three roles must cover the approved six-skill interface',
);

console.log('creative agent contract assertions passed');
