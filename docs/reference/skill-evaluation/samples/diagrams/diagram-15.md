# Decision: Keep internal text reports in UTF-8

Internal text reports will remain UTF-8.

This decision preserves compatibility with existing readers, which already
consume UTF-8. It avoids unnecessary conversion work and does not change any
module boundary, API, data flow, topology, state transition, or deployment
relationship.

No implementation, benchmark, dependency change, or format migration is
needed for this decision.
