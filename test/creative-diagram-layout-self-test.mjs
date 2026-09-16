import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
assert.equal(process.argv.length, 2, 'the layout check takes no arguments');
const source = 'plugins/kai-creative/skills/html-block-diagrams/references/catalog.md';
const document = readFileSync(join(root, source), 'utf8');
const css = document.match(/```css\s*([\s\S]*?)```/)?.[1];
assert.ok(css, 'the diagram reference must contain its CSS example');

const label = 'LongComponentLabel'.repeat(8);
const card = `<div class="kai-card r-eng"><b>${label}</b><small>Supplied description</small></div>`;
const content = `<figure class="kai-diagram"><figcaption>Structural fixture</figcaption>
<div class="kai-boundary r-eng"><span class="legend">${label}</span>
  <div class="kai-lanes"><div class="kai-lane r-product"><h4>Request lane</h4>
    <div class="kai-cards">${card}${card}</div></div></div></div>
<div class="kai-stack"><div class="kai-layer r-design"><h4>Layer label</h4>
  <div class="kai-cards">${card}</div></div></div>
<div class="kai-pipeline">
  <div class="kai-step r-human"><span class="kai-connector" aria-hidden="true">&#9658;</span><span><b>${label}</b></span></div>
  <div class="kai-step r-eng"><span class="kai-connector" aria-hidden="true">&#9658;</span><span><b>${label}</b></span></div>
</div>
<div class="kai-compare"><div><h4>Owns</h4><p>${label}</p></div>
  <div><h4>Does not own</h4><p>${label}</p></div></div></figure>`;

const packagedBrowser = existsSync(chromium.executablePath());
console.log(`Renderer: ${packagedBrowser ? 'existing Playwright Chromium' : 'existing system Edge'}`);
const browser = await chromium.launch(packagedBrowser
  ? { headless: true }
  : { headless: true, channel: 'msedge' });
const results = [];
try {
  const page = await browser.newPage();
  await page.route('**/*', route => route.abort());
  for (const width of [320, 900]) {
    for (const scheme of ['light', 'dark']) {
      await page.setViewportSize({ width, height: 1200 });
      await page.emulateMedia({ colorScheme: scheme });
      await page.setContent(`<html><head><style>body{margin:0;font:16px system-ui}${css}</style></head><body>${content}</body></html>`);
      const dimensions = await page.evaluate(() => ({
        pageOverflow: Math.max(0, document.documentElement.scrollWidth - innerWidth),
        overflowingBlocks: [...document.querySelectorAll('.kai-card,.kai-step,.kai-boundary,.kai-lane,.kai-layer')]
          .filter(element => element.scrollWidth > element.clientWidth + 1).length,
      }));
      results.push({ width, scheme, ...dimensions });
    }
  }
} finally {
  await browser.close();
}
console.log(JSON.stringify({ source, results }, null, 2));
assert.ok(results.every(result => result.pageOverflow === 0 && result.overflowingBlocks === 0),
  'diagram examples must fit the tested widths without overflowing blocks');
console.log('creative diagram layout assertions passed; not a general visual/accessibility certification');
