#!/usr/bin/env node
// Generalized Microsoft Learn extractor.
//
// Two modes:
//
//   node scripts/extract-learn-path.js <path-slug>
//       Walks https://learn.microsoft.com/en-us/training/paths/<path-slug>/,
//       auto-discovers the modules in the path, then for each module
//       auto-discovers units and extracts them.
//
//   node scripts/extract-learn-path.js --module <module-slug>
//       Extracts a single module (auto-discovers units in it).
//
// Output:
//
//   <workspace>/.kai/runs/learn/<goal-slug>/<NN>-extract-<path-or-module-slug>/
//     raw/                          ← per-unit markdown, audio-ready
//       NN-<module-slug>/           (omitted in single-module mode)
//         NN-<unit-slug>.md
//     modules/                      ← assembled per-module markdown for reading
//       <module-slug>.md            (in path mode; module mode writes ./module.md)
//     questions.md                  ← all knowledge-check questions
//     source.md                     ← extraction metadata + URL table
//     path.md / module.md           ← top-level overview
//
// All file writes go through writeText() so git's core.autocrlf+safecrlf
// on Windows doesn't reject the commit.

const { chromium } = require('playwright');
const fs = require('fs');
const os = require('os');
const path = require('path');

function writeText(filePath, content) {
  const normalized = os.EOL === '\n' ? content : content.replace(/\n/g, os.EOL);
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, normalized, 'utf8');
}

const BASE = 'https://learn.microsoft.com/en-us/training';
// Extractions land in the caller's workspace under the canonical learn run area,
// never inside the plugin checkout — so runs travel with the user's project.
const WORKDIR = process.cwd();

function parseArgs(argv) {
  const args = argv.slice(2);
  let goal = null;
  const rest = [];
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--goal') {
      goal = args[++i];
      if (!goal || goal.startsWith('--')) { console.error('--goal requires a slug'); process.exit(2); }
      continue;
    }
    rest.push(args[i]);
  }
  if (rest.length === 0) {
    console.error('Usage:');
    console.error('  node scripts/extract-learn-path.js [--goal <goal-slug>] <path-slug>');
    console.error('  node scripts/extract-learn-path.js [--goal <goal-slug>] --module <module-slug>');
    console.error('  --goal groups runs toward one durable learning goal (e.g. learn-react);');
    console.error('         defaults to the source slug when omitted.');
    process.exit(2);
  }
  let out;
  if (rest[0] === '--module') {
    if (!rest[1]) { console.error('--module requires a slug'); process.exit(2); }
    out = { mode: 'module', slug: rest[1], goal: goal || rest[1] };
  } else {
    out = { mode: 'path', slug: rest[0], goal: goal || rest[0] };
  }
  // Both the goal and the source slug become path segments; reject anything that
  // isn't a plain kebab slug so a value like `..` can't escape the learn area.
  validateSlug('goal', out.goal);
  validateSlug('source slug', out.slug);
  return out;
}

const SLUG_RE = /^[a-z0-9][a-z0-9-]*$/;
function validateSlug(label, value) {
  if (!SLUG_RE.test(value)) {
    console.error(`invalid ${label} "${value}": use a lowercase kebab-case slug (a-z, 0-9, -)`);
    process.exit(2);
  }
}

// Next sequential run index under a goal folder: highest existing NN + 1, never
// filling gaps — mirrors the date-first run grammar's <NN> rule so goal runs sort
// in the order they ran.
function nextRunIndex(goalDir) {
  let max = 0;
  try {
    for (const name of fs.readdirSync(goalDir)) {
      const m = name.match(/^(\d{2,})-/);
      if (m) { const n = parseInt(m[1], 10); if (n > max) max = n; }
    }
  } catch { /* goal dir doesn't exist yet → first run is 01 */ }
  return String(max + 1).padStart(2, '0');
}

