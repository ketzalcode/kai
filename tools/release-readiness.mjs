#!/usr/bin/env node

import {execFileSync} from 'node:child_process';
import {dirname} from 'node:path';
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

function readAtRef(ref, path) {
  return git(['show', `${ref}:${path}`]);
}

function readJsonAtRef(ref, path) {
  return JSON.parse(readAtRef(ref, path));
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

function generatedVersions(ref) {
  const marketplace = readJsonAtRef(ref, '.github/plugin/marketplace.json');
  const marketplaceVersion = name =>
    marketplace.plugins?.find(plugin => plugin.name === name)?.version;
  return {
    'plugin.json': readJsonAtRef(ref, 'plugin.json').version,
    'marketplace.metadata': marketplace.metadata?.version,
    'marketplace.kai-core': marketplaceVersion('kai-core'),
    'marketplace.kai-engineering': marketplaceVersion('kai-engineering'),
    'marketplace.kai-creative': marketplaceVersion('kai-creative'),
    'plugins/kai-core/plugin.json':
      readJsonAtRef(ref, 'plugins/kai-core/plugin.json').version,
    'plugins/kai-engineering/plugin.json':
      readJsonAtRef(ref, 'plugins/kai-engineering/plugin.json').version,
    'plugins/kai-creative/plugin.json':
      readJsonAtRef(ref, 'plugins/kai-creative/plugin.json').version,
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
  const releaseTag = latestTag();
  const base = options.base ?? releaseTag;
  const changedFiles = git([
    'diff',
    '--name-only',
    '--no-renames',
    `${base}...${options.head}`,
  ]).split(/\r?\n/).filter(Boolean);
  const currentVersion = readJsonAtRef(options.head, 'package.json').version;
  const result = evaluateReleaseReadiness({
    changedFiles,
    currentVersion,
    latestVersion: versionFromTag(releaseTag),
    latestTag: releaseTag,
    changelog: readAtRef(options.head, 'CHANGELOG.md'),
    generatedVersions: generatedVersions(options.head),
  });
  printResult(result, options.json);
  process.exit(result.ok ? 0 : 1);
} catch (error) {
  console.error(`release-readiness: ${error.message}`);
  process.exit(2);
}
