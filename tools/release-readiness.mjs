#!/usr/bin/env node

import {execFileSync} from 'node:child_process';
import {readFileSync} from 'node:fs';
import {dirname, join} from 'node:path';
import {fileURLToPath} from 'node:url';
import {evaluateReleaseReadiness} from './lib/release.mjs';

const ROOT = dirname(dirname(fileURLToPath(import.meta.url)));

function usage(message) {
  if (message) console.error(`release-readiness: ${message}`);
  console.error('Usage: node tools/release-readiness.mjs [--base <tag>] [--head <ref>] [--json]');
  process.exit(2);
}

function parseArgs(args) {
  const options = {base: null, head: 'HEAD', json: false};
  for (let index = 0; index < args.length; index += 1) {
    const argument = args[index];
    if (argument === '--json') {
      options.json = true;
      continue;
    }
    if (argument === '--base' || argument === '--head') {
      const value = args[index + 1];
      if (!value || value.startsWith('--')) usage(`${argument} requires a value`);
      options[argument.slice(2)] = value;
      index += 1;
      continue;
    }
    usage(`unknown argument: ${argument}`);
  }
  return options;
}

function git(args) {
  return execFileSync('git', args, {cwd: ROOT, encoding: 'utf8'}).trim();
}

function readJson(path) {
  return JSON.parse(readFileSync(join(ROOT, path), 'utf8'));
}

function latestTag() {
  const tags = git(['tag', '--list', 'v*', '--sort=-v:refname'])
    .split(/\r?\n/)
    .filter(Boolean);
  if (tags.length === 0) throw new Error('no v* release tag found; pass --base <tag>');
  return tags[0];
}

function versionFromTag(tag) {
  return tag.startsWith('v') ? tag.slice(1) : tag;
}

function generatedVersions() {
  const marketplace = readJson('.github/plugin/marketplace.json');
  return {
    'plugin.json': readJson('plugin.json').version,
    'marketplace.metadata': marketplace.metadata?.version,
    ...Object.fromEntries(
      (marketplace.plugins ?? []).map(plugin => [`marketplace.${plugin.name}`, plugin.version]),
    ),
    'plugins/kai-core/plugin.json': readJson('plugins/kai-core/plugin.json').version,
    'plugins/kai-engineering/plugin.json': readJson('plugins/kai-engineering/plugin.json').version,
    'plugins/kai-creative/plugin.json': readJson('plugins/kai-creative/plugin.json').version,
  };
}

function printResult(result, json) {
  if (json) {
    console.log(JSON.stringify(result, null, 2));
    return;
  }
  if (result.ok) {
    console.log(result.release
      ? 'release-readiness: ready'
      : 'release-readiness: no release needed');
    return;
  }
  console.error('release-readiness: not ready');
  for (const error of result.errors) console.error(`  ${error}`);
}

const options = parseArgs(process.argv.slice(2));

try {
  const base = options.base ?? latestTag();
  const changedFiles = git([
    'diff',
    '--name-only',
    '--no-renames',
    `${base}...${options.head}`,
  ]).split(/\r?\n/).filter(Boolean);
  const currentVersion = readJson('package.json').version;
  const result = evaluateReleaseReadiness({
    changedFiles,
    currentVersion,
    latestVersion: versionFromTag(base),
    changelog: readFileSync(join(ROOT, 'CHANGELOG.md'), 'utf8'),
    generatedVersions: generatedVersions(),
  });
  printResult(result, options.json);
  process.exit(result.ok ? 0 : 1);
} catch (error) {
  console.error(`release-readiness: ${error.message}`);
  process.exit(2);
}
