#!/usr/bin/env node
// demo-capture — the capture half of the demo seam.
//
// Why this exists
// ---------------
// `demo-zoom` renders a recording that already exists. The hard part of a screen
// demo is not the encode: it is driving the application, keeping the environment
// clean, and knowing *when* each action happened. Before this, that was a
// throwaway script with hard-coded pixel clicks and sleeps, and every timing
// downstream was a person remembering roughly when they clicked.
//
// A recorder without telemetry does not fix that. It converts one guess into a
// different format. So this tool does not just record: it executes a declared
// screenplay and writes down, per step, the second it really happened and the
// rectangle it really acted on. Those measurements are what `demo-zoom --compile`
// turns into a focus plan, so nobody types a source second by hand again.
//
// Where the clock comes from
// --------------------------
// ffmpeg is started with `-progress`, which appends `out_time_us` — the true
// position of the recording — to a file about twice a second. The driver polls
// that file until the value changes and notes the wall clock at that instant;
// `recording_zero = wall - out_time`. Measured on Windows the offset is stable to
// well under a tenth of a second, so the median of several samples pins the
// recording clock to roughly one frame. It is measured rather than assumed,
// which is the entire point.
//
// What this deliberately is not
// -----------------------------
// Not a general GUI automation framework. It emits a driver script for one
// platform, in plain text, that a person can read before running it. Hosts it
// cannot drive are refused by name rather than half-supported.

import { readFileSync, writeFileSync, existsSync } from 'node:fs';

const SCREENPLAY_SCHEMA = 'kai.demo-screenplay/v1';
const TAKE_SCHEMA = 'kai.demo-take/v1';
const ACTIONS = new Set(['hold', 'click', 'type', 'key', 'navigate']);
const ANCHORS = new Set(['center', 'leading', 'trailing', 'pointer']);
const MAX_STEPS = 200;

function fail(message) {
  throw new Error(message);
}

function num(value, label, { min = -Infinity, max = Infinity } = {}) {
  const n = Number(value);
  if (!Number.isFinite(n)) fail(`${label} must be a number, got ${JSON.stringify(value)}`);
  if (n < min || n > max) fail(`${label} must be within ${min}..${max}, got ${n}`);
  return n;
}

function str(value, label) {
  if (typeof value !== 'string' || value.trim() === '') fail(`${label} must be a non-empty string`);
  return value;
}

// "0,0 1280x800" or [0, 0, 1280, 800]. A region is four whole pixels; anything
// fractional would make the pixel-to-fraction conversion a lie.
export function parseRegion(value, label = 'capture.region') {
  let parts;
  if (Array.isArray(value)) parts = value;
  else if (typeof value === 'string') {
    const m = /^\s*(-?\d+)\s*,\s*(-?\d+)\s+(\d+)\s*x\s*(\d+)\s*$/.exec(value);
    if (!m) fail(`${label} must look like "0,0 1280x800", got ${JSON.stringify(value)}`);
    parts = m.slice(1);
  } else fail(`${label} must be a string or an array of four numbers`);

  if (parts.length !== 4) fail(`${label} must have four values: x, y, width, height`);
  const [x, y, w, h] = parts.map((p, i) => {
    const n = num(p, `${label}[${i}]`);
    if (!Number.isInteger(n)) fail(`${label}[${i}] must be a whole pixel, got ${n}`);
    return n;
  });
  if (w <= 0 || h <= 0) fail(`${label} must have a positive width and height, got ${w}x${h}`);
  // libx264 cannot encode an odd dimension in yuv420p, and discovering that
  // after a take is a wasted recording.
  if (w % 2 !== 0 || h % 2 !== 0) fail(`${label} must be even in both dimensions for h264, got ${w}x${h}`);
  return { x, y, w, h, text: `${x},${y} ${w}x${h}` };
}

export function parseRect(value, label) {
  if (!Array.isArray(value) || value.length !== 4) fail(`${label} must be [x0, y0, x1, y1]`);
  const [x0, y0, x1, y1] = value.map((p, i) => num(p, `${label}[${i}]`));
  if (x1 <= x0 || y1 <= y0) fail(`${label} must have x1 > x0 and y1 > y0, got ${JSON.stringify(value)}`);
  return { x0, y0, x1, y1 };
}

