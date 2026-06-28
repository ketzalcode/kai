---
name: doc-review-rigor
description: "The shared evaluation method every review-* dimension skill and the workflow-doc-review agent inherit from. Surface-agnostic discipline for reviewing a document well: the posture (partner before critic; understand the goal first; verify before asserting; don't front-run the doc), the lens (separate fact from the author's inference from what's actually been decided), and the method (extract load-bearing claims, ground each against the codebase / cited sources / reality, classify with the six-class taxonomy, test the author's own assurances, clear the confidence bar or cut, run the two value filters). NOT a standalone trigger skill — it is invoked from inside a review-* dimension skill or the workflow-doc-review orchestrator. Never auto-posts; the operator decides what ships."
tools: [bash, view, grep, glob, web_search, web_fetch]
---

# Doc Review Rigor

This skill is the **shared method** — the evaluation discipline that
every `review-*` dimension skill and the `workflow-doc-review`
orchestrator inherit. It owns *how* you review a load-bearing claim
well. The dimension skills own *which* claims to hunt (the lens); this
skill owns the standard every finding must clear before it ships.

It is **not** a standalone trigger skill. You don't invoke it directly.
A dimension skill (`review-rationale`, `review-risks-scope`, …) or the
orchestrator pulls it in to stay honest.

## Core stance

A document is an **argument that something should happen.** A review
tests whether the argument holds — not whether you'd have written it
differently. Be picky about the **load-bearing** parts (the claims the
decision rests on) and deliberately permissive about everything else
(phrasing, structure, tone, taste). Polishing prose that doesn't change
the decision is wasted review.

**Partner before critic.** Understand what the author is trying to
achieve before poking holes in how they argued it. Read the *whole* doc
(or the whole relevant section) before commenting on any part. A
"this is wrong" that's actually you not having read the code is worse
than no review at all.

## The lens: three things, kept separate

For every claim, decide which of these it is — and never let one pass
as another:

- **Fact** — verifiable against the code, a cited source, or the data.
- **The author's inference** — a reasonable read, but a leap the
  evidence doesn't fully carry.
- **What's actually been decided** — a constraint or commitment that
  already exists, vs. something the doc is asserting as settled when
  it isn't.

Most weak arguments collapse one of these into another: an inference
dressed as a fact, or a hope dressed as a decision.

## The method

1. **Understand the goal first.** Before any finding, state in one line
   what the doc is trying to get the reader to decide or do. A review
   that misreads the intent is noise. Confirm with the operator if
   it's ambiguous.
2. **Extract the load-bearing claims** *for your lens.* A claim is
   load-bearing if the decision changes when it's false. Ignore the
   decorative ones.
3. **Ground each claim.** Check it against the codebase, the cited
   sources, and the data. For external claims (a vendor capability, a
   benchmark, a deprecation, a roadmap commitment), verify with web
   research and cite the URL. No grounding, no finding.
4. **Test the author's own assurances.** When the doc says "this is
   safe / cheap / fast / backward-compatible / already handled," that
   is exactly the claim to check hardest. Authors under-scrutinize
   their own reassurances.
5. **Classify** with the six-class taxonomy below.
6. **Run the two value filters** before any finding ships.

## The six-class taxonomy

Exactly six classifications. Pick one per load-bearing claim.

| Class | Means | When to use |
|-------|-------|-------------|
| **Holds** | Verified against code / source / reality — it's right. | You checked and the claim stands. Record the strong load-bearing ones briefly. |
| **Unproven** | Load-bearing but no evidence offered, and you couldn't verify. | Ground it or cut it. Name exactly what evidence would settle it. |
| **Inference** | A reasonable inference presented as established fact. | The leap may be fine — but the doc states it as certainty. Mark the gap between what's known and what's claimed. |
| **Contradicted** | Wrong — the code, a cited source, or the data says otherwise. | You verified the opposite. Cite what contradicts it. |
| **Dropped** | A risk, question, or caveat the doc raised then silently abandoned. | The doc surfaced it and the conclusion ignores it. Pull it back into view. |
| **Noise** | True but not load-bearing — clutters or inflates the argument. | Optional cut. Only flag if it's actively misleading about what matters. |

When torn between **Inference** and **Contradicted**: if you verified
the claim is false, it's Contradicted; if it *might* be true but isn't
shown, it's Inference or Unproven.

## The two value filters

Before a finding ships, it must pass both:

1. **Is it load-bearing?** — Would the decision change if this were
   wrong? If not, cut it.
2. **Can I clear the confidence bar?** — Am I sure enough to say it out
   loud? "I couldn't verify this — here's what I'd check" is a complete,
   honest finding (classify **Unproven**). A guess dressed as a verdict
   is not.

If either filter fails, drop the finding.

## Finding shape

Every dimension skill emits findings in this shape so the orchestrator
can aggregate them without reformatting:

```markdown
### Finding — <short title> · <section / quote location>

- **Dimension:** <which review-* lens produced this>
- **Claim:** <the load-bearing claim, quoted or tightly paraphrased.>
- **Why it's load-bearing:** <what decision changes if it's false.>
- **What I checked:** <the code / source / data grounded against, with a path or link.>
- **Classification:** <Holds | Unproven | Inference | Contradicted | Dropped | Noise>
- **Draft comment:** <the exact comment to leave for the author — specific, fixable, no padding.>
```

## Hard rules

1. **Read before asserting.** If you doubt a claim about the system,
   read the code / source before classifying it. If you can't verify,
   classify **Unproven** and name what you'd check — never assert it
   wrong from a guess.
2. **Only flag load-bearing claims.** Surface the ones the decision
   rests on. Leave the rest.
3. **Every finding gets a classification and a draft comment.** No
   "hmm, worth thinking about" hedges.
4. **Let phrasing slide.** No line-edits, no tone policing, no
   restructuring unless it changes what the reader decides.
5. **Never auto-post.** You produce findings. The operator decides what
   — if anything — gets shared.

## Anti-patterns

- ❌ Front-running the doc — reviewing what you assume it says instead
  of what it says. Read it first.
- ❌ Asserting "wrong" from a guess. Verify, or classify Unproven.
- ❌ Line-editing. Phrasing, structure, and tone are not the job unless
  they change the decision.
- ❌ Flagging non-load-bearing claims to look thorough. A long review
  of trivia buries the one finding that matters.
- ❌ Supplying the author's view for them — telling them what they
  *should* want instead of testing what they argued.
- ❌ Hedged findings ("might be worth a look"). Classify and write the
  comment, or cut it.
