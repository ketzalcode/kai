import assert from 'node:assert/strict';
import {test} from 'node:test';
import {randomUUID} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import fs, {existsSync, linkSync, mkdirSync, readFileSync, rmSync, symlinkSync, writeFileSync} from 'node:fs';
import {syncBuiltinESMExports} from 'node:module';
import {dirname, join} from 'node:path';
import {
  buildReport, renderHtml, renderMarkdown, writeReport, reportPaths,
} from '../scripts/lib/coordination-runtime/report.mjs';
import {RuntimeError, criteriaRef} from '../scripts/lib/coordination-runtime/contract.mjs';
import {redactReport} from '../scripts/lib/coordination-runtime/report-safety.mjs';
import {renderLanding} from '../scripts/lib/coordination-runtime/report-render.mjs';
import {hashBundle} from '../scripts/lib/coordination-runtime/evidence-content.mjs';
import {closeStore, openStore, readRecord} from '../scripts/lib/coordination-runtime/store.mjs';
import {projectContext, readDetail, readMessages} from '../scripts/lib/coordination-runtime/context.mjs';
import {withWorkspace, seedItem, seedRecord} from './helpers/coordination-runtime-fixture.mjs';
import {
  NOW, acceptReport, addReportArtifact, appendMessage, appendVerdict, file, hash, mutateBody,
  payload, setupReport, source, verdict, seedHostAttempt,
} from './helpers/coordination-report-fixture.mjs';

const code = expected => error => error?.code === expected;
const boundarySecret = '0123456789abcdefghijklmnopqrstuvwx';
function setReportLease(store, token) {
  mutateBody(store, 'item', 'demo', body => { body.lease = {
    holder: {role: 'eng-builder-software', runId: 'producer-run'}, token,
    acquired_at: NOW, expires_at: '2026-09-17T12:00:00.000Z', version_at_grant: 1,
  }; });
}

for (const budget of ['artifact', 'aggregate']) {
  for (const encoding of ['utf8', 'latin1']) {
    for (const secret of [boundarySecret, `${boundarySecret}€Z`]) {
      test(`round3 ${budget} ${encoding} ${secret === boundarySecret ? 'ASCII' : 'Unicode'} known bearer spanning prefix is not exported`, async () => {
        await withWorkspace(({root, store}) => {
          const cut = budget === 'artifact' ? 65536 : 512;
          const bytes = Buffer.alloc(budget === 'artifact' ? 65537 : 65504, 46);
          if (encoding === 'latin1') bytes[0] = 0;
          const token = Buffer.from(secret);
          token.copy(bytes, 8); // Fully contained control, independently of the cut.
          const start = cut - token.length + 1;
          token.copy(bytes, start);
          setupReport(root, store, {}, bytes);
          if (budget === 'aggregate') for (let i = 1; i < 17; i++) addReportArtifact(root, store);
          setReportLease(store, secret);
          const before = store.database.prepare('SELECT * FROM records ORDER BY kind,id').all();
          const view = buildReport(store, {itemId: 'demo'});
          const preview = view.inspection.artifactPreviews.at(-1);
          assert.equal(preview.encoding, encoding);
          assert.equal(preview.previewBytes, cut);
          assert.equal(preview.sourceSize, bytes.length);
          assert.equal(preview.sourceDigest, hash(bytes));
          assert.equal(preview.omittedBytes, bytes.length - cut);
          assert.equal(preview.previewState, 'limited');
          assert.ok(preview.limitReasons.includes(`${budget === 'artifact' ? 'artifact' : 'report'}-preview-budget`));
          assert.equal(view.inspection.previewBudget.capturedBytes, budget === 'artifact' ? 65536 : 1048576);
          assert.equal(view.inspection.artifactPreviews.length, budget === 'artifact' ? 1 : 17);
          assert.equal(view.artifacts.at(-1).integrity, 'verified');
          assert.deepEqual(view.gaps, []);
          // Export after both live and retained bytes change: redaction must use the captured snapshot only.
          file(root, source, 'CHANGED-LIVE-BYTES');
          file(root, preview.retainedPath, 'CHANGED-RETAINED-BYTES');
          const out = writeReport({root, itemId: 'demo', view});
          const meta = JSON.parse(readFileSync(out.metadataPath, 'utf8'));
          const exported = meta.view.inspection.artifactPreviews.at(-1);
          const companion = meta.companions.filter(c => c.kind === 'artifact-preview').at(-1);
          const html = readFileSync(join(out.directory, companion.file), 'utf8');
          const displayed = /<pre>([^<]*)<\/pre>/.exec(html)[1];
          const content = encoding === 'latin1'
            ? Buffer.from(displayed.replace(/\s/g, ''), 'hex').toString('latin1') : displayed;
          const forbidden = token.subarray(0, token.length - 1).toString(encoding);
          assert.deepEqual({
            jsonLeaksPrefix: exported.content.includes(forbidden),
            companionLeaksPrefix: content.includes(forbidden),
          }, {jsonLeaksPrefix: false, companionLeaksPrefix: false},
          'neither JSON nor companion text/decoded hex may expose the known bearer prefix');
          for (const captured of [exported.content, content]) {
            assert.equal(captured.includes(token.toString(encoding)), false, 'fully contained known bearer is redacted too');
            assert.match(captured, /\[redacted bearer\]/);
            assert.match(captured, /\[withheld possible bearer-boundary\]/);
          }
          assert.equal(exported.boundaryWithheldBytes, token.length - 1);
          assert.equal(meta.redactions.boundaries, 1);
          assert.deepEqual(meta.redactions, view.redactions);
          assert.deepEqual(redactReport(view), view, 'repeat sanitation must not change contents or counts');
          assert.equal(meta.view_digest, hash(JSON.stringify(meta.view)));
          assert.equal(companion.digest, hash(html));
          for (const path of [out.indexPath, out.path, out.markdownPath, join(out.directory, companion.file)]) {
            const text = readFileSync(path, 'utf8');
            assert.match(text, /Conservative boundary withholding/i);
            assert.doesNotMatch(text, /CHANGED-LIVE-BYTES|CHANGED-RETAINED-BYTES/);
          }
          assert.deepEqual(writeReport({root, itemId: 'demo', view}), out, 'immutable repeat export remains idempotent');
          assert.deepEqual(store.database.prepare('SELECT * FROM records ORDER BY kind,id').all(), before);
        });
      });
    }
  }
}

for (const encoding of ['utf8', 'latin1']) {
  test(`round3 fully contained ${encoding} boundary control is redacted without uncertain withholding`, async () => {
    await withWorkspace(({root, store}) => {
      const bytes = Buffer.alloc(65536, 46);
      if (encoding === 'latin1') bytes[0] = 0;
      Buffer.from(boundarySecret).copy(bytes, 65502);
      setupReport(root, store, {}, bytes);
      setReportLease(store, boundarySecret);
      const view = buildReport(store, {itemId: 'demo'});
      const out = writeReport({root, itemId: 'demo', view});
      const meta = JSON.parse(readFileSync(out.metadataPath));
      const preview = meta.view.inspection.artifactPreviews[0];
      assert.equal(preview.previewState, 'complete');
      assert.equal(preview.previewBytes, 65536);
      assert.equal(preview.sourceDigest, hash(bytes));
      assert.equal(preview.content, bytes.subarray(0, 65502).toString(encoding) + '[redacted bearer]');
      assert.equal(preview.boundaryWithheldBytes ?? 0, 0);
      assert.equal(meta.redactions.boundaries ?? 0, 0);
      const companion = meta.companions.find(c => c.kind === 'artifact-preview');
      const text = /<pre>([^<]*)<\/pre>/.exec(readFileSync(join(out.directory, companion.file), 'utf8'))[1];
      assert.equal(encoding === 'latin1' ? Buffer.from(text.replace(/\s/g, ''), 'hex').toString('latin1') : text, preview.content);
    });
  });
}

test('round3 message and title previews sanitize full values before UTF-8 and character cuts', async () => {
  await withWorkspace(({root, store}) => {
    setupReport(root, store);
    const message = appendMessage(store, 1);
    const secret = `${boundarySecret}€`;
    mutateBody(store, 'message', message.id, body => {
      body.payload.did = 'é'.repeat(235) + secret + ' full retained message tail';
    });
    mutateBody(store, 'item', 'demo', body => { body.title = 'é'.repeat(112) + secret + ' full title tail'; });
    setReportLease(store, secret);
    const view = buildReport(store, {itemId: 'demo'});
    const excerpt = view.messages[0].payloadExcerpt;
    assert.equal(excerpt.truncated, true);
    assert.ok(Buffer.byteLength(excerpt.text) <= 512);
    const out = writeReport({root, itemId: 'demo', view});
    const meta = JSON.parse(readFileSync(out.metadataPath));
    assert.equal(meta.view.inspection.messagePages[0][0].record.body.payload.did,
      'é'.repeat(235) + '[redacted bearer] full retained message tail');
    assert.equal(meta.view.item.title, 'é'.repeat(112) + '[redacted bearer] full title tail');
    for (const path of [out.metadataPath, out.path, out.indexPath, out.markdownPath,
      ...meta.companions.map(c => join(out.directory, c.file))]) {
      const text = readFileSync(path, 'utf8');
      assert.equal(text.includes(boundarySecret.slice(0, 16)), false, 'no known-secret partial prefix in message/title surfaces');
      assert.doesNotMatch(text, /\ufffd/);
    }
    assert.deepEqual(redactReport(view), view);
  });
});

