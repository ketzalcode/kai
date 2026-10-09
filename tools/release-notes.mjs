#!/usr/bin/env node

import {readFileSync} from 'node:fs';
import {dirname, join} from 'node:path';
import {fileURLToPath} from 'node:url';
import {extractReleaseNotes} from './lib/release.mjs';

const ROOT = dirname(dirname(fileURLToPath(import.meta.url)));
const args = process.argv.slice(2);
const versionIndex = args.indexOf('--version');

if (versionIndex === -1 || !args[versionIndex + 1] || args[versionIndex + 1].startsWith('--')) {
  console.error('Usage: node tools/release-notes.mjs --version <x.y.z>');
  process.exit(2);
}

if (args.length !== 2 || versionIndex !== 0) {
  console.error('Usage: node tools/release-notes.mjs --version <x.y.z>');
  process.exit(2);
}

try {
  const changelog = readFileSync(join(ROOT, 'CHANGELOG.md'), 'utf8');
  console.log(extractReleaseNotes(changelog, args[versionIndex + 1]));
} catch (error) {
  console.error(`release-notes: ${error.message}`);
  process.exit(1);
}
