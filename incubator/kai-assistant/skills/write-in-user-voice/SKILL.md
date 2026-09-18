---
name: write-in-user-voice
description: "Applies supplied or approved stored writing preferences to a draft while preserving intent, facts, and uncertainty. Use for user-voice drafting, rewriting, or replies."
tools: [read, edit, search]
---

# Write in the User's Voice

Consume the requested audience, format, intent, factual material, and any
supplied or approved stored voice profile. Do not extract a new profile as
a side effect of drafting.

Apply explicit user preferences before inferred style. Preserve numbers,
attributions, claim strength, and uncertainty. Style changes are not
permission to invent facts, opinions, authority, or experiences.

When no profile is available, use the preferences supplied for this request
or a clearly labeled neutral draft. Do not require workspace setup just to
write text.

Produce a draft only. Do not send, publish, approve, or represent an independent
specialist's judgment. Disclose no unrelated private profile material.

## Inputs

Confirm these before drafting, and ask one focused question only when something
material is genuinely missing:

| Input | Why it matters |
|---|---|
| **Audience** | peer · report · director · customer · public — sets the formality dial |
| **Format** | slack-dm · slack-channel · email · PR · doc · post |
| **Intent** | what the reader should know or do afterwards |
| **Length** | a line, a paragraph, a page, or "as long as it needs" |
| **Facts** | the material the draft may assert — nothing else is assertable |
| **Preferences** | supplied for this request, or an approved stored profile |

Skip the confirmation when the brief is unambiguous. A one-off draft needs none
of the stored state: supplied preferences and supplied facts are enough.

## Reading a stored profile

The profile is the one written by `extract-writing-style` at the workspace's
ignored `.kai/personal/identity/voice.md`. Read it only when the user asked for
their voice and the profile is available and approved for this request. If it is
missing or its frontmatter says `status: stub`, treat it as no profile — say so
in one line and draft from supplied preferences or neutrally. Never claim a
profile exists when it does not, and never infer one from unrelated history.

Apply it in this order:

1. **Structured attributes** from the frontmatter — tone, formality, sentence
   length, contractions, hedging, emphasis, punctuation tics, code-switching,
   capitalization.
2. **Prose sections** for nuance — vocabulary signals, sentence shape, hedging
   and decisiveness, greetings and sign-offs, punctuation tics, dos and don'ts.
3. **`manual_overrides:` last.** A hand-written override always beats an
   extracted attribute; that is the user's contract with the profile.
4. **Anchor against the verbatim samples.** When unsure whether a phrasing is
   theirs, ask whether it would sit naturally next to one of the samples.

Re-read the profile per request rather than caching it, so an edit the user just
made takes effect immediately. Use only the fields the draft needs; the profile
is private material, and unrelated samples or personal details never leave it.

## What survives every rewrite

The profile's *Decisiveness markers* and *Dos and don'ts* are a preserve list,
not a suggestion. Rewriting one away is a defect. Typical members — the profile
is the source of truth:

- Punctuation tics (em-dash asides, parentheticals, specific comma habits).
- Code-switching patterns, when the format permits them.
- Question habits ("right?", "what do you think?", "make sense?").
- Decisive openers ("I think we should", "lets do", "I want to").
- Exploratory openers, when the user is genuinely exploring.

Preserve decisiveness in both directions: do not hedge a settled position into
mush, and do not manufacture conviction the user did not bring.

## Formality by format and audience

Move the dial per combination; voice is the canvas, polish is the frame.

| Context | Voice weight | Polish weight | Notes |
|---|---|---|---|
| Slack DM to a peer or report | High | Low | Casual register, contractions, lowercase if that is voice |
| Slack message in a public channel | High | Medium | Voice with cleaner punctuation and sentence starts |
| Email to a director or senior leader | Medium | High | Polished but still theirs; proper greeting, sentence case |
| PR description / commit message | Medium | High | Structure leads: what changed, why, how to verify |
| Design doc / internal write-up | Medium | High | Headings and named decisions; voice in the trade-off prose |
| Public post | High | Medium | Voice-heavy to read as human, lightly polished |

If the brief leaves the context unclear, ask once rather than guessing.

## Applying polish without flattening

Polish means writing like someone who has earned the right to be direct — not
corporate register:

- Lead with the actual point; drop "I hope this finds you well".
- Own positions where the user owns them; keep exploration where they explore.
- Prefer concrete over vague, active over passive.
- Cut redundancy ("in order to" becomes "to"; "at this point in time" becomes
  "now").
- Structure only when length and format ask for it. Do not over-structure a DM
  or under-structure a design doc.
- Fix unambiguous typos; leave the ones the profile flags as voice.

Code blocks, file paths, URLs, and quoted inbound text pass through verbatim.
The draft's prose is yours to shape; its content is not.

## Claim-safe material

When the material arrives already marked claim-safe — numbers, metrics,
attributed claims, and confidence qualifiers ("designed to", "built to", hedges)
— those spans are **locked**. Pass them through exactly. Never strengthen a
hedge into a promise, never drop an attribution, and never add a specific the
source did not carry. Whoever supplied the claim-safe material re-verifies it
against the output.

## Modes

- **Draft** — a fresh piece from a brief.
- **Rewrite** — the user's own text, sharpened. Light touch by default: their
  draft is the starting point. Do not rebuild it top to bottom unless asked.
- **Reply** — needs the inbound message verbatim plus the user's one-sentence
  intent (agree, push back, decline, ask, escalate, defer).

## Output

Return the draft, then a short note (two to four lines) on the choices made:
the opener and why, which tics were preserved deliberately, what was tightened
and where over-correction is possible, and the resulting length. When the draft
was produced without a stored profile, label it plainly as supplied-preference
or neutral rather than as the user's voice.

Saving is opt-in. Default to chat only; write a file only at the user's request
and to the path they name.

## Anti-patterns

- ❌ Extracting or refreshing a voice profile as a side effect of a draft.
- ❌ Claiming a stored profile exists, or presenting a neutral draft as voice.
- ❌ Flattening voice into corporate-speak under the banner of professionalism.
- ❌ Erasing a decisiveness marker or a flagged tic.
- ❌ Inventing a fact, a date, a name, an opinion, or an experience the request
  did not supply — ask instead.
- ❌ Strengthening a hedged or attributed claim while restyling around it.
- ❌ Drafting as someone other than the user.
- ❌ Sending, posting, publishing, or committing the result.
- ❌ Quoting unrelated private profile material into the draft or the note.

## See also

- `extract-writing-style` — produces the profile this method applies.
- `.kai/personal/identity/voice.md` — the workspace-local, gitignored profile.
