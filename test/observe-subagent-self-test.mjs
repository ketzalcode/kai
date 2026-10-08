// The observed half of fleet visibility — `src/core/observe-subagent.mjs`.
//
// Moved out of the hook itself (#225). The hook runs on every subagent stop on
// a consumer's machine, so it is the file where shipped weight is least welcome
// and where the privacy assertions below matter most. The checks are unchanged.
//
// The last section spawns the real process rather than calling the exported
// function: the guarantee is about what reaches the host's stdin/stdout, and a
// function call cannot observe that.

import { existsSync, mkdirSync, readFileSync, writeFileSync, rmSync, symlinkSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import { tmpdir } from 'node:os';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import {DatabaseSync} from 'node:sqlite';
import { MAX_NOTE } from '../src/core/lib/activity.mjs';
import {closeStore, openStore} from '../src/core/lib/coordination-runtime/store.mjs';
import {
  OBSERVED_REL, CONSENT_REL, appendObserved, buildObserved, main, wantsSummary,
} from '../src/core/observe-subagent.mjs';

const REPO_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const HOOK = join(REPO_ROOT, 'src', 'core', 'observe-subagent.mjs');

function selfTest() {
  let failed = 0;
  const ok = (cond, msg) => {
    if (cond) console.log(`\u2713 observe self-test: ${msg}`);
    else { console.error(`\u2717 observe self-test: ${msg}`); failed++; }
  };

  const tmp = join(tmpdir(), `kai-observe-${process.pid}`);
  mkdirSync(join(tmp, '.kai'), { recursive: true });
  spawnSync('git', ['init', '--quiet', tmp], {windowsHide: true});
  writeFileSync(join(tmp, '.gitignore'), '/.kai/\n');
  mkdirSync(join(tmp, 'docs', 'kai'), {recursive: true});
  writeFileSync(join(tmp, 'docs', 'kai', 'DIRECTION.md'), [
    '# Vision',
    'A composable workspace.',
    '',
    '# Mission',
    'Observe participation safely.',
    '',
    '# Current Goal',
    'Exercise schema-5 observation.',
    '',
    '# Out of Scope',
    'Generic observation lanes.',
    '',
  ].join('\n'));
  writeFileSync(join(tmp, '.kai', 'manifest.json'), `${JSON.stringify({
    plugin: 'kai-core',
    version: 'test',
    schema_version: 5,
    scaffolded: '2026-10-02',
    workspace_id: 'observer-workspace',
    placement: 'repo-local',
    workspace_root: '.',
    private_root: '.kai',
    direction: 'docs/kai/DIRECTION.md',
    projects: [{id: 'default', path: '.', publication_root: 'docs/kai'}],
  })}\n`);
  closeStore(openStore({
    path: join(tmp, '.kai', 'core', 'runtime', 'coordination.sqlite'),
    mode: 'create',
  }));
  ok(OBSERVED_REL === '.kai/core/runtime/observed.jsonl',
    'observed activity uses the schema-5 core runtime path');
  ok(CONSENT_REL === '.kai/core/runtime/observer-consent',
    'observer consent uses the schema-5 core runtime path');
  const payload = (extra = {}) => ({
    sessionId: 'session-uuid-abc',
    timestamp: Date.now(),
    cwd: tmp,
    agentName: 'principal-qa-ui',
    ...extra,
  });

  // --- the boundary that matters most -------------------------------------
  // Summaries are a second opt-in, so every summary assertion must ask for one.
  const S = { summary: true };

  const leaky = buildObserved('stop', payload({
    agentId: 'agent-1',
    response: 'C:\\Users\\someone\\secret\\report.md is where I wrote it',
  }), Date.now(), S);
  ok(leaky.ok && leaky.record.tldr === null, 'a response whose only line is an absolute path yields no tldr');
  ok(leaky.ok && leaky.record.tldr_withheld === 'path',
    'a refusal says so, because a silent null reads as a broken feature rather than a privacy choice');
  ok(leaky.ok && !JSON.stringify(leaky.record).includes('secret'),
    'the reason for the refusal never carries the text that caused it');

  // The three cases the operator must be able to tell apart (#103).
  const noProse = buildObserved('stop', payload({ response: '## Heading\n\n- bullet' }), Date.now(), S);
  ok(noProse.ok && noProse.record.tldr_withheld === 'no-prose',
    'a reply with no prose at all is distinguished from one that was refused');
  const clean = buildObserved('stop', payload({ response: 'All good.' }), Date.now(), S);
  ok(clean.ok && clean.record.tldr_withheld === undefined,
    'a stored summary carries no withheld marker');
  const optedOut = buildObserved('stop', payload({ response: '/home/me/x.md is the file' }));
  ok(optedOut.ok && optedOut.record.tldr_withheld === undefined,
    'without the summary opt-in nothing is withheld, because nothing was attempted');

  // The walk continues past a refusal: a clean sentence often follows the one
  // that named a path, and stopping at the first would throw it away.
  const recovered = buildObserved('stop', payload({
    response: 'I wrote it to /home/someone/notes.md for you.\nThe review finished cleanly.',
  }), Date.now(), S);
  ok(recovered.ok && recovered.record.tldr === 'The review finished cleanly.',
    'a path-shaped first line does not discard a clean sentence that follows it');
  ok(recovered.ok && recovered.record.tldr_withheld === undefined,
    'a recovered summary is not also reported as withheld');

  const posix = buildObserved('stop', payload({ response: '/home/someone/notes.md holds the detail' }), Date.now(), S);
  ok(posix.ok && posix.record.tldr === null, 'a POSIX absolute path is refused just like a Windows one');

  const long = buildObserved('stop', payload({ response: 'x'.repeat(500) }), Date.now(), S);
  ok(long.ok && long.record.tldr.length <= MAX_NOTE, 'a long response is capped, not stored whole');

  const full = buildObserved('stop', payload({
    response: 'Found three issues.\nThe second one is a blocker.\nDetail follows.',
  }), Date.now(), S);
  ok(full.ok && full.record.tldr === 'Found three issues.', 'the tldr is the first meaningful line, never the whole response');
  ok(full.ok && !JSON.stringify(full.record).includes('blocker'), 'the rest of the response never reaches the record');

  const heading = buildObserved('stop', payload({ response: '## Summary\n\n- bullet\n\nReview passed cleanly.' }), Date.now(), S);
  ok(heading.ok && heading.record.tldr === 'Review passed cleanly.', 'headings and bullets are skipped in favour of prose');

  // --- summaries are off unless asked for ----------------------------------
  const noSum = buildObserved('stop', payload({ response: 'Found three issues.' }));
  ok(noSum.ok && noSum.record.tldr === null, 'no summary is stored unless summaries were explicitly opted into');

  // The honest limit, asserted rather than left to a doc claim: the derived
  // summary is scraped prose, so a secret in the first line IS stored. This
  // test exists so nobody later reads "privacy bounds" as "secret-scrubbed".
  const secret = buildObserved('stop', payload({ response: 'Rotated key AKIAIOSFODNN7EXAMPLE today.' }), Date.now(), S);
  ok(secret.ok && secret.record.tldr.includes('AKIAIOSFODNN7EXAMPLE'),
    'a summary is NOT secret-scrubbed -- which is exactly why it is a separate opt-in');

  // --- no host identifiers -------------------------------------------------
  const rec = buildObserved('start', payload());
  ok(rec.ok && !JSON.stringify(rec.record).includes(tmp), 'the record never contains the absolute cwd it was resolved from');
  ok(rec.ok && !JSON.stringify(rec.record).includes('session-uuid-abc'), 'the raw session id is digested, never stored');
  ok(rec.ok && rec.record.tldr === null, 'a start event carries no tldr -- there is no response yet');

  // --- vocabulary ----------------------------------------------------------
  ok(!buildObserved('progress', payload()).ok, 'an event outside the closed vocabulary is refused');
  ok(!buildObserved('start', payload({ agentName: '../../etc/passwd' })).ok, 'an agentName that is not a plain name is refused');
  ok(!buildObserved('start', payload({ agentName: '' })).ok, 'a missing agentName is refused rather than recorded as unknown');

  const linkedRoot = join(tmpdir(), `kai-observe-linked-${process.pid}`);
  const outsideRoot = join(tmpdir(), `kai-observe-outside-${process.pid}`);
  mkdirSync(join(linkedRoot, '.kai'), {recursive: true});
  mkdirSync(outsideRoot, {recursive: true});
  symlinkSync(outsideRoot, join(linkedRoot, '.kai', 'core'), 'junction');
  const linkedWrite = appendObserved(linkedRoot, 'start', payload());
  ok(!linkedWrite.ok && !existsSync(join(outsideRoot, 'runtime', 'observed.jsonl')),
    'observed first-write validation refuses a junction without writing through it');
  rmSync(linkedRoot, {recursive: true, force: true});
  rmSync(outsideRoot, {recursive: true, force: true});

  // --- consent gate --------------------------------------------------------
  const denied = main(['subagentStart'], JSON.stringify(payload()));
  ok(!denied.ok && /not enabled/.test(denied.reason), 'without a consent marker nothing is written');
  ok(!existsSync(join(tmp, OBSERVED_REL)), 'the declined path leaves no file behind at all');

  mkdirSync(dirname(join(tmp, CONSENT_REL)), {recursive: true});
  writeFileSync(join(tmp, CONSENT_REL), 'enabled\n');
  const databasePath = join(tmp, '.kai', 'core', 'runtime', 'coordination.sqlite');
  for (const kind of ['missing', 'directory', 'corrupt', 'schema1']) {
    rmSync(databasePath, {recursive: true, force: true});
    if (kind === 'directory') mkdirSync(databasePath);
    if (kind === 'corrupt') writeFileSync(databasePath, 'not a sqlite database');
    if (kind === 'schema1') {
      closeStore(openStore({path: databasePath, mode: 'create'}));
      const raw = new DatabaseSync(databasePath);
      raw.prepare("UPDATE metadata SET value='1' WHERE key='schema_version'").run();
      raw.close();
    }
    rmSync(join(tmp, OBSERVED_REL), {force: true});
    const rejected = main(
      ['subagentStop'],
      JSON.stringify(payload({agentId: 'invalid-store', response: 'Must not record.'})),
    );
    ok(!rejected.ok && !existsSync(join(tmp, OBSERVED_REL)),
      `${kind} coordination database rejects observation without creating a log`,
      [rejected.reason].filter(Boolean));
  }
  rmSync(databasePath, {recursive: true, force: true});
  closeStore(openStore({path: databasePath, mode: 'create'}));
  const allowed = main(['subagentStop'], JSON.stringify(payload({ agentId: 'agent-1', response: 'Done.' })));
  ok(allowed.ok, 'with consent present the record is written');
  const written = readFileSync(join(tmp, OBSERVED_REL), 'utf8').trim();
  ok(JSON.parse(written).src === 'observed', 'the record is tiered as observed, distinct from declared activity');
  ok(JSON.parse(written).event === 'stop', 'the host event name is mapped into the shared vocabulary');
  // Asserted on the bytes that actually landed on disk, not on the object the
  // builder just returned -- otherwise the privacy claim is tested one layer
  // above the only place it can be broken.
  ok(!written.includes(tmp), 'the persisted line contains no absolute workspace path');
  ok(!written.includes('session-uuid-abc'), 'the persisted line contains no raw session id');
  ok(!written.includes('agent-1'), 'the persisted line contains no raw agent id');

  // --- summaries are a second, separate opt-in ----------------------------
  ok(!wantsSummary(tmp), 'a plain consent marker does not opt into summaries');
  ok(JSON.parse(written).tldr === null, 'end to end, consent alone stores participation without any prose');

  writeFileSync(join(tmp, CONSENT_REL), 'enabled\nsummary\n');
  ok(wantsSummary(tmp), 'the summary opt-in is read from the consent marker');
  rmSync(join(tmp, OBSERVED_REL));
  main(['subagentStop'], JSON.stringify(payload({ agentId: 'agent-2', response: 'Shipped it.' })));
  const withSum = readFileSync(join(tmp, OBSERVED_REL), 'utf8').trim();
  ok(JSON.parse(withSum).tldr === 'Shipped it.', 'end to end, the summary opt-in stores the derived line');
  writeFileSync(join(tmp, CONSENT_REL), 'enabled\n');

  // --- the hook's workspace boundary ignores KAI_WORKSPACE_ROOT -----------
  // Operator/admin CLIs may honor an ambient override, but the hook observes
  // wherever the subagent actually ran -- a real KAI_WORKSPACE_ROOT pointing
  // at an unrelated workspace must never redirect an observed event there.
  {
    const unrelatedWs = join(tmpdir(), `kai-observe-unrelated-${process.pid}`);
    mkdirSync(join(unrelatedWs, '.kai'), { recursive: true });
    writeFileSync(join(unrelatedWs, '.kai', 'manifest.json'), '{}');
    rmSync(join(tmp, OBSERVED_REL), { force: true });
    const prevEnvRoot = process.env.KAI_WORKSPACE_ROOT;
    process.env.KAI_WORKSPACE_ROOT = unrelatedWs;
    try {
      main(['subagentStop'], JSON.stringify(payload({ agentId: 'agent-3', response: 'Ignored the override.' })));
    } finally {
      if (prevEnvRoot === undefined) delete process.env.KAI_WORKSPACE_ROOT;
      else process.env.KAI_WORKSPACE_ROOT = prevEnvRoot;
    }
    ok(existsSync(join(tmp, OBSERVED_REL)), 'the record lands in the payload cwd workspace, not an ambient override');
    ok(!existsSync(join(unrelatedWs, OBSERVED_REL)),
      'a real KAI_WORKSPACE_ROOT set in the environment never redirects a hook event to an unrelated workspace');
    rmSync(unrelatedWs, { recursive: true, force: true });
  }

  // --- custom KAI_HOME remains available for external discovery -----------
  {
    const customRoot = join(tmpdir(), `kai-observe-external-${process.pid}`);
    const projectRoot = join(customRoot, 'project');
    const workspaceRoot = join(customRoot, 'workspace');
    const kaiHome = join(customRoot, 'home');
    mkdirSync(projectRoot, { recursive: true });
    mkdirSync(join(workspaceRoot, '.kai'), { recursive: true });
    mkdirSync(kaiHome, { recursive: true });
    mkdirSync(join(projectRoot, 'docs', 'kai'), {recursive: true});
    writeFileSync(join(projectRoot, 'docs', 'kai', 'DIRECTION.md'), [
      '# Vision',
      'An external private workspace.',
      '',
      '# Mission',
      'Observe bound project participation.',
      '',
      '# Current Goal',
      'Exercise external discovery.',
      '',
      '# Out of Scope',
      'Project-local private state.',
      '',
    ].join('\n'));
    writeFileSync(join(workspaceRoot, '.kai', 'manifest.json'), `${JSON.stringify({
      plugin: 'kai-core',
      version: 'test',
      schema_version: 5,
      scaffolded: '2026-10-02',
      placement: 'external',
      workspace_root: workspaceRoot,
      private_root: '.kai',
      direction: 'docs/kai/DIRECTION.md',
      workspace_id: 'observer-external-workspace',
      projects: [{ id: 'fixture', path: projectRoot, publication_root: 'docs/kai' }],
    }, null, 2)}\n`);
    closeStore(openStore({
      path: join(workspaceRoot, '.kai', 'core', 'runtime', 'coordination.sqlite'),
      mode: 'create',
    }));
    mkdirSync(dirname(join(workspaceRoot, CONSENT_REL)), {recursive: true});
    writeFileSync(join(workspaceRoot, CONSENT_REL), 'enabled\n');
    writeFileSync(join(kaiHome, 'workspaces.json'), `${JSON.stringify({
      schema_version: 1,
      workspaces: [{
        project_root: projectRoot,
        workspace_root: workspaceRoot,
        workspace_id: 'observer-external-workspace',
      }],
    }, null, 2)}\n`);
    const observed = main(
      ['subagentStop'],
      JSON.stringify(payload({ cwd: projectRoot, agentId: 'agent-4', response: 'External event.' })),
      Date.now(),
      { KAI_HOME: kaiHome, KAI_WORKSPACE_ROOT: tmp },
    );
    ok(observed.ok && existsSync(join(workspaceRoot, OBSERVED_REL)),
      'a hook preserves custom KAI_HOME discovery while ignoring KAI_WORKSPACE_ROOT');
    rmSync(customRoot, { recursive: true, force: true });
  }

  // --- malformed input never escalates ------------------------------------
  ok(!main(['subagentStart'], 'not json').ok, 'a non-JSON payload is refused without throwing');
  ok(!main(['subagentStart'], '{}').ok, 'a payload with no cwd is refused without throwing');

  // --- the guarantee the host depends on ----------------------------------
  // A single stray byte on stdout can be parsed as a decision object, and
  // `subagentStop` honors both `decision: "block"` and `modifiedResponse`. This
  // asserts the real process, not the exported function.
  for (const [name, input] of [
    ['a valid payload', JSON.stringify(payload({ agentId: 'a', response: 'Done.' }))],
    ['a malformed payload', 'not json at all'],
    ['an empty payload', ''],
  ]) {
    const r = spawnSync(process.execPath, [HOOK, 'subagentStop'], { input, encoding: 'utf8' });
    ok(r.stdout === '', `stdout stays empty for ${name}, so it can never be read as a decision`);
    ok(r.status === 0, `exit code stays 0 for ${name}, so a subagent never fails because of the observer`);
  }

  rmSync(tmp, { recursive: true, force: true });
  if (failed) { console.error(`observe self-test: ${failed} failure(s)`); process.exit(1); }
  console.log('\u2713 observe-subagent self-test: all checks passed');
}

selfTest();
