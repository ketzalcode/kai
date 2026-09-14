No split: this is one coherent behavior change with a small, necessary internal refactor. The helper extraction is only a cleanup step inside the same parser branch structure, and the new validation has no rollout, compatibility, or dependency boundary that would make an ordered split safer.

Validation: keep the helper extraction, validation logic, and tests together in the same PR. Verify the existing parser paths still parse the same inputs, the new invalid case is rejected, and the focused parser tests cover both branches that use the shared helper.
