#!/usr/bin/env node
// Release-hygiene gate for kai (#35): when a PR changes plugin behavior, it must
// also bump the version and refresh the release notes. This is the one check
// that needs the PR base, so it lives here (CI passes --base/--head) rather than
// in the git-free validate-plugin.mjs. The decision core is a pure function
// exercised by --self-test, so the logic is unit-tested, not brittle YAML.
//
// Usage:
//   node scripts/release-guard.mjs --base <ref> --head <ref>   (real gate, CI)
//   node scripts/release-guard.mjs --self-test                 (fixtureless unit test)

import { execFileSync } from 'node:child_process';

// Behavior-sensitive = the plugin's shipped surface. A change here is a release
// and must carry a version bump + release notes. `plugins/` is the committed
// tree: generated department/core plugins ship to users the same way root
// agents and skills do, so a change to it must never land outside version/release
// enforcement. Everything else (README, CHANGELOG, docs, tests, workflows,
// .env.example, LICENSE) is exempt.
const BEHAVIOR_PREFIXES = ['agents/', 'skills/', 'scripts/', 'plugins/'];
const BEHAVIOR_FILES = new Set([
  '.github/plugin/marketplace.json',
  'plugin.json',
  'package.json',
  'package-lock.json',
]);

function isBehaviorPath(p) {
  const f = p.replace(/\\/g, '/');
  return BEHAVIOR_PREFIXES.some((pre) => f.startsWith(pre)) || BEHAVIOR_FILES.has(f);
}

// Strict semver parse + forward-bump comparison, so a downgrade or a no-op
// version change on a behavior PR is rejected, not just an identical string.
function parseSemver(v) {
  const m = /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-([0-9A-Za-z.-]+))?(?:\+[0-9A-Za-z.-]+)?$/.exec(v ?? '');
  return m ? { core: [+m[1], +m[2], +m[3]], pre: m[4] ?? null } : null;
}
function isForwardBump(base, head) {
  const b = parseSemver(head);
  if (!b) return false;                 // head must be valid semver
  const a = parseSemver(base);
  if (!a) return true;                  // base unreadable (genesis) — any valid head counts
  for (let i = 0; i < 3; i++) {
    if (b.core[i] !== a.core[i]) return b.core[i] > a.core[i];
  }
  return Boolean(a.pre && !b.pre);       // equal core: only prerelease -> release is a bump
}

// Pure decision core. Given the changed file set and the base/head plugin
// versions, decide whether the release-artifact requirements are satisfied.
function evaluate({ changedFiles, baseVersion, headVersion }) {
  const errors = [];
  const changed = changedFiles.map((f) => f.replace(/\\/g, '/'));
  const behaviorChanged = changed.some(isBehaviorPath);
  if (!behaviorChanged) {
    return { ok: true, behaviorChanged: false, errors, note: 'docs/test-only change — release artifacts not required' };
  }
  if (!headVersion) {
    errors.push('plugin.json has no version at head');
  } else if (!isForwardBump(baseVersion, headVersion)) {
    errors.push(`behavior-sensitive files changed but the version was not bumped forward (base ${baseVersion ?? 'unknown'} -> head ${headVersion}) — bump plugin.json + package.json together`);
  }
  if (!changed.includes('CHANGELOG.md')) {
    errors.push('behavior-sensitive files changed but CHANGELOG.md was not updated (add a dated section for the new version)');
  }
  if (!changed.includes('README.md')) {
    errors.push('behavior-sensitive files changed but README.md was not updated (refresh the "## Status" stamp)');
  }
  return { ok: errors.length === 0, behaviorChanged: true, errors };
}

// --- git plumbing ----------------------------------------------------------
function gitChangedFiles(base, head) {
  // Three-dot (merge-base..head) = exactly what the PR introduced, even if the
  // base branch advanced meanwhile. --no-renames keeps both sides of a rename,
  // so moving a behavior file out of agents/skills/scripts still classifies.
  const out = execFileSync('git', ['diff', '--name-only', '--no-renames', `${base}...${head}`], { encoding: 'utf8' });
  return out.split(/\r?\n/).filter(Boolean);
}
function gitVersionAt(ref, path = 'plugin.json') {
  try {
    const txt = execFileSync('git', ['show', `${ref}:${path}`], { encoding: 'utf8' });
    return JSON.parse(txt).version ?? null;
  } catch {
    return null;
  }
}