test('round3 a confirmed full bearer at a limited cut is not counted again as uncertain withholding', () => {
  const view = redactReport({
    item: {lease: {token: 'ABCABC'}},
    inspection: {artifactPreviews: [{
      content: 'safe ABCABC', encoding: 'utf8', previewState: 'limited', previewBytes: 11,
    }]},
  });
  assert.equal(view.inspection.artifactPreviews[0].content, 'safe [redacted bearer]');
  assert.equal(view.inspection.artifactPreviews[0].boundaryWithheldBytes ?? 0, 0);
  assert.equal(view.redactions.occurrences, 1);
  assert.equal(view.redactions.boundaries ?? 0, 0);
  assert.deepEqual(redactReport(view), view);
});

test('round3 legacy zero-boundary bundles remain immutable and repeatable before selecting a new index', async () => {
  await withWorkspace(({root, store}) => {
    setupReport(root, store, {}, `safe ${boundarySecret}`);
    setReportLease(store, boundarySecret);
    const view = buildReport(store, {itemId: 'demo'});
    const first = writeReport({root, itemId: 'demo', view});
    const metadata = JSON.parse(readFileSync(first.metadataPath));
    // Prior schema-2 exports had only fields/occurrences. Recreate that complete,
    // owned bundle, including its exact view and index-to-metadata binding.
    delete metadata.redactions.boundaries;
    delete metadata.view.redactions.boundaries;
    metadata.view_digest = hash(JSON.stringify(metadata.view));
    const landing = renderLanding(metadata);
    metadata.landing.digest = hash(landing);
    writeFileSync(first.metadataPath, JSON.stringify(metadata, null, 2) + '\n');
    writeFileSync(first.indexPath, landing);
    const oldPaths = [first.path, first.markdownPath, first.metadataPath,
      ...metadata.companions.map(c => join(first.directory, c.file))];
    const originals = oldPaths.map(path => readFileSync(path));
    assert.deepEqual(writeReport({root, itemId: 'demo', view: metadata.view}), first,
      'adding an unused zero counter must not cause a same-HTML/different-sidecar collision');
    assert.equal(readFileSync(first.indexPath, 'utf8'), landing);
    const next = writeReport({root, itemId: 'demo', view: {...metadata.view, generatedAt: '2026-09-19T00:00:00Z'}});
    assert.notEqual(next.path, first.path);
    assert.notEqual(readFileSync(first.indexPath, 'utf8'), landing);
    assert.deepEqual(oldPaths.map(path => readFileSync(path)), originals);
  });
});

for (const [label, suffix, tail, expectedBytes, withheld] of [
  ['one-byte prefix', '0', boundarySecret.slice(1), 65536, 1],
  ['unconfirmed lookalike', boundarySecret.slice(0, -1), '!', 65536, 33],
  ['split UTF-8 in bearer', `${boundarySecret}€`, 'tail', 65535, 34],
]) {
  test(`round3 ${label} is conservatively withheld using only the verified source prefix`, async () => {
    await withWorkspace(({root, store}) => {
      const secret = label === 'split UTF-8 in bearer' ? `${boundarySecret}€Z` : boundarySecret;
      const start = label === 'split UTF-8 in bearer' ? 65501 : 65536 - Buffer.byteLength(suffix);
      const bytes = Buffer.from('.'.repeat(start) + suffix + tail);
      setupReport(root, store, {}, bytes);
      setReportLease(store, secret);
      const view = buildReport(store, {itemId: 'demo'});
      const preview = view.inspection.artifactPreviews[0];
      assert.equal(preview.content, '.'.repeat(start) + '[withheld possible bearer-boundary]');
      assert.equal(preview.previewBytes, expectedBytes);
      assert.equal(preview.boundaryWithheldBytes, withheld);
      assert.equal(preview.sourceSize, bytes.length);
      assert.equal(preview.sourceDigest, hash(bytes));
      assert.equal(view.redactions.occurrences, 0, 'an uninspected continuation must not become a confirmed occurrence');
      assert.equal(view.redactions.boundaries, 1);
      assert.deepEqual(redactReport(view), view);
    });
  });
}

for (const size of [4096, 65535, 65536, 65537]) {
  test(`round2 zero-rich retained artifact at ${size} bytes has a bounded honest preview`, async () => {
    await withWorkspace(({root, store}) => {
      const bytes = Buffer.alloc(size);
      const {artifactId} = setupReport(root, store, {}, bytes);
      acceptReport(root, store, artifactId);
      const before = store.database.prepare('SELECT * FROM records ORDER BY kind,id').all();
      const view = buildReport(store, {itemId: 'demo'});
      const preview = view.inspection.artifactPreviews[0];
      assert.ok(preview.content.length <= 65536, 'binary capture must be bounded before serialization');
      assert.equal(preview.sourceSize, size);
      assert.equal(preview.sourceDigest, hash(bytes), 'SHA-256 identifies the full retained file, never its prefix');
      assert.equal(preview.previewBytes, Math.min(size, 65536));
      assert.equal(preview.omittedBytes, Math.max(0, size - 65536));
      assert.equal(preview.previewState, size > 65536 ? 'limited' : 'complete');
      assert.equal(preview.encoding, 'latin1');
      assert.equal(view.artifacts[0].integrity, 'verified');
      assert.equal(view.decisions[0].integrity, 'verified', 'a presentation limit does not reject source acceptance');
      assert.equal(view.integrity.status, 'verified');
      assert.deepEqual(view.gaps, []);
      const out = writeReport({root, itemId: 'demo', view});
      const metadataBytes = readFileSync(out.metadataPath, 'utf8');
      assert.ok(metadataBytes.length < 450000, 'zero/control expansion stays bounded in the sidecar');
      const metadata = JSON.parse(metadataBytes);
      assert.equal(metadata.view_digest, hash(JSON.stringify(metadata.view)));
      const companion = metadata.companions.find(c => c.kind === 'artifact-preview');
      assert.match(companion.file, /^artifact-[a-f0-9]{32}-1\.html$/);
      const html = readFileSync(join(out.directory, companion.file), 'utf8');
      assert.equal(hash(html), companion.digest);
      const hex = /<pre>([^<]*)<\/pre>/.exec(html)[1].replace(/\s/g, '');
      assert.equal(hex, '00'.repeat(Math.min(size, 65536)));
      assert.ok(html.length < 150000, 'hex formatting is bounded too');
      assert.ok(readFileSync(out.path, 'utf8').includes(companion.file));
      assert.match(html, /Back to captured report/);
      if (size > 65536) {
        for (const rendered of [html, renderHtml(view), renderMarkdown(view)]) {
          assert.match(rendered, /Presentation limitation/i);
          assert.match(rendered, /64 KiB.*1 MiB/);
          assert.match(rendered, /65536.*65537/);
        }
        assert.deepEqual(preview.limitReasons, ['artifact-preview-budget']);
      }
      assert.deepEqual(readFileSync(join(root, preview.retainedPath)), bytes);
      assert.deepEqual(store.database.prepare('SELECT * FROM records ORDER BY kind,id').all(), before);
      assert.equal(buildReport(store, {itemId: 'demo'}).throughSeq, view.throughSeq);
    });
  });
}

for (const [label, bytes, expected, encoding, count] of [
  ['split UTF-8', Buffer.from('a'.repeat(65535) + '€TAIL'), 'a'.repeat(65535), 'utf8', 65535],
  ['complete UTF-8 at boundary', Buffer.from('a'.repeat(65532) + '😀TAIL'), 'a'.repeat(65532) + '😀', 'utf8', 65536],
  ['BOM and split UTF-8', Buffer.from('\ufeff' + 'a'.repeat(65532) + '😀TAIL'), '\ufeff' + 'a'.repeat(65532), 'utf8', 65535],
  ['control beyond prefix', Buffer.concat([Buffer.alloc(65536, 65), Buffer.from([1])]), 'A'.repeat(65536), 'latin1', 65536],
  ['invalid UTF-8 beyond prefix', Buffer.concat([Buffer.alloc(65536, 65), Buffer.from([255])]), 'A'.repeat(65536), 'latin1', 65536],
]) {
  test(`round2 ${label} preserves exact prefix and full-source identity`, async () => {
    await withWorkspace(({root, store}) => {
      setupReport(root, store, {}, bytes);
      const view = buildReport(store, {itemId: 'demo'});
      const preview = view.inspection.artifactPreviews[0];
      assert.equal(preview.content, expected, 'bounded UTF-8 must neither invent replacement characters nor split scalars');
      assert.equal(preview.encoding, encoding);
      assert.equal(preview.previewBytes, count);
      assert.equal(preview.sourceSize, bytes.length);
      assert.equal(preview.sourceDigest, hash(bytes));
      assert.equal(preview.omittedBytes, bytes.length - count);
      if (count < 65536) assert.ok(preview.limitReasons.includes('utf8-boundary'));
      file(root, source, 'CHANGED LIVE CONTENT');
      file(root, preview.retainedPath, 'CHANGED RETAINED CONTENT');
      const out = writeReport({root, itemId: 'demo', view});
      const meta = JSON.parse(readFileSync(out.metadataPath));
      assert.equal(meta.view.inspection.artifactPreviews[0].content, expected);
      const page = meta.companions.find(c => c.kind === 'artifact-preview');
      assert.doesNotMatch(readFileSync(join(out.directory, page.file), 'utf8'), /CHANGED LIVE|CHANGED RETAINED|\ufffd/);
      const damaged = buildReport(store, {itemId: 'demo'});
      assert.ok(damaged.inspection.artifactPreviews[0].gap, 'subsequent missing/corrupt retained bytes remain gaps');
    });
  });
}

