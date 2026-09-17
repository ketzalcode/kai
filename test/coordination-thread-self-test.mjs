// Regression coverage for `parseThread`/`parseQuestions` reconciliation.
//
// The peer-communication contract (kai-core-peer-communication) writes two
// header shapes that must both parse: the bracketed, timestamp-less form used
// by existing threads, and a timestamped unbracketed form. Whichever wrote the
// QUESTION, an ANSWER must be reconciled into the question's status rather
// than silently terminating the parse — that was the historical bug (see the
// design doc's ANSWER-append note). Conflicting, orphaned, and out-of-lane
// answers must stay visible as diagnostics instead of being dropped or
// silently preferred.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseThread, parseQuestions } from '../scripts/lib/coordination.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

// --- the brief's exact regression: timestamped, unbracketed headers --------
{
  const raw = [
    '## QUESTION Q-demo-01 2026-09-16-1400 - eng-builder-software -> @operator',
    '- status: open', '- kind: decision', '- blocking: yes',
    '- ask: Approve this revision?', '- answer_by: next-dispatch',
    '## ANSWER Q-demo-01 2026-09-16-1401 - operator -> @eng-builder-software',
    '- status: answered', '- answer: Approved', '- lane: in-lane',
    '- provenance: operator',
  ].join('\n');
  assert.equal(parseQuestions(raw).length, 1,
    'a timestamped unbracketed QUESTION header is still parsed as one question');
  assert.equal(parseQuestions(raw)[0].status, 'answered',
    'an in-lane, party-matched ANSWER reconciles the question to answered');
}

// --- bracketed existing fixtures still parse as before ---------------------
{
  const awaiting = readFileSync(
    join(root, 'test', 'fixtures', 'work-status', 'exceptions', '.kai', 'state', 'threads', 'awaiting-decision.md'),
    'utf8');
  const qs = parseQuestions(awaiting);
  assert.equal(qs.length, 1, 'the bracketed awaiting-decision fixture yields one question');
  assert.equal(qs[0].id, 'Q-awaiting-decision-01');
  assert.equal(qs[0].to, 'operator');
  assert.equal(qs[0].status, 'open', 'an unanswered bracketed question stays open');

  const notBlocked = readFileSync(
    join(root, 'test', 'fixtures', 'work-status', 'exceptions', '.kai', 'state', 'threads', 'question-not-blocked.md'),
    'utf8');
  const qs2 = parseQuestions(notBlocked);
  assert.equal(qs2.length, 1, 'a QUESTION written as a markdown heading (## prefix) still parses');
  assert.equal(qs2[0].status, 'open');
}

// --- unanswered question: no ANSWER packet at all ---------------------------
{
  const raw = [
    'QUESTION [Q-lonely-01] — principal-swe-backend → @principal-swe-frontend',
    '- status: open',
    '- kind: fact',
    '- blocking: no',
    '- ask: Does the cache invalidate on write?',
  ].join('\n');
  const { questions, diagnostics } = parseThread(raw);
  assert.equal(questions.length, 1);
  assert.equal(questions[0].status, 'open', 'no answer packet leaves the question open');
  assert.equal(diagnostics.length, 0, 'an unanswered question raises no diagnostic by itself');
}

// --- out-of-lane response: reconciliation must not resolve it ---------------
{
  const raw = [
    'QUESTION [Q-lane-01] — principal-swe-backend → @principal-swe-frontend',
    '- status: open',
    '- kind: fact',
    '- blocking: yes',
    '- ask: Does the history endpoint paginate?',
    'ANSWER [Q-lane-01] — principal-swe-frontend → @principal-swe-backend',
    '- status: answered',
    '- answer: Ask the platform team, not me.',
    '- lane: out-of-lane',
    '- provenance: durable-thread',
  ].join('\n');
  const { questions, diagnostics } = parseThread(raw);
  assert.equal(questions.length, 1);
  assert.equal(questions[0].status, 'open',
    'an out-of-lane answer does not reconcile the question to answered');
  assert.ok(diagnostics.some((d) => d.type === 'out-of-lane' && d.id === 'Q-lane-01'),
    'an out-of-lane answer is a visible diagnostic, not a silent drop');
}

