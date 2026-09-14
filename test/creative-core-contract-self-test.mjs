import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const read = id => readFileSync(
  join(root, 'plugins', 'kai-core', 'skills', id, 'SKILL.md'), 'utf8',
).replace(/\s+/g, ' ').toLowerCase();
const selected = process.argv[2] ?? 'all';
assert.ok(['all', 'grounding', 'scope'].includes(selected), 'unknown contract selector');
const failures = [];

if (selected !== 'scope') {
  const body = read('kai-core-design-grounding');
  for (const [label, pattern] of [
    ['bounded supplied evidence', /bounded.{0,140}scoped.{0,140}evidence/],
    ['no compulsory reference artifact', /without.{0,80}(creating|writing|deriving).{0,100}design-system\.md/],
    ['durable derivation remains explicit', /(requested|owed).{0,120}(deriv|design.system)/],
    ['provenance distinction', /observed.{0,80}implementation-truth.{0,80}proposed/],
    ['feasibility owner', /fe.{0,80}reviews feasibility/],
    ['unknown values are proposals', /value with no evidence is a proposal/],
    ['direct gaps remain unadopted', /bounded direct answer.{0,100}gap.{0,100}proposed value inline without adopting/],
    ['durable coverage', /coverage spans the.{0,15}whole in-scope app/],
    ['supplied evidence is not acceptance', /supplied evidence is not engineering approval or independent acceptance/],
  ]) {
    if (!pattern.test(body)) failures.push(`grounding: ${label}`);
  }
}

if (selected !== 'grounding') {
  const body = read('kai-core-scope-discipline');
  for (const [label, pattern] of [
    ['direct inline proposals', /direct.{0,100}(inline|conversational).{0,150}proposal/],
    ['no onboarding for inline answer', /(does not|do not|no need to).{0,100}(onboard|initializ)/],
    ['durable recording predicate', /(durable|coordinated).{0,120}(record|proposal)/],
    ['scope authority remains', /scope-owner.{0,120}owns/],
    ['assessment is not adoption', /never unilaterally add a scope-expanding/],
    ['durable channel retained', /proposal_channel/],
    ['inline advice is not adoption', /answer is advice, not adoption or a coordinated completion record/],
  ]) {
    if (!pattern.test(body)) failures.push(`scope: ${label}`);
  }
}

assert.deepEqual(failures, [], 'creative core seams must distinguish direct advice from durable coordination');
console.log(`creative core contract assertions passed (${selected})`);