// Walk the path index and return the ordered list of module slugs.
async function discoverModulesInPath(page, pathSlug) {
  const url = `${BASE}/paths/${pathSlug}/`;
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForSelector('main', { timeout: 15000 });
  return await page.evaluate(() => {
    const seen = new Set();
    const out = [];
    // The Learn path index renders module cards with both relative
    // (../../modules/<slug>/) and absolute (/en-us/training/modules/<slug>/)
    // links. Use the resolved `.href` so both shapes work.
    document.querySelectorAll('a').forEach(a => {
      const href = a.href || '';
      const m = href.match(/\/training\/modules\/([^\/?#]+)\/?(?:[?#]|$)/);
      if (m && !seen.has(m[1])) { seen.add(m[1]); out.push(m[1]); }
    });
    return out;
  });
}

// Walk the module index and return the ordered list of unit slugs as
// they appear in the unit list. Each entry is `<n>-<unit-slug>`.
async function discoverUnitsInModule(page, moduleSlug) {
  const url = `${BASE}/modules/${moduleSlug}/`;
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForSelector('main', { timeout: 15000 });
  return await page.evaluate(() => {
    const out = [];
    const seen = new Set();
    document.querySelectorAll('a').forEach(a => {
      const href = a.getAttribute('href') || '';
      const text = a.textContent?.trim() || '';
      // Match relative links of the form `<digits>(-anything)?` which is
      // how the unit list inside a module page renders.
      const m = href.match(/^(\d+[a-z]?-[a-z0-9-]+)\/?$/);
      if (m && !seen.has(m[1])) {
        seen.add(m[1]);
        out.push({ slug: m[1], title: text });
      }
    });
    return out;
  });
}

// Returned as a function passed to page.evaluate — runs in browser context.
function unitExtractor() {
  return () => {
    const title = document.querySelector('h1#module-unit-title')?.textContent.trim();
    const root  = document.querySelector('#module-unit-content');
    if (!title) return { error: 'unit title not found' };

    // Dedicated module assessment / knowledge-check pages render
    // questions inside a separate quiz form, not in #module-unit-content.
    const quizForm = document.querySelector('form[data-bi-name="quiz"]');
    if (quizForm && (!root || root.textContent.trim().length === 0)) {
      const questions = Array.from(document.querySelectorAll('.quiz-question[data-bi-name="question"]')).map(q => {
        const rawQ = q.querySelector('[id^="quiz-question-"]')?.textContent
                  || q.querySelector('.field-label')?.textContent
                  || '';
        const question = rawQ.replace(/^\s*\d+\.\s*/, '').replace(/\s+/g, ' ').trim();
        const options = Array.from(q.querySelectorAll('input[type=radio]')).map(r => {
          const label = r.closest('label') || (r.id && document.querySelector(`label[for="${r.id}"]`)) || r.parentElement;
          return label?.textContent.replace(/\s+/g, ' ').trim();
        }).filter(Boolean);
        return { question, options };
      });
      return {
        title,
        body: '> _This is a module assessment page — questions captured in questions.md._',
        questions,
        url: location.href.split('?')[0],
        pivot: new URLSearchParams(location.search).get('pivots') || null,
        word_count: 0,
        kind: 'assessment'
      };
    }

    if (!root) return { error: 'unit container not found' };
    const md = [], questions = [];
    let inKC = false, kcBuf = null;
    const flushKc = () => { if (kcBuf && kcBuf.question) questions.push(kcBuf); kcBuf = null; };
    const isH = t => /^H[1-6]$/.test(t);
    const hl = t => parseInt(t.slice(1), 10);
    const textOf = el => (el.textContent || '').replace(/\s+/g, ' ').trim();
    function inline(el) {
      let out = '';
      for (const n of el.childNodes) {
        if (n.nodeType === 3) out += n.nodeValue.replace(/\s+/g, ' ');
        else if (n.nodeType === 1) {
          const t = n.tagName;
          if (t === 'STRONG' || t === 'B') out += '**' + inline(n) + '**';
          else if (t === 'EM' || t === 'I') out += '*' + inline(n) + '*';
          else if (t === 'CODE') out += '`' + textOf(n) + '`';
          else if (t === 'A') out += inline(n);
          else if (t === 'BR') out += '\n';
          else out += inline(n);
        }
      }
      return out.replace(/[ \t]+/g, ' ').trim();
    }
    const kcH = t => /^(check your knowledge|knowledge check|quiz|quick check|test yourself|review questions|self-?assessment|module assessment)/i.test(t);
    function walk(el, d) {
      for (const n of el.childNodes) {
        if (n.nodeType === 3) { const t = n.nodeValue.trim(); if (t) md.push(t); continue; }
        if (n.nodeType !== 1) continue;
        const tag = n.tagName;
        if (n.id === 'next-section' || n.id === 'module-unit-metadata'
            || n.classList?.contains('xp-tag')
            || tag === 'FORM' || tag === 'SCRIPT' || tag === 'STYLE' || tag === 'NOSCRIPT') continue;
        if (isH(tag)) {
          flushKc();
          const text = inline(n);
          if (kcH(text)) { inKC = true; md.push('> _Knowledge check moved to questions.md_'); continue; }
          inKC = false;
          md.push('\n' + '#'.repeat(Math.min(hl(tag) + 1, 6)) + ' ' + text + '\n');
          continue;
        }
        if (inKC) {
          if (tag === 'P') { if (!kcBuf) kcBuf = { question: inline(n), options: [] }; }
          else if (tag === 'UL' || tag === 'OL') {
            if (!kcBuf) kcBuf = { question: '(see source)', options: [] };
            for (const li of n.querySelectorAll(':scope > li')) kcBuf.options.push(inline(li));
            flushKc();
          } else if (tag === 'DIV' || tag === 'SECTION') walk(n, d+1);
          continue;
        }
        if (tag === 'P') { const t = inline(n); if (t) md.push(t + '\n'); }
        else if (tag === 'UL' || tag === 'OL') {
          const ord = tag === 'OL'; let i = 1;
          for (const li of n.querySelectorAll(':scope > li')) md.push((ord ? (i++ + '. ') : '- ') + inline(li));
          md.push('');
        } else if (tag === 'BLOCKQUOTE') {
          inline(n).split('\n').forEach(l => md.push('> ' + l)); md.push('');
        } else if (tag === 'PRE') {
          const code = n.querySelector('code');
          const lang = code?.className?.match(/(?:language-|lang-)(\S+)/)?.[1] || '';
          md.push('```' + lang);
          md.push((code || n).textContent.replace(/\n$/, ''));
          md.push('```\n');
        } else if (tag === 'IMG') {
          const alt = n.getAttribute('alt')?.trim();
          if (alt) md.push('> _Image: ' + alt + '_\n');
        } else if (tag === 'FIGURE') {
          const img = n.querySelector('img');
          const cap = n.querySelector('figcaption');
          if (img?.alt) md.push('> _Image: ' + img.alt.trim() + '_');
          if (cap) md.push('> ' + inline(cap));
          md.push('');
        } else if (tag === 'TABLE') {
          const rows = n.querySelectorAll('tr'); let header = false;
          for (const tr of rows) {
            const cells = Array.from(tr.querySelectorAll('th,td')).map(c => inline(c) || ' ');
            md.push('| ' + cells.join(' | ') + ' |');
            if (!header && tr.querySelector('th')) {
              md.push('|' + cells.map(() => '---').join('|') + '|');
              header = true;
            }
          }
          md.push('');
        } else if (tag === 'DIV' || tag === 'SECTION' || tag === 'ARTICLE' || tag === 'ASIDE') {
          walk(n, d + 1);
        } else if (tag === 'HR') md.push('---');
      }
    }
    walk(root, 0); flushKc();
    let body = md.join('\n').replace(/\n{3,}/g, '\n\n').trim();
    return {
      title, body, questions,
      url: location.href.split('?')[0],
      pivot: new URLSearchParams(location.search).get('pivots') || null,
      word_count: body.split(/\s+/).filter(Boolean).length
    };
  };
}

function unitMarkdown(unit) {
  return [
    `# ${unit.title}`,
    '',
    `**Source:** ${unit.url}`,
    `**Pivot:** ${unit.pivot || '(none)'}`,
    `**Word count:** ${unit.word_count}`,
    '',
    unit.body,
    ''
  ].join('\n');
}

async function extractUnit(page, moduleSlug, unitSlug) {
  const url = `${BASE}/modules/${moduleSlug}/${unitSlug}/?pivots=text`;
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForSelector('#module-unit-content, h1#module-unit-title, form[data-bi-name="quiz"]', { timeout: 15000 });
  const r = await page.evaluate(unitExtractor());
  if (r.error) throw new Error(r.error);
  return r;
}

async function extractModule(page, moduleSlug, rawDir, moduleIndex) {
  const units = await discoverUnitsInModule(page, moduleSlug);
  if (units.length === 0) throw new Error(`no units discovered for module ${moduleSlug}`);

  const moduleLabel = moduleIndex == null ? '' : `[mod ${String(moduleIndex).padStart(2, '0')}] `;
  const results = [];
  const failures = [];
  for (let i = 0; i < units.length; i++) {
    const { slug } = units[i];
    const seq = String(i + 1).padStart(2, '0');
    process.stdout.write(`  ${moduleLabel}[${seq}/${units.length}] ${slug} … `);
    try {
      const r = await extractUnit(page, moduleSlug, slug);
      results.push({ seq, slug, ...r });
      writeText(path.join(rawDir, `${seq}-${slug}.md`), unitMarkdown(r));
      console.log(`ok (${r.word_count} words, ${r.questions.length} questions)`);
    } catch (e) {
      failures.push({ seq, slug, url: `${BASE}/modules/${moduleSlug}/${slug}/`, reason: e.message });
      console.log(`FAILED: ${e.message}`);
    }
  }
  return { moduleSlug, results, failures };
}

function moduleMarkdown(moduleTitle, moduleSlug, perModule) {
  const totalWords = perModule.results.reduce((a, r) => a + r.word_count, 0);
  const audioMin = Math.round(totalWords / 180);
  const header = [
    `# ${moduleTitle}`,
    '',
    `**Source:** ${BASE}/modules/${moduleSlug}/`,
    `**Pivot:** text`,
    `**Units walked:** ${perModule.results.length}${perModule.failures.length ? ` (${perModule.failures.length} failed)` : ''}`,
    `**Word count:** ${totalWords} · **Estimated audio length:** ~${audioMin} minutes at 180 wpm`,
    '',
    '---',
    ''
  ].join('\n');
  const body = perModule.results.map(r =>
    `## Unit ${parseInt(r.seq, 10)} — ${r.title}\n\n${r.body}\n\n---\n`
  ).join('\n');
  return header + body;
}

function questionsMarkdown(courseTitle, perModules) {
  const sections = [];
  let totalQs = 0;
  for (const pm of perModules) {
    const withQs = pm.results.filter(r => r.questions.length > 0);
    if (withQs.length === 0) continue;
    const moduleHeader = pm.moduleTitle ? `## Module — ${pm.moduleTitle}\n` : '';
    const blocks = withQs.map(r => {
      const qs = r.questions.map((q, qi) =>
        `#### Q${qi + 1}: ${q.question}\n${q.options.map(o => `- [ ] ${o}`).join('\n')}`
      ).join('\n\n');
      totalQs += r.questions.length;
      return `### Unit ${parseInt(r.seq, 10)} — ${r.title}\n\n${qs}\n`;
    }).join('\n');
    sections.push(moduleHeader + blocks);
  }
  const header = [
    `# Knowledge checks — ${courseTitle}`,
    '',
    `**Total questions:** ${totalQs}`,
    '',
    `> Self-test: answer from memory after listening. Correct answers intentionally not captured — go back to the source URL in \`source.md\` to verify.`,
    '',
    '---',
    ''
  ].join('\n');
  return header + (totalQs === 0
    ? '> _No knowledge checks detected in this course._\n'
    : sections.join('\n---\n\n'));
}

function sourceMarkdown(courseTitle, rootUrl, startedAt, finishedAt, perModules, otherFailures) {
  const totalFailures = otherFailures.length + perModules.reduce((a, pm) => a + pm.failures.length, 0);
  const status = totalFailures === 0 ? 'ok' : 'partial';
  const rows = [];
  for (const pm of perModules) {
    for (const r of pm.results) {
      rows.push(`| ${pm.moduleSlug} | ${parseInt(r.seq, 10)} | ${r.title} | ${r.url} | ok |`);
    }
    for (const f of pm.failures) {
      rows.push(`| ${pm.moduleSlug} | ${parseInt(f.seq, 10)} | (failed) | ${f.url} | failed: ${f.reason} |`);
    }
  }
  const failureText = totalFailures === 0
    ? 'None'
    : [
        ...otherFailures.map(f => `- ${f.scope}: ${f.reason}`),
        ...perModules.flatMap(pm => pm.failures.map(f => `- ${pm.moduleSlug} unit ${f.seq}: ${f.reason}`))
      ].join('\n');
  return [
    `# Extraction source — ${courseTitle}`,
    '',
    `**Root URL:** ${rootUrl}`,
    `**Pivot:** text`,
    `**Run started:** ${startedAt.toISOString()}`,
    `**Run finished:** ${finishedAt.toISOString()}`,
    `**Status:** ${status}`,
    '',
    '## Units walked',
    '',
    `| Module | # | Unit title | URL | Status |`,
    `|--------|---|------------|-----|--------|`,
    rows.join('\n'),
    '',
    '## Failures',
    '',
    failureText,
    '',
    '## Notes',
    '',
    `Walked via Playwright (headless). To narrate the per-unit files, run the \`kai-core-generate-audio\` skill on \`<run-dir>/raw\` — e.g. \`pwsh <kai-plugin>/scripts/generate-audio.ps1 -Source <run-dir>/raw -Lang es\`.`,
    ''
  ].join('\n');
}

(async () => {
  const args = parseArgs(process.argv);
  const goalDir = path.join(WORKDIR, '.kai', 'runs', 'learn', args.goal);
  fs.mkdirSync(goalDir, { recursive: true });
  // Reserve the run folder atomically: non-recursive mkdir fails if the computed
  // <NN> was taken by a concurrent run, so recompute and retry rather than share.
  let runRoot;
  for (let attempt = 0; ; attempt++) {
    const nn = nextRunIndex(goalDir);
    runRoot = path.join(goalDir, `${nn}-extract-${args.slug}`);
    try { fs.mkdirSync(runRoot); break; }
    catch (e) {
      if (e.code === 'EEXIST' && attempt < 20) continue;
      throw e;
    }
  }

  // Default to Playwright's bundled Chromium so the extractor runs on any host.
  // Override with LEARN_BROWSER_CHANNEL=msedge|chrome to use an installed browser.
  const channel = process.env.LEARN_BROWSER_CHANNEL;
  const browser = await chromium.launch(channel ? { channel, headless: true } : { headless: true });
  const ctx = await browser.newContext();
  const page = await ctx.newPage();

  const startedAt = new Date();
  const perModules = [];
  const otherFailures = [];

  try {
    if (args.mode === 'module') {
      const rawDir = path.join(runRoot, 'raw');
      console.log(`Extracting module ${args.slug} → ${path.relative(WORKDIR, runRoot)}`);
      const pm = await extractModule(page, args.slug, rawDir, null);
      // Pull the human title off the first unit's <title> or the module index.
      await page.goto(`${BASE}/modules/${args.slug}/`, { waitUntil: 'domcontentloaded', timeout: 30000 });
      const moduleTitle = await page.evaluate(() =>
        document.querySelector('main h1')?.textContent.trim() || document.title
      );
      pm.moduleTitle = moduleTitle;
      perModules.push(pm);
      writeText(path.join(runRoot, 'module.md'), moduleMarkdown(moduleTitle, args.slug, pm));
    } else {
      console.log(`Discovering modules in path ${args.slug} …`);
      const moduleSlugs = await discoverModulesInPath(page, args.slug);
      if (moduleSlugs.length === 0) {
        throw new Error(`no modules discovered in path ${args.slug}`);
      }
      console.log(`Found ${moduleSlugs.length} module(s): ${moduleSlugs.join(', ')}`);
      const modulesDir = path.join(runRoot, 'modules');
      fs.mkdirSync(modulesDir, { recursive: true });
      const pathRows = [];

      for (let mi = 0; mi < moduleSlugs.length; mi++) {
        const moduleSlug = moduleSlugs[mi];
        const moduleIdx = mi + 1;
        const moduleNum = String(moduleIdx).padStart(2, '0');
        console.log(`\n[module ${moduleNum}/${moduleSlugs.length}] ${moduleSlug}`);
        const rawDir = path.join(runRoot, 'raw', `${moduleNum}-${moduleSlug}`);
        try {
          const pm = await extractModule(page, moduleSlug, rawDir, moduleIdx);
          await page.goto(`${BASE}/modules/${moduleSlug}/`, { waitUntil: 'domcontentloaded', timeout: 30000 });
          const moduleTitle = await page.evaluate(() =>
            document.querySelector('main h1')?.textContent.trim() || document.title
          );
          pm.moduleTitle = moduleTitle;
          perModules.push(pm);
          writeText(path.join(modulesDir, `${moduleNum}-${moduleSlug}.md`),
                    moduleMarkdown(moduleTitle, moduleSlug, pm));
          pathRows.push(`| ${moduleIdx} | ${moduleTitle} | \`${moduleSlug}\` | ${pm.results.length} unit(s) |`);
        } catch (e) {
          console.log(`  FAILED module: ${e.message}`);
          otherFailures.push({ scope: `module ${moduleSlug}`, reason: e.message });
          pathRows.push(`| ${moduleIdx} | (failed) | \`${moduleSlug}\` | ${e.message} |`);
        }
      }

      const pathTitle = await (async () => {
        await page.goto(`${BASE}/paths/${args.slug}/`, { waitUntil: 'domcontentloaded', timeout: 30000 });
        return page.evaluate(() => document.querySelector('main h1')?.textContent.trim() || document.title);
      })();

      const pathHeader = [
        `# ${pathTitle}`,
        '',
        `**Source:** ${BASE}/paths/${args.slug}/`,
        `**Modules:** ${moduleSlugs.length}`,
        '',
        `> Per-module assembled markdown lives in \`modules/\`. Per-unit files (one .md per unit, audio-ready) live in \`raw/<NN-module-slug>/\`. Knowledge checks combined in \`questions.md\`.`,
        '',
        `| # | Module | Slug | Units |`,
        `|---|--------|------|-------|`,
        pathRows.join('\n'),
        ''
      ].join('\n');
      writeText(path.join(runRoot, 'path.md'), pathHeader);
    }

    const courseTitle = perModules.length === 1 && args.mode === 'module'
      ? perModules[0].moduleTitle
      : `Learning path: ${args.slug}`;
    const rootUrl = args.mode === 'module'
      ? `${BASE}/modules/${args.slug}/`
      : `${BASE}/paths/${args.slug}/`;

    writeText(path.join(runRoot, 'questions.md'), questionsMarkdown(courseTitle, perModules));
    writeText(path.join(runRoot, 'source.md'),
              sourceMarkdown(courseTitle, rootUrl, startedAt, new Date(), perModules, otherFailures));

    const totalUnits = perModules.reduce((a, pm) => a + pm.results.length, 0);
    const totalWords = perModules.reduce((a, pm) => a + pm.results.reduce((b, r) => b + r.word_count, 0), 0);
    const totalQs = perModules.reduce((a, pm) => a + pm.results.reduce((b, r) => b + r.questions.length, 0), 0);
    console.log(`\nWrote ${totalUnits} unit file(s) under ${path.relative(WORKDIR, runRoot)} (${totalWords} words, ${totalQs} questions).`);
    console.log(`Run dir: ${runRoot}`);
  } finally {
    await browser.close();
  }
})().catch(e => { console.error(e); process.exit(1); });
