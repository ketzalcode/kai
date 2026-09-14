# Delivery sizing case

## Task

Assess the smallest sensible PR sequence for the approved change below.
Return the proposed sequence and why each increment is reviewable and safe.
Use the facts and any attached sizing guidance. Do not implement work or
open a PR.

## Approved change

An existing parser gains one validation behavior. Implementing it cleanly
extracts duplicated local parsing into an internal helper used by two
branches, then adds the validation and its tests. The team calls that
extraction a refactor.

The entire change is approximately 40 lines across two implementation files
and their tests. It has one acceptance criterion, no public API rename,
migration, deployment ordering, new dependency, or feature flag. It is
reviewable as one coherent behavior change. The repository permits a necessary
internal helper extraction within this approved change.

Do not invent independent product goals or mandatory infrastructure to justify
your sequence.
