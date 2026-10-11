---
name: frontend-coding-standards
description: "Use with coding-standards when implementing or refactoring frontend UI or client behavior."
tools: [read, search, edit]
---

# Frontend Coding Standards

Apply only the rules relevant to the requested UI or client behavior. Follow
the repository's framework, design system, accessibility, and localization
patterns rather than creating parallel conventions.

## Rules

- Compose components around stable responsibilities. A boundary earns itself
  through reusable behavior, independent state or lifecycle, or a clear
  interface. Keep one-off render branches with the state owner.
- Keep state as local as its consumers allow. Make ownership, loading, empty,
  error, stale, and cancellation behavior explicit where the interaction needs
  them.
- Reuse repository components, tokens, forms, data-fetching patterns, and
  interaction conventions before introducing another abstraction.
- Preserve semantic controls, keyboard operation, focus behavior, labels, and
  responsive layout. Improve touched accessibility issues when the fix is
  clear and remains inside scope.
- Use the existing localization framework. Externalize user-facing strings and
  preserve interpolation, plural, formatting, fallback, RTL, and text-expansion
  behavior. Do not invent a second fallback system.
- Keep client/server and component boundaries explicit. Do not expose secrets,
  privileged decisions, or server-only data through client code.
- Measure a real render, bundle, or interaction problem before adding
  memoization, caching, virtualization, or another performance mechanism.