export function parseScreenplay(text) {
  let raw;
  try {
    raw = JSON.parse(text);
  } catch (error) {
    fail(`the screenplay is not valid JSON: ${error.message}`);
  }
  if (raw.schema !== SCREENPLAY_SCHEMA) {
    fail(`the screenplay must declare "schema": "${SCREENPLAY_SCHEMA}", got ${JSON.stringify(raw.schema ?? null)}`);
  }
  const title = str(raw.title, 'title');
  const capture = raw.capture ?? {};
  const region = parseRegion(capture.region ?? fail('capture.region is required: the driver has to know what rectangle of the screen it is recording'));
  const fps = num(capture.fps ?? 30, 'capture.fps', { min: 1, max: 240 });

  if (!Array.isArray(raw.steps) || raw.steps.length === 0) fail('steps must be a non-empty array');
  if (raw.steps.length > MAX_STEPS) fail(`a screenplay of ${raw.steps.length} steps is past the ${MAX_STEPS} this tool will drive; split the demo`);

  const seen = new Set();
  const steps = raw.steps.map((step, i) => {
    const where = `steps[${i}]`;
    const id = str(step.id, `${where}.id`);
    if (seen.has(id)) fail(`${where}.id "${id}" is used twice; a take manifest is keyed by step id`);
    seen.add(id);

    const action = str(step.action, `${where}.action`);
    if (!ACTIONS.has(action)) fail(`${where}.action must be one of ${[...ACTIONS].join(', ')}, got "${action}"`);

    const out = {
      id,
      action,
      settle: num(step.settle ?? 0, `${where}.settle`, { min: 0, max: 120 }),
      note: typeof step.note === 'string' ? step.note : '',
    };

    if (action === 'hold') out.seconds = num(step.seconds ?? fail(`${where}.seconds is required for a hold`), `${where}.seconds`, { min: 0.1, max: 120 });
    if (action === 'click') out.target = str(step.target, `${where}.target`);
    if (action === 'type') {
      out.text = str(step.text, `${where}.text`);
      out.target = typeof step.target === 'string' && step.target.trim() !== '' ? step.target : null;
      out.clear = step.clear === true;
      // Typing at a readable pace is what makes a demo legible; it is also what
      // makes the typing segment long enough to be worth zooming into.
      out.cps = num(step.cps ?? 18, `${where}.cps`, { min: 1, max: 100 });
    }
    if (action === 'key') out.keys = str(step.keys, `${where}.keys`);
    if (action === 'navigate') out.url = str(step.url, `${where}.url`);

    if (step.emphasis !== undefined && step.emphasis !== null) {
      const e = step.emphasis;
      const anchor = e.anchor ?? 'center';
      if (!ANCHORS.has(anchor)) fail(`${where}.emphasis.anchor must be one of ${[...ANCHORS].join(', ')}, got "${anchor}"`);
      if (anchor !== 'pointer' && action === 'hold') {
        fail(`${where} is a hold with no target, so its emphasis has nothing to anchor to; give the step a target or drop the emphasis`);
      }
      out.emphasis = {
        anchor,
        zoom: num(e.zoom ?? 2, `${where}.emphasis.zoom`, { min: 1, max: 10 }),
        ease: num(e.ease ?? 0.5, `${where}.emphasis.ease`, { min: 0, max: 10 }),
        lead: num(e.lead ?? 0.8, `${where}.emphasis.lead`, { min: 0, max: 30 }),
        hold: num(e.hold ?? 0.8, `${where}.emphasis.hold`, { min: 0, max: 30 }),
        label: typeof e.label === 'string' && e.label.trim() !== '' ? e.label : out.note || id,
      };
    } else out.emphasis = null;

    return out;
  });

  // A screenplay declares intent; it must not smuggle in the numbers only a
  // recording can supply, because a plausible guess renders as cleanly as a
  // measurement and is indistinguishable afterwards.
  for (const [i, step] of raw.steps.entries()) {
    for (const forbidden of ['start', 'end', 'x', 'y', 'timestamp', 'source_second']) {
      if (step[forbidden] !== undefined) {
        fail(`steps[${i}] declares "${forbidden}". A screenplay carries intent, not measurements: source seconds and frame coordinates come from the take manifest, never from direction.`);
      }
    }
  }

  return { schema: SCREENPLAY_SCHEMA, title, capture: { region, fps }, steps };
}

export function parseTargets(text) {
  let raw;
  try {
    raw = JSON.parse(text);
  } catch (error) {
    fail(`the targets file is not valid JSON: ${error.message}`);
  }
  const table = raw.targets ?? raw;
  const out = new Map();
  for (const [name, value] of Object.entries(table)) {
    if (name === 'schema') continue;
    out.set(name, parseRect(Array.isArray(value) ? value : value?.rect, `targets["${name}"]`));
  }
  if (out.size === 0) fail('the targets file resolves no rectangles');
  return out;
}

// Every semantic target a screenplay names has to exist before a take is worth
// starting; discovering a typo halfway through a recording wastes the take.
export function missingTargets(screenplay, targets) {
  const needed = new Set();
  for (const step of screenplay.steps) if (step.target) needed.add(step.target);
  return [...needed].filter((name) => !targets.has(name));
}

