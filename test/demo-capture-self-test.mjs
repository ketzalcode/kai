// Driving a declared screenplay and writing down what really happened —
// `src/creative/lib/screenplay.mjs` and the parked driver in `incubator/`.
//
// Moved out of the command itself (#225). The checks are unchanged.
//
// The driver assertions read the emitted PowerShell as text on purpose: this
// tool never runs the driver, because it clicks and types into a live desktop.
// Reading the script is the only honest way to check what it would do.

import {
  SCREENPLAY_SCHEMA, TAKE_SCHEMA,
  parseScreenplay, parseTake, parseRegion, parseRect, parseTargets, missingTargets,
  estimateDuration, QUIET_CAP,
} from '../src/creative/lib/screenplay.mjs';
// The driver stayed with the parked command; the parsers it used became a
// shipped module. That split is exactly why this suite lives here: it keeps
// running against both halves regardless of which tree each half sits in.
import { emitDriver } from '../incubator/kai-creative/scripts/demo-capture.mjs';


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

function selfTest() {
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
  ok(driver.indexOf('Wait-Quiet 8000') < driver.indexOf('Click-At $cx $cy; Start-Sleep -Milliseconds 500'),
    'the quiet wait happens before the click, so the click cannot land on a page that is still rendering');
  ok(driver.includes("$status = 'unsettled'"), 'a screen that never settles is recorded in the manifest rather than passed off as clean');
  ok(driver.includes("'-draw_mouse','0'"), 'the OS cursor is not captured, because the drawn one replaces it');
  ok(driver.includes('function Move-Pointer'), 'the real pointer is glided so the app produces the hover states a viewer will see');
  ok(driver.includes('GetCursorPos'), 'pointer samples are read from the OS, not assumed from the target rect');
  ok(driver.includes('Set-PointerVisible $false'), 'the pointer is marked hidden while typing, so the arrow does not cover the text');
  ok(!/(?<!function )Click-At\(/.test(driver), 'Click-At is called with space-separated arguments; PowerShell would pass Click-At(a, b) as a single array');
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
    pointer: { samples: [{ t: 1, x: 628, y: 392, visible: true }, { t: 2, x: 0, y: 0, visible: false }], clicks: [1.5] },
  }));
  ok(take.pointer.track[0].x === 0.5 && take.pointer.track[0].y === 0.5,
    'pointer samples are normalised against the capture region, so a plan survives a change of render size');
  ok(take.pointer.track[1].visible === false, 'a hidden pointer sample stays hidden through the manifest');
  ok(parseTake(JSON.stringify({
    schema: TAKE_SCHEMA, take_id: 't1', recording: 'raw.mp4',
    capture: { region: [0, 0, 100, 100] }, steps: [{ id: 'a', start: 1, end: 2 }],
  })).pointer === null, 'a take without pointer telemetry yields no track, rather than one inferred from the rects');
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

process.exit(selfTest() ? 0 : 1);