test('round2 full integrity hashing and preview capture use bounded real-file reads', async () => {
  await withWorkspace(({root, store}) => {
    const bytes = Buffer.concat([Buffer.alloc(65536), Buffer.from([7])]);
    const {artifactId} = setupReport(root, store, {}, bytes);
    acceptReport(root, store, artifactId);
    const original = fs.readFileSync;
    const read = fs.readSync;
    fs.readFileSync = (path, ...args) => {
      const stat = typeof path === 'number' ? fs.fstatSync(path) : fs.statSync(path);
      if (stat.size > 65536) throw new Error('Whole artifact read is forbidden during report preparation');
      return original(path, ...args);
    };
    fs.readSync = (fd, buffer, offset, length, position) => {
      assert.ok(length <= 65536, 'read buffer is bounded independently of full artifact size');
      return read(fd, buffer, offset, length, position);
    };
    syncBuiltinESMExports();
    let view;
    try { view = buildReport(store, {itemId: 'demo'}); }
    finally { fs.readFileSync = original; fs.readSync = read; syncBuiltinESMExports(); }
    assert.equal(view.artifacts[0].integrity, 'verified', 'integrity checks must not read the whole source or retained file');
    assert.equal(view.inspection.artifactPreviews[0].sourceDigest, hash(bytes));
    assert.equal(view.inspection.artifactPreviews[0].previewBytes, 65536);
    assert.equal(view.integrity.status, 'verified');
  });
});

test('round2 one artifact budget covers all its retained bundle members', async () => {
  await withWorkspace(({root, store}) => {
    const paths = ['.kai/runs/report-fixture/first.bin', '.kai/runs/report-fixture/second.bin', '.kai/runs/report-fixture/third.bin'];
    for (const path of paths) file(root, path, Buffer.alloc(40000));
    setupReport(root, store, {change_ref: hashBundle({root, paths})});
    const view = buildReport(store, {itemId: 'demo'});
    const previews = view.inspection.artifactPreviews;
    assert.deepEqual(previews.map(p => p.content?.length ?? 0), [40000, 25536, 0]);
    assert.deepEqual(previews.map(p => p.previewState), ['complete', 'limited', 'omitted']);
    assert.deepEqual(previews.map(p => p.sourceSize), [40000, 40000, 40000]);
    assert.ok(previews.every(p => p.sourceDigest === hash(Buffer.alloc(40000))));
    assert.deepEqual(previews[2].limitReasons, ['artifact-preview-budget']);
    assert.equal(previews[2].content, null);
    assert.ok(!previews[2].gap);
  });
});

test('round2 aggregate budget omits previews not integrity checks or full required text and history', async () => {
  await withWorkspace(({root, store}) => {
    const bytes = Buffer.alloc(65537);
    const full = 'Required complete text '.repeat(4000);
    setupReport(root, store, {acceptance: ['Exact behavior verified', full]}, bytes);
    for (let i = 1; i < 18; i++) addReportArtifact(root, store);
    const first = appendMessage(store, 0);
    mutateBody(store, 'message', first.id, body => { body.payload.did = full; });
    for (let i = 1; i < 52; i++) appendMessage(store, i);
    const opening = appendMessage(store, 52);
    mutateBody(store, 'message', opening.id, body => {
      body.kind = 'question';
      body.payload = {questionKind: 'decision', blocking: true, context: full, ask: full, answerBy: 'before work'};
    });
    seedRecord(store, {kind: 'question', id: 'budget-question', itemId: 'demo', version: 1, body: {
      schema_version: 1, question_id: 'budget-question', item_id: 'demo',
      asker: {role: 'eng-builder-software', runId: 'producer-run'},
      recipient: 'eng-reviewer-code', kind: 'decision', blocking: true, status: 'open',
      context: full, ask: full, answer_by: 'before work',
      opened_message_id: opening.id, answer_message_ids: [], resolution: null,
    }});
    mutateBody(store, 'item', 'demo', body => {
      body.state = 'blocked'; body.resume_state = 'in-review'; body.waiting_on_questions = ['budget-question'];
    });
    const view = buildReport(store, {itemId: 'demo'});
    const previews = view.inspection.artifactPreviews;
    assert.equal(previews.reduce((sum, p) => sum + (p.content?.length ?? 0), 0), 1048576);
    assert.equal(previews.filter(p => p.previewState === 'omitted').length, 2);
    assert.equal(previews[16].sourceDigest, hash(bytes));
    assert.equal(previews[16].sourceSize, 65537);
    assert.deepEqual(previews[16].limitReasons, ['report-preview-budget']);
    assert.equal(previews[16].content, null);
    assert.equal(view.criteria[1].text, full);
    assert.equal(view.questions[0].context, full);
    assert.equal(view.blockers[0].ask, full);
    assert.equal(view.inspection.messagePages.flat().find(p => p.record.id === first.id).record.body.payload.did, full);
    assert.ok(view.artifacts.every(a => a.integrity === 'verified'));
    assert.deepEqual(view.gaps, []);
    const out = writeReport({root, itemId: 'demo', view});
    const metadata = JSON.parse(readFileSync(out.metadataPath));
    assert.deepEqual(metadata.view.inspection.previewBudget, {
      perArtifactBytes: 65536, aggregateBytes: 1048576, capturedBytes: 1048576,
    });
    const companion = metadata.companions.filter(c => c.kind === 'artifact-preview')[16];
    const html = readFileSync(join(out.directory, companion.file), 'utf8');
    assert.match(html, /No preview.*budget/i);
    assert.match(html, /Presentation limitation/i);
    assert.ok(readFileSync(out.path, 'utf8').includes(companion.file));
    assert.match(html, /Back to captured report/);
    file(root, previews[16].retainedPath, Buffer.alloc(65537, 1));
    rmSync(join(root, previews[17].retainedPath));
    const damaged = buildReport(store, {itemId: 'demo'});
    for (const index of [16, 17]) {
      assert.ok(damaged.inspection.artifactPreviews[index].gap, 'exhausted budget must not hide corrupt or missing files');
      assert.equal(damaged.inspection.artifactPreviews[index].content, null);
    }
  });
});

test('round1 binary preview is complete lossless hex after known-bearer redaction', async () => {
  await withWorkspace(({root, store}) => {
    const bytes = Buffer.concat([Buffer.from([0, 255, 8]), Buffer.from('BINARY-SECRET'), Buffer.from([2, 13])]);
    setupReport(root, store, {}, bytes);
    mutateBody(store, 'item', 'demo', body => { body.lease = {
      holder: {role: 'eng-builder-software', runId: 'producer-run'}, token: 'BINARY-SECRET',
      acquired_at: NOW, expires_at: '2026-09-17T12:00:00.000Z', version_at_grant: 1,
    }; });
    const view = buildReport(store, {itemId: 'demo'});
    const out = writeReport({root, itemId: 'demo', view});
    const meta = JSON.parse(readFileSync(out.metadataPath));
    const preview = meta.view.inspection.artifactPreviews[0];
    assert.equal(preview.sourceDigest, hash(bytes));
    assert.equal(preview.encoding, 'latin1');
    const page = meta.companions.find(c => c.kind === 'artifact-preview');
    const html = readFileSync(join(out.directory, page.file), 'utf8');
    const hex = /<pre>([^<]*)<\/pre>/.exec(html)[1].replace(/\s/g, '');
    assert.equal(hex, Buffer.concat([Buffer.from([0, 255, 8]), Buffer.from('[redacted bearer]'), Buffer.from([2, 13])]).toString('hex'));
    assert.doesNotMatch(JSON.stringify(meta) + html, /BINARY-SECRET/);
    assert.match(html, /Redactions applied:/);
  });
});

const bare = () => ({
  item: {id: 'demo', title: '<script>alert(1)</script>', state: 'blocked'},
  decisions: [], criteria: [], artifacts: [], reviews: [], messages: [],
  attempts: [{actualModel: null, cost: null}], gaps: ['Missing review'],
  throughSeq: 7, generatedAt: '2026-09-16T21:00:00Z',
});

