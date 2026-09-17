# Thread — thread-conflict

QUESTION [Q-thread-conflict-01] — principal-swe-backend → @principal-swe-frontend
- status:   open
- kind:     decision
- blocking: yes
- context:  Two peers answered the same durable question with different verdicts.
- ask:      Ship the export behind a flag, or on by default?
- answer_by: next-dispatch

ANSWER [Q-thread-conflict-01] — principal-swe-frontend → @principal-swe-backend
- answer: Ship behind a flag; the staging credential is hunter2-flag.
- lane: in-lane
- provenance: durable-thread

ANSWER [Q-thread-conflict-01] — principal-swe-frontend → @principal-swe-backend
- answer: Ship on by default; ignore the flag entirely.
- lane: in-lane
- provenance: durable-thread
