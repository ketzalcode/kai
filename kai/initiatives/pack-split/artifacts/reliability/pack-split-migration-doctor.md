# Reliability Assessment — pack-split migration doctor

**Mode:** CHANGE-REVIEW (`independent-reliability`)  
**Change ref:** `961c86c6e948093999256e64a88f2fe31f53cfe4`  
**Verdict:** **READY**

## Decision

The migration doctor is reliable for the reviewed release scope. Every
uninspectable state fails closed, the check has no mutation capability, and
automation can distinguish `clear`, `blocked`, and `unknown`.

## Evidence

- Exit codes are `0` clear, `2` blocked, and `3` unknown; JSON carries the same
  verdict and finding codes.
- Recursive discovery handles deep layouts, symlinks, cycles, dangling links,
  manifest-less remnants, duplicate copies, and foreign identities.
- Cleanup steps require complete classified metadata; incomplete evidence
  produces no uninstall or tree-removal instruction.
- Fixture materialization is path-contained and snapshots symlinks without
  following dangling targets.
- `.kai/manifest.json` provenance accepts only `kai` or `kai-core`; applying the
  migration twice is a no-op.
- `node scripts/workspace-doctor.mjs --self-test` passed 26 scenarios and the
  byte-identical read-only assertion.
- `npm test` passed locally.
- PR #163 `validate / contract` passed in Actions run `33006110904`, job
  `98300155097`, at the reviewed ref.

## Residual risk

Real marketplace, macOS, and cloud host layouts remain a host-gate concern.
Until measured, inferred layouts remain `unknown`; they cannot authorize an
install.

