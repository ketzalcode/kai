import assert from 'node:assert/strict';
import {cpSync, existsSync, mkdirSync, readFileSync, writeFileSync} from 'node:fs';
import {dirname, join, resolve} from 'node:path';
import {fileURLToPath, pathToFileURL} from 'node:url';
import {chromium} from 'playwright';
import {buildReport, writeReport} from '../scripts/lib/coordination-runtime/report.mjs';
import {withWorkspace} from './helpers/coordination-runtime-fixture.mjs';
import {
  NOW, acceptReport, addReportArtifact, appendMessage, hash, mutateBody, payload, seedHostAttempt, setupReport,
} from './helpers/coordination-report-fixture.mjs';

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const artifactDirectory = process.env.KAI_REPORT_TEST_ARTIFACTS;
if (artifactDirectory) {
  assert.equal(resolve(artifactDirectory), join(repoRoot, '.superpowers', 'sdd',
    '2026-09-16-core-coordination-evidence', 'task-8-round2-visual'));
  mkdirSync(artifactDirectory, {recursive: true});
}
const malicious = '<script>globalThis.reportInjected=true</script><img src="https://attacker.invalid/probe" onerror="globalThis.reportInjected=true">';
const longLabel = 'LongCriterionWithoutSpaces'.repeat(18);
const results = [];
const packaged = existsSync(chromium.executablePath());
console.log(`Renderer: ${packaged ? 'existing Playwright Chromium' : 'existing system Edge'}`);
const browser = await chromium.launch(packaged ? {headless: true} : {headless: true, channel: 'msedge'});
try {
  await withWorkspace(async ({root, store}) => {
    const hostileRefs = [
      'artifact:00000000-0000-4000-8000-000000000001',
      'javascript:globalThis.reportInjected=true',
      'https://attacker.invalid/a', '//attacker.invalid/b',
      'file:///C:/Windows/win.ini', '..\\outside',
    ];
    const {artifactId} = setupReport(root, store, {
      title: `SYNTHETIC FIXTURE — not host acceptance ${malicious}`,
      acceptance: ['Exact behavior verified', longLabel],
      outcome: 'Synthetic offline coordination evidence. Browser safety/layout check only.',
    }, payload + 'x'.repeat(65536) + 'OMITTED-SOURCE-TAIL');
    acceptReport(root, store, artifactId);
    seedHostAttempt(store, [{
      sessionId: 'synthetic-session', actualModel: null, durationMs: 123,
      usage: {scope: 'session-cumulative', sessionId: 'synthetic-session',
        totalNanoAiu: null, totalPremiumRequests: 1.5},
    }]);
    const messageIds = [];
    // Hostile historical message references are not admissible output inputs.
    for (let i = 0; i < 62; i++) messageIds.push(appendMessage(store, i, {
      long: i === 0 || i === 61, refs: i === 61 ? hostileRefs : [],
    }).id);
    mutateBody(store, 'message', messageIds[0], body => {
      body.payload.did = malicious + '</pre>' + body.payload.did;
    });
    mutateBody(store, 'approval', store.database.prepare("SELECT id FROM records WHERE kind='approval'").get().id,
      body => { body.reason = malicious + ' [click](javascript:alert(1)) ' + longLabel; });
    const view = buildReport(store, {itemId: 'demo'});
    const output = writeReport({root, itemId: 'demo', view});
    assert.equal(typeof output.path, 'string', 'export must produce a real offline document');
    const page = await browser.newPage();
    const requests = [];
    const errors = [];
    page.on('request', request => {
      if (!request.url().startsWith('file:')) requests.push(request.url());
    });
    page.on('pageerror', error => errors.push(error.message));
    page.on('dialog', dialog => { errors.push(`dialog:${dialog.message()}`); void dialog.dismiss(); });
    await page.route(/^https?:/, route => route.abort());
    const checkDestination = async () => {
      assert.equal(await page.locator('script,iframe,object,embed,img,svg,form').count(), 0);
      assert.equal(await page.evaluate(() => !!(globalThis.reportInjected || globalThis.evidenceExecuted)), false);
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth), 0);
      assert.deepEqual(requests, []);
      assert.ok((await page.locator('a').evaluateAll(links => links.map(a => a.getAttribute('href'))))
        .every(href => /^(?:#[a-z0-9-]+|[a-z0-9-]+\.html(?:#[a-z0-9-]+)?)$/.test(href)),
      'links are only contained generated destinations or local anchors');
    };
    for (const width of [1280, 320]) {
      await page.setViewportSize({width, height: 1000});
      await page.goto(pathToFileURL(join(output.directory, 'index.html')).href);
      await checkDestination();
      await page.getByRole('link', {name: 'Open captured report', exact: true}).click();
      assert.equal(page.url(), pathToFileURL(output.path).href);
      assert.equal(await page.locator('h1').count(), 1);
      assert.equal(await page.locator('h1').innerText(), 'Coordination evidence report');
      assert.ok((await page.locator('.subject').boundingBox()).height <= 50,
        'bounded subject must not dominate the narrow report header');
      assert.equal(await page.locator('main').count(), 1);
      assert.equal(await page.locator('h2').count(), 6);
      assert.equal(await page.getByRole('table').count(), await page.locator('table:visible').count());
      assert.ok(await page.getByRole('columnheader').count() > 0);
      assert.match(await page.locator('body').innerText(), /snapshot.*not live/i);
      assert.match(await page.locator('body').innerText(), new RegExp(String(view.throughSeq)));
      assert.ok((await page.locator('body').innerText()).includes(view.generatedAt));
      assert.match(await page.locator('body').innerText(), /missing|unavailable/i);
      assert.match(await page.locator('body').innerText(), /8 of 62/);
      assert.equal(await page.locator('script,iframe,object,embed,img,svg,form').count(), 0);
      assert.ok((await page.locator('meta[http-equiv="Content-Security-Policy"]').getAttribute('content'))
        .includes("default-src 'none'"));
      await checkDestination();
      const dimensions = await page.evaluate(() => ({
        overflow: document.documentElement.scrollWidth - innerWidth,
        tablesWithoutCaptions: [...document.querySelectorAll('table')].filter(t => !t.caption).length,
        unlabelledHeaders: [...document.querySelectorAll('th')].filter(th => !th.hasAttribute('scope')).length,
        injected: !!(globalThis.reportInjected || globalThis.evidenceExecuted),
      }));
      assert.equal(dimensions.overflow, 0, 'long labels and tables must fit the actual viewport');
      assert.equal(dimensions.tablesWithoutCaptions, 0);
      assert.equal(dimensions.unlabelledHeaders, 0);
      assert.equal(dimensions.injected, false);
      await page.keyboard.press('Tab');
      assert.equal(await page.evaluate(() => document.activeElement.tagName), 'A');
      await page.keyboard.press('Enter');
      assert.equal(await page.evaluate(() => document.activeElement.id), 'main');
      const history = page.locator('main details').first();
      const summary = history.locator('summary').first();
      let reached = false;
      for (let i = 0; i < 100; i++) {
        await page.keyboard.press('Tab');
        if (await summary.evaluate(element => element === document.activeElement)) { reached = true; break; }
      }
      assert.ok(reached, 'history summary must be reachable with the keyboard alone');
      await page.keyboard.press('Enter');
      assert.equal(await history.getAttribute('open'), '');
      await page.keyboard.press('Space');
      assert.equal(await history.getAttribute('open'), null);
      const subject = page.locator('header details').first();
      await subject.locator('summary').click();
      assert.equal(await subject.locator('p').innerText(), view.item.title);
      await subject.locator('summary').click();
      assert.ok((await page.locator('.subject').innerText()).length <= 150);
      await page.evaluate(() => scrollTo(0, 0));
      if (artifactDirectory) {
        await page.screenshot({path: join(artifactDirectory, `synthetic-${width}.png`), fullPage: true});
        await page.screenshot({path: join(artifactDirectory, `synthetic-top-${width}.png`)});
      }
      results.push({width, fileUrl: true, ...dimensions});
      await page.getByRole('link', {name: 'Full and older messages', exact: true}).click();
      await checkDestination();
      assert.match(await page.locator('body').innerText(), /LongMessage/);
      await page.getByRole('link', {name: 'Older messages', exact: true}).click();
      await checkDestination();
      assert.ok((await page.locator('body').innerText()).includes(messageIds[0]));
      const oldest = JSON.parse(await page.locator('section').filter({hasText: messageIds[0]}).locator('pre').innerText());
      assert.ok(oldest.body.payload.did.includes(malicious), 'full exact malicious text survives as inert JSON text');
      assert.ok((await page.locator('body').innerText()).includes('LongMessage'.repeat(300)));
      await page.getByRole('link', {name: 'Back to captured report', exact: true}).click();
      await page.locator('summary').filter({hasText: 'Recent messages (limited preview)'}).click();
      await page.getByRole('link', {name: 'Full message', exact: true}).last().click();
      await checkDestination();
      assert.ok((await page.locator('body').innerText()).includes('LongMessage'.repeat(300)));
      await page.getByRole('link', {name: 'Back to captured report', exact: true}).click();
      await page.getByRole('link', {name: 'Inert retained preview', exact: true}).first().click();
      await checkDestination();
      assert.match(await page.locator('body').innerText(), /Presentation limitation/i);
      assert.match(await page.locator('body').innerText(), /64 KiB.*1 MiB/);
      assert.doesNotMatch(await page.locator('pre').innerText(), /OMITTED-SOURCE-TAIL/);
      assert.match(await page.locator('pre').innerText(), /<script>globalThis.evidenceExecuted=true<\/script>/);
      assert.match(await page.locator('body').innerText(), /retained.*SHA-256/i);
      if (artifactDirectory) {
        await page.locator('main p').filter({hasText: 'Presentation limitation'})
          .evaluate(element => element.scrollIntoView({block: 'start'}));
        await page.screenshot({path: join(artifactDirectory, `synthetic-preview-${width}.png`)});
      }
      await page.getByRole('link', {name: 'Back to captured report', exact: true}).click();
    }
    assert.deepEqual(requests, [], 'no external network attempts');
    assert.deepEqual(errors, [], 'no payload execution or page exceptions');
    if (artifactDirectory) {
      // This is a rendered test artifact, never acceptance of an actual host run.
      const html = readFileSync(output.path);
      writeFileSync(join(artifactDirectory, 'synthetic-report.html'), html);
      writeFileSync(join(artifactDirectory, 'synthetic-report.json'), readFileSync(output.metadataPath));
      cpSync(output.directory, join(artifactDirectory, 'synthetic-bundle'), {recursive: true});
      writeFileSync(join(artifactDirectory, 'synthetic-source.json'), JSON.stringify({
        label: 'SYNTHETIC — browser safety/layout only; awaiting host visual acceptance',
        fixtureSource: 'test/helpers/coordination-report-fixture.mjs',
        browserTestSource: 'test/coordination-report-browser-self-test.mjs',
        htmlDigest: hash(html), results,
        screenshots: [1280, 320].flatMap(width => ['', 'top-', 'preview-'].map(prefix => ({
          path: `synthetic-${prefix}${width}.png`,
          digest: hash(readFileSync(join(artifactDirectory, `synthetic-${prefix}${width}.png`))),
        }))),
      }, null, 2));
    }
    for (let i = 1; i < 17; i++) addReportArtifact(root, store);
    const limitedView = buildReport(store, {itemId: 'demo'});
    const limitedOutput = writeReport({root, itemId: 'demo', view: limitedView});
    await page.goto(pathToFileURL(limitedOutput.indexPath).href);
    await page.getByRole('link', {name: 'Open captured report', exact: true}).click();
    await page.getByRole('link', {name: 'No preview — inspect presentation limitation', exact: true}).first().click();
    await checkDestination();
    assert.match(await page.locator('body').innerText(), /No preview.*budget/i);
    assert.match(await page.locator('body').innerText(), /Presentation limitation/i);
    await page.getByRole('link', {name: 'Back to captured report', exact: true}).click();
    assert.equal(page.url(), pathToFileURL(limitedOutput.path).href);
    assert.deepEqual(requests, [], 'no external network attempts in limited previews');
    assert.deepEqual(errors, [], 'no payload execution or page exceptions in limited previews');
    await page.close();
  });
  for (const encoding of ['utf8', 'latin1']) {
    await withWorkspace(async ({root, store}) => {
      const secret = '0123456789abcdefghijklmnopqrstuvwx';
      const bytes = Buffer.alloc(65537, 46);
      if (encoding === 'latin1') bytes[0] = 0;
      Buffer.from(secret).copy(bytes, 8);
      Buffer.from(secret).copy(bytes, 65503);
      setupReport(root, store, {}, bytes);
      mutateBody(store, 'item', 'demo', body => { body.lease = {
        holder: {role: 'eng-builder-software', runId: 'producer-run'}, token: secret,
        acquired_at: NOW, expires_at: '2026-09-17T12:00:00.000Z', version_at_grant: 1,
      }; });
      const view = buildReport(store, {itemId: 'demo'});
      const output = writeReport({root, itemId: 'demo', view});
      const page = await browser.newPage();
      const requests = [];
      const errors = [];
      page.on('request', request => { if (!request.url().startsWith('file:')) requests.push(request.url()); });
      page.on('pageerror', error => errors.push(error.message));
      page.on('dialog', dialog => { errors.push(`dialog:${dialog.message()}`); void dialog.dismiss(); });
      await page.route(/^https?:/, route => route.abort());
      for (const width of [1280, 320]) {
        await page.setViewportSize({width, height: 1000});
        await page.goto(pathToFileURL(output.indexPath).href);
        await page.getByRole('link', {name: 'Open captured report', exact: true}).click();
        await page.getByRole('link', {name: 'Inert retained preview', exact: true}).click();
        const pre = await page.locator('pre').innerText();
        const content = encoding === 'latin1' ? Buffer.from(pre.replace(/\s/g, ''), 'hex').toString('latin1') : pre;
        assert.equal(content.includes(secret.slice(0, -1)), false, 'round3 actual file-URL text/hex must withhold the known bearer boundary');
        assert.match(content, /\[redacted bearer\]/);
        assert.match(content, /\[withheld possible bearer-boundary\]/);
        assert.match(await page.locator('body').innerText(), /Conservative boundary withholding/i);
        assert.equal(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth), 0);
        assert.equal(await page.locator('script,iframe,object,embed,img,svg,form').count(), 0);
        await page.getByRole('link', {name: 'Back to captured report', exact: true}).click();
        assert.equal(page.url(), pathToFileURL(output.path).href);
      }
      assert.deepEqual(requests, []);
      assert.deepEqual(errors, []);
      await page.close();
    });
  }
} finally { await browser.close(); }
console.log(JSON.stringify(results));
console.log('coordination report file-URL browser checks passed; synthetic, not host visual acceptance');
