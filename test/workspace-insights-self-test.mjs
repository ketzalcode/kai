import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {dirname, join} from 'node:path';
import test from 'node:test';
import {fileURLToPath} from 'node:url';
import {materializePacks, sourceSkillFiles} from '../tools/lib/pack-plan.mjs';
import {isUserInvocable, parseFrontmatter} from '../src/core/lib/loader-contract.mjs';
import {extractRepositoryInstructions} from '../tools/lib/repository-instructions.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const read = (...parts) => readFileSync(join(root, ...parts), 'utf8');
const ids = [
  'my-insights',
  'refine-insights',
  'team-insights',
];

test('workspace insight skills are lean manual Engineering entry points', () => {
  const skills = sourceSkillFiles(root);
  const emitted = materializePacks({root, version: '0.0.0-insights-test'});

  for (const id of ids) {
    const entry = skills.find(candidate => candidate.id === id);
    assert.ok(entry, `${id} must exist`);
    assert.equal(entry.pack, 'engineering');
    const body = readFileSync(entry.path, 'utf8');
    const parsed = parseFrontmatter(body);
    assert.equal(parsed.ok, true);
    assert.equal(isUserInvocable(parsed.fm), true);
    assert.ok(body.split(/\r?\n/).length <= 100, `${id} must remain lean`);
    assert.ok(emitted.has(`kai-engineering/skills/${id}/SKILL.md`));
  }
});

test('workspace paths bind insights to the named target and manifest project', () => {
  const body = read(
    'plugins', 'kai-core', 'skills', 'kai-core-workspace-paths', 'SKILL.md',
  );
  assert.match(
    body,
    /session root[\s\S]*target root[\s\S]*workspace root[\s\S]*project id/,
  );
  assert.match(body, /sibling\s+repository[\s\S]*use the target path instead of ambient `cwd`/);
  assert.match(body, /one\s+binding per repository/);
  assert.doesNotMatch(body, /insights\/<project-id>/);
});

test('the main CLI loads only the active target profile', () => {
  const block = read('src', 'core', 'lib', 'repository-instructions-block.md');
  const agents = read('AGENTS.md');
  assert.equal(extractRepositoryInstructions(agents), block);
  assert.match(block, /session started is not necessarily the active target/);
  assert.match(block, /Load its applicable `AGENTS\.md`/);
  assert.match(block, /\.kai\/engineering\/insights\/<project-id>\/profile\.md/);
  assert.match(block, /Never\s+apply one project binding's profile to another/);
  assert.match(block, /never create insight state\s+merely because a profile is absent/);
});

test('capture stays source-specific and refinement owns approved promotion', () => {
  const mine = read(
    'plugins', 'kai-engineering', 'skills', 'my-insights', 'SKILL.md',
  );
  assert.match(mine, /explicit request to remember or adapt/);
  assert.match(mine, /Do not inspect\s+ordinary tasks for possible lessons/);
  assert.match(mine, /Do not edit `profile\.md`/);

  const team = read(
    'plugins', 'kai-engineering', 'skills', 'team-insights', 'SKILL.md',
  );
  assert.match(team, /Team feedback is evidence, not automatic authority/);
  assert.match(team, /Never scan PRs, comments, chat, or documents automatically/);
  assert.match(team, /Do not edit `profile\.md`/);

  const refine = read(
    'plugins', 'kai-engineering', 'skills', 'refine-insights', 'SKILL.md',
  );
  assert.match(refine, /Obtain operator approval\s+before changing `profile\.md`/);
  assert.match(refine, /under roughly 100 substantive\s+lines/);
  assert.match(refine, /Never turn candidates into global Kai defaults/);
  assert.match(refine, /create or modify a skill/);
});

test('workspace initialization remains lazy and creates no insight directory', () => {
  const onboarding = read(
    'plugins', 'kai-core', 'skills', 'kai-core-workspace-onboarding', 'SKILL.md',
  );
  assert.match(onboarding, /creates only the schema-6 manifest/);
  assert.doesNotMatch(onboarding, /\.kai\/core\/insights/);
});
