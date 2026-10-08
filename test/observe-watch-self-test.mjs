// The merged fleet view — `src/core/observe-watch.mjs`.
//
// Moved out of the command itself (#225): the block was gated on a
// `--self-test` argv string, which no build-time constant can fold, so it
// shipped to every consumer. The checks are unchanged.
//
// Everything here is pure: records in, rendered text out. That is deliberate —
// the watcher's claims ("said" vs "seen", overdue, ambiguous, truncated) are
// properties of the reduction and the render, so they can be asserted without
// a terminal, a log file, or a live host.

import {
  ACTIVITY_ROTATED_REL, INVALID_ROLE,
  parseRecords, dedupe, reduceState, renderScene, renderSequence, feedLine, fitHeight, readAndParse,
} from '../src/core/observe-watch.mjs';

function selfTest() {
  let failed = 0;
  const ok = (cond, msg) => {
    if (!cond) failed++;
    console.log(`${cond ? '\u2713' : '\u2717'} watch self-test: ${msg}`);
  };
  const rec = (o) => JSON.stringify({ t: 1000, src: 'observed', session: 's1', ...o });

  // --- parsing tolerates the writer ---------------------------------------
  ok(parseRecords(`${rec({ event: 'start', role: 'a' })}\n{"partial`).length === 1,
    'a torn final line is skipped, not fatal -- the writer appends concurrently');
  ok(parseRecords('').length === 0, 'an empty log parses to nothing rather than throwing');
  ok(parseRecords(null).length === 0, 'a non-string input is refused without throwing');
  ok(parseRecords('{"t":1,"src":"observed"}\n').length === 0,
    'a record with no role or event is not counted as an agent');

  // --- pairing -------------------------------------------------------------
  const open = reduceState(parseRecords([rec({ event: 'start', role: 'explore' })].join('\n')), 1060);
  ok(open.working.length === 1 && open.working[0].role === 'explore', 'a start with no stop shows as working');
  ok(open.working[0].elapsed === 60, 'elapsed is computed in seconds, matching the writer');

  const closed = reduceState(parseRecords([
    rec({ event: 'start', role: 'explore' }),
    rec({ event: 'stop', role: 'explore' }),
  ].join('\n')));
  ok(closed.working.length === 0, 'a matched stop clears the working row');
  ok(closed.done.length === 1 && closed.done[0].count === 1, 'a completed run is counted in the roster');

  // A stop for a role that never started must not create a negative or ghost
  // row -- the log can begin mid-session.
  const orphan = reduceState(parseRecords(rec({ event: 'stop', role: 'ghost' })));
  ok(orphan.working.length === 0, 'a stop with no start does not produce a ghost worker');
  ok(orphan.done[0].count === 1, 'a stop with no start still counts as finished work');

  // Different sessions must not close each other's runs.
  const twoSessions = reduceState(parseRecords([
    JSON.stringify({ t: 1, event: 'start', role: 'explore', session: 'A' }),
    JSON.stringify({ t: 2, event: 'stop', role: 'explore', session: 'B' }),
  ].join('\n')));
  ok(twoSessions.working.length === 1, 'a stop in one session cannot close a start in another');

  // --- the declared tier ---------------------------------------------------
  const decl = (o) => JSON.stringify({ t: 1000, src: 'declared', ...o });

  ok(parseRecords(decl({ e: 'start', role: 'principal-swe-backend', run: 'r1' }))[0].src === 'declared',
    'a declared record keeps its provenance instead of being flattened into the observed tier');
  ok(parseRecords(rec({ event: 'start', role: 'a' }))[0].src === 'observed',
    'a record that names no tier is treated as observed, the weaker claim');
  ok(parseRecords(decl({ e: 'start', role: 'a', run: 'r1' }))[0].event === 'start',
    'the declared tier writes `e` where the observer writes `event`; both parse');

  // A run id pairs by identity, so two runs of one role at the same time are
  // not a guess -- which is the whole reason the declared tier is worth having.
  const twoRuns = reduceState(parseRecords([
    decl({ t: 10, e: 'start', role: 'principal-swe-backend', run: 'r1' }),
    decl({ t: 11, e: 'start', role: 'principal-swe-backend', run: 'r2' }),
    decl({ t: 12, e: 'stop', role: 'principal-swe-backend', run: 'r1' }),
  ].join('\n')), 20);
  ok(twoRuns.working.length === 1, 'a run id closes exactly the run it names, not the oldest of that role');
  ok(twoRuns.ambiguous === false,
    'overlapping declared runs are not ambiguous: they carry ids, so nothing was guessed');

  // The central claim of the merged view: absence from the observed tier is
  // NOT absence of work. The host emits no events at all for plugin agents.
  const merged = reduceState(parseRecords([
    decl({ t: 10, e: 'start', role: 'principal-swe-backend', run: 'r1' }),
    JSON.stringify({ t: 11, src: 'observed', event: 'start', role: 'explore', session: 's1' }),
  ].join('\n')), 20);
  ok(merged.working.length === 2, 'both tiers appear in one view rather than one hiding the other');
  ok(merged.unobserved.join() === 'principal-swe-backend',
    'a role only ever self-reported is named as such, never rendered as not having run');
  ok(!renderScene(merged, { width: 100 }).includes('did not run'),
    'the view never claims an unobserved agent did not run');

  // A deadline the agent set for itself beats a threshold the watcher invented.
  const late = reduceState(parseRecords(
    decl({ t: 10, e: 'start', role: 'a', run: 'r1', next_report_by: 50 }),
  ), 100);
  ok(late.working[0].overdue === true, 'a run past the check-in time it promised is marked overdue');
  const onTime = reduceState(parseRecords(
    decl({ t: 10, e: 'start', role: 'a', run: 'r1', next_report_by: 500 }),
  ), 100);
  ok(onTime.working[0].overdue === false, 'a run inside its own deadline is not flagged, however long it has run');

  // `progress` renews liveness without opening or closing anything.
  const prog = reduceState(parseRecords([
    decl({ t: 10, e: 'start', role: 'a', run: 'r1', next_report_by: 50 }),
    decl({ t: 40, e: 'progress', role: 'a', run: 'r1', next_report_by: 500 }),
  ].join('\n')), 100);
  ok(prog.working.length === 1, 'progress neither starts a second run nor closes the first');
  ok(prog.working[0].overdue === false, 'progress renews the deadline, clearing an overdue mark');
  ok(prog.working[0].quiet === 60, 'quiet time is measured from the last word, not from the start');

  // --- duplicate delivery --------------------------------------------------
  const dupPair = parseRecords([
    JSON.stringify({ t: 100, src: 'observed', event: 'stop', role: 'explore', session: 's1', agent: 'a1' }),
    JSON.stringify({ t: 100, src: 'observed', event: 'stop', role: 'explore', session: 's1', agent: 'a1' }),
  ].join('\n'));
  ok(dedupe(dupPair).length === 1, 'one event delivered twice in the same second is counted once');

  // The corpus contains an agentId reused by two real runs 90,244s apart, so
  // collapsing on identity alone would delete a run that genuinely happened.
  // This is the failing case for the fix originally proposed for that bug.
  const reused = parseRecords([
    JSON.stringify({ t: 100, src: 'observed', event: 'stop', role: 'explore', session: 's1', agent: 'a1' }),
    JSON.stringify({ t: 90344, src: 'observed', event: 'stop', role: 'explore', session: 's1', agent: 'a1' }),
  ].join('\n'));
  ok(dedupe(reused).length === 2,
    'an agent id reused a day later is two runs, not a duplicate -- identity alone must not collapse them');
  ok(dedupe(parseRecords([
    decl({ t: 100, e: 'stop', role: 'a', run: 'r1' }),
    JSON.stringify({ t: 100, src: 'observed', event: 'stop', role: 'a', session: 's1' }),
  ].join('\n'))).length === 2,
    'the same moment reported by both tiers is two records; they are merged for display, not reconciled');

  // --- roles the host qualifies -------------------------------------------
  ok(parseRecords(rec({ event: 'start', role: 'kai:principal-swe-architect' }))[0].invalid === false,
    'a namespaced role from the host is a valid role, not a quarantined one');
  ok(parseRecords(rec({ event: 'start', role: 'a:b:c' }))[0].invalid === true,
    'only one namespace segment is allowed; anything else is still quarantined');

  // --- provenance comes from the file, not the record ----------------------
  // Both logs are local files. If a record could name its own tier, anything
  // able to append to the observed log could present itself as an agent's own
  // account, and the `said`/`seen` distinction would be worthless.
  ok(parseRecords(JSON.stringify({ t: 1, src: 'declared', event: 'start', role: 'a' }), 'observed')[0].src === 'observed',
    'a record claiming to be declared, found in the observed log, is observed');
  ok(parseRecords(decl({ e: 'start', role: 'a', run: 'r1' }), 'declared')[0].run === 'r1',
    'a run id is read from the tier that issues them');
  ok(parseRecords(JSON.stringify({ t: 1, event: 'stop', role: 'a', run: 'r1' }), 'observed')[0].run === '',
    'a run id in the observed log is discarded: it could otherwise close a declared run');

  // The same key in two tiers must not collide, or either log could close the
  // other's runs.
  const crossTier = reduceState(readAndParse([
    { src: 'declared', text: decl({ t: 10, e: 'start', role: 'a', run: 'r1' }) },
    { src: 'observed', text: JSON.stringify({ t: 11, event: 'stop', role: 'a', run: 'r1', session: 's1' }) },
  ]), 20);
  ok(crossTier.working.length === 1, 'an observed stop cannot close a declared run, even naming its id');

  // --- rotation ------------------------------------------------------------
  // The declared writer rotates exactly like the observer. Reading only the
  // current generation retires an agent that is still running.
  ok(ACTIVITY_ROTATED_REL === '.kai/core/runtime/activity.jsonl.1',
    'the rotated declared log is read, matching what the activity writer renames to');
  const acrossRotation = reduceState(readAndParse([
    { src: 'declared', text: decl({ t: 10, e: 'start', role: 'a', run: 'r1', next_report_by: 900 }) },
    { src: 'declared', text: decl({ t: 40, e: 'progress', role: 'a', run: 'r1', next_report_by: 900 }) },
  ]), 100);
  ok(acrossRotation.working.length === 1, 'a start in the rotated generation still pairs with progress in the current one');

  // A run that reports progress with no start in view is running, not absent.
  const orphanProgress = reduceState(parseRecords(
    decl({ t: 40, e: 'progress', role: 'a', run: 'r1', next_report_by: 900 }), 'declared',
  ), 100);
  ok(orphanProgress.working.length === 1, 'progress with no start shows a worker rather than an empty fleet');
  ok(orphanProgress.startless === true, 'and the missing start is disclosed rather than papered over');

  // --- a repeated start for one run is not a second agent ------------------
  const retried = reduceState(parseRecords([
    decl({ t: 10, e: 'start', role: 'a', run: 'r1' }),
    decl({ t: 12, e: 'start', role: 'a', run: 'r1' }),
    decl({ t: 20, e: 'stop', role: 'a', run: 'r1' }),
  ].join('\n'), 'declared'), 30);
  ok(retried.working.length === 0,
    'a replayed start for one run id does not leave a worker no stop can ever clear');

  // --- timestamps and dedupe ordering --------------------------------------
  // dedupe runs before reduceState reconciles times, so a record with no
  // usable timestamp has nothing to compare and must pass through untouched
  // rather than collapsing against, or overwriting, a known time.
  const noTime = dedupe(parseRecords([
    JSON.stringify({ t: 100, src: 'observed', event: 'stop', role: 'a', session: 's1', agent: 'x' }),
    JSON.stringify({ src: 'observed', event: 'stop', role: 'a', session: 's1', agent: 'x' }),
    JSON.stringify({ t: 100, src: 'observed', event: 'stop', role: 'a', session: 's1', agent: 'x' }),
  ].join('\n'), 'observed'));
  ok(noTime.length === 2,
    'a timestamp-less record neither collapses nor resets dedupe state for the records around it');

  // Without an identity, one second is not evidence of duplication: a start
  // carries no id, so two real agents a second apart look exactly like one
  // event delivered twice. Deleting a real agent is the worse error.
  const twoFastStarts = dedupe(parseRecords([
    JSON.stringify({ t: 100, src: 'observed', event: 'start', role: 'explore', session: 's1' }),
    JSON.stringify({ t: 101, src: 'observed', event: 'start', role: 'explore', session: 's1' }),
  ].join('\n'), 'observed'));
  ok(twoFastStarts.length === 2,
    'two identity-less starts a second apart are both kept: a double-count is visible, a deleted agent is not');
  const sameInstant = dedupe(parseRecords([
    JSON.stringify({ t: 100, src: 'observed', event: 'start', role: 'explore', session: 's1' }),
    JSON.stringify({ t: 100, src: 'observed', event: 'start', role: 'explore', session: 's1' }),
  ].join('\n'), 'observed'));
  ok(sameInstant.length === 1, 'an identical timestamp with no identity is still collapsed');

  // --- the view fits the terminal it was given -----------------------------
  const fitState = reduceState(readAndParse([
    { src: 'declared', text: [
      decl({ t: 10, e: 'start', role: 'principal-swe-architect', run: 'r1', next_report_by: 20 }),
      decl({ t: 10, e: 'start', role: 'creative-lead-video', run: 'r2', next_report_by: 20 }),
    ].join('\n') },
    { src: 'observed', text: JSON.stringify({ t: 12, event: 'start', role: 'explore', session: 's1' }) },
  ]), 100);
  for (const width of [40, 56, 72, 100]) {
    const over = renderScene(fitState, { width }).split('\n').filter((l) => l.length > Math.max(40, Math.min(width, 100)));
    ok(over.length === 0, `every rendered line fits within ${width} columns`);
    // Narrowing may shorten a caveat but must never remove it: a row that has
    // quietly lost its doubt reads as a confident row.
    const marked = renderScene(fitState, { width }).split('\n')
      .filter((l) => l.includes('said')).every((l) => /check-in|!late/.test(l));
    ok(marked, `an overdue run is still marked as overdue at ${width} columns`);
  }

  const overlap = reduceState(parseRecords([
    rec({ event: 'start', role: 'explore' }),
    rec({ event: 'start', role: 'explore' }),
    rec({ event: 'stop', role: 'explore' }),
  ].join('\n')), 1000);
  ok(overlap.working.length === 1, 'two overlapping runs of one role leave one open after a single stop');
  ok(overlap.ambiguous === true, 'overlapping same-role runs are flagged as ambiguous, not silently guessed');
  ok(closed.ambiguous === false, 'a clean sequence is not flagged ambiguous');

  // --- rendering -----------------------------------------------------------
  const scene = renderScene(open, { tick: 0 });
  ok(scene.includes('explore'), 'the scene names the working role');
  ok(scene.includes('1 working'), 'the scene counts the working agents');
  ok(!/[A-Za-z]:\\|\/home\/|\/Users\//.test(scene), 'the scene never renders an absolute path');  ok(renderScene(reduceState([]), { tick: 0 }).includes('nobody is working'),
    'an empty log renders an honest empty state rather than a blank screen');
  ok(renderScene(overlap, { tick: 0 }).includes('pairing is by order'),
    'the ambiguity is surfaced to the reader, not hidden in the data');

  const longRole = reduceState(parseRecords(rec({ event: 'start', role: 'principal-a-very-long-role-name-that-overflows-the-column' })), 1000);
  const wide = renderScene(longRole, { tick: 0, width: 72 });
  ok(wide.split('\n').every((l) => l.length <= 100), 'a long role name cannot break the layout');

  const stale = reduceState(parseRecords(rec({ event: 'start', role: 'explore' })), 1000 + 5000);
  ok(renderScene(stale, { tick: 0 }).includes('silent a while'),
    'a long-open start is aged rather than presented as certain liveness');

  // Animation must actually change, or it is a static picture claiming to live.
  const frames = new Set([0, 1, 2, 3].map((t) => renderScene(open, { tick: t })));
  ok(frames.size > 1, 'the view animates across ticks');

  // --- hostile input -------------------------------------------------------
  // The watcher reads a plain file that any process on the machine can append
  // to. Everything below is what a hand-edited line can carry, and none of it
  // may reach the terminal as written.
  const hostileRole = parseRecords(JSON.stringify({ t: 1, event: 'start', role: 'C:\\Users\\alice\\secret', session: 's1' }));
  ok(hostileRole.length === 1 && hostileRole[0].role === INVALID_ROLE,
    'a role this plugin never writes is quarantined, not rendered as a label');
  ok(!renderScene(reduceState(hostileRole, 2), { tick: 0 }).includes('alice'),
    'a path smuggled in as a role never reaches the screen');
  ok(renderScene(reduceState(hostileRole, 2), { tick: 0 }).includes('never writes'),
    'the quarantine is reported rather than silently swallowing the record');

  const esc = parseRecords(JSON.stringify({ t: 1, event: 'stop', role: 'explore', session: 's1', tldr: 'a\u001b[2Jb\u0007c' }));
  ok(!feedLine(esc[0]).includes('\u001b') && !feedLine(esc[0]).includes('\u0007'),
    'terminal control sequences in a summary are stripped before printing');
  ok(feedLine(esc[0]).includes('a[2Jbc'),
    'stripping the escape byte leaves its payload as plain text, which is harmless');

  ok(feedLine({ t: 1e100, event: 'start', role: 'explore' }).includes('>>'),
    'an impossible timestamp is formatted, not thrown');
  ok(parseRecords(JSON.stringify({ t: 1e100, event: 'start', role: 'explore' }))[0].t === 0,
    'a timestamp outside any real clock is refused rather than trusted');

  // Out-of-order arrival: a stop written before its own start must not leave
  // the run counted as both finished and still working.
  const reordered = reduceState(parseRecords([
    JSON.stringify({ t: 20, event: 'stop', role: 'explore', session: 's1' }),
    JSON.stringify({ t: 10, event: 'start', role: 'explore', session: 's1' }),
  ].join('\n')), 30);
  ok(reordered.working.length === 0, 'a stop recorded before its start does not leave a ghost worker');

  // Two sessionless records may not close each other's runs without saying so.
  const sessionless = reduceState(parseRecords([
    JSON.stringify({ t: 1, event: 'start', role: 'explore' }),
    JSON.stringify({ t: 2, event: 'stop', role: 'explore' }),
  ].join('\n')), 3);
  ok(sessionless.ambiguous === true, 'pairing records with no session is declared as a guess');

  // --- honesty about missing history ---------------------------------------
  ok(renderScene(reduceState([], 1, { truncated: true }), { tick: 0 }).includes('older history'),
    'a truncated read is reported rather than shown as a quiet fleet');

  // --- feed ---------------------------------------------------------------
  const line = feedLine({ t: 1786488059, event: 'stop', role: 'explore', tldr: 'Did the thing.' });
  ok(line.includes('explore') && line.includes('Did the thing.'), 'a feed line carries the role and any summary');
  // A withheld summary is reported, not shown as the same blank an operator
  // gets when they never opted in (#103).
  const held = parseRecords(JSON.stringify({
    t: 1786488059, event: 'stop', role: 'explore', tldr: null, tldr_withheld: 'path',
  }));
  ok(feedLine(held[0]).includes('summary withheld: named a path'),
    'the feed says a summary was withheld rather than showing nothing');
  const noProseLine = parseRecords(JSON.stringify({
    t: 1786488059, event: 'stop', role: 'explore', tldr: null, tldr_withheld: 'no-prose',
  }));
  ok(feedLine(noProseLine[0]).includes('no prose in the reply'),
    'a reply with no prose is distinguished from a refusal');
  const plain = parseRecords(JSON.stringify({ t: 1786488059, event: 'stop', role: 'explore' }));
  ok(!/withheld|no summary/.test(feedLine(plain[0])),
    'a record with no marker claims nothing about why a summary is absent');
  const bogus = parseRecords(JSON.stringify({
    t: 1, event: 'stop', role: 'explore', tldr_withheld: 'C:\\Users\\someone\\leak.md',
  }));
  // The render never interpolates the reason, so this asserts the parser's own
  // allowlist rather than the render -- otherwise the check passes even with the
  // allowlist removed, which is exactly how a vacuous test hides a hole.
  ok(bogus[0].withheld === '', 'a reason outside the allowlist is dropped at the parser, not carried');
  ok(!feedLine(bogus[0]).includes('someone') && !/withheld|no summary/.test(feedLine(bogus[0])),
    'a hostile reason renders as no claim at all, rather than as a refusal that never happened');
  ok(feedLine({ t: 0, event: 'start', role: 'explore' }).includes('>>'), 'a start is marked distinctly from a stop');

  // --- the sequence view ---------------------------------------------------
  const seqRecs = parseRecords([
    JSON.stringify({ t: 100, event: 'start', role: 'workflow-issue-analysis', session: 's' }),
    JSON.stringify({ t: 160, event: 'stop', role: 'workflow-issue-analysis', session: 's' }),
    JSON.stringify({ t: 200, event: 'start', role: 'principal-swe-backend', session: 's' }),
    JSON.stringify({ t: 500, event: 'stop', role: 'principal-swe-backend', session: 's' }),
    JSON.stringify({ t: 600, event: 'start', role: 'principal-swe-backend', session: 's' }),
  ].join('\n'), 'observed');
  const seqState = reduceState(seqRecs, 700);
  ok(seqState.runs.length === 3, 'every run reaches the sequence, closed and open alike');
  ok(seqState.runs[0].role === 'workflow-issue-analysis' && seqState.runs[2].open === true,
    'runs are ordered by when they began, and the open one is last');
  const seq = renderSequence(seqState, { width: 100 });
  ok(seq.includes('workflow-issue-analysis') && seq.includes('principal-swe-backend'),
    'the sequence names each role that took part');
  // Assertions are made against whitespace-normalised text: these notes wrap to
  // the terminal, so a literal substring would be testing the line breaks
  // rather than the words.
  const flat = (s) => s.replace(/\s+/g, ' ');
  ok(seq.includes('run 2'), 'a repeated role is marked rather than left for the reader to count');
  ok(seq.includes('no stop recorded'), 'a run with no stop is shown as such, not as finished');
  ok(flat(seq).includes('not evidence that a process is still alive'),
    'an open run carries the liveness caveat in the report itself');
  ok(!/\bopen\b/.test(seq.split('note:')[0]), 'no row claims a run is "open", which reads as alive');
  ok(/1m 0/.test(seq), 'a closed run reports the span between its own start and stop');
  // The one inference this view must never invite.
  ok(!/did not run|idle|never ran|absent|skipped/i.test(seq),
    'the sequence never reports a role as not having run');
  ok(flat(seq).includes('no record, not no work') && flat(seq).includes('host observes no kai agent'),
    'the measured host limitation travels with the data, not documentation nobody read');
  ok(flat(seq).includes('retained history'),
    'the view says it shows retained history rather than implying it is complete');
  ok(flat(seq).includes('counts repeats in this view'),
    'the repeat ordinal is scoped to the view rather than read as a global count');

  // The empty render is the one most likely to be read as "nothing ran", so it
  // is the last place a caveat may be dropped.
  const emptySeq = flat(renderSequence(reduceState([], 1, { truncated: true }), { width: 72 }));
  ok(emptySeq.includes('nothing recorded is not the same'),
    'an empty sequence still refuses to read as an empty fleet');
  ok(emptySeq.includes('host observes no kai agent'),
    'the empty sequence keeps the measured host limitation');
  ok(emptySeq.includes('older history was not read'),
    'the empty sequence still reports that history was truncated');

  // A stop whose start fell outside the read window is a real run with an
  // unknown span; showing it as instant would be a fabricated duration.
  const orphanStop = reduceState(parseRecords(
    JSON.stringify({ t: 900, event: 'stop', role: 'explore', session: 's' }), 'observed'), 950);
  ok(orphanStop.runs.length === 1 && orphanStop.runs[0].start === null,
    'a stop with no start in view keeps an unknown span rather than inventing one');
  ok(renderSequence(orphanStop, { width: 72 }).includes('start not in view'),
    'an unknown span is labelled, not silently rendered as a duration');

  // A run first heard from at `progress` has a timestamp, but that timestamp is
  // not its start -- so it has no span, and printing one would be fabrication.
  const progressOnly = reduceState(parseRecords([
    JSON.stringify({ t: 100, e: 'progress', role: 'principal-swe-backend', run: 'r9' }),
    JSON.stringify({ t: 160, e: 'stop', role: 'principal-swe-backend', run: 'r9' }),
  ].join('\n'), 'declared'), 200);
  const progressSeq = renderSequence(progressOnly, { width: 100 });
  ok(progressOnly.runs.length === 1 && progressOnly.runs[0].startless === true,
    'a run first heard at progress is marked as having no start in view');
  ok(flat(progressSeq).includes('--:--:-- 00:02:40 -- start not in view'),
    'a run with no known start prints neither a start clock nor a span, because its first record is not its start');

  // A stop timestamped before its own start sorts ahead of it and looks like
  // two half-runs. That is reported, never quietly repaired.
  const skew = reduceState(parseRecords([
    JSON.stringify({ t: 100, event: 'start', role: 'explore', session: 's' }),
    JSON.stringify({ t: 50, event: 'stop', role: 'explore', session: 's' }),
  ].join('\n'), 'observed'), 200);
  ok(skew.outOfOrder === true, 'a stop preceding its own start is detected rather than shown as two runs');
  ok(renderSequence(skew, { width: 100 }).includes('order and pairing around it are unreliable'),
    'out-of-order records are disclosed in the render');

  // A stop naming a different role must not rewrite which role took part.
  const swapped = reduceState(parseRecords([
    JSON.stringify({ t: 10, e: 'start', role: 'principal-swe-backend', run: 'r7' }),
    JSON.stringify({ t: 70, e: 'stop', role: 'principal-security', run: 'r7' }),
  ].join('\n'), 'declared'), 100);
  ok(swapped.runs[0].role === 'principal-swe-backend',
    'a run is described by the start it closes, so a stop cannot rewrite the role');
  ok(swapped.mismatched === true && renderSequence(swapped, { width: 100 }).includes('named a different role'),
    'a role disagreement between start and stop is disclosed, not silently resolved');

  const declaredSeq = reduceState(parseRecords([
    JSON.stringify({ t: 10, e: 'start', role: 'principal-swe-backend', run: 'r1' }),
    JSON.stringify({ t: 70, e: 'stop', role: 'principal-swe-backend', run: 'r1' }),
  ].join('\n'), 'declared'), 100);
  ok(renderSequence(declaredSeq, { width: 72 }).includes('said'),
    'a self-declared run is labelled as said, never as observed');

  // A malformed record must not take the whole view down.
  ok(renderSequence({ runs: [{ role: null, src: 'observed', start: 1, end: 2 }] }, { width: 72 }).includes('unknown'),
    'a run with no usable role renders as unknown rather than crashing');

  const crowded = reduceState(parseRecords([
    JSON.stringify({ t: 10, event: 'stop', role: 'creative-lead-video', session: 's' }),
    JSON.stringify({ t: 20, event: 'stop', role: 'creative-lead-video', session: 's' }),
    JSON.stringify({ t: 30, event: 'start', role: 'principal-swe-architect', session: 's' }),
  ].join('\n'), 'observed'), 40);
  // Three-digit run counts must not push the index column into the name.
  const many = { runs: Array.from({ length: 120 }, (_, i) => ({
    role: 'principal-swe-architect', src: 'observed', start: i * 10, end: i * 10 + 5,
  })) };
  for (const width of [40, 56, 72, 100]) {
    for (const st of [seqState, crowded, orphanStop, skew, many, reduceState([], 1, { truncated: true })]) {
      const over = renderSequence(st, { width }).split('\n')
        .filter((l) => l.length > Math.max(40, Math.min(width, 100)));
      ok(over.length === 0, `the sequence fits ${width} columns without wrapping`);
    }
    // Every flag survives the narrowest layout, on its own line if it must.
    const out = renderSequence(crowded, { width });
    ok(out.includes('start not in view') && out.includes('run 2'),
      `no caveat is dropped at ${width} columns`);
  }

  // --- fitting the frame to the window ------------------------------------
  // A frame taller than the window scrolls, which is the bug the alternate
  // screen was adopted to fix; fitting is the other half of that fix.
  const tallScene = renderScene(reduceState(parseRecords(
    Array.from({ length: 30 }, (_, i) => JSON.stringify({
      t: 100 + i, event: 'start', role: `principal-role-${i}`, session: `s${i}`,
    })).join('\n'), 'observed'), 500), { width: 80 });
  ok(tallScene.split('\n').length > 20, 'the fixture is genuinely taller than a short window');
  const fitted = fitHeight(tallScene, 20);
  ok(fitted.split('\n').length <= 20, 'a tall frame is cut down to the rows available');
  ok(fitted.includes('more row(s) not shown'), 'the rows that were dropped are declared, not silently missing');
  // The invariant is exact: everything from the final rule onward -- the whole
  // caveat block -- must survive the cut byte for byte.
  const tailOf = (s) => {
    const ls = s.split('\n');
    for (let i = ls.length - 1; i >= 0; i--) if (/^-{3,}$/.test(ls[i].trim())) return ls.slice(i).join('\n');
    return '';
  };
  ok(tailOf(tallScene).length > 0 && tailOf(fitted) === tailOf(tallScene),
    'every caveat survives the cut -- workers are dropped, warnings never are');
  ok(fitHeight(tallScene, 500) === tallScene, 'a frame that already fits is returned untouched');
  ok(fitHeight(tallScene, 4).includes('too short'),
    'a window too short for even the caveats renders a plain explanation, not a confident fragment');
  ok(!fitHeight(tallScene, 4).includes('principal-role-0'),
    'the too-short fallback shows no worker rows, so it cannot be read as the whole fleet');

  // A line longer than the window is wrapped by the terminal into several rows.
  // Counting newlines rather than rows would under-count the frame and let it
  // scroll on a narrow window -- the bug this whole change exists to prevent.
  const wrapping = ['a'.repeat(70), '-'.repeat(20), 'note: keep me'].join('\n');
  ok(fitHeight(wrapping, 4, 20).includes('too short'),
    'a frame is measured in wrapped rows, not lines: 3 lines can be far more than 3 rows');
  ok(fitHeight(wrapping, 40, 20) === wrapping, 'the same frame is untouched when the rows really are there');
  const narrow = fitHeight(tallScene, 6, 20);
  ok(narrow.split('\n').reduce((n, l) => n + Math.max(1, Math.ceil(l.length / 20)), 0) <= 6,
    'the fitted frame fits the window once wrapping is counted');
  // A one-row window makes the budget zero at the call site; a frame emitted
  // there would scroll immediately.
  ok(fitHeight(tallScene, 0, 80).split('\n').length === 1 && !fitHeight(tallScene, 0, 80).includes('principal-role-'),
    'a window with no usable rows renders one line, never the whole frame');
  ok(fitHeight(tallScene, undefined) === tallScene, 'an unknown budget is not guessed at');
  // The anchor is what makes dropping safe. Without it there is no safe cut.
  ok(fitHeight('head\nrule\nrow\nrow\nrow\nrow', 3, 80).includes('too short'),
    'a frame with no caveat rule is refused rather than truncated blind');

  console.log(failed === 0 ? '\u2713 observe-watch self-test: all checks passed' : `\u2717 observe-watch self-test: ${failed} failure(s)`);
  process.exit(failed === 0 ? 0 : 1);
}

selfTest();
