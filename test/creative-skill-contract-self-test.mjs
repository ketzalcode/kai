import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { routedSkills, sourceSkillFiles } from '../scripts/lib/pack-plan.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const ids = [
  'mockups-ascii',
  'mockups-html',
  'video-create-narration',
  'video-align-narration',
  'video-render-zoom',
  'html-block-diagrams',
  'ascii-motion-source',
  'ascii-motion-render',
];
const retiredCreativeSkills = [
  'create-product-demo',
  'demo-capture',
  'demo-narrate',
  'demo-zoom',
  'ui-mockup',
  'video-direction',
];
const selected = process.argv[2] ?? 'all';
assert.ok(
  selected === 'all' || ids.includes(selected),
  `unknown creative skill contract selector "${selected}"`,
);

const failures = [];
const selectedIds = selected === 'all' ? ids : [selected];
const normalize = body => body.replace(/\s+/g, ' ').trim().toLowerCase();
const knownSkills = new Set(sourceSkillFiles(root).map(entry => entry.id));

function expect(id, condition, label) {
  if (!condition) failures.push(`${id}: ${label}`);
}

function expectMatch(id, body, label, pattern) {
  expect(id, pattern.test(body), `missing ${label}`);
}

function expectNoMatch(id, body, label, pattern) {
  expect(id, !pattern.test(body), `forbidden ${label}`);
}

