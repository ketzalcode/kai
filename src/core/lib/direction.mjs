import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {basename, join, posix as path} from 'node:path';
import {directionPath} from './workspace-layout.mjs';
import {resolveConfiguredProject} from './workspace-resolve.mjs';
import {exactPath, pathHasLink} from './workspace-path-safety.mjs';

const SECTION_ORDER = [
  ['Vision', 'vision'],
  ['Mission', 'mission'],
  ['Current Goal', 'currentGoal'],
  ['Out of Scope', 'outOfScope'],
];

const decoder = new TextDecoder('utf-8', {fatal: true});

function fail(code, message) {
  const error = new Error(message);
  error.code = code;
  throw error;
}

function exactDirectionFile(publicationRoot) {
  return path.join(publicationRoot, basename(directionPath()));
}

function parseTopLevelSections(markdown) {
  const headings = [];
  let inFence = false;
  let fenceChar = null;
  let fenceSize = 0;
  const lines = markdown.matchAll(/.*?(?:\r\n|\n|\r|$)/g);

  for (const match of lines) {
    const line = match[0];
    const start = match.index ?? 0;
    if (!line && start === markdown.length) break;
    const content = line.replace(/[\r\n]+$/, '');
    const fence = /^[ \t]*(`{3,}|~{3,})/.exec(content);
    if (fence) {
      const marker = fence[1];
      if (!inFence) {
        inFence = true;
        fenceChar = marker[0];
        fenceSize = marker.length;
      } else if (marker[0] === fenceChar && marker.length >= fenceSize) {
        inFence = false;
        fenceChar = null;
        fenceSize = 0;
      }
      continue;
    }
    if (inFence) continue;
    const heading = /^# ([^\r\n]+?)\s*$/.exec(content);
    if (!heading) continue;
    headings.push({
      title: heading[1],
      bodyStart: start + line.length,
      start,
    });
  }

  if (headings.length !== SECTION_ORDER.length) {
    fail('INVALID_DIRECTION', 'direction must contain exactly Vision, Mission, Current Goal, and Out of Scope once each');
  }

  const sections = {};
  for (const [index, [expectedTitle, key]] of SECTION_ORDER.entries()) {
    if (headings[index].title !== expectedTitle) {
      fail('INVALID_DIRECTION', 'direction headings must appear exactly once in the required order');
    }
    const bodyEnd = headings[index + 1]?.start ?? markdown.length;
    const body = markdown.slice(headings[index].bodyStart, bodyEnd).trim();
    if (!body) fail('INVALID_DIRECTION', `${expectedTitle} must have a non-empty body`);
    sections[key] = body;
  }

  return sections;
}

export function readDirection({workspaceRoot, manifest, projectId}) {
  const project = resolveConfiguredProject({workspaceRoot, manifest, projectId});
  const relativePath = exactDirectionFile(project.publicationRoot);
  const absolutePath = join(project.projectRoot, ...relativePath.split('/'));

  let bytes;
  try {
    if (pathHasLink(project.projectRoot, absolutePath) || !exactPath(absolutePath)) {
      fail('PATH_ESCAPE', `${relativePath} must resolve without symbolic link or junction aliases`);
    }
    bytes = readFileSync(absolutePath);
  } catch (error) {
    if (error?.code === 'ENOENT') fail('DIRECTION_REQUIRED', `coordinated work requires ${relativePath}`);
    if (error?.code === 'PATH_ESCAPE') throw error;
    throw error;
  }

  let markdown;
  try {
    markdown = decoder.decode(bytes);
  } catch {
    fail('INVALID_DIRECTION', `${relativePath} must be valid UTF-8`);
  }

  const sections = parseTopLevelSections(markdown);
  return {
    path: relativePath,
    hash: createHash('sha256').update(bytes).digest('hex'),
    goal: sections.currentGoal,
    sections,
    bytes,
  };
}

export function requireDirection({workspaceRoot, manifest, projectId, coordinated}) {
  if (!coordinated) return null;
  return readDirection({workspaceRoot, manifest, projectId});
}
