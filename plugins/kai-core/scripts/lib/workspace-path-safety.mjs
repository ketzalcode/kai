import {existsSync, lstatSync, readdirSync, realpathSync} from 'node:fs';
import {basename, dirname, isAbsolute, join, relative, resolve, sep} from 'node:path';
import {isNull, unquote} from './coordination.mjs';

// These diagnostic helpers are shared with the workspace doctor.
export function badPath(p) {
  const t = unquote(p);
  if (isNull(t) || t === '[]') return null;
  const projectTarget = /^project:([a-z][a-z0-9-]*):(.*)$/i.exec(t);
  const candidate = projectTarget ? projectTarget[2] : t;
  if (projectTarget && !candidate.trim()) return 'project target with no relative path';
  const norm = candidate.replace(/\\/g, '/');
  if (t.startsWith('\\\\') || norm.startsWith('//')) return 'UNC / share path';
  if (/^[A-Za-z]:\//.test(norm) || norm.startsWith('/')) return 'machine-absolute path';
  if (t.includes('.../')) return 'abbreviated `.../` path';
  if (norm.split('/').some(seg => seg === '..')) return 'path escaping the workspace root';
  if (/session-state/i.test(t)) return 'session-state-relative path';
  return null;
}

export function canonicalPath(path) {
  let existing = resolve(path);
  const tail = [];
  while (!existsSync(existing)) {
    const parent = dirname(existing);
    if (parent === existing) break;
    tail.unshift(basename(existing));
    existing = parent;
  }
  const canonical = existsSync(existing) ? realpathSync(existing) : existing;
  return resolve(canonical, ...tail);
}

export function normalized(path) {
  const value = canonicalPath(path);
  return process.platform === 'win32' ? value.toLowerCase() : value;
}

export function resolvedProjectPath(root, projectPath) {
  return isAbsolute(projectPath) ? resolve(projectPath) : resolve(root, projectPath);
}

export function escapesRoot(root, candidate) {
  const rel = relative(canonicalPath(root), canonicalPath(candidate));
  return rel === '..' || rel.startsWith(`..${sep}`) || isAbsolute(rel);
}

export function inspectPrivateLanes(root, lanes = ['.kai/runs', '.kai/review', '.kai/archive', '.kai/personal']) {
  const gitRoots = [];
  const symbolicLinks = [];
  const unreadable = [];
  for (const lane of lanes) {
    const laneRoot = join(root, ...lane.split('/'));
    let laneStat;
    try {
      laneStat = lstatSync(laneRoot);
    } catch (error) {
      if (error.code === 'ENOENT') continue;
      unreadable.push(`${lane}: ${error.message}`);
      continue;
    }
    if (laneStat.isSymbolicLink()) {
      symbolicLinks.push(lane);
      continue;
    }
    const pending = [laneRoot];
    while (pending.length) {
      const current = pending.pop();
      let entries;
      try {
        entries = readdirSync(current, {withFileTypes: true});
      } catch (error) {
        unreadable.push(`${relative(root, current).replace(/\\/g, '/')}: ${error.message}`);
        continue;
      }
      for (const entry of entries) {
        const path = join(current, entry.name);
        if (entry.name.toLowerCase() === '.git') {
          gitRoots.push(relative(root, current).replace(/\\/g, '/') || '.');
          continue;
        }
        if (entry.isSymbolicLink()) {
          symbolicLinks.push(relative(root, path).replace(/\\/g, '/'));
          continue;
        }
        if (entry.isDirectory()) pending.push(path);
      }
    }
  }
  return {gitRoots, symbolicLinks, unreadable};
}

// Unlike physical containment alone, this also rejects in-root and dangling links.
export function pathHasLink(root, candidate) {
  let current = resolve(root);
  const segments = relative(current, resolve(candidate)).split(sep).filter(Boolean);
  for (const segment of ['', ...segments]) {
    if (segment) current = join(current, segment);
    try {
      if (lstatSync(current).isSymbolicLink()) return true;
    } catch (error) {
      if (error.code !== 'ENOENT') throw error;
    }
  }
  return false;
}