// How long the driver will take, so ffmpeg can be given a fixed duration and
// stop itself. Killing a recorder mid-write risks an unplayable file. A type
// step waits for the app to stop repainting before it clicks, and that wait is
// measured at run time, so its worst case has to be budgeted here or the
// recorder stops before the last step happens.
export const QUIET_CAP = 8;

export function estimateDuration(screenplay) {
  let total = 0;
  for (const step of screenplay.steps) {
    if (step.action === 'hold') total += step.seconds;
    if (step.action === 'type') {
      total += step.text.length / step.cps + (step.clear ? 0.7 : 0) + 0.5;
      if (step.target) total += QUIET_CAP;
    }
    if (step.action === 'click' || step.action === 'key') total += 0.3;
    if (step.action === 'navigate') total += 1.0;
    total += step.settle;
  }
  return total;
}

export function parseTake(text) {
  let raw;
  try {
    raw = JSON.parse(text);
  } catch (error) {
    fail(`the take manifest is not valid JSON: ${error.message}`);
  }
  if (raw.schema !== TAKE_SCHEMA) {
    fail(`the take manifest must declare "schema": "${TAKE_SCHEMA}", got ${JSON.stringify(raw.schema ?? null)}`);
  }
  const region = parseRegion(raw.capture?.region ?? fail('capture.region is required in a take manifest'));
  const fps = num(raw.capture?.fps ?? 30, 'capture.fps', { min: 1, max: 240 });
  if (!Array.isArray(raw.steps) || raw.steps.length === 0) fail('a take manifest must record at least one step');

  const steps = raw.steps.map((step, i) => {
    const where = `steps[${i}]`;
    const start = num(step.start, `${where}.start`, { min: 0 });
    const end = num(step.end, `${where}.end`, { min: 0 });
    if (end < start) fail(`${where} ends before it starts`);
    return {
      id: str(step.id, `${where}.id`),
      start,
      end,
      rect: step.rect ? parseRect(step.rect, `${where}.rect`) : null,
      pointer: Array.isArray(step.pointer) ? { x: num(step.pointer[0], `${where}.pointer[0]`), y: num(step.pointer[1], `${where}.pointer[1]`) } : null,
      status: step.status === 'failed' ? 'failed' : step.status === 'unsettled' ? 'unsettled' : 'ok',
    };
  });

  return {
    schema: TAKE_SCHEMA,
    take_id: str(raw.take_id, 'take_id'),
    recording: str(raw.recording, 'recording'),
    screenplay: typeof raw.screenplay === 'string' ? raw.screenplay : null,
    recording_zero_spread: Number.isFinite(Number(raw.recording_zero_spread)) ? Number(raw.recording_zero_spread) : null,
    capture: { region, fps },
    steps,
  };
}

// ------------------------------------------------------------------- driver

