# Technical-reference pattern

Use this pattern for APIs, CLIs, configuration, schemas, environment variables,
and other lookup-oriented documentation.

## Structure

1. **Scope and version** — what surface and release the reference describes.
2. **Syntax or signature** — the exact callable, command, field, or schema.
3. **Inputs** — names, types, required status, defaults, constraints, and units.
4. **Outputs** — return shape, side effects, exit status, and observable result.
5. **Errors** — conditions, messages or codes, and recovery.
6. **Examples** — minimal valid use, then one representative advanced case.
7. **Related entries** — direct links without repeating their content.

## Checks

- Names, casing, defaults, and types match the implementation or generated
  source.
- Optional and required values are distinguishable.
- Examples execute without undocumented setup.
- Security, permission, rate, platform, and compatibility limits are explicit.
- Reference entries are complete and consistently ordered for scanning.