// --- status-less legacy ANSWER (the canonical packet shape): the canonical
// kai-core-peer-communication ANSWER carries no `status:` field at all — only
// `re`/`answer`/`lane`/`provenance`. A status-less, in-lane, party-matched,
// non-blank answer must still reconcile the question. Requiring `status:
// answered` (the pre-fix guard) silently left every canonically-written
// answer unresolved.
{
  const raw = [
    'QUESTION [Q-canonical-01] — principal-swe-backend → @principal-swe-frontend',
    '- status: open',
    '- kind: fact',
    '- blocking: yes',
    '- ask: Does the export endpoint page results?',
    'ANSWER [Q-canonical-01] — principal-swe-frontend → @principal-swe-backend',
    '- re: Does the export endpoint page results?',
    '- answer: Yes, cursor-based.',
    '- lane: in-lane',
    '- provenance: durable-thread',
  ].join('\n');
  const { questions, diagnostics } = parseThread(raw);
  assert.equal(questions.length, 1);
  assert.equal(questions[0].status, 'answered',
    'a status-less, in-lane, party-matched ANSWER (the canonical packet shape) resolves the question');
  assert.equal(diagnostics.length, 0, 'a valid canonical answer raises no diagnostic');
}

// --- blank content never completes a question, status-less or not ---------
{
  const raw = [
    'QUESTION [Q-blank-01] — principal-swe-backend → @principal-swe-frontend',
    '- status: open',
    '- kind: fact',
    '- blocking: yes',
    '- ask: Does the export endpoint page results?',
    'ANSWER [Q-blank-01] — principal-swe-frontend → @principal-swe-backend',
    '- answer:',
    '- lane: in-lane',
    '- provenance: durable-thread',
  ].join('\n');
  const { questions, diagnostics } = parseThread(raw);
  assert.equal(questions.length, 1);
  assert.equal(questions[0].status, 'open', 'a blank answer never completes a question');
  assert.ok(diagnostics.some((d) => d.type === 'blank-answer' && d.id === 'Q-blank-01'),
    'a blank answer is a visible diagnostic, not a silent resolve');
}

// --- an explicit invalid status stays unresolved, even in-lane and on-party
{
  const raw = [
    'QUESTION [Q-draft-01] — principal-swe-backend → @principal-swe-frontend',
    '- status: open',
    '- kind: fact',
    '- blocking: yes',
    '- ask: Does the export endpoint page results?',
    'ANSWER [Q-draft-01] — principal-swe-frontend → @principal-swe-backend',
    '- status: draft',
    '- answer: Still checking, not final yet.',
    '- lane: in-lane',
    '- provenance: durable-thread',
  ].join('\n');
  const { questions, diagnostics } = parseThread(raw);
  assert.equal(questions.length, 1);
  assert.equal(questions[0].status, 'open',
    'an explicit non-"answered" status never reconciles the question, unlike a status-less packet');
  assert.ok(diagnostics.some((d) => d.type === 'unresolved-status' && d.id === 'Q-draft-01'),
    'an explicit invalid status is a visible diagnostic');
}

// --- conflicting answers force the question open, even over a declared
// "answered" status on the QUESTION itself ---------------------------------
{
  const raw = [
    'QUESTION [Q-stale-01] — principal-swe-backend → @principal-swe-frontend',
    '- status: answered',
    '- kind: decision',
    '- blocking: yes',
    '- ask: Ship behind a flag or on by default?',
    'ANSWER [Q-stale-01] — principal-swe-frontend → @principal-swe-backend',
    '- answer: Ship behind a flag.',
    '- lane: in-lane',
    '- provenance: durable-thread',
    'ANSWER [Q-stale-01] — principal-swe-frontend → @principal-swe-backend',
    '- answer: Ship on by default.',
    '- lane: in-lane',
    '- provenance: durable-thread',
  ].join('\n');
  const { questions, diagnostics } = parseThread(raw);
  assert.equal(questions.length, 1);
  assert.equal(questions[0].status, 'open',
    'contradictory answers force the question open even when it was already declared "answered"');
  assert.ok(diagnostics.some((d) => d.type === 'conflicting-answer' && d.id === 'Q-stale-01'),
    'the forced-open conflict is still a visible diagnostic');
}

// --- orphan answer: references a question that does not exist --------------
{
  const raw = [
    'ANSWER [Q-ghost-01] — principal-swe-backend → @principal-swe-frontend',
    '- status: answered',
    '- answer: There is no such question in this thread.',
    '- lane: in-lane',
    '- provenance: durable-thread',
  ].join('\n');
  const { questions, diagnostics } = parseThread(raw);
  assert.equal(questions.length, 0, 'an orphan answer creates no question');
  assert.ok(diagnostics.some((d) => d.type === 'orphan-answer' && d.id === 'Q-ghost-01'),
    'an orphan answer is a visible diagnostic');
}

