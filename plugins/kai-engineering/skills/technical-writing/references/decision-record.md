# Decision-record pattern

Use this pattern to document an architecture or product decision that its owner
has made. Technical writing improves the record; it does not make or approve
the decision.

## Structure

```markdown
# <decision title>

**Status:** proposed | accepted | superseded | deprecated
**Date:** YYYY-MM-DD
**Owners:** <decision owners>

## Context
<problem, constraints, and forces>

## Decision
<the selected option and its boundary>

## Consequences
<benefits, costs, risks, and follow-up obligations>

## Alternatives considered
<credible options and why they were not selected>

## Evidence
<source links, measurements, and related records>
```

## Checks

- One record captures one decision.
- The decision owner and status are explicit.
- Context separates facts, constraints, and assumptions.
- Consequences include trade-offs, not only benefits.
- A superseded record remains available and links to its replacement.