// --- self-test -------------------------------------------------------------
function selfTest() {
  let ok = true;
  const cases = [
    {
      name: 'docs/test-only change is exempt',
      input: { changedFiles: ['README.md', 'docs/guide.md', 'test/README.md'], baseVersion: '0.14.0', headVersion: '0.14.0' },
      expect: (r) => r.ok && !r.behaviorChanged,
    },
    {
      name: 'behavior change without a bump fails',
      input: { changedFiles: ['skills/kai-core-work-coordination/SKILL.md'], baseVersion: '0.14.0', headVersion: '0.14.0' },
      expect: (r) => !r.ok && r.behaviorChanged && r.errors.some((e) => /not bumped/.test(e)),
    },
    {
      name: 'behavior change bumped + changelog + readme passes',
      input: { changedFiles: ['agents/director-chief-of-staff.agent.md', 'CHANGELOG.md', 'README.md'], baseVersion: '0.14.0', headVersion: '0.15.0' },
      expect: (r) => r.ok && r.behaviorChanged,
    },
    {
      name: 'behavior change bumped but missing CHANGELOG fails',
      input: { changedFiles: ['scripts/validate-plugin.mjs', 'README.md'], baseVersion: '0.14.0', headVersion: '0.15.0' },
      expect: (r) => !r.ok && r.errors.some((e) => /CHANGELOG\.md was not updated/.test(e)),
    },
    {
      name: 'behavior change bumped but missing README stamp fails',
      input: { changedFiles: ['scripts/validate-plugin.mjs', 'CHANGELOG.md'], baseVersion: '0.14.0', headVersion: '0.15.0' },
      expect: (r) => !r.ok && r.errors.some((e) => /README\.md was not updated/.test(e)),
    },
    {
      name: 'a lockfile-only (dependency) change is behavior-sensitive',
      input: { changedFiles: ['package-lock.json'], baseVersion: '0.15.0', headVersion: '0.15.0' },
      expect: (r) => !r.ok && r.behaviorChanged && r.errors.some((e) => /not bumped forward/.test(e)),
    },
    {
      name: 'a committed pack-tree change is behavior-sensitive',
      input: { changedFiles: ['plugins/kai-core/plugin.json'], baseVersion: '0.15.0', headVersion: '0.15.0' },
      expect: (r) => !r.ok && r.behaviorChanged && r.errors.some((e) => /not bumped forward/.test(e)),
    },
    {
      name: 'a marketplace publication change is behavior-sensitive',
      input: { changedFiles: ['.github/plugin/marketplace.json'], baseVersion: '0.15.0', headVersion: '0.15.0' },
      expect: (r) => !r.ok && r.behaviorChanged && r.errors.some((e) => /not bumped forward/.test(e)),
    },
    {
      name: 'a bumped + release-noted pack-tree change passes',
      input: { changedFiles: ['plugins/kai-personal/agents/persona-self.agent.md', 'CHANGELOG.md', 'README.md'], baseVersion: '0.15.0', headVersion: '0.16.0' },
      expect: (r) => r.ok && r.behaviorChanged,
    },
    {
      name: 'a version downgrade on a behavior change fails',
      input: { changedFiles: ['skills/x/SKILL.md', 'CHANGELOG.md', 'README.md'], baseVersion: '0.15.0', headVersion: '0.14.0' },
      expect: (r) => !r.ok && r.errors.some((e) => /not bumped forward/.test(e)),
    },
  ];
  for (const c of cases) {
    const r = evaluate(c.input);
    if (c.expect(r)) {
      console.log(`\u2713 release-guard self-test: ${c.name}`);
    } else {
      ok = false;
      console.log(`\u2717 release-guard self-test: ${c.name}`);
      console.log(`    got ${JSON.stringify(r)}`);
    }
  }
  // Path classification spot-checks.
  const cls = [
    ['agents/x.agent.md', true], ['skills/x/SKILL.md', true], ['scripts/x.mjs', true],
    ['plugins/kai-core/plugin.json', true], ['plugins/kai-personal/agents/x.agent.md', true],
    ['.github/plugin/marketplace.json', true],
    ['plugin.json', true], ['package.json', true], ['package-lock.json', true],
    ['README.md', false], ['CHANGELOG.md', false], ['docs/x.md', false],
    ['test/fixtures/x/y.md', false], ['.github/workflows/validate.yml', false],
  ];
  for (const [p, want] of cls) {
    if (isBehaviorPath(p) !== want) { ok = false; console.log(`\u2717 release-guard self-test: isBehaviorPath(${p}) expected ${want}`); }
  }
  if (ok) console.log('\u2713 release-guard self-test: path classification correct');
  process.exit(ok ? 0 : 1);
}

// --- entry -----------------------------------------------------------------
const args = process.argv.slice(2);
const argVal = (flag) => {
  const i = args.indexOf(flag);
  return i !== -1 && i + 1 < args.length ? args[i + 1] : null;
};

if (args.includes('--self-test')) {
  selfTest();
} else {
  const base = argVal('--base');
  const head = argVal('--head') ?? 'HEAD';
  if (!base) {
    console.error('release-guard: --base <ref> is required (or --self-test)');
    process.exit(2);
  }
  const res = evaluate({
    changedFiles: gitChangedFiles(base, head),
    baseVersion: gitVersionAt(base),
    headVersion: gitVersionAt(head),
  });
  if (res.ok) {
    console.log(`\u2713 release-guard: ${res.behaviorChanged ? `behavior change is bumped and release-noted` : res.note}`);
    process.exit(0);
  }
  console.error('\u2717 release-guard: release hygiene not satisfied for this PR\n');
  for (const e of res.errors) console.error(`  ${e}`);
  process.exit(1);
}
