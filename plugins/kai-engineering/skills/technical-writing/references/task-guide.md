# Task-guide pattern

Use this pattern for tutorials, how-to guides, setup instructions, user guides,
and troubleshooting procedures.

## Structure

1. **Outcome** — what the reader will accomplish.
2. **Audience and prerequisites** — required access, knowledge, tools, versions,
   and platform constraints.
3. **Starting state** — what must already exist.
4. **Steps** — one action per numbered step, beginning with an imperative verb.
5. **Verification** — the observable result after meaningful steps and at the
   end.
6. **Recovery** — likely failures, exact symptoms, diagnosis, and safe remedy.
7. **Next paths** — optional extensions or deeper reference.

## Tutorial versus how-to

- A tutorial teaches through a complete, staged experience. Explain why each
  major step matters and build toward a visible result.
- A how-to guide assumes a goal and helps an informed reader complete it
  quickly. Keep background explanation out of the procedure.
- Troubleshooting starts from symptoms and decision points, not feature
  descriptions.

## Checks

- Commands identify the working directory and platform assumptions when needed.
- Code blocks include language identifiers and expected output where useful.
- Steps do not hide multiple actions behind one instruction.
- Warnings precede destructive or irreversible actions.
- The guide was followed literally, or any untested step is marked.
