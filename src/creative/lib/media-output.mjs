import {existsSync, realpathSync, statSync} from 'node:fs';
import {resolve} from 'node:path';

function pathIdentity(path) {
  const absolute = resolve(path);
  const identity = existsSync(absolute) ? realpathSync(absolute) : absolute;
  return process.platform === 'win32' ? identity.toLowerCase() : identity;
}

export function assertSafeOutput(sources, out, replace) {
  const outputIdentity = pathIdentity(out);
  const outputStat = existsSync(out) ? statSync(out) : null;
  const collision = sources.find((source) => {
    if (pathIdentity(source.path) === outputIdentity) return true;
    const inputStat = outputStat && existsSync(source.path) ? statSync(source.path) : null;
    return inputStat && inputStat.dev === outputStat.dev && inputStat.ino === outputStat.ino;
  });
  if (collision) throw new Error(`output path "${out}" is the same as the ${collision.role}; this must write a distinct file`);
  if (existsSync(out) && !replace) {
    throw new Error(`output path "${out}" already exists; choose a new destination or pass --replace after authorizing replacement`);
  }
}