test('round1 mismatched item thread messages are withheld from summaries as well as companions', async () => {
  await withWorkspace(({root, store}) => {
    seedItem(store, {state: 'ready', acceptance_actor: null});
    const message = appendMessage(store, 1);
    message.body.item_id = 'other';
    message.body.thread_id = 'other';
    message.body.payload.did = 'OUT-OF-SCOPE-CONTENT';
    store.database.prepare("UPDATE records SET item_id='other', body=? WHERE kind='message' AND id=?")
      .run(JSON.stringify(message.body), message.id);
    store.database.prepare("UPDATE events SET thread_id='demo' WHERE message_id=?").run(message.id);
    const view = buildReport(store, {itemId: 'demo'});
    assert.doesNotMatch(JSON.stringify(view), /OUT-OF-SCOPE-CONTENT/);
    assert.ok(view.gaps.some(g => /scope|mismatch/.test(g.message)), JSON.stringify(view.gaps));
    const out = writeReport({root, itemId: 'demo', view});
    assert.doesNotMatch(readFileSync(out.metadataPath, 'utf8'), /OUT-OF-SCOPE-CONTENT/);
  });
});

test('round1 repeated sanitization preserves actual redaction counts and binary retained content is inert', async () => {
  const once = redactReport({text: '{"leaseToken":"SECRET-RAW"} Authorization: Bearer TOKEN-RAW'});
  const twice = redactReport(once);
  assert.deepEqual(twice.redactions, once.redactions, 'already redacted text is not a new omission');
  await withWorkspace(({root, store}) => {
    const bytes = Buffer.concat([Buffer.from([0, 255, 8]), Buffer.from('BINARY-SECRET'), Buffer.from([2, 13])]);
    const {artifactId} = setupReport(root, store);
    const a = readRecord(store, 'artifact', artifactId).body;
    // Keep the original exact artifact registration; changed retained bytes must never be previewed.
    file(root, a.snapshots[0].snapshot_path, bytes);
    const view = buildReport(store, {itemId: 'demo'});
    assert.ok(view.inspection.artifactPreviews[0].gap);
    const out = writeReport({root, itemId: 'demo', view});
    const meta = JSON.parse(readFileSync(out.metadataPath));
    const page = meta.companions.find(c => c.kind === 'artifact-preview');
    assert.match(readFileSync(join(out.directory, page.file), 'utf8'), /do not match registered digest/);
    assert.doesNotMatch(readFileSync(join(out.directory, page.file), 'utf8'), /BINARY-SECRET/);
  });
});

test('round1 stable landing updates only recognized owned bytes and keeps complete generations', async () => {
  await withWorkspace(({root, store}) => {
    seedItem(store, {state: 'ready', acceptance_actor: null});
    const view = buildReport(store, {itemId: 'demo'});
    const first = writeReport({root, itemId: 'demo', view});
    const index = join(first.directory, 'index.html');
    assert.ok(existsSync(index), 'human operator needs stable index.html');
    assert.equal(first.indexPath, index);
    const before = readFileSync(index, 'utf8');
    const second = writeReport({root, itemId: 'demo', view: {...view, generatedAt: '2026-09-18T00:00:00Z'}});
    assert.notEqual(readFileSync(index, 'utf8'), before);
    assert.match(readFileSync(index, 'utf8'), new RegExp(second.path.split(/[\\/]/).at(-1)));
    assert.ok(existsSync(first.path));
    writeFileSync(index, 'User-owned index');
    assert.throws(() => writeReport({root, itemId: 'demo', view}), code('EVIDENCE_GAP'));
    assert.equal(readFileSync(index, 'utf8'), 'User-owned index');
  });
});

test('round1 sidecar cannot silently drop a companion while authorizing stable index replacement', async () => {
  await withWorkspace(({root, store}) => {
    setupReport(root, store);
    appendMessage(store, 1);
    const view = buildReport(store, {itemId: 'demo'});
    const first = writeReport({root, itemId: 'demo', view});
    const index = readFileSync(first.indexPath);
    const metadata = JSON.parse(readFileSync(first.metadataPath));
    metadata.companions.pop();
    writeFileSync(first.metadataPath, JSON.stringify(metadata, null, 2) + '\n');
    assert.throws(() => writeReport({root, itemId: 'demo', view: {...view, generatedAt: '2026-09-19T00:00:00Z'}}),
      code('EVIDENCE_GAP'));
    assert.deepEqual(readFileSync(first.indexPath), index);
  });
});

for (const trap of ['initial-user-index', 'index-hardlink', 'index-junction', 'different-workspace', 'held-writer-lock']) {
  test(`round1 ${trap} cannot be replaced or bypassed`, async () => {
    await withWorkspace(({root, store}) => {
      seedItem(store, {state: 'ready', acceptance_actor: null});
      let view = buildReport(store, {itemId: 'demo'});
      const paths = reportPaths({root, itemId: 'demo'});
      const sentinel = file(root, 'sentinel.txt', 'human owned');
      if (trap === 'initial-user-index') {
        mkdirSync(paths.directory, {recursive: true});
        writeFileSync(paths.indexPath, 'human owned');
      } else {
        writeReport({root, itemId: 'demo', view});
        if (trap === 'index-hardlink' || trap === 'index-junction') {
          rmSync(paths.indexPath);
          if (trap === 'index-hardlink') linkSync(sentinel, paths.indexPath);
          else symlinkSync(dirname(sentinel), paths.indexPath, process.platform === 'win32' ? 'junction' : 'dir');
        } else if (trap === 'different-workspace') {
          const path = join(root, '.kai', 'manifest.json');
          const manifest = JSON.parse(readFileSync(path));
          manifest.workspace_id = 'replacement-workspace';
          writeFileSync(path, JSON.stringify(manifest));
          view = buildReport(store, {itemId: 'demo'});
        } else writeFileSync(join(paths.directory, 'current.lock'), 'another writer');
      }
      assert.throws(() => writeReport({root, itemId: 'demo', view: {...view, generatedAt: '2026-09-19T00:00:00Z'}}),
        error => ['INVALID_INPUT', 'EVIDENCE_GAP', 'STORE_BUSY'].includes(error.code));
      assert.equal(readFileSync(sentinel, 'utf8'), 'human owned');
      if (trap === 'initial-user-index') assert.equal(readFileSync(paths.indexPath, 'utf8'), 'human owned');
      if (trap === 'held-writer-lock') assert.equal(readFileSync(join(paths.directory, 'current.lock'), 'utf8'), 'another writer');
    });
  });
}

test('round1 failed atomic replacement preserves the prior landing without test-only production hooks', async () => {
  await withWorkspace(({root, store}) => {
    seedItem(store, {state: 'ready', acceptance_actor: null});
    const view = buildReport(store, {itemId: 'demo'});
    const first = writeReport({root, itemId: 'demo', view});
    const original = fs.renameSync;
    const before = readFileSync(first.indexPath);
    let called = false;
    fs.renameSync = (source, target) => {
      assert.equal(target, first.indexPath);
      assert.deepEqual(readFileSync(target), before, 'old landing remains complete until rename');
      assert.match(readFileSync(source, 'utf8'), /Open captured report/);
      called = true;
      throw new Error('synthetic rename failure');
    };
    syncBuiltinESMExports();
    try {
      assert.throws(() => writeReport({root, itemId: 'demo', view: {...view, generatedAt: '2026-09-19T00:00:00Z'}}),
        /synthetic rename failure/);
    } finally { fs.renameSync = original; syncBuiltinESMExports(); }
    assert.equal(called, true);
    assert.deepEqual(readFileSync(first.indexPath), before);
    assert.ok(!existsSync(join(first.directory, 'current.lock')));
    assert.ok(!fs.readdirSync(first.directory).some(f => f.endsWith('.new')));
  });
});

