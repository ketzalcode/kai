---
name: kai-core-contract-v1
description: "Reports that kai-core is installed and which contract version it provides. Invoked as the first action of every kai department pack agent."
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
