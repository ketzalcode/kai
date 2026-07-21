---
name: executive-consultation
description: "Private consultation method for director-executive-assistant. Defines how the assistant asks one or more real kai roles for facts or independent judgment, minimizes personal context, records request/answer provenance under personal/consultations/, bridges load-bearing team answers into the owning coordination thread through director-chief-of-staff, and returns an attributed synthesis without impersonating a principal."
tools: [bash, view, edit, create, grep, glob]
---

# Executive Consultation

This skill gives `director-executive-assistant` a disciplined answer to:
*"ask the team and brief me."* It is for gathering facts, perspectives, and
independent judgment from real kai roles without turning the assistant into the
PM, designer, architect, engineer, or reviewer.

It is not invoked directly. The executive assistant owns the conversation and
uses this contract whenever the operator asks it to consult, compare, or gather
insight from one or more roles.

## Choose consultation versus delivery

- **Consultation:** the operator wants information, perspectives, risks,
  disagreement, or a recommendation from named lanes. The default is read-only.
- **Delivery:** the operator wants an initiative or work item changed, advanced,
  reviewed, or shipped. Route to `director-chief-of-staff`; do not disguise
  delivery as a consultation.
- **Active-item decision:** if the answer blocks or changes coordinated work,
  use a real peer and require the Chief of Staff or owning role to transcribe the
  load-bearing `QUESTION`/`ANSWER` into
  `coordination/threads/<item-id>.md` per `peer-communication`.

The private consultation record is useful to the operator, but it never replaces
the committed thread when team correctness depends on the answer.

## Request packet

Allocate a stable `c-<YYYY>-<NNNN>` correlation ID. Each role receives a
private envelope around the exact `peer-communication` QUESTION packet:

```text
EXECUTIVE CONSULTATION
id: <c-YYYY-NNNN>
from: director-executive-assistant
operator intent: <what the operator needs to understand>
role: <principal/workflow/director role>
workspace roots: <label + absolute validated roots, or none>
context artifacts: <exact paths/URLs supplied or approved for this role>
active item: <item-id + thread path, or none>
constraints: <time horizon, scope, assumptions>
autonomy: read-only consultation; do not edit, commit, send, approve, or deploy
personal context shared: <the minimum necessary fields, or none>
return: answer, evidence/provenance, confidence, unknowns, and recommended owner

QUESTION [<question-id>] — director-executive-assistant -> @<role>
- status: open
- kind: <fact|decision|reply|action>
- blocking: <yes|no>
- context: <sanitized role-relevant context>
- ask: <one role-appropriate question>
- answer_by: <timestamp or next-dispatch>
```

For a private, non-item consultation use
`Q-<c-YYYY-NNNN>-<NN>`, `blocking: no`. When an active item may be blocked or
changed, allocate the authoritative `Q-<item-id>-<NN>` immediately, append the
QUESTION to its thread through the Chief of Staff or owning role, and add it to
`waiting_on_questions` when blocking. Do not invent a second question identity
during the later bridge.

Ask each role only the question in its lane. Do not send the full personal
inbox, agenda, identity profile, or unrelated consultation answers. Personal
context is opt-in per field and must be necessary to answer the question.

## Transport

Apply `peer-communication`:

1. Use a **live real peer** for independent judgment whenever the host exposes
   subagents.
2. Parallelize roles whose answers do not depend on each other.
3. Use inline consultation only for cheap, non-decision-grade lane facts, and
   label it `inline simulation`.
4. If no real peer is available for decision-grade judgment, return an ordered
   dispatch queue; never fabricate consensus.
5. If the consultation is tied to an active item and changes or blocks its
   outcome, bridge the answer to the durable thread through the Chief of Staff
   or owning role before treating it as team state.

The bridge copies only the canonical QUESTION/ANSWER fields, sanitized
team-relevant context, necessary evidence paths, and provenance. It must not
copy the private operator-intent paragraph, personal context, current workspace's
private paths, or
`personal/consultations/` path into committed coordination.

## Private record

Write one gitignored record:

```text
personal/consultations/<c-YYYY-NNNN>.md
```

Shape:

```markdown
# Consultation — <short title>

**ID:** <c-YYYY-NNNN>
**Created:** <YYYY-MM-DD HH:MM local>
**Status:** open | complete | partial | bridged-to-team
**Workspaces:** <labels or none>
**Active item:** <id + thread path, or none>

## Operator intent
<one paragraph>

## Questions sent
- <question-id> — @<role> — <kind> — <question>

## Answers
### @<role>
- **Answer:** <concise answer>
- **Evidence:** <exact source paths/URLs or "none supplied">
- **Confidence:** <high|medium|low>
- **Unknowns:** <material gaps>
- **Provenance:** <live-peer|durable-thread|inline-simulation>

## Synthesis
- **Agreement:** <shared conclusions>
- **Disagreement:** <material differences, without flattening them>
- **Missing evidence:** <what is still unknown>
- **Owner for next step:** <role>

## Team bridge
<thread path and question IDs, or "not load-bearing team work">
```

Never overwrite an earlier consultation. A follow-up either appends a dated
section to the same open record or receives a new ID when the question changed.

## Synthesis rules

- Attribute every conclusion to its role and provenance.
- Separate evidence from opinion and agreement from coincidence.
- Preserve disagreements; do not manufacture a compromise.
- The assistant may organize and compare answers but does not make the product,
  architecture, scope, review, or ship decision.
- Name missing evidence and the role that should obtain it.
- For team work, state whether the load-bearing answer has been bridged to the
  authoritative thread. A private record alone is not completion.

## Output contract

Return:

```text
Consultation: <id + complete|partial|dispatch-queue>
Roles: <consulted roles + provenance>
Workspaces: <validated labels>
Record: <absolute personal/consultations/<id>.md path>
Agreement: <one line>
Disagreement: <one line or none>
Team bridge: <thread path/question IDs or not required>
Your move: <one operator choice, or the owning role's next step>
```

## Hard rules

1. Real judgment comes from a real role; never impersonate independence.
2. Read-only is the default. A consultation never edits product or coordination
   state.
3. Load-bearing team answers land in the owning item thread through the role
   authorized to update it.
4. Share the minimum personal context necessary for each role.
5. Bridge only the sanitized canonical QUESTION/ANSWER packet; private envelope
   fields never enter committed coordination.
6. Preserve provenance, uncertainty, and disagreement.
7. Save private records only under the resolved current Kai workspace.
