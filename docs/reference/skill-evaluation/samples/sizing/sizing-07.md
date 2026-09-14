# Sizing assessment

PR 1: Extract the duplicated local parsing into an internal helper, add the new validation behavior, and cover both branches with tests.

- Why this is the smallest sensible sequence: the approved change is already a single coherent behavior change, about 40 lines total, with one acceptance criterion and no API, migration, deployment, dependency, or feature-flag work.
- Why it is reviewable: the diff stays inside two implementation files and their tests, so a reviewer can read the whole change in one sitting without context switching.
- Why it is safe to ship: the helper is internal and permitted as part of the change, so there is no public contract change or sequencing dependency on another PR.
- Why no split is needed: a refactor-only PR would not be independently valuable here, and the validation cannot land meaningfully without the helper extraction that enables it.
