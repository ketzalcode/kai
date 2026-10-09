const SEMVER = /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-([0-9A-Za-z.-]+))?$/;
const CHANGELOG_REPOSITORY = 'https://github.com/ketzalcode/kai';

export const BEHAVIOR_PREFIXES = Object.freeze([
  'plugins/', 'src/', 'tools/',
]);

export const BEHAVIOR_FILES = new Set([
  'package.json',
  'package-lock.json',
  'plugin.json',
  '.github/plugin/marketplace.json',
]);

export const EXPECTED_GENERATED_VERSION_KEYS = Object.freeze([
  'plugin.json',
  'marketplace.metadata',
  'marketplace.kai-core',
  'marketplace.kai-engineering',
  'marketplace.kai-creative',
  'plugins/kai-core/plugin.json',
  'plugins/kai-engineering/plugin.json',
  'plugins/kai-creative/plugin.json',
]);

export function isBehaviorPath(value) {
  const path = value.replace(/\\/g, '/');
  return BEHAVIOR_FILES.has(path)
    || BEHAVIOR_PREFIXES.some(prefix => path.startsWith(prefix));
}

export function parseSemver(version) {
  const match = SEMVER.exec(version ?? '');
  return match
    ? {core: match.slice(1, 4).map(Number), prerelease: match[4] ?? null}
    : null;
}

export function isForwardVersion(latestVersion, currentVersion) {
  const latest = parseSemver(latestVersion);
  const current = parseSemver(currentVersion);
  if (!current) return false;
  if (!latest) return true;
  for (let index = 0; index < 3; index += 1) {
    if (latest.core[index] !== current.core[index]) {
      return current.core[index] > latest.core[index];
    }
  }
  return Boolean(latest.prerelease && !current.prerelease);
}

export function generatedVersionErrors(currentVersion, generatedVersions) {
  return EXPECTED_GENERATED_VERSION_KEYS.flatMap(file => {
    if (!Object.hasOwn(generatedVersions, file)) {
      return [`${file} is missing; expected ${currentVersion}`];
    }
    const version = generatedVersions[file];
    return version === currentVersion
      ? []
      : [`${file} has ${version}; expected ${currentVersion}`];
  });
}

export function extractReleaseNotes(changelog, version) {
  const lines = changelog.replace(/\r\n/g, '\n').split('\n');
  const escaped = version.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const heading = new RegExp(`^## \\[${escaped}\\] - \\d{4}-\\d{2}-\\d{2}$`);
  const start = lines.findIndex(line => heading.test(line));
  if (start === -1) throw new Error(`CHANGELOG.md has no exact ${version} section`);
  const next = lines.findIndex((line, index) => index > start && /^## \[/.test(line));
  return lines.slice(start + 1, next === -1 ? lines.length : next).join('\n').trim();
}

export function expectedComparisonLink(latestTag, currentVersion) {
  return `[${currentVersion}]: ${CHANGELOG_REPOSITORY}/compare/${latestTag}...v${currentVersion}`;
}

export function evaluateReleaseReadiness(input) {
  const behaviorChanged = input.changedFiles.some(isBehaviorPath);
  if (!behaviorChanged) {
    return {ok: true, release: false, reason: 'no-release-needed', errors: [], notes: ''};
  }
  const errors = [];
  if (!isForwardVersion(input.latestVersion, input.currentVersion)) {
    errors.push(`behavior changed without a forward version: ${input.latestVersion} -> ${input.currentVersion}`);
  }
  let notes = '';
  try {
    notes = extractReleaseNotes(input.changelog, input.currentVersion);
  } catch (error) {
    errors.push(error.message);
  }
  const comparisonLink = expectedComparisonLink(input.latestTag, input.currentVersion);
  if (!input.changelog.replace(/\r\n/g, '\n').split('\n').includes(comparisonLink)) {
    errors.push(`CHANGELOG.md is missing exact comparison link: ${comparisonLink}`);
  }
  errors.push(...generatedVersionErrors(input.currentVersion, input.generatedVersions));
  return {
    ok: errors.length === 0,
    release: errors.length === 0,
    reason: errors.length === 0 ? 'ready' : 'not-ready',
    errors,
    notes,
  };
}
