#Requires -Version 7.0
<#
.SYNOPSIS
    Generate multilingual audio from any folder of markdown notes (or a single .md file)
    by shelling out to lectoria. Resolves paths relative to the caller's cwd, so it
    travels across codebases.

.DESCRIPTION
    Sister script to bongo's generate-audio.ps1, but bongo bakes in Microsoft-work
    paths (knowledge/dev-designs/). This one stays cwd-relative so you can run it
    from any project — personal notes, an OSS readme, a course, a blog draft —
    and the audio lands next to the source by default.

    Reads markdown from -Source, writes mp3s + RSS feeds to -Out. Output mirrors
    source structure under -Out (one feed per source folder).

.PARAMETER Source
    Folder of markdown documents to narrate, or a single .md file. Resolved
    relative to your current working directory. Default: . (cwd).

.PARAMETER Out
    Output directory. Lectoria mirrors source structure under here. Resolved
    relative to your current working directory. Default: ./audio.

.PARAMETER Lang
    Comma-separated languages. Default: en,es.

.PARAMETER Style
    Script style: podcast | conversational | verbatim | dialogue.
    Default: conversational (best balance of fidelity vs. listenability).

.PARAMETER Voice
    Voice preset: espana | latino | intermedio. Sets the narrator voices
    and pace per language. Default: intermedio (a less regionally-marked,
    international Spanish). Run `lectoria voices` to see them all.

.PARAMETER NoDistribute
    Skip RSS feed + episodes.json generation; produce audio only.

.PARAMETER NoRecursive
    Don't walk subdirectories of -Source.

.PARAMETER DryRun
    Print the command that would run, without invoking lectoria.

.EXAMPLE
    cd ~/Documents/notes
    pwsh <kai-plugin>/scripts/generate-audio.ps1
    # Narrates everything under ~/Documents/notes -> ~/Documents/notes/audio/

.EXAMPLE
    pwsh <kai-plugin>/scripts/generate-audio.ps1 -Source ./README.md -Lang es
    # Single file, Spanish only

.EXAMPLE
    pwsh <kai-plugin>/scripts/generate-audio.ps1 -Style verbatim -DryRun
    # Preview the command without spending money

.NOTES
    Lectoria is pinned in this plugin's package.json. Install once with `npm install`
    at the kai plugin root and the wrapper will prefer the local copy (via npx).
    Falls back to a global `lectoria` install if one is on PATH. Azure credentials
    are loaded from this repo's `.env` so callers don't need them exported.
#>

[CmdletBinding()]
param(
    [string]$Source = ".",
    [string]$Out = "./audio",
    [string]$Lang = "en,es",
    [ValidateSet("podcast", "conversational", "verbatim", "dialogue")]
    [string]$Style = "conversational",
    [ValidateSet("espana", "latino", "intermedio")]
    [string]$Voice = "intermedio",
    [switch]$NoDistribute,
    [switch]$NoRecursive,
    [switch]$DryRun
)

$ErrorActionPreference = 'Stop'

# Stay where the user invoked the script from. Unlike bongo's wrapper —
# which cd's into the plugin repo — this script is meant to be cross-repo,
# so paths must resolve against the user's cwd.
$callerCwd = (Get-Location).Path

# Verify lectoria is available — prefer the local npm install (so the wrapper
# travels with this repo), fall back to a global install if needed. The local
# bin is `lectoria.cmd` on Windows and `lectoria` (no extension) on macOS/Linux,
# so check both.
$repoRoot      = Split-Path -Parent $PSScriptRoot
$repoBinDir    = Join-Path $repoRoot 'node_modules' '.bin'
$repoLectoria  = Join-Path $repoBinDir 'lectoria.cmd'
$repoLectoriaP = Join-Path $repoBinDir 'lectoria'
$useNpx        = $false

if ((Test-Path $repoLectoria) -or (Test-Path $repoLectoriaP)) {
    $useNpx = $true
}
else {
    $lectoriaCmd = Get-Command lectoria -ErrorAction SilentlyContinue
    if (-not $lectoriaCmd) {
        Write-Error @"
'lectoria' is not available. Either:

  # Install locally in this repo (recommended — travels with the codebase):
  cd $repoRoot
  npm install

  # Or install globally:
  npm install -g git+https://github.com/RubenSaucedo/lectoria.git
"@
        exit 1
    }
}

# Load repo .env so callers don't need Azure vars exported in their shell. This
# mirrors bongo's wrapper — credentials live with the repo's config, not the
# user's profile.
$envFile = Join-Path $repoRoot '.env'
if (Test-Path $envFile) {
    Get-Content $envFile | ForEach-Object {
        if ($_ -match '^\s*([A-Z_][A-Z0-9_]*)\s*=\s*(.*?)\s*$' -and $_ -notmatch '^\s*#') {
            [Environment]::SetEnvironmentVariable($matches[1], $matches[2], 'Process')
        }
    }
}

# Resolve -Source against caller cwd (Resolve-Path needs the file to exist).
try {
    $resolvedSource = (Resolve-Path -LiteralPath $Source -ErrorAction Stop).Path
}
catch {
    Write-Error "Source path '$Source' does not exist (resolved against cwd: $callerCwd)."
    exit 1
}

# Resolve -Out without requiring it to exist yet (lectoria creates it).
# Normalize so dry-run output reads cleanly (no '\.\audio').
$resolvedOut = if ([System.IO.Path]::IsPathRooted($Out)) {
    [System.IO.Path]::GetFullPath($Out)
} else {
    [System.IO.Path]::GetFullPath((Join-Path $callerCwd $Out))
}

$lectoriaArgs = @(
    'run', $resolvedSource,
    '--out', $resolvedOut,
    '--lang', $Lang,
    '--style', $Style
)
if ($NoDistribute) { $lectoriaArgs += '--no-distribute' }
if ($NoRecursive)  { $lectoriaArgs += '--no-recursive' }
if ($Voice)        { $lectoriaArgs += @('--voice', $Voice) }

$cmdLine = if ($useNpx) {
    "npx --no-install lectoria $($lectoriaArgs -join ' ')"
} else {
    "lectoria $($lectoriaArgs -join ' ')"
}

if ($DryRun) {
    Write-Host "[dry-run] $cmdLine"
    Write-Host "[dry-run] cwd     : $callerCwd"
    Write-Host "[dry-run] source  : $resolvedSource"
    Write-Host "[dry-run] out     : $resolvedOut"
    exit 0
}

Write-Host $cmdLine -ForegroundColor Cyan
if ($useNpx) {
    # --no-install: never reach into the registry, only use what's already in
    # this repo's node_modules. Avoids surprise downloads + waits.
    & npx --no-install lectoria @lectoriaArgs
} else {
    & lectoria @lectoriaArgs
}
exit $LASTEXITCODE
