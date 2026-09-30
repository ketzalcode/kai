#!/usr/bin/env node
import{createRequire as __cr}from'node:module';const require=__cr(import.meta.url);
import {
  parseScreenplay,
  parseTake
} from "./chunk-YCMFUTW7.mjs";

// src/creative/demo-format.mjs
import { readFileSync, statSync, existsSync } from "node:fs";
import { spawnSync } from "node:child_process";
var PLACEMENTS = {
  "social-teaser": { target: 25, cap: 45, maxBytes: null, muted: true, note: "autoplays muted in a feed" },
  "landing-hero": { target: 40, cap: 60, maxBytes: null, muted: true, note: "often autoplays, usually muted" },
  // Provenance: GitHub attachment limits observed 2026-08. Platform limits
  // change, so this is a portability target for Free repositories rather than a
  // permanent fact about GitHub.
  readme: { target: 60, cap: 90, maxBytes: 10 * 1024 * 1024, muted: false, note: "GitHub Free caps video attachments at 10 MB (observed 2026-08)" },
  walkthrough: { target: 90, cap: 180, maxBytes: 100 * 1024 * 1024, muted: false, note: "GitHub paid plans cap at 100 MB (observed 2026-08)" },
  "deep-walkthrough": { target: 300, cap: 1800, maxBytes: 100 * 1024 * 1024, muted: false, note: "past five minutes by explicit intent" }
};
var WPM = { default: 130, dense: 120 };
var HOLD_RESERVE = 0.15;
var TAIL_WARN = 3;
function fail(message) {
  throw new Error(message);
}
var round = (n) => Math.round(n * 100) / 100;
var mb = (bytes) => `${round(bytes / (1024 * 1024))} MB`;
var pass = (id, detail) => ({ id, status: "pass", detail });
var warn = (id, detail) => ({ id, status: "warn", detail });
var bad = (id, detail) => ({ id, status: "fail", detail });
var skip = (id, needs) => ({ id, status: "skipped", detail: `needs ${needs}` });
var na = (id, why) => ({ id, status: "n/a", detail: why });
function profileFor(screenplay) {
  if (!screenplay.placement) fail(`this screenplay declares no placement, so there is no format to check it against. Add "placement": one of ${Object.keys(PLACEMENTS).join(", ")}`);
  return PLACEMENTS[screenplay.placement];
}
function checkProvenance(screenplay, take) {
  if (!take) return skip("provenance", "a take manifest");
  const authored = new Set(screenplay.steps.map((s) => s.id));
  const recorded = new Set(take.steps.map((s) => s.id));
  const missing = [...authored].filter((id) => !recorded.has(id));
  const extra = [...recorded].filter((id) => !authored.has(id));
  if (missing.length || extra.length) {
    return bad("provenance", `the screenplay and the take are not the same revision${missing.length ? `; never recorded: ${missing.join(", ")}` : ""}${extra.length ? `; recorded but not authored: ${extra.join(", ")}` : ""}. Every number derived from them would describe a demo that does not exist.`);
  }
  const broken = take.steps.filter((s) => s.status !== "ok");
  if (broken.length) {
    return bad("provenance", `the take recorded ${broken.map((s) => `"${s.id}" as ${s.status}`).join(", ")}. A demo built on a step that failed, or on a screen that never settled, is not a demo of the product working.`);
  }
  return pass("provenance", `${take.steps.length} steps, all ok, matching the screenplay`);
}
function checkWordBudget(screenplay, { wpm = WPM.default } = {}) {
  const beats = screenplay.narration ?? [];
  if (beats.length === 0) return na("word-budget", "this demo has no narration, so there is no script to budget");
  const profile = profileFor(screenplay);
  const planned = screenplay.max_seconds ?? profile.target;
  const words = beats.reduce((total, beat) => total + beat.text.trim().split(/\s+/).filter(Boolean).length, 0);
  const speakable = planned * (1 - HOLD_RESERVE);
  const budget = Math.floor(speakable / 60 * wpm);
  const detail = `${words} words against a ${budget}-word guideline for a ${planned}s ${screenplay.placement}, at ${wpm} wpm with ${Math.round(HOLD_RESERVE * 100)}% reserved for action`;
  if (words > budget * 1.15) {
    return bad("word-budget", `${detail}. That is past what a pace estimate can be wrong by: cut about ${words - budget} words, or choose a longer placement. Feasibility is still unknown until synthesis measures it.`);
  }
  if (words > budget) {
    return warn("word-budget", `${detail}. Within the margin a pace estimate can be wrong by, so it may still fit. Feasibility is unknown until synthesis measures it.`);
  }
  return pass("word-budget", `${detail}. Planning forecast only \u2014 feasibility is unknown until synthesis, and a total that fits can still contain a line that does not.`);
}
function checkDuration(screenplay, render) {
  if (!render?.seconds) return skip("duration", "a rendered video (the take is not the final timeline)");
  const profile = profileFor(screenplay);
  const seconds = render.seconds;
  if (screenplay.max_seconds && seconds > screenplay.max_seconds) {
    return bad("duration", `${round(seconds)}s is over the ${screenplay.max_seconds}s this screenplay declares as its own limit`);
  }
  if (seconds > profile.cap) {
    return warn("duration", `${round(seconds)}s is past the ${profile.cap}s editorial cap for ${screenplay.placement}. That cap is a product default, not a platform fact \u2014 accept it deliberately, declare a longer placement, or set max_seconds to make the limit real.`);
  }
  if (seconds > profile.target) {
    return warn("duration", `${round(seconds)}s is over the ${profile.target}s target for ${screenplay.placement}, inside its ${profile.cap}s cap. The evidence supports the trade-off, not this exact number.`);
  }
  return pass("duration", `${round(seconds)}s, inside the ${profile.target}s target for ${screenplay.placement}`);
}
function checkTail(take, render) {
  if (!take || !render?.seconds) return skip("tail", "a take manifest and a rendered video");
  const lastEvent = Math.max(...take.steps.map((s) => s.end));
  const tail = render.seconds - lastEvent;
  if (tail < -0.5) {
    return bad("tail", `the render (${round(render.seconds)}s) is shorter than the recorded action (${round(lastEvent)}s); the end of the demo is missing`);
  }
  if (tail > TAIL_WARN) {
    return warn("tail", `${round(tail)}s of the render happens after the last recorded step (${round(lastEvent)}s of ${round(render.seconds)}s). Trim it, or hold something worth watching.`);
  }
  return pass("tail", `${round(tail)}s after the last recorded step`);
}
function checkArrival(screenplay, take, render) {
  if (!take || !render?.seconds) return skip("arrival", "a take manifest and a rendered video");
  const declared = screenplay.steps.filter((s) => s.intends_to_show);
  if (declared.length === 0) return skip("arrival", "a step marked intends_to_show");
  const measured = new Map(take.steps.map((s) => [s.id, s]));
  const total = render.seconds;
  const limits = { "intended-outcome": 0.25, "primary-action": 0.5 };
  const problems = [];
  for (const step of declared) {
    const m = measured.get(step.id);
    if (!m) {
      problems.push(`"${step.id}" is not in the take`);
      continue;
    }
    const at = m.start / total;
    if (at > limits[step.intends_to_show]) {
      problems.push(`the ${step.intends_to_show} ("${step.id}") does not begin until ${Math.round(at * 100)}% in (${round(m.start)}s of ${round(total)}s); aim for ${limits[step.intends_to_show] * 100}%`);
    }
  }
  return problems.length > 0 ? warn("arrival", `${problems.join("; ")}. Move the setup later, cut it, or trim the tail.`) : pass("arrival", `${declared.map((s) => `${s.intends_to_show} "${s.id}"`).join(", ")} begin early enough. Arrival time only \u2014 that it was readable and unobscured is a review question, not a measurement.`);
}
function checkSize(screenplay, render) {
  const profile = profileFor(screenplay);
  if (!profile.maxBytes) return na("size", `${screenplay.placement} has no published upload limit to check against`);
  if (!render?.bytes) return skip("size", "a rendered video");
  const size = render.bytes;
  if (size > profile.maxBytes) {
    return bad("size", `${mb(size)} is over the ${mb(profile.maxBytes)} limit (${profile.note}). The upload is refused, not merely discouraged.`);
  }
  if (size > profile.maxBytes * 0.8) {
    return warn("size", `${mb(size)} is within ${mb(profile.maxBytes)} but close to it (${profile.note}); a slightly longer take would not fit`);
  }
  return pass("size", `${mb(size)}, inside the ${mb(profile.maxBytes)} limit (${profile.note})`);
}
function checkMutedComprehension(screenplay) {
  const profile = profileFor(screenplay);
  if (!profile.muted) return na("sound-off", `${screenplay.placement} does not autoplay muted`);
  const beats = screenplay.narration ?? [];
  if (screenplay.captions) return pass("sound-off", `captions declared (${typeof screenplay.captions === "string" ? screenplay.captions : "burned in"}), so the demo survives that it ${profile.note}`);
  if (beats.length > 0) {
    return bad("sound-off", `this demo carries ${beats.length} narration beat(s) and no captions, but it ${profile.note}. Most viewers would be shown a silent film of exactly the parts you chose to explain out loud.`);
  }
  return warn("sound-off", `no narration and no captions, and it ${profile.note}. The demo has to carry itself visually \u2014 check that what is on screen tells the story alone.`);
}
function checkFraming(screenplay, render) {
  if (!render?.width) return skip("framing", "a rendered video");
  const { width, height } = render;
  const ratio = width / height;
  if (width % 2 !== 0 || height % 2 !== 0) return bad("framing", `${width}x${height} is odd in a dimension; h264 cannot encode it in yuv420p`);
  if (ratio < 1) {
    return warn("framing", `${width}x${height} is portrait. A vertical demo has to be composed vertically, not cropped from a desktop capture \u2014 the readable region moves, so a crop lands on whitespace or half a control.`);
  }
  return pass("framing", `${width}x${height} (${round(ratio)}:1), landscape. Frame size only \u2014 legibility at embedded size is a review question.`);
}
function probeRender(path, run = defaultProbe) {
  if (!path) return null;
  if (!existsSync(path)) fail(`${path} does not exist`);
  const out = run(path);
  if (!out) return null;
  const [width, height, duration] = out.trim().split(/[\r\n,]+/).map(Number);
  return {
    width: Number.isFinite(width) ? width : null,
    height: Number.isFinite(height) ? height : null,
    seconds: Number.isFinite(duration) ? duration : null,
    bytes: statSync(path).size
  };
}
function defaultProbe(path) {
  const r = spawnSync("ffprobe", ["-v", "error", "-select_streams", "v:0", "-show_entries", "stream=width,height:format=duration", "-of", "csv=p=0", path], { encoding: "utf8" });
  return r.status === 0 ? r.stdout : null;
}
function checkAll(screenplay, { take = null, render = null, wpm = WPM.default } = {}) {
  const checks = [
    checkProvenance(screenplay, take),
    checkWordBudget(screenplay, { wpm }),
    checkDuration(screenplay, render),
    checkTail(take, render),
    checkArrival(screenplay, take, render),
    checkSize(screenplay, render),
    checkMutedComprehension(screenplay),
    checkFraming(screenplay, render)
  ];
  const skipped = checks.filter((c) => c.status === "skipped");
  const failures = checks.filter((c) => c.status === "fail");
  const warnings = checks.filter((c) => c.status === "warn");
  const status = failures.length > 0 ? "FAIL" : skipped.length > 0 ? "INCOMPLETE" : warnings.length > 0 ? "PASS WITH WARNINGS" : "PASS";
  return {
    placement: screenplay.placement,
    checks,
    status,
    ran: checks.length - skipped.length,
    total: checks.length,
    failures: failures.length,
    warnings: warnings.length,
    ok: failures.length === 0
  };
}
function formatReport(result) {
  const mark = { pass: "ok  ", warn: "warn", fail: "FAIL", skipped: "--  ", "n/a": "n/a " };
  const lines = result.checks.map((c) => `  ${mark[c.status]} ${c.id.padEnd(11)} ${c.detail}`);
  const skipped = result.checks.filter((c) => c.status === "skipped");
  lines.push("");
  lines.push(`${result.status} \u2014 placement "${result.placement}", ${result.ran}/${result.total} checks ran${skipped.length ? `, ${skipped.length} could not (${skipped.map((c) => c.id).join(", ")})` : ""}.`);
  if (result.status === "INCOMPLETE") lines.push("Missing evidence is not a pass. Supply the take and the render to check the rest.");
  if (result.status.startsWith("PASS")) lines.push("This says the demo fits its slot. It does not say the demo is good, or that what it points at was readable.");
  return lines.join("\n");
}
function flag(argv, name, fallback = null) {
  const i = argv.indexOf(name);
  return i >= 0 && argv[i + 1] ? argv[i + 1] : fallback;
}
function main(argv) {
  if (argv.includes("--placements")) {
    for (const [name, p] of Object.entries(PLACEMENTS)) {
      console.log(`  ${name.padEnd(17)} target ${String(p.target).padStart(4)}s   cap ${String(p.cap).padStart(4)}s   ${(p.maxBytes ? mb(p.maxBytes) : "-").padStart(9)}   ${p.muted ? "muted" : "     "}  ${p.note}`);
    }
    console.log("\nEvidence-informed product defaults, not scientific optima. Only max_seconds, which you declare, can fail a demo on runtime.");
    return 0;
  }
  const consumed = /* @__PURE__ */ new Set(["--take", "--video", "--wpm"]);
  const screenplayPath = argv.find((a, i) => !a.startsWith("-") && !consumed.has(argv[i - 1]));
  if (!screenplayPath) {
    console.log("demo-format \u2014 does this demo meet the format its placement demands?\n");
    console.log("  demo-format <screenplay.json> [--take take.json] [--video render.mp4] [--wpm 120]");
    console.log("  demo-format --placements");
    return 2;
  }
  const screenplay = parseScreenplay(readFileSync(screenplayPath, "utf8"));
  const takePath = flag(argv, "--take");
  const result = checkAll(screenplay, {
    take: takePath ? parseTake(readFileSync(takePath, "utf8")) : null,
    render: probeRender(flag(argv, "--video")),
    wpm: Number(flag(argv, "--wpm", WPM.default))
  });
  console.log(formatReport(result));
  return result.ok ? 0 : 1;
}
if (process.argv[1]?.endsWith("demo-format.mjs")) {
  try {
    process.exit(main(process.argv.slice(2)));
  } catch (error) {
    console.error(`demo-format: ${error.message}`);
    process.exit(1);
  }
}
export {
  HOLD_RESERVE,
  PLACEMENTS,
  TAIL_WARN,
  WPM,
  checkAll,
  checkArrival,
  checkDuration,
  checkFraming,
  checkMutedComprehension,
  checkProvenance,
  checkSize,
  checkTail,
  checkWordBudget,
  formatReport,
  probeRender,
  profileFor
};
