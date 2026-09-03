# Approved agent models

**Policy version:** `kai-agent-models-v1`
**Reviewed:** 2026-09-02

Agent creation selects from this set. It does not choose a new model during the
task.

## Approved models

| Model identifier | Approved profiles | Purpose |
|---|---|---|
| `claude-opus-5` | `judgment`, `review` | Expensive decisions, broad trade-offs, and independent high-precision review. |
| `claude-sonnet-5` | `execution`, `operations`, `coordination`, `advisory`, `procedure`, `teaching`, `simulation` | Reliable implementation, tool use, and instruction-driven work at lower cost. |

Use the exact identifier as one quoted scalar:

```yaml
model: "claude-sonnet-5"
```

Model identity stays out of the agent name. If an approved model is unavailable
on the target host, report the incompatibility. Add or replace a model only
through a reviewed change that updates:

1. this table and policy version;
2. `APPROVED_AGENT_MODELS` in the loader contract;
3. malformed-fixture and model-policy tests;
4. any agent pinned to the retired identifier.

The profile mapping is deterministic. A role that appears to need a different
model should first re-check its posture and scope; a genuine exception updates
the approved policy rather than selecting ad hoc.
