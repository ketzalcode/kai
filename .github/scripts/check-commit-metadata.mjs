#!/usr/bin/env node

import { execFileSync } from 'node:child_process';

const APPROVED_EMAIL = '17255390+RubenSaucedo@users.noreply.github.com';
const MAINTAINER_ALIASES = new Set(['ruben saucedo', 'rubensaucedo']);
const ZERO_OID = /^0{40}(?:0{24})?$/;

function normalizeName(value) {
  return value.normalize('NFKC').trim().replace(/\s+/g, ' ').toLowerCase();
}

function git(args) {
  try {
    return execFileSync('git', args, {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
      windowsHide: true,
    }).replace(/\r?\n$/, '');
  } catch {
    throw new Error(`git ${args[0]} failed`);
  }
}

function commitsInRange(base, head) {
  const args = ZERO_OID.test(base)
    ? ['rev-list', '--reverse', head]
    : ['rev-list', '--reverse', `${base}..${head}`];
  const output = git(args);
  return output ? output.split(/\r?\n/) : [];
}

function identityForCommit(oid) {
  const fields = git([
    'show',
    '-s',
    '--format=%H%x00%an%x00%ae%x00%cn%x00%ce',
    oid,
  ]).split('\0');
  if (fields.length !== 5) {
    throw new Error(`could not parse commit ${oid.slice(0, 12)}`);
  }
  const [commit, authorName, authorEmail, committerName, committerEmail] = fields;
  return { commit, authorName, authorEmail, committerName, committerEmail };
}

function violation(commit, role, name, email) {
  if (!MAINTAINER_ALIASES.has(normalizeName(name))) return null;
  if (email.toLowerCase() === APPROVED_EMAIL.toLowerCase()) return null;
  return `${commit.slice(0, 12)}: ${role} uses a non-approved email`;
}

function argument(flag) {
  const index = process.argv.indexOf(flag);
  return index >= 0 ? process.argv[index + 1] : null;
}

const base = argument('--base');
const head = argument('--head');
if (!base || !head) {
  console.error('commit-metadata guard: --base <revision> and --head <revision> are required');
  process.exit(2);
}

try {
  const violations = [];
  for (const oid of commitsInRange(base, head)) {
    const value = identityForCommit(oid);
    violations.push(
      violation(value.commit, 'author', value.authorName, value.authorEmail),
      violation(value.commit, 'committer', value.committerName, value.committerEmail),
    );
  }
  const failures = violations.filter(Boolean);
  if (failures.length) {
    console.error('\u2717 commit-metadata guard rejected maintainer identity metadata');
    for (const failure of failures) console.error(`  ${failure}`);
    process.exit(1);
  }
  console.log('\u2713 commit-metadata guard: new maintainer commits use GitHub noreply');
} catch (error) {
  console.error(`commit-metadata guard: ${error.message}`);
  process.exit(2);
}