// PowerShell, because that is the host this was measured on. The driver is
// emitted as readable text rather than executed from here so a person can see
// every click and keystroke before anything types into their live browser.
export function emitDriver(screenplay, targets, options) {
  const { recording, take, progress = 'demo-progress.txt', pad = 4 } = options;
  const duration = Math.ceil(estimateDuration(screenplay) + pad);
  const payload = {
    title: screenplay.title,
    region: screenplay.capture.region,
    fps: screenplay.capture.fps,
    recording,
    take,
    progress,
    duration,
    steps: screenplay.steps.map((step) => ({
      ...step,
      rect: step.target ? targets.get(step.target) : null,
    })),
  };
  const json = JSON.stringify(payload);
  if (json.includes('\n') || json.includes("'@")) fail('a step contains text this driver cannot safely embed');

  return String.raw`# Generated by demo-capture. Review before running: it clicks and types into
# whatever is on screen. Nothing here is executed until you run it yourself.
$ErrorActionPreference = 'Stop'

$plan = @'
${json}
'@ | ConvertFrom-Json

$ff = (Get-Command ffmpeg -ErrorAction SilentlyContinue)
if (-not $ff) { throw 'ffmpeg is not on PATH' }
$ff = $ff.Source

Add-Type @"
using System;using System.Runtime.InteropServices;
public class DemoUI {
 [DllImport("user32.dll")] public static extern bool SetCursorPos(int x,int y);
 [DllImport("user32.dll")] public static extern void mouse_event(uint f,uint x,uint y,uint d,int e);
 public static void Click(int x,int y){
   SetCursorPos(x,y); System.Threading.Thread.Sleep(120);
   mouse_event(0x0002,0,0,0,0); System.Threading.Thread.Sleep(60); mouse_event(0x0004,0,0,0,0);
 }
}
"@ -ErrorAction SilentlyContinue

$sh = New-Object -ComObject WScript.Shell
$rx = [int]$plan.region.x; $ry = [int]$plan.region.y
$rw = [int]$plan.region.w; $rh = [int]$plan.region.h

function Send-Literal($text) {
  # SendKeys reads these as commands; a demo that types "(" must not open a group.
  $escaped = [regex]::Replace($text, '[+^%~(){}\[\]]', { param($m) '{' + $m.Value + '}' })
  $sh.SendKeys($escaped)
}

# ---------------------------------------------------------------- preflight
# A take that starts from a dirty screen or a black capture is wasted, and the
# waste is only discovered after the recording. So it is checked first.
$probe = [System.IO.Path]::GetTempFileName() + '.png'
& $ff -y -loglevel error -f gdigrab -video_size "$($rw)x$($rh)" -offset_x $rx -offset_y $ry -i desktop -frames:v 1 $probe
if (-not (Test-Path $probe)) { throw 'preflight: the capture region produced no frame' }

$stats = 'kai-preflight-stats.txt'
Remove-Item $stats -ErrorAction SilentlyContinue
# metadata=print writes at info level, which -v error would swallow, so the
# statistic goes to a file. The filename is relative and free of ':' and '\'
# because ffmpeg's filter parser treats both as syntax.
& $ff -v error -i $probe -vf "signalstats,metadata=print:file=$stats" -f null -
$yavg = -1.0
if (Test-Path $stats) {
  $text = (Get-Content $stats -Raw)
  if ($text -match 'YAVG=([0-9.]+)') { $yavg = [double]$matches[1] }
}
Remove-Item $stats -ErrorAction SilentlyContinue
if ($yavg -lt 0) { throw "preflight: could not read a brightness statistic from the captured frame, so it cannot be checked" }
if ($yavg -lt 1.0) {
  throw "preflight: the captured frame is uniformly black (YAVG=$yavg). Chromium composites on the GPU, so gdigrab sees nothing; relaunch the browser with --disable-gpu and capture a desktop region rather than a window title."
}
Write-Host "preflight: frame is live (YAVG=$([math]::Round($yavg,1)))"
Remove-Item $probe -ErrorAction SilentlyContinue

# ------------------------------------------------------------------ record
Remove-Item $plan.progress -ErrorAction SilentlyContinue
$args = @(
  '-y','-loglevel','error',
  '-f','gdigrab','-framerate',[string]$plan.fps,
  '-video_size',"$($rw)x$($rh)",'-offset_x',[string]$rx,'-offset_y',[string]$ry,'-i','desktop',
  '-t',[string]$plan.duration,
  '-progress',$plan.progress,
  '-c:v','libx264','-preset','ultrafast','-pix_fmt','yuv420p',
  $plan.recording
)
$rec = Start-Process -FilePath $ff -ArgumentList $args -WindowStyle Hidden -PassThru

# Calibrate the recording clock. ffmpeg appends out_time_us about twice a
# second; catching the instant it changes pins wall time to the recording to
# about a frame. The median of several samples absorbs the jitter.
$sw = [Diagnostics.Stopwatch]::StartNew()
$offsets = @(); $last = $null
while ($offsets.Count -lt 4 -and $sw.Elapsed.TotalSeconds -lt 15) {
  if (Test-Path $plan.progress) {
    $m = Select-String -Path $plan.progress -Pattern '^out_time_us=(\d+)' -AllMatches | Select-Object -Last 1
    if ($m) {
      $v = [long]$m.Matches[0].Groups[1].Value
      if ($v -ne $last) {
        if ($null -ne $last) { $offsets += ($sw.Elapsed.TotalSeconds - ($v / 1e6)) }
        $last = $v
      }
    }
  }
  Start-Sleep -Milliseconds 20
}
if ($offsets.Count -lt 2) { $rec.Kill(); throw 'the recorder never reported progress; the take clock cannot be measured' }
$sorted = $offsets | Sort-Object
$zero = $sorted[[int]([math]::Floor($sorted.Count / 2))]
$spread = [math]::Round(($sorted[-1] - $sorted[0]), 3)
Write-Host "recording clock pinned: offset $([math]::Round($zero,3))s, spread $($spread)s"

function Now-Source { return [math]::Round(($sw.Elapsed.TotalSeconds - $zero), 3) }

function Grab-Frame([string]$path) {
  & $ff -y -loglevel error -f gdigrab -video_size "$($rw)x$($rh)" -offset_x $rx -offset_y $ry -i desktop -frames:v 1 $path
  return (Test-Path $path)
}

# How long an app takes to render is not something a screenplay can know, so it
# is measured instead of authored. Two captures a quarter second apart are
# compared; when they are near-identical the app has stopped repainting. A
# blinking caret moves far too few pixels to hold the score down, while a
# spinner or a loading page keeps it low. Returns the seconds actually waited,
# or -1 if the screen never settled, so the take manifest can record it.
function Wait-Quiet([int]$capMs) {
  $a = 'kai-quiet-a.png'; $b = 'kai-quiet-b.png'; $s = 'kai-quiet-psnr.txt'
  $t = [Diagnostics.Stopwatch]::StartNew()
  if (-not (Grab-Frame $a)) { return -1 }
  while ($t.Elapsed.TotalMilliseconds -lt $capMs) {
    Start-Sleep -Milliseconds 250
    if (-not (Grab-Frame $b)) { return -1 }
    Remove-Item $s -ErrorAction SilentlyContinue
    & $ff -v error -i $a -i $b -lavfi "psnr=stats_file=$s" -f null -
    $score = 0.0
    if (Test-Path $s) {
      $line = (Get-Content $s -Raw)
      if ($line -match 'psnr_avg:(inf|[0-9.]+)') {
        $score = if ($matches[1] -eq 'inf') { 999.0 } else { [double]$matches[1] }
      }
    }
    if ($score -gt 40.0) {
      Remove-Item $a,$b,$s -ErrorAction SilentlyContinue
      return [math]::Round($t.Elapsed.TotalSeconds, 3)
    }
    Move-Item $b $a -Force
  }
  Remove-Item $a,$b,$s -ErrorAction SilentlyContinue
  return -1
}

# ----------------------------------------------------------------- execute
$log = @()
foreach ($step in $plan.steps) {
  $t0 = Now-Source
  $status = 'ok'
  $quiet = $null
  switch ($step.action) {
    'hold'     { Start-Sleep -Milliseconds ([int]($step.seconds * 1000)) }
    'navigate' { [DemoUI]::Click(($rx + [int]($rw / 2)), ($ry + 60)); Start-Sleep -Milliseconds 400; $sh.SendKeys('^a'); Start-Sleep -Milliseconds 150; Send-Literal $step.url; $sh.SendKeys('{ENTER}') }
    'key'      { $sh.SendKeys($step.keys) }
    'click'    {
      if (-not $step.rect) { $status = 'failed' }
      else {
        $cx = $rx + [int](($step.rect.x0 + $step.rect.x1) / 2)
        $cy = $ry + [int](($step.rect.y0 + $step.rect.y1) / 2)
        [DemoUI]::Click($cx, $cy)
      }
    }
    'type'     {
      if ($step.rect) {
        $cx = $rx + [int](($step.rect.x0 + $step.rect.x1) / 2)
        $cy = $ry + [int](($step.rect.y0 + $step.rect.y1) / 2)
        # Wait for the app to stop repainting before clicking, or the click
        # lands on whatever was on screen a moment ago rather than the field.
        $quiet = Wait-Quiet 8000
        if ($quiet -lt 0) { $status = 'unsettled' }
        [DemoUI]::Click($cx, $cy); Start-Sleep -Milliseconds 500
      }
      if ($step.clear) {
        # Web apps restore saved drafts, so a field is not empty just because
        # this take has not typed into it yet.
        $sh.SendKeys('^a'); Start-Sleep -Milliseconds 200; $sh.SendKeys('{DEL}'); Start-Sleep -Milliseconds 400
      }
      $t0 = Now-Source
      $delay = [int](1000 / $step.cps)
      foreach ($ch in $step.text.ToCharArray()) {
        Send-Literal ([string]$ch)
        Start-Sleep -Milliseconds $delay
      }
    }
  }
  $t1 = Now-Source
  if ($step.settle -gt 0) { Start-Sleep -Milliseconds ([int]($step.settle * 1000)) }

  $entry = [ordered]@{ id = $step.id; start = $t0; end = $t1; status = $status }
  if ($null -ne $quiet -and $quiet -ge 0) { $entry.quiet_wait = $quiet }
  if ($step.rect) { $entry.rect = @($step.rect.x0, $step.rect.y0, $step.rect.x1, $step.rect.y1) }
  $log += [pscustomobject]$entry
  Write-Host ("  {0,-8} {1,6:N2}s -> {2,6:N2}s  {3}  {4}" -f $step.id, $t0, $t1, $step.action, $status)
}

$rec.WaitForExit()
if (-not (Test-Path $plan.recording)) { throw 'the recorder produced no file' }

$manifest = [ordered]@{
  schema  = 'kai.demo-take/v1'
  take_id = (Get-Date).ToUniversalTime().ToString('yyyy-MM-ddTHH-mm-ssZ')
  screenplay = $plan.title
  recording = $plan.recording
  recording_zero_spread = $spread
  capture = [ordered]@{ region = @($rx, $ry, $rw, $rh); fps = $plan.fps }
  steps = $log
}
$manifest | ConvertTo-Json -Depth 6 | Set-Content -Path $plan.take -Encoding ascii
Write-Host "wrote $($plan.take) and $($plan.recording)"
`;
}

