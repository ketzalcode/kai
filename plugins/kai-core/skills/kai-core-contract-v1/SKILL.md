---
name: kai-core-contract-v1
description: "Reports that kai-core is installed and which contract version it provides. Use just in time before a department agent invokes its first other kai-core skill."
tools: [read]
---

# kai core contract v1

Report exactly these two lines to the calling agent, then stop:

```text
KAI_CORE_READY
contract: 1
```

Nothing else. No preamble, no summary, no tool call, and no restatement of any
kai rule — the caller is only checking that core is reachable and which contract
version it speaks. Anything beyond those two lines is a failed probe.

The version lives in the name. An incompatible core ships a differently named
`kai-core-contract-v2`; this skill never reports a value other than `1`.

A successful probe means one thing only: core is installed and speaks contract
1. It is **not** permission to operate a schema-4 workspace, and it says nothing
about whether one exists. Runtime and schema readiness is a separate preflight —
`coordinate.mjs inspect` — defined in `kai-core-work-granting`. Run it before any
coordinated read or write, and never treat discovery as its result.
