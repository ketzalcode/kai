// SYNTHETIC operator/catalog fixture. It is not actual human acceptance.
// Only the metadata discovery seam is replaced; native receipt matching,
// capabilities, parser, SQLite, files, Git and all domain operations are real.
import {runCLI} from '../../scripts/coordinate.mjs';
import {createNativeHost} from '../../scripts/lib/coordination-runtime/native-host.mjs';
import {randomUUID} from 'node:crypto';

const roles = ['workflow-manager', 'workflow-ship', 'eng-lead-architecture',
  'eng-builder-software', 'eng-reviewer-code', 'eng-reviewer-quality',
  'creative-lead-design', 'creative-lead-video', 'workflow-creative-demo-production'];
const host = createNativeHost({
  env: process.env,
  discover: async ({role}) => ({
    host: {name: 'SYNTHETIC catalog fixture', version: '1.0.85'},
    roster: roles.map(role => ({id: `fixture:${role}`, role, model: null})),
    profiles: {},
    capabilities: {peerDispatch: false, resume: false, modelOverride: true,
      usage: false, models: ['claude-opus-5', 'claude-sonnet-5', 'gpt-5.6-sol', 'gpt-5.6-terra'], efforts: []},
    modelPromptSent: false,
    transportClosed: true,
    ...(role ? {prepared: {actor: {role, runId: randomUUID()}, agentId: `fixture:${role}`}} : {}),
  }),
});
try {
  const {exitCode, result} = await runCLI(process.argv.slice(2), {host});
  process.stdout.write(`${JSON.stringify(result)}\n`);
  process.exitCode = exitCode;
} catch (error) {
  process.stderr.write(`${error.stack}\n`);
  process.exitCode = 1;
}