// ---------------------------------------------------------------- self-test

let checks = 0;
let failures = 0;

function ok(condition, label) {
  checks += 1;
  if (condition) console.log(`  ok ${label}`);
  else { failures += 1; console.log(`  FAIL ${label}`); }
}

function rejects(fn, fragment, label) {
  checks += 1;
  try {
    fn();
    failures += 1;
    console.log(`  FAIL ${label} (nothing was refused)`);
  } catch (error) {
    if (String(error.message).includes(fragment)) console.log(`  ok ${label}`);
    else { failures += 1; console.log(`  FAIL ${label} (said: ${error.message})`); }
  }
}

const VALID = JSON.stringify({
  schema: SCREENPLAY_SCHEMA,
  title: 'a demo',
  capture: { region: '0,0 1256x784', fps: 30 },
  steps: [
    { id: 'st-1', action: 'hold', seconds: 2, note: 'establish' },
    { id: 'st-2', action: 'click', target: 'issues-tab', settle: 4, emphasis: { anchor: 'center', zoom: 2 } },
    { id: 'st-3', action: 'type', target: 'title-input', text: 'hello', clear: true, emphasis: { anchor: 'leading', zoom: 2.2 } },
  ],
});

export function selfTest() {
  console.log('demo-capture self-test');
  const plan = parseScreenplay(VALID);
  ok(plan.steps.length === 3, 'a valid screenplay parses');
  ok(plan.capture.region.w === 1256 && plan.capture.region.h === 784, 'a region string resolves to whole pixels');
  ok(plan.steps[2].cps === 18, 'typing gets a default pace rather than instant text');
  ok(plan.steps[1].emphasis.lead > 0, 'emphasis leads the action, so the zoom has arrived before the thing happens');

  rejects(() => parseScreenplay('{'), 'not valid JSON', 'malformed JSON is refused');
  rejects(() => parseScreenplay(JSON.stringify({ schema: 'other', title: 'x' })), 'must declare', 'a foreign schema is refused');
  rejects(() => parseRegion('0,0 1255x784'), 'even in both dimensions', 'an odd capture dimension is refused before the take, not after');
  rejects(() => parseRegion('nonsense'), 'must look like', 'an unparseable region is refused');

  // The reason this tool exists: direction must not carry measurements.
  rejects(() => parseScreenplay(JSON.stringify({
    schema: SCREENPLAY_SCHEMA, title: 'x', capture: { region: '0,0 100x100' },
    steps: [{ id: 's', action: 'click', target: 't', start: 4.2 }],
  })), 'carries intent, not measurements', 'a screenplay that declares a source second is refused');
  rejects(() => parseScreenplay(JSON.stringify({
    schema: SCREENPLAY_SCHEMA, title: 'x', capture: { region: '0,0 100x100' },
    steps: [{ id: 's', action: 'click', target: 't', x: 0.4 }],
  })), 'carries intent, not measurements', 'a screenplay that declares a frame coordinate is refused');

  rejects(() => parseScreenplay(JSON.stringify({
    schema: SCREENPLAY_SCHEMA, title: 'x', capture: { region: '0,0 100x100' },
    steps: [{ id: 'a', action: 'hold', seconds: 1 }, { id: 'a', action: 'hold', seconds: 1 }],
  })), 'is used twice', 'a duplicate step id is refused, since a take is keyed by it');
  rejects(() => parseScreenplay(JSON.stringify({
    schema: SCREENPLAY_SCHEMA, title: 'x', capture: { region: '0,0 100x100' },
    steps: [{ id: 'a', action: 'hold', seconds: 1, emphasis: { zoom: 2 } }],
  })), 'nothing to anchor to', 'emphasis on a targetless hold is refused rather than silently centred');

  const targets = parseTargets(JSON.stringify({ 'issues-tab': [80, 136, 150, 162], 'title-input': [78, 254, 940, 282] }));
  ok(targets.size === 2, 'a targets file resolves rectangles');
  ok(missingTargets(plan, targets).length === 0, 'a screenplay whose targets all resolve is ready to record');
  const short = parseTargets(JSON.stringify({ 'issues-tab': [80, 136, 150, 162] }));
  ok(missingTargets(plan, short)[0] === 'title-input', 'an unresolved target is named before the take, not after');
  rejects(() => parseRect([10, 10, 5, 20], 'r'), 'x1 > x0', 'an inside-out rectangle is refused');

  const seconds = estimateDuration(plan);
  ok(seconds > 14 && seconds < 20, `a take duration is estimated from the screenplay, quiet wait included (${seconds.toFixed(1)}s)`);

  const driver = emitDriver(plan, targets, { recording: 'raw.mp4', take: 'demo_take.json' });
  ok(driver.includes('kai.demo-take/v1'), 'the driver writes a take manifest');
  ok(driver.includes('out_time_us'), 'the driver measures the recording clock rather than assuming ffmpeg started instantly');
  ok(driver.includes('YAVG'), 'the driver refuses a black capture before recording');
  ok(driver.includes('metadata=print:file='), 'the brightness statistic is written to a file, because metadata=print logs at info level and would be swallowed by -v error');
  ok(!/metadata=print:file=\$?[A-Za-z]:/.test(driver) && driver.includes("$stats = 'kai-preflight-stats.txt'"),
    "the statistics filename is relative, because ffmpeg's filter parser treats ':' and '\\' as syntax");
  ok(driver.includes('could not read a brightness statistic'), 'an unreadable brightness statistic is distinguished from a black frame');
  ok(driver.includes("SendKeys('^a')"), 'the driver clears a restored draft before typing');
  ok(driver.includes('function Wait-Quiet'), 'the driver waits for the app to stop repainting rather than trusting an authored settle');
  ok(driver.indexOf('Wait-Quiet 8000') < driver.indexOf('[DemoUI]::Click($cx, $cy); Start-Sleep -Milliseconds 500'),
    'the quiet wait happens before the click, so the click cannot land on a page that is still rendering');
  ok(driver.includes("$status = 'unsettled'"), 'a screen that never settles is recorded in the manifest rather than passed off as clean');
  ok(!driver.includes('Start-Sleep -Milliseconds 4000'), 'step timing is measured, not hard-coded into the driver');

  const typeOnly = parseScreenplay(JSON.stringify({
    schema: SCREENPLAY_SCHEMA, title: 't', capture: { region: '0,0 100x100' },
    steps: [{ id: 'a', action: 'type', target: 'f', text: 'abcdefgh', cps: 16, settle: 0 }],
  }));
  ok(estimateDuration(typeOnly) > QUIET_CAP,
    'the estimated duration budgets the measured quiet wait, so the recorder cannot stop before the last step');
  ok(parseTake(JSON.stringify({
    schema: TAKE_SCHEMA, take_id: 't', recording: 'r.mp4', capture: { region: [0, 0, 10, 10] },
    steps: [{ id: 'a', start: 1, end: 2, status: 'unsettled' }],
  })).steps[0].status === 'unsettled', 'an unsettled status survives the manifest round trip');

  const take = parseTake(JSON.stringify({
    schema: TAKE_SCHEMA, take_id: 't1', recording: 'raw.mp4',
    capture: { region: [0, 0, 1256, 784], fps: 30 },
    steps: [{ id: 'st-2', start: 4.02, end: 4.33, rect: [80, 136, 150, 162] }],
  }));
  ok(take.steps[0].start === 4.02, 'a take manifest carries measured seconds');
  ok(take.steps[0].rect.x0 === 80, 'a take manifest carries the rectangle actually acted on');
  rejects(() => parseTake(JSON.stringify({
    schema: TAKE_SCHEMA, take_id: 't', recording: 'r.mp4',
    capture: { region: [0, 0, 10, 10] }, steps: [{ id: 'a', start: 5, end: 2 }],
  })), 'ends before it starts', 'a take step that ends before it starts is refused');

  console.log(`\ndemo-capture self-test: ${checks - failures}/${checks} checks passed`);
  return failures === 0;
}

