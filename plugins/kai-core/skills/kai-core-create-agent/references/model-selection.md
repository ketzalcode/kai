# Approved agent models

**Policy version:** `kai-agent-models-v2`
**Reviewed:** 2026-09-03

Agent creation selects from this set. It does not choose a new model during the
task.

## Approved models

| Model identifier | Approved profiles | Purpose |
|---|---|---|
| `claude-opus-5` | `judgment`, `review` | Broad cross-domain decisions and independent review where code is not the primary evidence surface. |
| `gpt-5.6-sol` | `technical-judgment` | Repository-grounded architecture, design, and technical trade-offs where code reasoning is central. |
| `gpt-5.6-terra` | `technical-review` | Independent review of code, tests, technical contracts, and implementation risk. |
| `claude-sonnet-5` | `execution`, `operations`, `coordination`, `advisory`, `procedure`, `teaching`, `simulation` | Reliable implementation, tool use, and instruction-driven work at lower cost. |

Use the exact identifier as one quoted scalar:

```yaml
model: "gpt-5.6-terra"
```

Model identity stays out of the agent name. If an approved model is unavailable
on the target host, report the incompatibility. Add or replace a model only
through a reviewed change that updates:

1. this table and policy version;
2. `APPROVED_AGENT_MODELS` in the loader contract;
3. malformed-fixture and model-policy tests;
4. any agent pinned to the retired identifier.

The profile mapping is deterministic. Use `technical-judgment` when the role's
standing decision lane centers on repository evidence, and `technical-review`
when its independent verdict centers on code, tests, or technical contracts.
Do not switch models per task. A role that appears to need a different model
should first re-check its posture, scope, and primary profile; a genuine
exception updates the approved policy rather than selecting ad hoc.
