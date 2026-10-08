import {existsSync} from 'node:fs';
import {dirname, join, resolve} from 'node:path';
import {fileURLToPath, pathToFileURL} from 'node:url';

export const checkout = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const configuredPath = process.env.KAI_TEST_COORDINATION_ENTRYPOINT;
export const cliEntrypoint = configuredPath
  ? resolve(checkout, configuredPath)
  : join(checkout, 'src', 'core', 'coordinate.mjs');
if (!existsSync(cliEntrypoint)) {
  throw new Error(`configured coordination entrypoint does not exist: ${cliEntrypoint}`);
}
const cliModule = await import(pathToFileURL(cliEntrypoint).href);
export const {parseArguments, runCLI} = cliModule;

export function withEntrypointEnv(env = {}) {
  return {
    ...env,
    KAI_TEST_REPORT_COORDINATION_ENTRYPOINT: '1',
  };
}