// --- exact duplicate answers: agreement, not conflict -----------------------
{
  const raw = [
    'QUESTION [Q-dup-01] — principal-swe-backend → @principal-swe-frontend',
    '- status: open',
    '- kind: fact',
    '- blocking: yes',
    '- ask: Is the flag on by default?',
    'ANSWER [Q-dup-01] — principal-swe-frontend → @principal-swe-backend',
    '- status: answered',
    '- answer: Yes, on by default.',
    '- lane: in-lane',
    '- provenance: durable-thread',
    'ANSWER [Q-dup-01] — principal-swe-frontend → @principal-swe-backend',
    '- status: answered',
    '- answer: Yes, on by default.',
    '- lane: in-lane',
    '- provenance: durable-thread',
  ].join('\n');
  const { questions, diagnostics } = parseThread(raw);
  assert.equal(questions.length, 1);
  assert.equal(questions[0].status, 'answered', 'two identical answers still resolve the question');
  assert.ok(!diagnostics.some((d) => d.type === 'conflicting-answer'),
    'duplicate agreeing answers are not reported as a conflict');
}

// --- conflicting answers: never silently pick the latest --------------------
{
  const raw = [
    'QUESTION [Q-conflict-01] — principal-swe-backend → @principal-swe-frontend',
    '- status: open',
    '- kind: decision',
    '- blocking: yes',
    '- ask: Ship behind a flag or ship on by default?',
    'ANSWER [Q-conflict-01] — principal-swe-frontend → @principal-swe-backend',
    '- status: answered',
    '- answer: Ship behind a flag.',
    '- lane: in-lane',
    '- provenance: durable-thread',
    'ANSWER [Q-conflict-01] — principal-swe-frontend → @principal-swe-backend',
    '- status: answered',
    '- answer: Ship on by default.',
    '- lane: in-lane',
    '- provenance: durable-thread',
  ].join('\n');
  const { questions, diagnostics } = parseThread(raw);
  assert.equal(questions.length, 1);
  assert.equal(questions[0].status, 'open',
    'contradictory answers leave the question open rather than picking either one');
  assert.ok(diagnostics.some((d) => d.type === 'conflicting-answer' && d.id === 'Q-conflict-01'),
    'a conflict between answers is a visible diagnostic');
}

// --- misleading fenced examples: a QUESTION-shaped block inside a fence -----
{
  const raw = [
    'Here is the packet shape, for reference:',
    '```',
    'QUESTION [Q-fenced-01] — principal-swe-backend → @principal-swe-frontend',
    '- status: open',
    '- kind: fact',
    '- blocking: yes',
    '- ask: This is documentation, not a real question.',
    '```',
    '',
    'QUESTION [Q-real-01] — principal-swe-backend → @principal-swe-frontend',
    '- status: open',
    '- kind: fact',
    '- blocking: no',
    '- ask: This one is real.',
  ].join('\n');
  const { questions, diagnostics } = parseThread(raw);
  assert.equal(questions.length, 1, 'a fenced example packet is not parsed as a real question');
  assert.equal(questions[0].id, 'Q-real-01');
  assert.equal(diagnostics.length, 0, 'the fenced example produces no diagnostic either');
}

// --- already-answered legacy question: no ANSWER packet, status is direct --
{
  const raw = [
    'QUESTION [Q-legacy-01] — principal-swe-backend → @principal-swe-frontend',
    '- status: answered',
    '- kind: fact',
    '- blocking: no',
    '- ask: Legacy threads sometimes wrote status: answered directly.',
  ].join('\n');
  const { questions, diagnostics } = parseThread(raw);
  assert.equal(questions.length, 1);
  assert.equal(questions[0].status, 'answered',
    'a legacy question already declared answered is preserved without a matching ANSWER packet');
  assert.equal(diagnostics.length, 0);
}

// --- parseQuestions stays backward-compatible (array of questions only) ----
{
  const raw = [
    'QUESTION [Q-compat-01] — principal-swe-backend → @principal-swe-frontend',
    '- status: open',
    '- kind: fact',
    '- blocking: yes',
    '- ask: Compat check.',
    'ANSWER [Q-compat-01] — principal-swe-frontend → @principal-swe-backend',
    '- status: answered',
    '- answer: Done.',
    '- lane: in-lane',
    '- provenance: durable-thread',
  ].join('\n');
  assert.ok(Array.isArray(parseQuestions(raw)), 'parseQuestions still returns an array of questions');
  assert.equal(parseQuestions(raw)[0].status, 'answered');
}

console.log('✓ coordination-thread self-test: all checks passed');
