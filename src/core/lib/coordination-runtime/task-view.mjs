import {projectContext} from './context.mjs';
import {listAllRecords} from './store.mjs';

const terminal = new Set(['completed', 'dropped']);

function dependencyAttention(tasks, task) {
  const byId = new Map(tasks.map(record => [record.id, record]));
  const reasons = [];
  for (const dependency of task.body.depends_on) {
    const upstream = byId.get(dependency.task);
    if (!upstream) {
      reasons.push({
        attention: 'blocked',
        code: 'MISSING_DEPENDENCY',
        message: `dependency task/${dependency.task} is missing`,
      });
    } else if (upstream.body.state === 'dropped') {
      reasons.push({
        attention: 'needs-human',
        code: 'FAILED_DEPENDENCY',
        message: `dependency task/${dependency.task} was dropped`,
      });
    }
  }
  return reasons;
}

function taskNode(tasks, task, roles) {
  const reasons = dependencyAttention(tasks, task);
  if (task.body.state === 'blocked') {
    reasons.push({
      attention: task.body.recovery_hold ? 'needs-human' : 'blocked',
      code: task.body.recovery_hold ? 'RECOVERY_HOLD' : 'BLOCKED',
      message: task.body.recovery_hold
        ? 'operator recovery resolution is required'
        : 'Task is blocked',
    });
  }
  if (task.body.waiting_on_questions.length > 0) {
    reasons.push({
      attention: 'blocked',
      code: 'OPEN_QUESTION',
      message: `${task.body.waiting_on_questions.length} blocking question(s) remain open`,
    });
  }
  if (task.body.lease && Date.parse(task.body.lease.expires_at) <= Date.now()) {
    reasons.push({
      attention: 'needs-human',
      code: 'EXPIRED_LEASE',
      message: 'Task lease expired and requires reconciliation',
    });
  }
  const responsibilities = [];
  if (task.body.next_role && !roles.includes(task.body.next_role)) {
    responsibilities.push({
      role: task.body.next_role,
      responsibilities: ['next action'],
    });
  }
  return {
    kind: 'task',
    id: task.id,
    version: task.version,
    title: task.body.title,
    state: task.body.state,
    terminal: terminal.has(task.body.state),
    planning_refs: task.body.planning_refs,
    attention: {
      reasons,
      staffing_gaps: responsibilities,
    },
  };
}

export function taskStatus(store, {roles = []} = {}) {
  const tasks = listAllRecords(store, {kind: 'task'});
  const nodes = tasks.map(task => taskNode(tasks, task, roles));
  const throughSeq = Number(store.database.prepare(
    'SELECT COALESCE(MAX(seq), 0) AS seq FROM events',
  ).get().seq);
  return {
    schema_version: 1,
    through_seq: throughSeq,
    tasks: nodes,
    totals: {
      records: nodes.length,
      terminal: nodes.filter(node => node.terminal).length,
    },
  };
}

export function taskContext(store, options) {
  return projectContext(store, options);
}
