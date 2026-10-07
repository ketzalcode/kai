#!/usr/bin/env node

import assert from 'node:assert/strict';
import { execFileSync, spawnSync } from 'node:child_process';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const GUARD = join(ROOT, '.github', 'scripts', 'check-commit-metadata.mjs');
const APPROVED = '17255390+RubenSaucedo@users.noreply.github.com';
const scratch = mkdtempSync(join(tmpdir(), 'kai-commit-metadata-'));

function git(repo, args, env = {}) {
  return execFileSync('git', ['-C', repo, ...args], {
    encoding: 'utf8',
    env: { ...process.env, ...env },
    windowsHide: true,
  }).trim();
}

function createRepo() {
  const repo = mkdtempSync(join(scratch, 'case-'));
  git(repo, ['init', '--quiet']);
  git(repo, ['config', 'user.name', 'Fixture User']);
  git(repo, ['config', 'user.email', 'fixture@example.invalid']);
  return repo;
}

function commit(repo, label, {
  authorName = 'Ruben Saucedo',
  authorEmail = APPROVED,
  committerName = 'Ruben Saucedo',
  committerEmail = APPROVED,
} = {}) {
  writeFileSync(join(repo, `${label}.txt`), label);
  git(repo, ['add', '.']);
  git(repo, ['commit', '--quiet', '-m', label], {
    GIT_AUTHOR_NAME: authorName,
    GIT_AUTHOR_EMAIL: authorEmail,
    GIT_COMMITTER_NAME: committerName,
    GIT_COMMITTER_EMAIL: committerEmail,
  });
  return git(repo, ['rev-parse', 'HEAD']);
}

function guard(repo, base, head) {
  return spawnSync(process.execPath, [GUARD, '--base', base, '--head', head], {
    cwd: repo,
    encoding: 'utf8',
    windowsHide: true,
  });
}

try {
  {
    const repo = createRepo();
    const base = commit(repo, 'base');
    const head = commit(repo, 'approved');
    assert.equal(guard(repo, base, head).status, 0);
  }
  {
    const repo = createRepo();
    const base = commit(repo, 'base');
    const head = commit(repo, 'bad-author', {
      authorEmail: 'private-author@example.invalid',
    });
    const result = guard(repo, base, head);
    assert.equal(result.status, 1);
    assert.match(result.stderr, /author uses a non-approved email/);
    assert.doesNotMatch(result.stderr, /private-author@example\.invalid/);
  }
  {
    const repo = createRepo();
    const base = commit(repo, 'base');
    const head = commit(repo, 'bad-committer', {
      committerEmail: 'private-committer@example.invalid',
    });
    const result = guard(repo, base, head);
    assert.equal(result.status, 1);
    assert.match(result.stderr, /committer uses a non-approved email/);
    assert.doesNotMatch(result.stderr, /private-committer@example\.invalid/);
  }
  {
    const repo = createRepo();
    const base = commit(repo, 'base');
    const head = commit(repo, 'whitespace-committer', {
      committerEmail: `${APPROVED}\u00a0`,
    });
    const result = guard(repo, base, head);
    assert.equal(result.status, 1);
    assert.match(result.stderr, /committer uses a non-approved email/);
  }
  {
    const repo = createRepo();
    const base = commit(repo, 'base');
    const head = commit(repo, 'login-alias', {
      authorName: 'RubenSaucedo',
      committerName: 'GitHub',
      committerEmail: 'noreply@github.com',
    });
    assert.equal(guard(repo, base, head).status, 0);
  }
  {
    const repo = createRepo();
    const base = commit(repo, 'base');
    const head = commit(repo, 'external', {
      authorName: 'External Contributor',
      authorEmail: 'public@example.invalid',
      committerName: 'GitHub',
      committerEmail: 'noreply@github.com',
    });
    assert.equal(guard(repo, base, head).status, 0);
  }
  {
    const repo = createRepo();
    commit(repo, 'historical-bad', {
      authorEmail: 'historical@example.invalid',
      committerEmail: 'historical@example.invalid',
    });
    const base = commit(repo, 'base');
    const head = commit(repo, 'new-approved');
    assert.equal(guard(repo, base, head).status, 0);
  }
  {
    const repo = createRepo();
    commit(repo, 'initial-bad', {
      authorEmail: 'initial@example.invalid',
      committerEmail: 'initial@example.invalid',
    });
    const head = commit(repo, 'head');
    assert.equal(guard(repo, '0'.repeat(40), head).status, 1);
  }
  {
    const repo = createRepo();
    const head = commit(repo, 'head');
    assert.equal(guard(repo, 'missing-ref', head).status, 2);
  }
  console.log('\u2713 commit-metadata guard self-test passed');
} finally {
  rmSync(scratch, { recursive: true, force: true });
}