function parseSkill(id) {
  const path = join(root, 'plugins', 'kai-creative', 'skills', id, 'SKILL.md');
  try {
    assert.ok(existsSync(path), `${id}: expected skill file ${path}`);
  } catch (error) {
    failures.push(error.message);
    return null;
  }

  const body = readFileSync(path, 'utf8').replace(/\r\n/g, '\n');
  const frontmatter = body.match(/^---\n([\s\S]*?)\n---(?:\n|$)/);
  expect(id, Boolean(frontmatter), 'valid YAML frontmatter');
  if (!frontmatter) return null;

  const field = name =>
    frontmatter[1].match(new RegExp(`^${name}:\\s*(.+)$`, 'm'))?.[1].trim();
  const description = (field('description') ?? '').replace(/^["']|["']$/g, '');
  expect(id, field('name') === id, `frontmatter name must be ${id}`);
  expect(id, /^Use when\b/.test(description), 'description must be trigger-only and start with "Use when"');
  expectNoMatch(
    id,
    description,
    'workflow or outcome instructions in description',
    /\b(?:first|then|after that|returns?|outputs?|steps?)\b/i,
  );
  expect(id, field('tools') === undefined, 'frontmatter must not declare tools');
  if (field('user-invocable') !== undefined) {
    expect(id, field('user-invocable') === 'true', 'user-invocable, when present, must be true');
  }

  const routes = routedSkills(body);
  const retiredRoutes = routes.filter(route => retiredCreativeSkills.includes(route));
  const chainedMethods = routes.filter(route => ids.includes(route));
  const unresolvedRoutes = routes.filter(route => !knownSkills.has(route));
  expect(id, retiredRoutes.length === 0,
    `must not route retired creative skills (found: ${retiredRoutes.join(', ')})`);
  expect(id, chainedMethods.length === 0,
    `must not make another approved creative method a routed chain (found: ${chainedMethods.join(', ')})`);
  expect(id, unresolvedRoutes.length === 0,
    `routed skills must resolve to active definitions (missing: ${unresolvedRoutes.join(', ')})`);
  expectNoMatch(id, body, 'eager inheritance list', /^\*\*Inherits:\*\*/m);

  const referencePaths = [...body.matchAll(/references\/[a-z0-9._/-]+\.md/gi)]
    .map(match => match[0])
    .filter((value, index, all) => all.indexOf(value) === index);
  for (const reference of referencePaths) {
    expect(id, existsSync(join(dirname(path), ...reference.split('/'))),
      `referenced companion must exist: ${reference}`);
  }

  return {
    body,
    description,
    normalized: normalize(body),
    path,
    routes,
  };
}

function assertDescription(id, skill, patterns) {
  if (!skill) return;
  for (const [label, pattern] of patterns) {
    expectMatch(id, skill.description, `description ${label}`, pattern);
  }
}

function assertConditionalCoreRoutes(id, skill) {
  if (!skill) return;
  const coreRoutes = skill.routes.filter(route => route.startsWith('kai-core-'));
  for (const route of coreRoutes) {
    const escaped = route.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    expectMatch(
      id,
      skill.normalized,
      `${route} route to stay condition-bound`,
      new RegExp(
        `(?:when|if|before|only for|as needed)[^.]{0,180}` +
        `(?:load|invoke|apply|run) \`${escaped}\`|` +
        `(?:load|invoke|apply|run) \`${escaped}\`[^.]{0,180}(?:when|if|before|only for|as needed)`,
      ),
    );
  }
}

function assertProviderCommands(id, skill, script, operations) {
  if (!skill) return;
  expectMatch(
    id,
    skill.normalized,
    'provider root resolved from the loaded skill location',
    /loaded skill.{0,120}(?:base|source|directory).{0,160}(?:provider root|kai-creative provider)/,
  );
  expectMatch(
    id,
    skill.normalized,
    'provider root must not be derived from cwd or a search hit',
    /(?:never|do not).{0,100}(?:cwd|working directory).{0,160}(?:search|other installed|first hit)/,
  );
  for (const operation of operations) {
    expectMatch(
      id,
      skill.body,
      `absolute provider-root ${script} ${operation} command`,
      new RegExp(
        `node\\s+["']?<[^>]*creative[^>]*>[\\\\/]scripts[\\\\/]${script.replace('.', '\\.')}` +
        `["']?[^\\n]*${operation.replace('--', '\\-\\-')}`,
        'i',
      ),
    );
  }
  expectNoMatch(
    id,
    skill.body,
    `cwd-relative ${script} command`,
    new RegExp(`node\\s+["']?(?:\\.\\.?[\\\\/])?scripts[\\\\/]${script.replace('.', '\\.')}`, 'i'),
  );
}

function assertMockupsAscii(skill) {
  const id = 'mockups-ascii';
  if (!skill) return;
  assertDescription(id, skill, [
    ['names ASCII or wireframes', /\b(?:ascii|wireframe)\b/i],
    ['names a structural decision', /\b(?:layout|placement|grouping|hierarchy|structure)\b/i],
  ]);
  for (const [label, pattern] of [
    ['structural low-fidelity outcome', /(?:structural|low.fidelity).{0,100}(?:layout|mock|wireframe)/],
    ['explicit or unresolved structural trigger',
      /explicit.{0,60}(?:ascii|wireframe)|unresolved.{0,100}(?:placement|grouping|hierarchy)/],
    ['styling and interactive negative triggers',
      /(?:color|type|styling|component feel).{0,140}(?:html|interactive|not|instead)|interactive.{0,80}(?:exercise|prototype)/],
    ['approved outcome and fixed constraints authority',
      /approved outcome.{0,120}(?:fixed|open).{0,40}constraints/],
    ['current surface or state evidence', /(?:current|relevant).{0,60}(?:surface|state).{0,40}evidence/],
    ['unknown surfaces remain unknown', /unknown.{0,50}(?:not invent|remain unknown)/],
    ['small proportional outcome', /one inline.{0,60}(?:ascii|mock)|only the (?:real )?alternatives.{0,80}decision/],
    ['no-addition outcome', /(?:no addition|no new mock|insights only)/],
    ['independent from HTML', /(?:independent|no automatic).{0,80}(?:html|mockups-html)/],
    ['implementation stop', /(?:stop|do not|not).{0,100}implementation/],
    ['conditional design grounding', /(?:apply|load) `kai-core-design-grounding`.{0,140}(?:when|if)|(?:when|if).{0,140}(?:apply|load) `kai-core-design-grounding`/],
    ['conditional scope discipline', /(?:apply|load) `kai-core-scope-discipline`.{0,140}(?:when|if)|(?:when|if).{0,140}(?:apply|load) `kai-core-scope-discipline`/],
  ]) expectMatch(id, skill.normalized, label, pattern);
  for (const [label, pattern] of [
    ['minimum option quota', /(?:3\s*[-–]\s*4|at least\s+\d+|minimum.{0,30}options?|mandatory.{0,30}options?)/],
    ['prototype expansion', /(?:build|create|produce).{0,80}(?:interactive|executable).{0,30}prototype/],
    ['mandatory workspace', /(?:must|always|required to).{0,80}(?:workspace|\.kai)/],
  ]) expectNoMatch(id, skill.normalized, label, pattern);
  assertConditionalCoreRoutes(id, skill);
}

function assertMockupsHtml(skill) {
  const id = 'mockups-html';
  if (!skill) return;
  assertDescription(id, skill, [
    ['names HTML mockups', /\bhtml\b/i],
    ['names appearance or responsive layout', /\b(?:appearance|visual hierarchy|component|responsive)\b/i],
  ]);
  for (const [label, pattern] of [
    ['reviewable visual outcome', /(?:visual hierarchy|component appearance|responsive layout).{0,120}(?:review|mock)/],
    ['appearance-dependent trigger', /(?:explicit.{0,50}html|depends on.{0,80}(?:appearance|responsive|component))/],
    ['ASCII-sufficient negative trigger', /ascii.{0,100}(?:already|sufficient|communicates|enough)/],
    ['prototype negative trigger', /(?:interactive|simulated).{0,80}(?:prototype|transition|behavior|behaviour)/],
    ['approved need and destination authority', /approved (?:need|outcome).{0,120}(?:destination|viewport)/],
    ['token evidence boundary', /(?:current|supplied).{0,50}tokens.{0,120}(?:neutral|proposed|on.brand)/],
    ['screenshot evidence boundary', /screenshots?.{0,80}(?:not|do not).{0,50}(?:token|source).{0,30}truth/],
    ['single scoped outcome', /one scoped.{0,80}(?:self.contained|offline).{0,40}html/],
    ['offline output',
      /(?:self.contained|inline css).{0,100}(?:offline|no (?:cdn|network|build|dependency))|offline.{0,100}(?:self.contained|inline css|no (?:cdn|network|build|dependency))/],
    ['single-file assets', /no local file dependencies/],
    ['actual inspection status', /actual inspection status|rendered fidelity.{0,80}(?:browser|render)/],
    ['independent from ASCII', /(?:independent|no automatic).{0,80}(?:ascii|mockups-ascii)/],
    ['authority stop', /(?:do not|not).{0,80}(?:lock|adopt).{0,80}(?:authority|owner)|scope\/adoption authority/],
    ['implementation stop', /(?:stop|do not|not).{0,100}(?:implement|production frontend)/],
    ['conditional design grounding', /(?:apply|load) `kai-core-design-grounding`.{0,140}(?:when|if)|(?:when|if).{0,140}(?:apply|load) `kai-core-design-grounding`/],
    ['conditional scope discipline', /(?:apply|load) `kai-core-scope-discipline`.{0,140}(?:when|if)|(?:when|if).{0,140}(?:apply|load) `kai-core-scope-discipline`/],
  ]) expectMatch(id, skill.normalized, label, pattern);
  for (const [label, pattern] of [
    ['minimum option quota', /(?:3\s*[-–]\s*4|at least\s+\d+|minimum.{0,30}options?|mandatory.{0,30}options?)/],
    ['automatic ASCII stage', /(?:first|before|must|always).{0,100}(?:ascii|mockups-ascii)/],
    ['interactive prototype expansion', /(?:build|create|produce).{0,80}(?:interactive|executable).{0,30}prototype/],
    ['external HTML dependency', /(?:cdn|npm install|external (?:script|stylesheet)|build step).{0,50}(?:required|must|always)/],
  ]) expectNoMatch(id, skill.normalized, label, pattern);
  assertConditionalCoreRoutes(id, skill);
}

function assertVideoCreateNarration(skill) {
  const id = 'video-create-narration';
  if (!skill) return;
  assertDescription(id, skill, [
    ['names narration', /\bnarration\b/i],
    ['names estimate or synthesis', /\b(?:estimate|synthesi[sz])\w*\b/i],
  ]);
  for (const [label, pattern] of [
    ['estimate and synthesis responsibility', /estimate.{0,100}synthesi[sz]/],
    ['explicit operation trigger', /explicit.{0,80}(?:estimate|synthesi[sz])/],
    ['silent or supplied-clip negative trigger', /silent.{0,100}(?:no|skip)|supplied.{0,80}clips?.{0,80}(?:no|skip|need)/],
    ['helper-accepted screenplay input', /screenplay.{0,100}(?:accepted|validated).{0,80}(?:helper|demo-(?:narrate|format))/],
    ['paid processing and disclosure consent', /(?:paid|charge).{0,120}(?:consent|authori[sz]).{0,120}(?:disclosure|external)|(?:disclosure|external).{0,120}(?:consent|authori[sz])/],
    ['no automatic paid retry', /(?:no|never|do not).{0,50}(?:automatic(?:ally)? )?retry.{0,100}(?:new|fresh).{0,50}authori[sz]/],
    ['estimate is not measurement', /estimate.{0,80}(?:not|isn.t|does not).{0,40}measure/],
    ['estimate does not require product grounding', /estimation.{0,120}does not require factual grounding/],
    ['claim grounding is synthesis-specific', /before synthesizing product.claim narration.{0,80}load `kai-core-content-grounding`/],
    ['measured clip output', /demo_narration_take\.json.{0,100}measured|measured.{0,100}demo_narration_take\.json/],
    ['visible partial failures', /(?:failed clips?|partial).{0,100}(?:report|visible|explicit)/],
    ['actual paths reporting', /(?:actual|exact).{0,40}paths?/],
    ['no automatic alignment', /(?:no|never|do not).{0,80}(?:automatic(?:ally)? )?(?:alignment|placement|mix)/],
    ['script or story non-responsibility',
      /(?:does not|not).{0,100}(?:own|write|rewrite).{0,80}(?:script|story)|(?:script|story).{0,80}(?:not|does not).{0,50}(?:own|write|rewrite)/],
    ['placement and mixing non-responsibility',
      /(?:does not|not).{0,100}(?:place|align|mix)|(?:placement|alignment|mixing).{0,80}(?:not|does not)/],
  ]) expectMatch(id, skill.normalized, label, pattern);
  assertProviderCommands(id, skill, 'demo-narrate.mjs', ['--estimate', '--synthesize']);
}

function assertVideoAlignNarration(skill) {
  const id = 'video-align-narration';
  if (!skill) return;
  assertDescription(id, skill, [
    ['names narration alignment', /\b(?:align|placement|mix)\w*\b/i],
    ['names measured media', /\b(?:measured|clips?|media|footage)\b/i],
  ]);
  for (const [label, pattern] of [
    ['measured placement responsibility', /(?:place|align).{0,100}measured.{0,100}(?:clips?|speech|states?)/],
    ['explicit placement or mix trigger', /explicit.{0,80}(?:placement|fit|mix)/],
    ['screenplay input', /\bscreenplay\b/],
    ['measured take input', /measured take/],
    ['measured clip input', /(?:measured clips?|narration take)/],
    ['relevant footage evidence input', /(?:relevant footage|visual.state evidence)/],
    ['mix needs compatible video and distinct output', /mix.{0,160}compatible.{0,50}(?:video|render).{0,160}(?:distinct|different).{0,50}output/],
    ['all relevant states including interior and start_after', /all relevant states.{0,160}interior states.{0,160}start_after/],
    ['recording and speech takes are distinct', /demo_take\.json.{0,160}demo_narration_take\.json/],
    ['recording defect has a recording remedy', /replacement measured recording take/],
    ['usable speech is reused for the next check', /reuse.{0,80}existing clips.{0,80}next fit check/],
    ['waiting cannot repair a recorded take', /waiting does not repair a completed recording/],
    ['input changes invalidate placement', /changed inputs invalidate.{0,80}placement plan/],
    ['rebuild placement before remixing', /rebuild.{0,80}placement plan.{0,160}(fresh|new).{0,40}mix/],
    ['helper checks endpoints rather than whole span', /(?:helper|parser).{0,120}(?:endpoint|from.{0,50}through).{0,160}(?:not|weaker|does not).{0,80}(?:interior|whole.span|all relevant)/],
    ['missing visibility evidence remains unresolved', /missing.{0,80}visibility evidence.{0,80}(?:unresolved|gap|stop)/],
    ['fit plan command or mixed output', /(?:fit|rejection).{0,160}placement plan.{0,160}(?:printed|command).{0,160}(?:mixed|mix)/],
    ['printed command is not an executed mix', /(?:printed )?command.{0,50}(?:not|isn.t|does not).{0,50}(?:executed|mixed|output)/],
    ['actual mixed file existence', /(?:mixed|output) file.{0,100}(?:exists|existence|actual)/],
    ['no automatic synthesis', /(?:no|never|do not).{0,80}(?:automatic(?:ally)? )?synthesi[sz]/],
    ['no invented timing', /(?:invented|do not invent).{0,50}(?:offset|timing)/],
    ['no stretching or freezing to conceal latency',
      /(?:stretch|freez).{0,120}(?:not|never|do not|refus|conceal)|(?:not|never|do not|refus).{0,120}(?:stretch|freez)/],
  ]) expectMatch(id, skill.normalized, label, pattern);
  assertProviderCommands(id, skill, 'demo-narrate.mjs', ['--place', '--mix']);
}

function assertVideoRenderZoom(skill) {
  const id = 'video-render-zoom';
  if (!skill) return;
  assertDescription(id, skill, [
    ['names focus or zoom', /\b(?:focus|zoom)\b/i],
    ['names existing footage or video', /\b(?:footage|video|recording)\b/i],
  ]);
  for (const [label, pattern] of [
    ['focus operation responsibility', /(?:explain|compile|render|review).{0,140}(?:focus|zoom)/],
    ['explicit or legibility trigger', /explicit.{0,60}focus|evidenced.{0,80}legibility/],
    ['explanation is its own stopping point', /explain.only request ends at explanation/],
    ['contact sheet needs an existing render', /contact sheet depends on an existing render/],
    ['clear-footage negative trigger', /already.readable|clear footage.{0,80}(?:skip|no)/],
    ['supplied footage accepted', /(?:supplied|external|existing).{0,80}(?:footage|recording|video).{0,120}(?:accept|direct|without)/],
    ['manual focus measurements', /manual(?:ly)? (?:inspected|measured|focus).{0,100}(?:frame|coordinate|plan)/],
    ['no automatic tracking', /(?:no|never|does not|do not).{0,100}(?:automatic.{0,30}(?:tracking|activity)|cursor.track|subject.track)/],
    ['focus authority and evidence boundary', /(?:supplied intent|focus plan).{0,100}(?:chooses|declares).{0,80}(?:emphasis|focus).{0,140}(?:frames?|evidence|measure).{0,100}(?:coordinate|time)/],
    ['ffmpeg and ffprobe evidence roles', /ffmpeg.{0,100}render.{0,160}ffprobe.{0,120}(?:duration|audio)/],
    ['proportional outputs', /(?:plan|command).{0,160}(?:render|review sheet|contact sheet)/],
    ['printed command is not a render', /(?:printed )?command.{0,60}(?:not|isn.t|does not).{0,60}(?:render|executed|output)/],
    ['actual output and inspection status', /(?:output file|render).{0,120}(?:exists|existence|actual).{0,160}(?:inspection|review status)/],
    ['compiler limitations stay visible', /(?:clamping|clamped).{0,120}(?:skip|skipped).{0,120}(?:missing duration|duration evidence|unsettled)/],
    ['no invented empty-plan zoom', /(?:no|never|do not).{0,80}(?:invented|invent).{0,40}(?:zoom|focus)|empty plan.{0,80}(?:no|not)/],
    ['no automatic narration',
      /(?:no|never|do not).{0,100}(?:automatic(?:ally)? )?narration|narration.{0,80}(?:not automatic|does not automatically)/],
    ['no capture or recording ownership',
      /(?:no|never|do not|not).{0,100}(?:capture|recording)|(?:capture|recording).{0,80}(?:not|does not)/],
  ]) expectMatch(id, skill.normalized, label, pattern);
  assertProviderCommands(id, skill, 'demo-zoom.mjs', ['--compile', '--grid', '--plan', '--review']);
}

function assertHtmlBlockDiagrams(skill) {
  const id = 'html-block-diagrams';
  if (!skill) return;
  assertDescription(id, skill, [
    ['names structural diagrams', /\b(?:structural|block).{0,20}diagram\b/i],
    ['names an HTML or image destination', /\b(?:html|image)\b/i],
  ]);
  for (const [label, pattern] of [
    ['established relationship responsibility',
      /(?:established|supplied).{0,80}(?:layers|lanes|sequence|containment|comparison|relationship)/],
    ['explicit or material-value trigger',
      /explicit.{0,60}(?:structural|diagram)|(?:materially|meaningfully).{0,80}(?:improve|clearer|adds)/],
    ['prose-sufficient negative trigger', /prose.{0,80}(?:clear|sufficient|needs no)/],
    ['branching-graph negative trigger', /branching.{0,80}(?:outside|not supported|different)/],
    ['evidence authority', /established.{0,80}(?:entities|relationships).{0,160}(?:labels|destination|dimensions)/],
    ['example values are not subject facts', /(?:example|sample).{0,80}(?:palettes?|statuses?|paths?).{0,100}(?:not|aren.t).{0,50}(?:facts?|evidence|truth)/],
    ['no-diagram outcome', /(?:no addition|no diagram)/],
    ['meaningful fields only', /only meaningful fields/],
    ['caption and semantics craft', /captions?.{0,100}semantics/],
    ['long-label wrapping checks', /long.label.{0,80}wrapp/],
    ['offline output', /\boffline\b/],
    ['actual inspection status', /actual inspection status|inspection.{0,80}(?:performed|status)/],
    ['optional engineering neighbor', /build-diagrams.{0,100}(?:optional|not a prerequisite)/],
    ['progressive catalog load', /load `references\/catalog\.md` when/],
  ]) expectMatch(id, skill.normalized, label, pattern);

  const catalogPath = join(dirname(skill.path), 'references', 'catalog.md');
  expect(id, existsSync(catalogPath), 'references/catalog.md must exist');
  const combined = existsSync(catalogPath)
    ? `${skill.body}\n${readFileSync(catalogPath, 'utf8')}`
    : skill.body;
  expect(id, combined.includes('class="kai-connector" aria-hidden="true"'),
    'pipeline connectors need their own decorative aria-hidden element');
  for (const [label, pattern] of [
    ['guaranteed no-overlap claim',
      /(?:overlap\s+is\s+impossible|makes\s+overlap\s+impossible|cannot\s+overlap|no\s+overlap\s+(?:is|will be)\s+possible)/i],
    ['forced Mermaid direction', /(?:must|always|use|switch to)\s+`?mermaid`?/i],
    ['mandatory four-field cards',
      /(?:must|always|every|card.{0,80}(?:carries|needs|has)).{0,120}(?:four fields|name.{0,50}subtitle.{0,50}status.{0,50}(?:artifact )?path)/is],
    ['mandatory diagram quota', /at least (?:one|1) diagram/i],
  ]) expectNoMatch(id, combined, label, pattern);
}

function assertAsciiMotionSource(skill) {
  const id = 'ascii-motion-source';
  if (!skill) return;
  assertDescription(id, skill, [
    ['names ascii motion', /ascii motion/i],
    ['names a source or licence trigger', /\b(?:source|licence|license|origin)\b/i],
  ]);
  for (const [label, pattern] of [
    ['a prompt is not a source', /prompt.{0,80}(?:is a request|not a source)/],
    ['only supplied media and templates are licensed',
      /(?:supplie[sd]|operator).{0,120}(?:template|procedural).{0,160}nothing else is licensed/],
    ['a template is not footage of the subject',
      /template.{0,80}(?:generated arithmetic|not footage).{0,120}(?:not footage|named subject)/],
    ['giphy excluded outright', /giphy is excluded outright/],
    ['no fetching from a url or stock service', /never fetch media from a url|stock service/],
    ['licence recorded for supplied media too', /every clip carries licence and origin/],
    ['an unrecorded licence blocks rather than guesses',
      /unrecorded licence blocks.{0,80}(?:does not become a guess|not.{0,30}guess)/],
    ['missing tools reported, never installed',
      /(?:do not|never) install tools/],
    ['producing is not review or publication', /not review and not publication/],
  ]) expectMatch(id, skill.normalized, label, pattern);
  assertConditionalCoreRoutes(id, skill);
  assertProviderCommands(id, skill, 'ascii-motion.mjs', ['--probe', '--explain', '--template']);
}

function assertAsciiMotionRender(skill) {
  const id = 'ascii-motion-render';
  if (!skill) return;
  assertDescription(id, skill, [
    ['names ascii motion', /ascii motion|ascii animation/i],
    ['names a bundle or looping image destination', /\b(?:bundle|looping image)\b/i],
  ]);
  for (const [label, pattern] of [
    ['both artifacts are co-primary', /two artifacts are co-primary/],
    ['looping image covers what mp4 cannot', /mp4 cannot do/],
    ['neither artifact substitutes for the other', /neither one substitutes for the other/],
    ['still gate is spatial', /still gate catches spatial/],
    ['sample gate is temporal', /sample gate catches temporal/],
    ['a still is not evidence the motion reads',
      /still that looks right is not evidence that the motion does/],
    ['bundle grid disagreement is rejected, not resized',
      /disagreement is rejected, not resized/],
    ['export-only backend reports unsupported rather than an empty bundle',
      /unsupported.{0,120}rather than emitting an empty bundle/],
    ['printed command is not a render', /printed command is not a render/],
    ['missing tools reported, never installed', /(?:do not|never) install tools/],
    ['rendering is not review and review is not publication',
      /rendering is not review, and review is not publication/],
  ]) expectMatch(id, skill.normalized, label, pattern);
  assertConditionalCoreRoutes(id, skill);
  assertProviderCommands(id, skill, 'ascii-motion.mjs', [
    '--explain',
    '--preview',
    '--sample',
    '--bundle',
    '--convert',
    '--review',
  ]);
}

const contracts = {
  'mockups-ascii': assertMockupsAscii,
  'mockups-html': assertMockupsHtml,
  'video-create-narration': assertVideoCreateNarration,
  'video-align-narration': assertVideoAlignNarration,
  'video-render-zoom': assertVideoRenderZoom,
  'html-block-diagrams': assertHtmlBlockDiagrams,
  'ascii-motion-source': assertAsciiMotionSource,
  'ascii-motion-render': assertAsciiMotionRender,
};

for (const id of selectedIds) {
  contracts[id](parseSkill(id));
}

assert.deepEqual(
  failures,
  [],
  `creative skill contract assertions failed (${selected})`,
);
console.log(`creative skill contract assertions passed (${selected})`);
