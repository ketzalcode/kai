// Shared coordination-record parsing.
//
// `workspace-doctor` validates these records and `work-status` reports on them.
// They must never disagree about what a record *says*, so both read it through
// this module — a second parser would be a second truth, which is precisely the
// failure the status report exists to surface.
//
// Node built-ins only; this module is imported by checks that CI runs with no
// install step.

// Canonical lifecycle states.
export const TASK_LIFECYCLE = new Set([
  'proposed', 'ready', 'in-progress', 'in-review', 'blocked', 'completed', 'dropped',
]);

// States at or past in-review require a change_ref bound to the implementation.
export const TASK_NEEDS_CHANGE_REF = new Set([
  'in-review', 'completed',
]);

export const TASK_DEPENDENCY_STATES = new Set([
  'in-review',
  'completed',
]);

// States that are finished: no further role action is expected.
export const TASK_TERMINAL_STATES = new Set(['completed', 'dropped']);

export const isNull = (v) => v === undefined || v === '' || v === 'null' || v === '~' || v === '—';

export const unquote = (s) => {
  const t = (s ?? '').trim();
  return (t.startsWith('"') && t.endsWith('"')) || (t.startsWith("'") && t.endsWith("'"))
    ? t.slice(1, -1) : t;
};
