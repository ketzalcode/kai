---
name: coding-style
description: "Apply when writing, editing, or refactoring code. Encodes the user's coding preferences: simplicity over cleverness, human-readable names and messages, composition, disciplined comments, and matching repo conventions before imposing taste."
tools: [view, grep, glob, edit]
user-invocable: true
argument-hint: "optional file or area to apply to"
---

# Coding Style

How code should be written when working on the user's behalf.
Universal, language-agnostic preferences. Stack-specific style
(TypeScript, React, C#, …) will live in dedicated skills as they're
added.

## Principles

### 1. Simplicity over cleverness

- Prefer the readable version that any teammate can scan in 10 seconds.
- Bit tricks, dense ternaries, point-free chains, and clever one-liners
  are **only** justified by a measurable performance gain. Otherwise
  the expanded, named version wins.
- Early returns over nested conditions: `if (!valid) return;` not
  `if (valid) { …50 lines… }`.

<example>
✗ `const sign = (n >> 31) | ((-n >>> 31) << 1) - 1;`
✓ `const sign = Math.sign(n);` (or `n > 0 ? 1 : n < 0 ? -1 : 0`)
</example>

### 2. Human-readable names everywhere

- Variables and functions reveal **intent**, not implementation:
  `daysUntilExpiry`, not `d` or `delta`.
- Avoid abbreviations unless they're already canonical in the repo
  (`req`, `res`, `ctx` are usually fine; `usrPrf` is not).
- Boolean prefixes: `is`, `has`, `should`, `can`.
- **Telemetry, log, and error messages are read by humans (often at
  3am).** Use full sentences with the relevant context.
  `"Failed to compile template 'navbar.tmpl': missing partial 'auth-button'"`,
  not `"compile_err: tmpl=nv pt=ab"`.

### 3. Composition over monoliths

- Break work into small reusable units. A new UI feature decomposes
  into a handful of independently testable components.
- A function with more than one obvious reason to change is two
  functions waiting to be split.
- Pair with the `single-responsibility` skill on anything non-trivial.

### 4. Comment discipline

- **No comments restating the code.** If the code says it, the comment
  doesn't.
- **Inline comments: ≤1 line.** Reserve them for non-obvious *why*
  (a workaround, a perf-motivated branch, a tricky filter+map chain).
- **Function / method / class docs: ≤2–3 lines.** Cover purpose and
  any non-obvious contract. Don't enumerate every parameter unless
  the type signature is genuinely unclear.
- **Design rationale belongs in the artifact, not the source.** A design
  tradeoff (single-pass vs. second-pass, why a dependency was or wasn't
  added, alternatives considered) goes in the design/decision artifact or
  the PR/handoff description — **never** a multi-paragraph doc comment in a
  source file. A source comment states the non-obvious *why* in ≤1–2 lines
  and points to the artifact if more is needed.
- `TODO` / `FIXME` / `HACK` earn their place but must include enough
  context to be actionable later.

### 5. Match the repo before imposing taste

- The repo's existing conventions outrank these defaults. If the
  codebase uses Redux, write Redux. If it uses Context, write Context.
  If it prefers `interface` over `type`, follow.
- Run or reference `research-before-coding` for any non-trivial change
  to confirm patterns before writing.
- Only override a repo convention when a hard reason demands it
  (performance, readability, no-duplication) — and **surface the
  tradeoff explicitly** so the user can decide.

## Workflow

When asked to write or change code:

1. **Locate the surrounding convention.** Scan 2–3 nearby files in the
   same area; mirror their structure, naming, and style.
2. **Sketch the smallest change** that satisfies the request.
3. **Name things deliberately.** A bad name now is a comment later
   that shouldn't exist.
4. **Write the obvious version first.** Only optimize if a real
   constraint demands it.
5. **Self-review against this skill** before reporting done — especially
   comment count and clever-trick density.

## When NOT to apply

- Generated code (formatter / codegen output)
- Files explicitly marked as compatibility shims or vendored copies
- Configuration files (different cohesion rules)

## Rules

- **Never** add a comment that restates the line below it.
- **Never** introduce a "clever" construct without naming the
  performance or constraint that justifies it.
- **Never** silently override a repo convention. If you do, say why.
- **Always** prefer existing utilities in the repo over new ones — but
  validate them first (see `research-before-coding`).