// --------------------------------------------------------------------- cli

function usage() {
  return `demo-capture — drive a declared screenplay, record it, and write down when things really happened.

  node scripts/demo-capture.mjs --screenplay demo_screenplay.json --check
  node scripts/demo-capture.mjs --screenplay demo_screenplay.json --targets demo_targets.json \\
      --emit-driver run-take.ps1 [--recording raw.mp4] [--take demo_take.json]
  node scripts/demo-capture.mjs --example
  node scripts/demo-capture.mjs --self-test

The driver is written out, never run from here: it clicks and types into a live
desktop, and you should read it first. Windows/PowerShell is the only host it
emits today.

Then: node scripts/demo-zoom.mjs --compile demo_screenplay.json demo_take.json --out plan.json`;
}

const EXAMPLE = `{
  "schema": "${SCREENPLAY_SCHEMA}",
  "title": "Create an issue on GitHub",
  "capture": { "region": "0,0 1256x784", "fps": 30 },
  "steps": [
    { "id": "st-1", "action": "hold", "seconds": 2, "note": "establish the repo page" },
    { "id": "st-2", "action": "click", "target": "issues-tab", "settle": 3.5,
      "emphasis": { "anchor": "center", "zoom": 2.0, "lead": 1.4, "hold": 1.0,
                    "label": "the Issues tab being clicked" } },
    { "id": "st-3", "action": "click", "target": "new-issue-button", "settle": 3.5,
      "emphasis": { "anchor": "center", "zoom": 2.0, "lead": 1.4, "hold": 0.6,
                    "label": "the New issue button" } },
    { "id": "st-4", "action": "type", "target": "title-input", "clear": true,
      "text": "Record product demos from a focus plan",
      "emphasis": { "anchor": "leading", "zoom": 2.2, "lead": 0.8, "hold": 1.0,
                    "label": "the title being typed" } },
    { "id": "st-5", "action": "type", "target": "body-input", "clear": true,
      "text": "Captured with demo-capture, zoomed with demo-zoom.", "settle": 3,
      "emphasis": { "anchor": "leading", "zoom": 2.0, "lead": 0.8, "hold": 1.5,
                    "label": "the description being typed" } }
  ]
}
`;

