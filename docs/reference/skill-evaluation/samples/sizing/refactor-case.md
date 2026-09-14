# Sizing boundary: a legitimate standalone refactor

Propose the smallest sensible PR sequence for this explicitly requested
code-health change, using the attached sizing guidance. Return the sequence
and its rationale only; do not implement or open a PR.

- The sole approved goal is to remove duplicated internal parsing logic that
  has caused repeated maintenance mistakes.
- Two callers should share one existing-behavior helper.
- No new product behavior or later feature is part of this request.
- Existing regression coverage must remain green; add protection for any
  refactor-specific regression risk in the same increment.
- There is no API change, migration, deployment order or feature flag.
- The change is small enough to review in one sitting.

Do not invent a feature that this refactor must accompany to be legitimate.
