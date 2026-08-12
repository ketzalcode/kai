---
name: create-product-demo
description: Plan, record and check a product demo that fits where it is going — a README, a landing hero, a social teaser or a full walkthrough. Use when asked to make a demo video, a product video, a feature announcement clip, or to check whether an existing demo is the right length, size or shape for its destination.
tools: [bash, view, edit, create, grep, glob]
requires_tools: [bash]
user-invocable: true
---

# Create a product demo

A demo is not a recording. A recording is what the screen did; a demo is a claim
about a product, aimed at somebody in a particular place with a particular amount
of patience. This skill is about the second thing — deciding the shape before you
record, and checking the result against that decision afterwards.

The mechanism lives elsewhere and is unchanged:

| Concern | Owner |
| --- | --- |
| What to show, in what order, why | `creative-video-director` agent |
| Recording it and measuring what happened | `demo-capture` skill |
| Zoom, focus, cursor | `demo-zoom` skill |
| Placing narration against measured time | `demo-narrate` skill |
| **Does the result fit its destination** | **this skill, via `scripts/demo-format.mjs`** |

## Declare the placement first

`placement` is the one field that turns a recording into a demo, because every
other constraint follows from it. Put it in the screenplay before you record —
deciding afterwards means discovering the constraint after it is expensive.

| placement | target | cap | upload limit | autoplays muted |
| --- | --- | --- | --- | --- |
| `social-teaser` | 25s | 45s | — | yes |
| `landing-hero` | 40s | 60s | — | yes |
| `readme` | 60s | 90s | 10 MB (GitHub Free) | no |
| `walkthrough` | 90s | 180s | 100 MB (GitHub paid) | no |
| `deep-walkthrough` | 300s | 1800s | 100 MB | no |

`node scripts/demo-format.mjs --placements` prints the same table from the code,
so it cannot drift from this page.

### Where these numbers come from, and where they do not

**The widely repeated "a demo must be under 60 seconds" is not supported by the
evidence, and this skill does not enforce it.** Wistia's State of Video — 13
million videos, 79 million hours of viewing — puts the material engagement drop
after roughly *five minutes*, and its software-and-technology cut performs best
between 3 and 30 minutes. The sub-minute advice comes from completion
benchmarks: around 65% of viewers finish a business video under a minute. That is
an argument about **teasers**, where the goal is that somebody sees the whole
thing in a feed. It is not an argument that teaching somebody a task in four
minutes is worse than failing to teach them in fifty seconds.

So the short targets above are a choice about attention in a specific slot, not a
finding that longer is worse. They are **evidence-informed product defaults**.

The consequence is a rule in the checker: **no default in that table can fail a
demo.** Crossing a target or a cap is a warning that names its own provenance.
Only two things fail on length and size:

- `max_seconds`, when the screenplay declares one — that is a promise somebody
  made, not a default this tool chose.
- The byte limits, which are not advice. An over-limit upload is **refused**.
  Observed 2026-08; platform limits change, so re-check before relying on one.

If you want a hard length limit, declare `max_seconds`. Do not expect the
placement to give you one.

## The workflow

1. **Decide the placement**, then write the screenplay with the director. Mark
   the payoff with `intends_to_show` on the steps that matter:
   - `primary-action` — the thing the user does.
   - `intended-outcome` — the result they came to see.
2. **Check the plan before recording.** `demo-format.mjs plan.json` runs the
   checks that need no footage; the rest report as skipped. The word budget is
   worth having here because it is the cheapest possible moment to discover the
   script does not fit.
3. **Record** (`demo-capture`), **focus** (`demo-zoom`), **narrate**
   (`demo-narrate`) as usual.
4. **Check the finished file**, which is the only run that establishes anything:

   ```
   node scripts/demo-format.mjs plan.json --take take.json --video final.mp4
   ```

## What the checks establish, and what they do not

Being precise about this is the point of the tool. Each check states its own
scope in its output, so a report cannot be quoted as more than it is.

- **provenance** — that the screenplay, the take and the render describe the same
  demo, and that no step failed or was left unsettled. Without it the tool will
  cheerfully combine three revisions and report confidently on a demo that never
  existed.
- **word-budget** — a **forecast**, made before you pay for synthesis. Words at
  an assumed pace hide two things: how a particular voice reads code, command
  names, URLs and authored pauses, and whether any *individual* line fits its own
  span. A total that fits can still contain a line that cannot. `demo-narrate`
  answers that with measured durations, and that answer is the one that decides.
- **duration** — measured **from the rendered file**, never from the take. See
  below; this distinction is load-bearing.
- **tail** — recorded dead air after the last thing that happened.
- **arrival** — when a step marked `intends_to_show` *began*, as a fraction of
  the finished runtime. This is a weaker claim than it looks: it does **not**
  establish that the result was readable, unobscured, or held long enough to
  register, and it cannot know whether the marked step is the outcome you
  actually promised. Arriving late is a finding. Arriving early is not a
  guarantee.
- **size** — a hard limit, not a preference.
- **sound-off** — where a video autoplays muted, narration is a second channel,
  not the only one. A narrated teaser with no captions **fails**: most viewers
  would be shown a silent film of exactly the parts you chose to explain out
  loud.
- **framing** — that the frame is the right shape and encodable. Metadata proves
  the frame is big; it says nothing about whether the text in it survives being
  embedded at a fraction of that size.

Nothing here has an opinion on whether the demo is *interesting*.

## Two things this skill learned the expensive way

**The take is not the final timeline.** The first version of the checker measured
runtime from the take manifest. On kai's own shipped demo the last measured step
ends at 37.2s and the video is 50s — thirteen seconds of tail the check could not
see. It would have reported a 50-second demo as a 37-second one, and passed it.
Anything about how long a viewer watches is measured from the render, with
ffprobe. A take alone cannot answer it, and the checker says so rather than
guessing.

**A checker that silently skips is worse than no checker**, because it prints a
clean pass over a demo it barely looked at. So every check declares what it
needs, and there are four verdicts, not three:

| verdict | meaning |
| --- | --- |
| `PASS` | every check ran and found nothing |
| `PASS WITH WARNINGS` | every check ran; some findings are editorial |
| `INCOMPLETE` | a check could not run — **this is not a pass** |
| `FAIL` | something is broken, refused, or unwatchable where it is going |

`skipped` (input missing) is distinct from `n/a` (nothing to check — a silent
demo has no script to budget). Only the first makes a run `INCOMPLETE`.

A demo that never marks its payoff stays `INCOMPLETE` even with every file
present. That is deliberate: the most important editorial property of a demo is
unanswerable until somebody says what it was for.

## Anti-patterns

- **Recording first and choosing the placement afterwards.** The placement
  decides what you record. Reversing it means discovering the constraint at the
  most expensive moment.
- **Reading runtime off the take.** See above. Use the render.
- **Treating a target as a limit.** They are defaults. If the length genuinely
  matters, declare `max_seconds` and make it real.
- **Quoting `PASS` as "the demo is good."** It says the demo fits its slot. The
  report says this itself, in those words, every time.
- **Shipping a narrated teaser without captions** because captions are tracked
  somewhere else. Where autoplay is muted, that is not a follow-up, it is the
  demo not working.
- **Cropping a desktop capture to portrait.** A vertical demo has to be composed
  vertically — the readable region moves, so a crop lands on whitespace or half a
  control.
