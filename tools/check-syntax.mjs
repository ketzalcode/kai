#!/usr/bin/env node
// Syntax/parse gate (#35): every .mjs/.js under src/, tools/ and examples/
// must pass `node --check`, and every .ps1 must parse under
// PowerShell. PowerShell parsing is skipped with a notice when pwsh is
// unavailable, so the check stays runnable on machines without PowerShell (CI
// runners have it).
//
// Usage: node tools/check-syntax.mjs   (exit 0 = all parse, 1 = a failure)

import { execFileSync } from 'node:child_process';
import { readdirSync, statSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const rel = (p) => p.slice(ROOT.length + 1).replace(/\\/g, '/');
const errors = [];

function collect(dir, re) {
  const out = [];
  for (const e of readdirSync(dir)) {
    const p = join(dir, e);
    if (statSync(p).isDirectory()) out.push(...collect(p, re));
    else if (re.test(e)) out.push(p);
  }
  return out;
}

// Product source and the developer tooling that decides what ships. Both are
// parsed: a tooling file that will not parse breaks the build that produces the
// packs, which is no less severe than a shipped file that will not parse.
const sourceRoots = ['src', 'tools', 'examples'];

const sourceDirs = sourceRoots.map((name) => {
  const dir = join(ROOT, name);
  try {
    if (statSync(dir).isDirectory()) return dir;
  } catch { /* fall through to the error below */ }
  // A missing directory is a failure, never a silent skip. This check used to
  // filter absent roots out quietly; when `scripts/` was split into `src/` and
  // `tools/`, that turned a 63-file gate into a 1-file gate and still reported
  // success. An expected root that has moved must fail loudly.
  errors.push(`${name}/: expected source root is missing — check-syntax would otherwise pass by scanning nothing`);
  return null;
}).filter(Boolean);

// 1. JavaScript / ESM — node --check parses without executing.
const jsFiles = sourceDirs.flatMap((d) => collect(d, /\.(mjs|js)$/));
for (const f of jsFiles) {
  try {
    execFileSync(process.execPath, ['--check', f], { stdio: 'pipe' });
  } catch (e) {
    errors.push(`${rel(f)}: node --check failed\n${(e.stderr?.toString() || e.message).trim()}`);
  }
}

// 2. PowerShell — parse via the language parser (no execution). Skip cleanly
//    when pwsh is not installed.
const psFiles = sourceDirs.flatMap((d) => collect(d, /\.ps1$/));
let pwsh = null;
try {
  execFileSync('pwsh', ['-NoProfile', '-Command', '$PSVersionTable.PSVersion.Major'], { stdio: 'pipe' });
  pwsh = 'pwsh';
} catch {
  pwsh = null;
}
if (psFiles.length && pwsh) {
  for (const f of psFiles) {
    const script = `$errs=$null;[void][System.Management.Automation.Language.Parser]::ParseFile(${JSON.stringify(f)},[ref]$null,[ref]$errs);if($errs){$errs|ForEach-Object{[Console]::Error.WriteLine($_.Message)};exit 1}`;
    try {
      execFileSync(pwsh, ['-NoProfile', '-NonInteractive', '-Command', script], { stdio: 'pipe' });
    } catch (e) {
      errors.push(`${rel(f)}: PowerShell parse failed\n${(e.stderr?.toString() || e.message).trim()}`);
    }
  }
} else if (psFiles.length) {
  console.log(`\u2139 check-syntax: pwsh not found — skipped ${psFiles.length} PowerShell script(s) (${psFiles.map(rel).join(', ')})`);
}

if (errors.length === 0) {
  console.log(`\u2713 check-syntax: ${jsFiles.length} JS/MJS${psFiles.length && pwsh ? ` + ${psFiles.length} PowerShell` : ''} helper(s) parse cleanly`);
  process.exit(0);
}
console.error(`\u2717 check-syntax: ${errors.length} script(s) failed to parse\n`);
for (const e of errors) console.error(`  ${e}`);
process.exit(1);
