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
    Voice preset: espana | latino | intermedio | intermedio-femenino. Sets
    the narrator voices and pace per language. Default: intermedio (a less
    regionally-marked, international Spanish). Run `lectoria voices` to see
    them all.

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
    Lectoria is pinned in this pack's package.json and package-lock.json. Install
    it with `npm ci --prefix "<kai-core-plugin>"`; the wrapper prefers that
    pack-local executable and falls back to PATH. Azure credentials are loaded
    from this repo's `.env` so callers don't need them exported.
#>

[CmdletBinding()]
param(
    [string]$Source = ".",
    [string]$Out = "./audio",
    [string]$Lang = "en,es",
    [ValidateSet("podcast", "conversational", "verbatim", "dialogue")]
    [string]$Style = "conversational",
    [ValidateSet("espana", "latino", "intermedio", "intermedio-femenino")]
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

# Resolve lectoria from an explicit override, this pack's pinned install, or
# PATH. Copilot copies plugin files but does not run npm for installed packs.
$repoRoot = Split-Path -Parent $PSScriptRoot
$lectoriaExecutable = $null
$lectoriaSource = $null

if ($env:LECTORIA_BIN) {
    $explicit = Get-Command $env:LECTORIA_BIN -ErrorAction SilentlyContinue
    if (-not $explicit) {
        Write-Error "LECTORIA_BIN points to '$($env:LECTORIA_BIN)', but that executable does not exist."
        exit 1
    }
    $lectoriaExecutable = $explicit.Source
    $lectoriaSource = 'LECTORIA_BIN'
}

if (-not $lectoriaExecutable) {
    $repoBinDir = Join-Path $repoRoot 'node_modules' '.bin'
    foreach ($name in @('lectoria.cmd', 'lectoria.ps1', 'lectoria')) {
        $candidate = Join-Path $repoBinDir $name
        if (Test-Path -LiteralPath $candidate) {
            $lectoriaExecutable = $candidate
            $lectoriaSource = 'node_modules/.bin'
            break
        }
    }
}

if (-not $lectoriaExecutable) {
    $pathCommand = Get-Command lectoria -ErrorAction SilentlyContinue
    if ($pathCommand) {
        $lectoriaExecutable = $pathCommand.Source
        $lectoriaSource = 'PATH'
    }
}

if (-not $lectoriaExecutable) {
    Write-Error @"
'lectoria' is not available. Copilot installs the plugin files but does not run npm.

Install the dependency pinned by this pack:

  npm ci --prefix "$repoRoot"

Then retry. Plugin updates may replace node_modules, so rerun that command when
the local executable is absent. Alternatively, set LECTORIA_BIN to a durable
user-managed executable or place lectoria on PATH.
"@
    exit 1
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

$cmdLine = "& `"$lectoriaExecutable`" $($lectoriaArgs -join ' ')"

if ($DryRun) {
    Write-Host "[dry-run] $cmdLine"
    Write-Host "[dry-run] lectoria: $lectoriaSource"
    Write-Host "[dry-run] cwd     : $callerCwd"
    Write-Host "[dry-run] source  : $resolvedSource"
    Write-Host "[dry-run] out     : $resolvedOut"
    exit 0
}

Write-Host $cmdLine -ForegroundColor Cyan
& $lectoriaExecutable @lectoriaArgs
exit $LASTEXITCODE