function main(argv) {
  const flag = (name) => argv.includes(name);
  const value = (name) => {
    const i = argv.indexOf(name);
    return i === -1 || i === argv.length - 1 ? null : argv[i + 1];
  };

  if (argv.length === 0 || flag('--help') || flag('-h')) { console.log(usage()); return 0; }
  if (flag('--example')) { process.stdout.write(EXAMPLE); return 0; }
  if (flag('--self-test')) return selfTest() ? 0 : 1;

  const screenplayPath = value('--screenplay');
  if (!screenplayPath) { console.error('demo-capture: --screenplay is required'); return 1; }
  if (!existsSync(screenplayPath)) { console.error(`demo-capture: screenplay not found: ${screenplayPath}`); return 1; }

  let screenplay;
  try {
    screenplay = parseScreenplay(readFileSync(screenplayPath, 'utf8'));
  } catch (error) {
    console.error(`demo-capture: ${error.message}`);
    return 1;
  }

  const targetsPath = value('--targets');
  let targets = new Map();
  if (targetsPath) {
    if (!existsSync(targetsPath)) { console.error(`demo-capture: targets not found: ${targetsPath}`); return 1; }
    try {
      targets = parseTargets(readFileSync(targetsPath, 'utf8'));
    } catch (error) {
      console.error(`demo-capture: ${error.message}`);
      return 1;
    }
  }

  const missing = missingTargets(screenplay, targets);

  if (flag('--check') || !flag('--emit-driver')) {
    console.log(`screenplay ${screenplay.title}`);
    console.log(`capture ${screenplay.capture.region.text} @ ${screenplay.capture.fps}fps`);
    console.log(`${screenplay.steps.length} step(s), about ${estimateDuration(screenplay).toFixed(1)}s`);
    const emphasised = screenplay.steps.filter((s) => s.emphasis);
    console.log(`${emphasised.length} step(s) marked for emphasis`);
    for (const step of screenplay.steps) {
      const e = step.emphasis ? `  zoom ${step.emphasis.zoom}x ${step.emphasis.anchor}` : '';
      console.log(`  ${step.id.padEnd(8)} ${step.action.padEnd(9)} ${(step.target ?? '').padEnd(18)}${e}`);
    }
    if (missing.length > 0) {
      console.log('');
      console.log(`${missing.length} target(s) have no rectangle yet: ${missing.join(', ')}`);
      console.log('Resolve them against a preflight frame before recording; the driver cannot guess where they are.');
      return flag('--check') ? 1 : 0;
    }
    if (flag('--check')) console.log('\nready to record');
    return 0;
  }

  if (missing.length > 0) {
    console.error(`demo-capture: cannot emit a driver, ${missing.length} target(s) unresolved: ${missing.join(', ')}`);
    return 1;
  }

  const out = value('--emit-driver');
  let driver;
  try {
    driver = emitDriver(screenplay, targets, {
      recording: value('--recording') ?? 'raw.mp4',
      take: value('--take') ?? 'demo_take.json',
      progress: value('--progress') ?? 'demo-progress.txt',
    });
  } catch (error) {
    console.error(`demo-capture: ${error.message}`);
    return 1;
  }
  writeFileSync(out, driver, 'utf8');
  console.log(`wrote ${out}`);
  console.log('Read it, then run it. It clicks and types into whatever is on screen.');
  return 0;
}

// Only act when run directly. `demo-zoom --compile` imports the screenplay and
// take parsers from here, and an import must not drive anyone's desktop.
const invoked = process.argv[1] && process.argv[1].endsWith('demo-capture.mjs');
if (invoked) process.exitCode = main(process.argv.slice(2));