test('round1 offline companions retain full older messages and exact inert snapshots from capture time', async () => {
  await withWorkspace(({root, store}) => {
    const {artifactId} = setupReport(root, store);
    const first = appendMessage(store, 0, {long: true});
    for (let i = 1; i < 121; i++) appendMessage(store, i);
    appendMessage(store, 999, {threadId: 'unrelated-thread'});
    const view = buildReport(store, {itemId: 'demo'});
    appendMessage(store, 1000);
    mutateBody(store, 'message', first.id, b => { b.payload.did = 'AFTER CAPTURE'; });
    const a = readRecord(store, 'artifact', artifactId).body;
    file(root, a.snapshots[0].snapshot_path, 'AFTER CAPTURE');
    const out = writeReport({root, itemId: 'demo', view});
    const meta = JSON.parse(readFileSync(out.metadataPath));
    assert.ok(meta.companions?.length >= 4, 'history pages plus inert artifact preview are actual files');
    const pages = meta.companions.map(c => {
      assert.match(c.file, /^[a-z0-9-]+\.html$/);
      const bytes = readFileSync(join(out.directory, c.file));
      assert.equal(hash(bytes), c.digest);
      return bytes.toString();
    });
    assert.ok(pages.some(p => p.includes(first.body.payload.did)));
    assert.ok(pages.some(p => p.includes('&lt;script&gt;globalThis.evidenceExecuted')));
    assert.doesNotMatch(pages.join(''), /AFTER CAPTURE|Synthetic step 999|Synthetic step 1000|<script>/);
    assert.match(readFileSync(out.path, 'utf8'), /href="history-[a-z0-9-]+\.html/);
    assert.match(readFileSync(out.path, 'utf8'), /href="artifact-[a-z0-9-]+\.html/);
    assert.doesNotMatch(readFileSync(out.path, 'utf8'), /readDetail\(store|readMessages\(store/);
  });
});

test('round1 pending failed satisfied and missing dependencies stay distinct without lifecycle changes', async () => {
  await withWorkspace(({store}) => {
    seedItem(store, {state: 'ready', acceptance_actor: null, depends_on: [
      {item: 'pending', requires: 'completed'}, {item: 'failed', requires: 'completed'},
      {item: 'done', requires: 'completed'}, {item: 'missing', requires: 'completed'},
    ]});
    seedItem(store, {id: 'pending', state: 'in-review', acceptance_actor: null});
    seedItem(store, {id: 'failed', state: 'dropped', acceptance_actor: null});
    seedItem(store, {id: 'done'});
    const view = buildReport(store, {itemId: 'demo'});
    assert.ok(view.blockers.some(b => b.ref === 'item:pending' && b.status === 'pending'));
    assert.ok(view.blockers.some(b => b.ref === 'item:failed' && b.status === 'failed'));
    assert.ok(view.blockers.some(b => b.ref === 'item:missing' && b.status === 'missing'));
    assert.ok(!view.blockers.some(b => b.ref === 'item:done'));
    assert.ok(view.gaps.some(g => g.ref === 'item:pending' && g.severity === 'pending'));
    assert.ok(view.gaps.some(g => g.ref === 'item:failed' && g.severity === 'gap'));
    assert.equal(readRecord(store, 'item', 'demo').body.state, 'ready');
  });
});

test('round1 six ordered sections expose declared scope revision evidence and important rationale', async () => {
  await withWorkspace(({root, store}) => {
    const {artifactId} = setupReport(root, store);
    acceptReport(root, store, artifactId);
    const view = buildReport(store, {itemId: 'demo'});
    const html = renderHtml(view);
    assert.deepEqual([...html.matchAll(/<h2[^>]*>([^<]+)<\/h2>/g)].map(m => m[1]), [
      'Outcome and current state', 'Changes and important decisions',
      'Criteria-to-evidence coverage and exact artifacts', 'Independent verdicts and uncertainty',
      'Addressed thread and execution history', 'Attempts, models and usage',
    ]);
    assert.match(html, /Declared scope.*not verified changes/);
    assert.match(html, /scripts\/lib\/coordination-runtime\/\*\*/);
    assert.match(html, /Recorded artifact revision/);
    assert.match(html, /Independent exact proof/);
    assert.match(html, /No before\/after change semantics/);
  });
});

test('round1 system heading bounded subject full accessible text and truthful status strip', async () => {
  const view = bare();
  view.item.title = 'HOSTILE SUBJECT '.repeat(250);
  view.integrity = {status: 'pending'};
  view.blockers = [{ref: 'question:q', ask: 'Recorded blocker'}];
  const html = renderHtml(view);
  assert.match(html, /<h1>Coordination evidence report<\/h1>/);
  assert.match(html, /class="subject"[^>]*>[^<]{1,180}<\/p>/);
  assert.ok(html.includes(view.item.title), 'full subject is accessible in native details');
  assert.match(html, /class="status-strip"[^>]*>Recorded state: blocked.*Proof checks: pending.*Blockers: 1/);
});

test('round1 visible provenance and redaction notice include actual omitted bearer fields', async () => {
  await withWorkspace(({root, store}) => {
    setupReport(root, store);
    mutateBody(store, 'item', 'demo', b => { b.lease = {
      holder: {role: 'eng-builder-software', runId: 'producer-run'}, token: 'ROUND1-SECRET',
      acquired_at: NOW, expires_at: '2026-09-17T12:00:00.000Z', version_at_grant: 1,
    }; });
    const message = appendMessage(store, 1);
    mutateBody(store, 'message', message.id, b => { b.payload.did = 'ROUND1-SECRET'; });
    const view = buildReport(store, {itemId: 'demo'});
    const out = writeReport({root, itemId: 'demo', view});
    const html = readFileSync(out.path, 'utf8');
    assert.match(html, /Redactions applied:/);
    assert.match(html, /Provenance: declared/);
    const meta = JSON.parse(readFileSync(out.metadataPath));
    assert.ok(meta.redactions?.fields > 0);
    assert.doesNotMatch(JSON.stringify(meta), /ROUND1-SECRET/);
    for (const c of meta.companions) assert.doesNotMatch(readFileSync(join(out.directory, c.file), 'utf8'), /ROUND1-SECRET/);
  });
});

test('round1 Git changes use registered bound immutable commits without diff or textconv helpers', async () => {
  await withWorkspace(({root, store}) => {
    const project = join(root, 'project');
    mkdirSync(project);
    const git = args => execFileSync('git', ['--no-pager', '-C', project, ...args], {encoding: 'utf8'}).trim();
    git(['init', '--quiet']);
    git(['config', 'core.autocrlf', 'false']);
    git(['config', 'user.name', 'Synthetic fixture']);
    git(['config', 'user.email', 'fixture@example.invalid']);
    file(project, 'actual.txt', 'before\n');
    git(['add', '--', 'actual.txt']);
    git(['commit', '--quiet', '-m', 'synthetic base']);
    const base = git(['rev-parse', 'HEAD']);
    file(project, 'actual.txt', 'after\n');
    file(project, 'new.txt', 'new\n');
    git(['add', '--', 'actual.txt', 'new.txt']);
    git(['commit', '--quiet', '-m', 'synthetic head']);
    const head = git(['rev-parse', 'HEAD']);
    const manifestPath = join(root, '.kai', 'manifest.json');
    const manifest = JSON.parse(readFileSync(manifestPath));
    manifest.projects = [{id: 'bound', path: project, publication_root: 'docs'}];
    writeFileSync(manifestPath, JSON.stringify(manifest));
    const {artifactId} = setupReport(root, store, {change_ref: {kind: 'git', base, head}});
    // setupReport registers a Git artifact only with an explicit project binding.
    assert.ok(artifactId);
    git(['config', 'diff.external', 'MUST-NOT-EXECUTE']);
    git(['config', 'diff.test.textconv', 'MUST-NOT-EXECUTE']);
    file(project, '.gitattributes', '*.txt diff=test\n');
    const view = buildReport(store, {itemId: 'demo'});
    assert.ok(view.changes?.some(c => c.path === 'actual.txt' && c.status === 'M'));
    assert.ok(view.changes.some(c => c.path === 'new.txt' && c.status === 'A'));
    assert.ok(view.changes.every(c => c.base === base && c.head === head));
  });
});

test('renderers escape untrusted text, stamp snapshots and never invent model or cost', () => {
  const view = bare();
  const html = renderHtml(view);
  assert.ok(!html.includes('<script>alert(1)</script>'));
  assert.match(html, /&lt;script&gt;/);
  assert.match(html, /snapshot/i);
  assert.match(html, /unavailable/i);
  assert.match(html, /Missing review/);
  assert.match(html, /Content-Security-Policy/);
  assert.doesNotMatch(html, /<(script|iframe|object|embed|img)\b/i);
  const md = renderMarkdown(view);
  assert.doesNotMatch(md, /<script>/);
  assert.match(md, /snapshot/i);
  assert.match(md, /unavailable/i);
  assert.match(md, /Missing review/);
});

test('host uncertainty and unresolved effects are visible with the outcome, not hidden in attempt history', async () => {
  await withWorkspace(({store}) => {
    seedItem(store, {state: 'ready', acceptance_actor: null});
    const attempt = seedHostAttempt(store, [{status: 'timeout', liveness: 'unknown'}]);
    const effectId = randomUUID();
    seedRecord(store, {kind: 'effect', id: effectId, itemId: 'demo', version: 1, body: {
      schema_version: 1, effect_id: effectId, attempt_id: attempt.id, item_id: 'demo', item_version: 1,
      actor: {role: 'eng-builder-software', runId: 'producer-run'}, intended_action: 'Synthetic effect only',
      idempotency_key: null, external: false, paid: false, created_at: NOW, observations: [],
      outcome: 'unknown', gaps: ['EFFECT_OUTCOME_UNKNOWN'],
    }});
    const view = buildReport(store, {itemId: 'demo'});
    assert.ok(view.blockers.some(b => b.ref === `host-attempt:${attempt.id}`));
    assert.ok(view.blockers.some(b => b.ref === `effect:${effectId}`));
    assert.equal(view.integrity.status, 'gap');
    const outcomeHtml = renderHtml(view).split('<section id="coverage"')[0];
    assert.match(outcomeHtml, /uncertain/);
    assert.match(outcomeHtml, /effect/);
  });
});

test('exporting hostile item IDs really writes only encoded owned outputs and preserves prior generations', async () => {
  await withWorkspace(({root, store}) => {
    const itemId = '..\\CON:outside?';
    seedItem(store, {id: itemId, state: 'ready', acceptance_actor: null});
    const view = buildReport(store, {itemId});
    const first = writeReport({root, itemId, view});
    const second = writeReport({root, itemId, view: {...view, generatedAt: '2026-09-17T00:00:00.000Z'}});
    assert.notEqual(first.path, second.path);
    assert.ok(existsSync(first.path));
    assert.ok(existsSync(second.path));
    assert.equal(dirname(first.path), reportPaths({root, itemId}).directory);
    assert.equal(JSON.parse(readFileSync(first.metadataPath)).item.id, itemId);
  });
});

test('an unknown-scheme reference in Markdown remains inert instead of becoming an autolink', () => {
  const view = bare();
  view.item.title = 'https://attacker.invalid/a [click](javascript:alert(1))';
  const md = renderMarkdown(view);
  assert.doesNotMatch(md, /https:\/\/attacker/);
  assert.doesNotMatch(md, /\[click\]\(javascript:/);
});

test('exact artifact producer identity prevents misleading independent review labels', async () => {
  await withWorkspace(({root, store}) => {
    const {artifactId} = setupReport(root, store);
    const review = appendVerdict(store, verdict(store, 'review', artifactId));
    mutateBody(store, 'artifact', artifactId, b => {
      b.producer = review.body.reviewer;
      b.subject = {path: b.subject.path, digest: b.subject.digest, kind: b.subject.kind};
    });
    const view = buildReport(store, {itemId: 'demo'});
    assert.equal(view.reviews[0].independent, false);
    assert.equal(view.reviews[0].integrity, 'gap');
  });
});

test('ordinary incomplete work renders pending coverage, not broken approval or lifecycle failure', async () => {
  await withWorkspace(({store}) => {
    seedItem(store, {state: 'ready', acceptance_actor: null});
    const view = buildReport(store, {itemId: 'demo'});
    assert.equal(view.item.state, 'ready');
    assert.equal(view.criteria[0].status, 'pending');
    assert.equal(view.integrity.status, 'pending');
    assert.equal(view.gaps.filter(g => g.severity === 'broken-claim').length, 0);
    assert.match(renderHtml(view), /pending/i);
  });
});

test('current accepted coverage verifies real retained proof and maps only explicit review criteria', async () => {
  await withWorkspace(({root, store}) => {
    const {artifactId} = setupReport(root, store);
    acceptReport(root, store, artifactId);
    const view = buildReport(store, {itemId: 'demo'});
    assert.equal(view.integrity.status, 'verified');
    assert.equal(view.criteria[0].status, 'verified');
    assert.equal(view.criteria[1].status, 'pending');
    assert.deepEqual(view.criteria[0].evidenceRefs, [`artifact:${artifactId}`]);
    assert.equal(view.reviews[0].independent, true);
    assert.equal(view.reviews[0].integrity, 'verified');
    assert.equal(view.artifacts[0].subject.digest, hash(payload));
    assert.equal(view.artifacts[0].snapshots.length, 1);
    assert.doesNotMatch(renderHtml(view), /globalThis\.evidenceExecuted/);
  });
});

for (const damage of ['source changed', 'source missing', 'snapshot changed', 'manifest missing']) {
  test(`positive claims expose ${damage} without rewriting terminal truth`, async () => {
    await withWorkspace(({root, store}) => {
      const {artifactId} = setupReport(root, store);
      const {approval} = acceptReport(root, store, artifactId);
      mutateBody(store, 'item', 'demo', b => { b.state = 'completed'; });
      const a = readRecord(store, 'artifact', artifactId).body;
      const target = damage.startsWith('source') ? source
        : damage.startsWith('snapshot') ? a.snapshots[0].snapshot_path : a.manifest_path;
      if (damage.endsWith('missing')) rmSync(join(root, target));
      else file(root, target, 'tampered');
      const view = buildReport(store, {itemId: 'demo'});
      assert.equal(view.item.state, 'completed');
      assert.equal(view.integrity.status, 'gap');
      assert.equal(view.criteria[0].status, 'gap');
      assert.ok(view.gaps.some(g => g.severity === 'broken-claim'));
      assert.equal(readDetail(store, {kind: 'approval', id: approval.id}).body.decision, 'approved');
    });
  });
}

test('stale criteria and superseded verdicts remain historical, not newly accepted proof', async () => {
  await withWorkspace(({root, store}) => {
    const {artifactId} = setupReport(root, store);
    const {review} = acceptReport(root, store, artifactId);
    appendVerdict(store, verdict(store, 'review', artifactId, {verdict: 'changes-requested', supersedes: [review.id]}));
    let view = buildReport(store, {itemId: 'demo'});
    assert.equal(view.reviews.find(r => r.id === review.id).status, 'superseded');
    assert.equal(view.integrity.status, 'gap');
    assert.equal(view.criteria[0].status, 'gap');
    mutateBody(store, 'item', 'demo', b => { b.acceptance.push('New requirement'); b.state = 'completed'; });
    rmSync(join(root, source));
    view = buildReport(store, {itemId: 'demo'});
    assert.ok(view.reviews.every(r => r.status === 'historical'));
    assert.ok(view.reviews.every(r => r.integrity === 'not-rechecked'));
    assert.equal(view.item.state, 'completed');
    assert.ok(view.gaps.some(g => /stale|criteria/i.test(g.message)));
  });
});

test('supersession conflicts never fall back to a green list', async () => {
  await withWorkspace(({root, store}) => {
    const {artifactId} = setupReport(root, store);
    const prior = appendVerdict(store, verdict(store, 'review', artifactId));
    appendVerdict(store, verdict(store, 'review', artifactId, {supersedes: [prior.id]}));
    appendVerdict(store, verdict(store, 'review', artifactId, {supersedes: [prior.id]}));
    const view = buildReport(store, {itemId: 'demo'});
    assert.equal(view.integrity.status, 'gap');
    assert.ok(view.gaps.some(g => /conflicting successors/.test(g.message)));
    assert.ok(view.reviews.every(r => r.integrity !== 'verified'));
  });
});

test('self review and missing registered references are broken positive claims', async () => {
  await withWorkspace(({root, store}) => {
    const {artifactId} = setupReport(root, store);
    appendVerdict(store, verdict(store, 'review', artifactId, {
      reviewer: {role: 'eng-reviewer-code', runId: 'producer-run'},
    }));
    appendVerdict(store, verdict(store, 'approval', randomUUID()));
    const view = buildReport(store, {itemId: 'demo'});
    assert.equal(view.reviews[0].independent, false);
    assert.equal(view.integrity.status, 'gap');
    assert.ok(view.gaps.some(g => /missing|another item/.test(g.message)));
    assert.ok(view.gaps.some(g => /producing|independen/.test(g.message)));
  });
});

test('missing context references remain visible without losing outcome and approvals', async () => {
  await withWorkspace(({root, store}) => {
    const {artifactId} = setupReport(root, store);
    acceptReport(root, store, artifactId);
    const missing = `artifact:${randomUUID()}`;
    appendMessage(store, 1, {refs: [missing]});
    mutateBody(store, 'item', 'demo', b => { b.context_artifacts = [missing]; });
    const view = buildReport(store, {itemId: 'demo'});
    assert.ok(view.gaps.some(g => g.ref === missing));
    assert.equal(view.decisions.length, 1);
    assert.match(view.item.outcome, /coordination/);
  });
});

test('a missing recent message preserves report obligations and a bounded history inspection ceiling', async () => {
  await withWorkspace(({root, store}) => {
    const {artifactId} = setupReport(root, store);
    acceptReport(root, store, artifactId);
    const message = appendMessage(store, 1);
    store.database.prepare("DELETE FROM records WHERE kind='message' AND id=?").run(message.id);
    const view = buildReport(store, {itemId: 'demo'});
    assert.equal(view.item.id, 'demo');
    assert.equal(view.decisions.length, 1);
    assert.ok(view.gaps.some(g => /missing/.test(g.message)));
    assert.equal(view.history.totalMessages, null);
    assert.notEqual(view.history.cursor, null, 'corrupt preview must still expose its bounded inspection ceiling');
    assert.equal(view.history.cursor.beforeSeq, view.throughSeq + 1);
    assert.equal(view.history.cursor.remainingCount, null);
    assert.equal(view.integrity.status, 'gap');
  });
});

test('read-only authoring needs no host binding and does not mutate records, receipts or events', async () => {
  await withWorkspace(({root, store}) => {
    const {artifactId} = setupReport(root, store);
    acceptReport(root, store, artifactId);
    const before = readFileSync(store.path);
    const reader = openStore({path: store.path, mode: 'read'});
    try {
      const view = buildReport(reader, {itemId: 'demo'});
      assert.equal(view.integrity.status, 'verified');
      const output = writeReport({root, itemId: 'demo', view});
      assert.equal(output.throughSeq, view.throughSeq);
      assert.ok(existsSync(output.path));
    } finally { closeStore(reader); }
    assert.deepEqual(readFileSync(store.path), before);
  });
});

test('bounded recent history uses sequence cursors and retains full messages for drill-down', async () => {
  await withWorkspace(({store}) => {
    seedItem(store, {state: 'ready', acceptance_actor: null});
    const first = appendMessage(store, 0, {long: true});
    for (let i = 1; i <= 16; i++) appendMessage(store, i);
    const view = buildReport(store, {itemId: 'demo'});
    assert.equal(view.messages.length, 8);
    assert.equal(view.history.totalMessages, 17);
    assert.equal(view.history.cursor.remainingCount, 9);
    const older = readMessages(store, {...view.history.cursor, limit: 100});
    assert.equal(older.messages.length, 9);
    assert.ok(readDetail(store, {kind: 'message', id: first.id}).body.payload.did.length > 2000);
    assert.match(renderHtml(view), /8 of 17/);
    assert.match(renderMarkdown(view), /beforeSeq/);
  });
});

test('known gaps are surfaced but unexpected query failures propagate', async () => {
  await withWorkspace(({store}) => {
    seedItem(store);
    const original = store.database.prepare.bind(store.database);
    const boom = new Error('unexpected storage fault');
    store.database.prepare = sql => {
      if (/FROM records/.test(sql)) throw boom;
      return original(sql);
    };
    try { assert.throws(() => buildReport(store, {itemId: 'demo'}), error => error === boom); }
    finally { store.database.prepare = original; }
    assert.equal(readRecord(store, 'item', 'demo').id, 'demo', 'snapshot rolled back');
  });
});

test('one read snapshot includes item, proof and chronology despite a concurrent WAL writer', async () => {
  await withWorkspace(({root, store}) => {
    setupReport(root, store);
    store.database.exec('PRAGMA journal_mode=WAL');
    const writer = openStore({path: store.path, mode: 'write'});
    const original = store.database.prepare.bind(store.database);
    let changed = false;
    store.database.prepare = sql => {
      if (/FROM records/.test(sql) && !changed) {
        changed = true;
        mutateBody(writer, 'item', 'demo', b => { b.title = 'later live title'; });
        appendMessage(writer, 1);
      }
      return original(sql);
    };
    try {
      const view = buildReport(store, {itemId: 'demo'});
      assert.equal(changed, true);
      assert.equal(view.item.title, 'Demo knowledge item');
      assert.equal(view.messages.length, 0);
      assert.equal(view.throughSeq, 1);
    } finally { store.database.prepare = original; closeStore(writer); }
  });
});

test('lease bearer tokens never reach either human renderer or derived sidecars', async () => {
  await withWorkspace(({root, store}) => {
    seedItem(store, {
      state: 'ready', acceptance_actor: null,
      lease: {
        holder: {role: 'eng-builder-software', runId: 'producer-run'}, token: 'LEASE-SECRET-EXACT',
        acquired_at: NOW, expires_at: '2026-09-17T12:00:00.000Z',
        version_at_grant: 1,
      },
    });
    const view = buildReport(store, {itemId: 'demo'});
    assert.doesNotMatch(JSON.stringify(view), /LEASE-SECRET-EXACT/);
    const injected = {...view, messages: [{payload: {staleLeaseToken: 'STALE-SECRET'}}]};
    assert.doesNotMatch(renderHtml(injected) + renderMarkdown(injected), /STALE-SECRET|LEASE-SECRET-EXACT/);
    const out = writeReport({root, itemId: 'demo', view});
    assert.doesNotMatch(readFileSync(out.metadataPath, 'utf8'), /LEASE-SECRET-EXACT/);
  });
});

test('derived immutable outputs carry identity, sequence, time, hashes and no YAML header', async () => {
  await withWorkspace(({root, store}) => {
    seedItem(store, {state: 'ready', acceptance_actor: null});
    const view = buildReport(store, {itemId: 'demo'});
    const result = writeReport({root, itemId: 'demo', view});
    const html = readFileSync(result.path);
    assert.equal(hash(html), result.digest);
    assert.ok(html.toString().startsWith('<!doctype html>'));
    const metadata = JSON.parse(readFileSync(result.metadataPath));
    assert.equal(metadata.schema_version, 2);
    assert.equal(metadata.kind, 'kai-coordination-report');
    assert.equal(metadata.derived, true);
    assert.equal(metadata.workspace.id, view.workspace.id);
    assert.equal(metadata.item.id, 'demo');
    assert.equal(metadata.through_seq, view.throughSeq);
    assert.equal(metadata.generated_at, view.generatedAt);
    assert.equal(metadata.html.digest, result.digest);
    assert.equal(metadata.markdown.digest, hash(readFileSync(result.markdownPath)));
    assert.equal(metadata.view_digest, hash(JSON.stringify(metadata.view)));
    assert.deepEqual(writeReport({root, itemId: 'demo', view}), result);
    assert.throws(() => writeReport({root, itemId: 'other', view}), code('INVALID_INPUT'));
    assert.throws(() => writeReport({root, itemId: 'demo', view: {...view, workspace: {...view.workspace, id: 'other'}}}),
      code('INVALID_INPUT'));
  });
});

test('Windows hostile item IDs are collision-resistant encoded filenames, never traversal or aliases', async () => {
  await withWorkspace(({root}) => {
    const ids = ['../outside', '..\\outside', 'CON', 'nul.txt', 'a:b', 'a?b', 'a#b', 'a%b', 'Case', 'case', 'x'.repeat(800)];
    const paths = ids.map(itemId => reportPaths({root, itemId}).directory);
    assert.equal(new Set(paths.map(p => p.toLowerCase())).size, ids.length);
    assert.ok(paths.every(p => dirname(p) === join(root, '.kai', 'review', 'coordination')));
    assert.throws(() => reportPaths({root, itemId: ''}), code('INVALID_INPUT'));
  });
});

for (const trap of ['junction', 'hardlink', 'existing file']) {
  test(`report export refuses ${trap} without clobbering another output`, async () => {
    await withWorkspace(({root, store}) => {
      seedItem(store, {state: 'ready', acceptance_actor: null});
      const view = buildReport(store, {itemId: 'demo'});
      const out = writeReport({root, itemId: 'demo', view});
      const sentinel = file(root, 'sentinel.txt', 'must not change');
      if (trap === 'junction') {
        const directory = reportPaths({root, itemId: 'demo'}).directory;
        rmSync(directory, {recursive: true});
        const other = join(root, 'other-output');
        mkdirSync(other);
        symlinkSync(other, directory, process.platform === 'win32' ? 'junction' : 'dir');
      } else {
        rmSync(out.path);
        if (trap === 'hardlink') linkSync(sentinel, out.path);
        else writeFileSync(out.path, 'unowned prior bytes');
      }

      assert.throws(() => writeReport({root, itemId: 'demo', view}),
        error => error instanceof RuntimeError && ['INVALID_INPUT', 'EVIDENCE_GAP'].includes(error.code));
      assert.equal(readFileSync(sentinel, 'utf8'), 'must not change');
    });
  });
}

test('requested and observed host metadata retain all cumulative checkpoints without dollar conversion or totals', async () => {
  await withWorkspace(({root, store}) => {
    seedItem(store, {state: 'ready', acceptance_actor: null});
    seedHostAttempt(store, [
      {
        sessionId: 'session-shared', actualModel: 'observed-model', inputTokens: 11, outputTokens: 7,
        durationMs: 123, usage: {scope: 'session-cumulative', sessionId: 'session-shared',
          totalNanoAiu: 1500000000, totalPremiumRequests: 1.5},
        cost: {amount: 0.125, currency: 'EUR', scope: 'session-cumulative', sessionId: 'session-shared'},
      },
      {
        sessionId: 'session-shared', actualModel: null,
        usage: {scope: 'session-cumulative', sessionId: 'session-shared',
          totalNanoAiu: 1500000000, totalPremiumRequests: 1.5},
      },
    ]);
    const view = buildReport(store, {itemId: 'demo'});
    assert.equal(view.attempts.length, 1);
    assert.equal(view.attempts[0].observations[1].facts.actualModel, null);
    assert.equal(view.attempts[0].observations[1].facts.cost, null);
    const html = renderHtml(view);
    assert.match(html, /observed-model/);
    assert.match(html, /Model claude-sonnet-5/);
    assert.match(html, /Model unavailable/);
    assert.match(html, /EUR 0\.125/);
    assert.match(html, /1500000000 nano-AIU/);
    assert.doesNotMatch(html, /3000000000|USD|\$1\.5|\$0\.00/);
    assert.match(html, /session-cumulative/);
    assert.match(html, /not dollars/);
    const out = writeReport({root, itemId: 'demo', view});
    assert.equal(JSON.parse(readFileSync(out.metadataPath)).view.attempts[0].observations.length, 2);
  });
});

test('stale nonterminal proof is explicitly historical pending rather than silently green or broken', async () => {
  await withWorkspace(({root, store}) => {
    const {artifactId} = setupReport(root, store);
    acceptReport(root, store, artifactId);
    mutateBody(store, 'item', 'demo', b => { b.acceptance.push('New criterion'); });
    const view = buildReport(store, {itemId: 'demo'});
    assert.equal(view.integrity.status, 'pending');
    assert.ok(view.gaps.some(g => g.severity === 'pending' && /historical|stale/i.test(g.message)));
    assert.equal(view.gaps.filter(g => g.severity === 'broken-claim').length, 0);
  });
});

test('missing and invalid question links do not erase actionable blockers or render green', async () => {
  await withWorkspace(({store}) => {
    seedItem(store, {state: 'blocked', resume_state: 'ready', waiting_on_questions: ['missing-question'], acceptance_actor: null});
    const view = buildReport(store, {itemId: 'demo'});
    assert.equal(view.item.state, 'blocked');
    assert.ok(view.gaps.some(g => /question/i.test(g.message)));
    assert.ok(view.blockers.some(b => b.ref === 'question:missing-question'));
    assert.equal(view.integrity.status, 'gap');
  });
});

test('answered questions retain complete resolution and missing resolution-message evidence becomes a visible gap', async () => {
  await withWorkspace(({store}) => {
    seedItem(store, {state: 'ready', acceptance_actor: null});
    const id = 'addressed-question';
    seedRecord(store, {
      kind: 'question', id, itemId: 'demo', version: 1, body: {
        schema_version: 1, question_id: id, item_id: 'demo', asker: {role: 'eng-builder-software', runId: 'producer-run'},
        recipient: 'eng-reviewer-code', kind: 'decision', blocking: true, status: 'answered',
        context: 'Do not lose the original issue.', ask: 'Can we narrow scope?', answer_by: 'before work',
        opened_message_id: randomUUID(), answer_message_ids: [randomUUID()],
        resolution: {answer: 'Addressed resolution '.repeat(100), lane: 'in-lane', provenance: 'durable-thread',
          message_id: randomUUID(), answered_at: NOW, sender: {role: 'eng-reviewer-code', runId: 'reviewer'}},
      },
    });
    const view = buildReport(store, {itemId: 'demo'});
    assert.equal(view.questions[0].resolution.answer.length, 2100);
    assert.ok(view.gaps.some(g => g.ref === `question:${id}` && /missing|resolution/.test(g.message)));
    assert.ok(renderHtml(view).includes('Addressed resolution '.repeat(100)));
    assert.match(renderHtml(view), /<details><summary>Addressed questions/);
  });
});

test('a current approval cannot hide missing mandatory reviews behind independently verified artifact bytes', async () => {
  await withWorkspace(({root, store}) => {
    const {artifactId} = setupReport(root, store);
    appendVerdict(store, verdict(store, 'approval', artifactId));
    const view = buildReport(store, {itemId: 'demo'});
    assert.equal(view.integrity.status, 'gap');
    assert.ok(view.gaps.some(g => g.severity === 'broken-claim' && /lacks current.*review/.test(g.message)));
    assert.equal(view.decisions[0].integrity, 'gap', 'positive decision summary cannot remain green after its required gate fails');
  });
});

test('transitive negative evidence invalidates an apparently approved review', async () => {
  await withWorkspace(({root, store}) => {
    const {artifactId} = setupReport(root, store);
    const item = readRecord(store, 'item', 'demo').body;
    const id = randomUUID();
    seedRecord(store, {kind: 'evidence', id, itemId: 'demo', version: 1, body: {
      schema_version: 1, evidence_id: id, item_id: 'demo', kind: 'dod-dimension',
      subject: item.change_ref, criteria_ref: criteriaRef(item), supersedes: [], dimension: 'verified',
      outcome: 'gap', evidence_refs: [`artifact:${artifactId}`], reason: 'Known failed check',
      data: {}, created_at: NOW,
    }});
    appendVerdict(store, verdict(store, 'review', artifactId, {evidence_refs: [`evidence:${id}`]}));
    const view = buildReport(store, {itemId: 'demo'});
    assert.equal(view.reviews[0].integrity, 'gap');
    assert.equal(view.criteria[0].status, 'gap');
    assert.ok(view.gaps.some(g => /negative evidence/.test(g.message)));
  });
});

test('agent context stays bounded while human export uses linear bounded keyset pages', async () => {
  await withWorkspace(({store}) => {
    seedItem(store, {state: 'ready', acceptance_actor: null});
    for (let i = 0; i < 20; i++) appendMessage(store, i);
    const measure = (human = false) => {
      let calls = 0;
      let messageBodies = 0;
      const exportPageSizes = [];
      const original = store.database.prepare.bind(store.database);
      store.database.prepare = sql => {
        calls++;
        const statement = original(sql);
        return new Proxy(statement, {get(target, key) {
          const method = target[key];
          if (typeof method !== 'function') return method;
          return (...args) => {
            const result = method.apply(target, args);
            if (['get', 'all'].includes(key)) {
              const rows = Array.isArray(result) ? result : [result];
              messageBodies += rows.filter(r => r?.kind === 'message').length;
              if (/ORDER BY e.seq DESC LIMIT 50/.test(sql)) exportPageSizes.push(rows.length);
            }
            return result;
          };
        }});
      };
      try {
        const view = human ? buildReport(store, {itemId: 'demo'}) : projectContext(store, {itemId: 'demo'});
        if (human) assert.equal(view.messages.length, 8);
        else assert.ok(Buffer.byteLength(view.text) <= 24 * 1024);
      }
      finally { store.database.prepare = original; }
      return {calls, messageBodies, exportPageSizes};
    };
    const small = measure();
    const smallExport = measure(true);
    for (let i = 20; i < 1020; i++) appendMessage(store, i);
    const large = measure();
    const largeExport = measure(true);
    assert.equal(large.calls, small.calls);
    assert.ok(large.messageBodies <= 9, 'only eight recent bodies and latest handoff are fetched');
    assert.equal(largeExport.messageBodies - smallExport.messageBodies, 1000,
      'each added historical body read once for human capture, not once per history page');
    assert.ok(largeExport.exportPageSizes.every(size => size <= 50));
    assert.equal(largeExport.exportPageSizes.reduce((a, b) => a + b, 0), 1020);
    assert.equal(largeExport.exportPageSizes.length, 21);
    const plan = store.database.prepare(`EXPLAIN QUERY PLAN
      SELECT e.seq, r.body FROM events e LEFT JOIN records r ON r.kind='message' AND r.id=e.message_id
      WHERE e.thread_id=? AND e.message_id IS NOT NULL AND e.seq < ? ORDER BY e.seq DESC LIMIT 50`)
      .all('demo', 10000).map(r => r.detail).join('\n');
    assert.match(plan, /SEARCH e USING INDEX events_by_thread/);
  });
});

test('a readable open question without persisted chronology is a gap, not healthy pending work', async () => {
  await withWorkspace(({store}) => {
    seedItem(store, {state: 'ready', acceptance_actor: null});
    const messageId = randomUUID();
    const id = 'imported-open-question';
    seedRecord(store, {kind: 'message', id: messageId, itemId: 'demo', version: 1, body: {
      schema_version: 1, message_id: messageId, thread_id: 'demo', item_id: 'demo',
      parent_id: null, sender_role: 'eng-builder-software', sender_run: 'producer-run',
      recipient: 'eng-reviewer-code', kind: 'question', created_at: NOW, basis_version: 1,
      payload: {questionKind: 'decision', blocking: false, context: 'Scope', ask: 'Can scope narrow?', answerBy: 'next'},
      artifact_refs: [], evidence_refs: [], provenance: 'durable-thread',
    }});
    seedRecord(store, {kind: 'question', id, itemId: 'demo', version: 1, body: {
      schema_version: 1, question_id: id, item_id: 'demo', asker: {role: 'eng-builder-software', runId: 'producer-run'},
      recipient: 'eng-reviewer-code', kind: 'decision', blocking: false, status: 'open',
      context: 'Scope', ask: 'Can scope narrow?', answer_by: 'next',
      opened_message_id: messageId, answer_message_ids: [], resolution: null,
    }});
    const view = buildReport(store, {itemId: 'demo'});
    assert.ok(view.gaps.some(g => g.ref === `question:${id}` && /chronology/.test(g.message)));
    assert.equal(view.integrity.status, 'gap');
  });
});

for (const state of ['release-ready', 'deploying', 'production-verification', 'shipped']) {
  test(`recorded ${state} retains its lifecycle but exposes missing supporting release/deployment proof`, async () => {
    await withWorkspace(({root, store}) => {
      const {artifactId} = setupReport(root, store, {delivery_class: 'product-change'});
      acceptReport(root, store, artifactId);
      mutateBody(store, 'item', 'demo', b => { b.state = state; });
      const view = buildReport(store, {itemId: 'demo'});
      assert.equal(view.item.state, state);
      assert.equal(view.integrity.status, 'gap');
      assert.ok(view.gaps.some(g => g.ref === 'release-evidence'));
      if (state !== 'release-ready') assert.ok(view.gaps.some(g => g.ref === 'deployment-start'));
      if (state === 'shipped') assert.ok(view.gaps.some(g => g.ref === 'production-verification'));
      assert.equal(readRecord(store, 'item', 'demo').body.state, state);
    });
  });
}
