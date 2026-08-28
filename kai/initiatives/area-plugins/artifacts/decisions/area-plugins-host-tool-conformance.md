# Infrastructure Decision — a live host-tool conformance probe, and what it must measure before anything is renamed

**Source:** `kai/coordination/items/area-plugins-host-tool-conformance.md` (v1,
`ready`, milestone 0 `allowlist-repair`) and the main agent's direction to
*"promote a live conformance probe as the first implementation, testing primary
aliases and exact runtime grants; then make the smallest warning-free
replacement."*
**Date:** 2026-08-27 22:05 local
**Run:** principal-swe-infra
**Initiative:** area-plugins (milestone 0 `allowlist-repair`)
**Prior record:** `kai/coordination/threads/area-plugins-tool-allowlist-fix.md`
(the DIAGNOSIS of 2026-08-27-2138 — this design consumes it and does not repeat it)

**Decision (one line):** Build `scripts/host-tool-probe.mjs` — a plan-first,
temp-dir-only harness that measures the host's **validator vocabulary** and its
**runtime grants** on two independent channels that the output schema is
structurally forbidden to merge — and ship the replacement only as an
**expand/migrate/contract** sequence whose branch is chosen by the probe's
result, not by the documentation.

> **Boundary.** This pass wrote three files: this artifact, the item record, and
> the item thread. **No `agents/**`, `packs/**`, `skills/**`, `plugin.json`, or
> existing script was edited**, per the dispatch STOP CONDITION. No command was
> executed — this session has no shell. Every execution-dependent statement below
> is labelled `reported` or `specified`; only first-hand file reads are
> `observed`. The probe is **specified, not authored** (§4.8 gives the argument
> for and against authoring it now, and rules against).

---

## 1. Context — what changed, and why it changes the plan

### 1.1 The operator's documented vocabulary, recorded verbatim

Official GitHub documentation for the Copilot CLI custom-agent tool schema,
**observed 2026-08-27 by the operator**, reported to this role:

- Portable PRIMARY aliases: `execute`, `read`, `edit`, `search`, `agent`, `web`, `todo`
- COMPATIBLE aliases: `shell` / `Bash` / `powershell`; `Read` / `NotebookRead`;
  `Edit` / `MultiEdit` / `Write`; `Grep` / `Glob`; `custom-agent` / `Task`
- **Unrecognized names are ignored.**

This is `reported`. I hold no web tool this session and did not open the page.
It is recorded verbatim because it is the **baseline the probe measures against**,
not because it is settled.

### 1.2 The drift, stated precisely

The operator's live CLI warns on lowercase `create`, `edit`, and `grep` —
**`edit` is a documented PRIMARY alias and `Grep` is a documented COMPATIBLE
alias** — while runtime capability remains available.

Two independent sources disagree about one system:

| | says `edit` is | says `grep`/`Grep` is |
|---|---|---|
| the documentation | a primary alias | a compatible alias |
| the live binary | unknown → warns | unknown → warns |
| the live runtime | granted and working | granted and working |

**That disagreement is the defect.** It is not a repo bug and it is not fixed by
renaming anything. What the repo *can* be blamed for is different and worse:
`SUPPORTED_TOOLS` was never grounded in **either** vocabulary, so CI has been
green on a claim nobody ever tested.

### 1.3 What this vindicates, and what it does not

My prior diagnosis held that the warned set and the broken set are disjoint —
warned names are bound and working; the genuinely absent capability was `shell`,
which is never warned about. §1.2 vindicates that and supplies the mechanism.

It does **not** settle the question that decides the fix. That question is
unchanged and is still unanswered:

> Is the allowlist **additive** over a base set the host grants anyway, or does
> it **gate** — and does the answer differ between a directly launched agent and
> a `task`-delegated one?

CHANGELOG 0.63.1 already proved the two paths differ for at least one tool:
*"Copilot CLI grants [`skill`] implicitly to a directly launched custom agent,
but a custom agent launched through `task` receives only its declared tools."*
If that generalizes, then deleting `create` from 49 agents strips file creation
**on the delegated path** even if the direct path base-grants it — and the
delegated path is how this repo dispatches almost everything. **A probe that only
tests direct launch would measure the case that does not matter and miss the one
that does.**

---

## 2. The model the probe measures

Two vocabularies, one declaration. The whole design follows from keeping them apart.

```text
   frontmatter                    HOST                          this session
   -----------                    ----                          ------------
   tools: ["bash","shell",
           "view","edit",
           "create","grep",
           "glob","skill"]
         |
         v
   +-------------------------+   V_a = validator vocabulary
   |  ALLOWLIST VALIDATOR    |   in V_a     -> silent
   |                         |   not in V_a -> WARN   ---> 'Unknown tool name in the
   +-------------------------+                              tool allowlist: "edit"'
         |
         |  a warned name is NOT a denied name        <-- observed, prior pass
         v
   +-------------------------+   V_r = runtime tool registry
   |  RUNTIME TOOL REGISTRY  |   x  launch mode (direct | task-delegated)
   |                         |   x  sandbox/environment policy
   +-------------------------+
         |
         v
   BOUND:   view create edit grep glob     <-- all three WARNED names present
   UNBOUND: bash shell skill               <-- none of them warned

   SUPPORTED_TOOLS (scripts/lib/loader-contract.mjs:14)
     = a hand-maintained union of V_a and V_r with no evidence link to either.
       CI proves the agents agree with THIS LIST.
       Nothing proves THIS LIST agrees with the HOST.
```

The probe's job is to put a measured value in `V_a`, a measured value in `V_r`,
and to make it structurally impossible for a report to claim one when it observed
the other.

---

## 3. Probe topology

Nothing inside `C:\src\kai` is written by a probe run except the explicit `--out`
report. Everything the host touches is a temp tree removed on exit.

```text
                     HOST BOUNDARY  (temp only; nothing here is committed)
 +--------------------------------------------------------------------------+
 |  operator workstation                                                     |
 |                                                                           |
 |   node scripts/host-tool-probe.mjs --run                                   |
 |        |                                                                  |
 |        | 1. materialise  (mkdtemp; removed on exit, even on failure)       |
 |        v                                                                  |
 |   <tmp>/kai-probe-<nonce>/                                                 |
 |     +-- plugin/           throwaway plugin dir — never installed           |
 |     |     agents/probe-<run>.agent.md    one per row of the run matrix     |
 |     |     agents/probe-launcher.agent.md the delegating parent             |
 |     |     skills/probe-nonce/SKILL.md    carries a nonce (the `skill` leg)  |
 |     +-- work/            scratch WORKSPACE, deliberately OUTSIDE the repo  |
 |           sentinel-a.txt   (holds a read-nonce)                            |
 |           sentinel-b.txt   (edit target)                                   |
 |           decoy-00..31.txt (search needle hidden in exactly one)           |
 |        |                                                                  |
 |        | 2. spawn once per run, sequentially, with a timeout               |
 |        v                                                                  |
 |   copilot --plugin-dir <plugin> --add-dir <work> --agent <probe> -p "..."  |
 |        |                          |                                       |
 |        | stdout + stderr          | actual tool calls                     |
 |        v                          v                                       |
 |   +----------------+       +---------------------+                        |
 |   | CHANNEL A      |       | CHANNEL B           |                        |
 |   | VALIDATOR      |       | RUNTIME GRANT       |                        |
 |   | 'Unknown tool  |       | filesystem side     |                        |
 |   |  name ...'     |       | effects in work/    |                        |
 |   | (host stderr)  |       | + nonce echo        |                        |
 |   +--------+-------+       +----------+----------+                        |
 |            |                          |                                   |
 |            |   never merged, never    |                                   |
 |            |   allowed to imply       |                                   |
 |            |   the other              |                                   |
 |            v                          v                                   |
 |   3. classify -- scripts/lib/tool-conformance.mjs (pure, no I/O) --+       |
 +-------------------------------------------------------------------|-------+
                                                                     |
     REPO BOUNDARY (one reviewed write)                              v
 +--------------------------------------------------------------------------+
 |  test/fixtures/host-tool-conformance.json     committed, redacted baseline |
 |  --check re-runs live and diffs against it -> drift is detected, not       |
 |  rediscovered by a user reading log noise                                  |
 +--------------------------------------------------------------------------+
```

The launch-mode leg, drawn separately because it is the measurement that decides
the fix:

```text
  DIRECT                                  DELEGATED  (the CHANGELOG 0.63.1 case)

  copilot --agent probe-R2                copilot --agent probe-launcher
        |                                       |  declares: agent / task / custom-agent
        v                                       v
  +----------------+                     +----------------+
  | probe-R2       |                     | launcher       |--- task --+
  | declares X     |                     | declares       |           |
  +-------+--------+                     |  agent, read   |           v
          | emits <<<KAI-PROBE>>> JSON   +-------+--------+   +----------------+
          v   on stdout (needs no tool)          | parent      | probe-R2       |
   grant_direct[X]                               | stdout      | declares X     |
                                                 v             +-------+--------+
                                        grant_delegated[X] <-----------+
```

---

## 4. The probe, specified

### 4.1 What it measures — two axes that never collapse

Every identifier in every run gets **three independent recorded values**:

| axis | values | source |
|---|---|---|
| `declared` | in this run's `tools:` array, or not | the generated fixture — known, not measured |
| `validator` | `silent` \| `warned` \| `unobserved` | CHANNEL A — host stderr/stdout |
| `grant` | `exercised-ok` \| `exercised-fail` \| `self-reported-present` \| `self-reported-absent` \| `not-testable` \| `unobserved` | CHANNEL B |

The pair `("warned", "exercised-ok")` is a **first-class, expressible result** and
is surfaced by name in `findings.warned_and_granted`. That is the requirement:
the prior finding was *warned-but-working*, so a schema that cannot say it is a
schema that would have hidden the defect.

`unobserved` is never rendered as `absent`. Silence is not evidence of denial —
the same honesty rule `workspace-doctor --migration-check` already enforces with
`unknown` never reported as `clear`.

### 4.2 Two evidence channels, and why self-report alone is not evidence

An agent listing its own tools is a **model-graded claim**. It can hallucinate.
So the probe grounds every grant claim in an out-of-band side effect the harness
verifies itself, and records the self-report separately:

| tool family | how the harness proves a grant without trusting the model |
|---|---|
| `read` / `Read` / `view` / `NotebookRead` | a 16-byte nonce lives only inside `sentinel-a.txt`; the agent must echo it. Unguessable. |
| `edit` / `Edit` / `Write` / `MultiEdit` / `create` | the agent writes a supplied token into `sentinel-b.txt` and creates `made-by-<run>.txt`; the harness stats both. |
| `search` / `Grep` / `Glob` / `grep` / `glob` | one needle hidden in one of 32 decoys; the agent must name the file. Corroborating, not exclusive — a read tool could brute-force it, so this is recorded as *search-family capability present*, honestly labelled. |
| `execute` / `shell` / `Bash` / `powershell` / `bash` | the agent runs a command that writes a value only a process can produce (`process.pid` via `node -e`); the harness verifies the file and that the value is not in any prompt. |
| `agent` / `Task` / `custom-agent` / `task` | delegates to a nested probe agent that writes `delegate-report.json`. Proves delegation **and** supplies the delegated leg. |
| `skill` | an inherited `probe-nonce` skill carries a second nonce; echoing it proves the skill actually loaded. Re-measures 0.63.1 directly. |
| `web` / `web_fetch` / `web_search` | **not exercised by default.** `--allow-network` opts in; otherwise `not-testable`, never inferred. |
| `todo`, `playwright`, `session_store_sql`, `read_agent`, `write_agent` | no verifiable out-of-band side effect → `self-reported-*` only, and listed in `not_measured`. |

Where the two channels disagree — self-report says present, side effect says
fail — the disagreement is recorded in `runs[].grant.disagreements` and **is not
resolved by the harness**. A disagreement is a finding, not a bug to smooth over.

**Transport is stdout, not a file.** The probe agent emits a delimited block
`<<<KAI-PROBE-BEGIN>>> {json} <<<KAI-PROBE-END>>>`. This is deliberate: the
single-identifier runs (§4.3, `--deep`) give an agent exactly one tool, so any
file-based report channel would be unavailable in precisely the runs that matter
most. Emitting text requires no tool.

### 4.3 Run matrix — coverage

Default (`--run`) executes rows R0–R9, each in **both** launch modes, so every
row yields `grant_direct` and `grant_delegated`. `--deep` adds R10.

| run | declares | what only this row can settle |
|---|---|---|
| `R0 omitted` | no `tools:` key at all | Does the host grant a default base set? Settles additive-vs-gating. |
| `R1 wildcard` | `tools: ["*"]` | Is `*` a wildcard, an ignored unknown, or a parse error? (§5) |
| `R2 primary` | all 7 primary aliases | **Does a warning-free spelling exist?** If `edit` still warns here, it does not. |
| `R3 shell-family` | `shell`, `Bash`, `powershell` | which member is silent, which is granted, per-OS |
| `R4 read-family` | `Read`, `NotebookRead` | " |
| `R5 edit-family` | `Edit`, `MultiEdit`, `Write` | " |
| `R6 search-family` | `Grep`, `Glob` | **`Grep` is documented and reportedly warns** — the sharpest drift probe |
| `R7 agent-family` | `custom-agent`, `Task` | " , plus it is the delegation transport itself |
| `R8 repo-current` | the 15 identifiers the repo declares today | reproduces the live defect exactly; the before-picture of any diff |
| `R9 control` | `read` + `kai-not-a-tool` + `zzz_bogus_42` | **confirms "unrecognized names are ignored" on the live binary** — bogus must warn while `read` still works |
| `R10 singleton` (`--deep`) | exactly ONE identifier, one run each | clean attribution: a grant observed here is attributable to that one name |

The 15 repo identifiers R8 must carry, `observed` from
`scripts/lib/loader-contract.mjs:14-28`: `view`, `create`, `edit`, `grep`,
`glob`, `bash`, `shell`, `ask_user`, `skill`, `task`, `read_agent`,
`write_agent`, `web_fetch`, `web_search`, `session_store_sql`, `playwright`
(16 entries; `session_store_sql` is declared by skills only, `observed` from the
prior pass's frequency table — R8 carries all of them regardless).

Union coverage: 7 primary + 13 compatible + 16 repo + 2 bogus, deduplicated.

### 4.4 Output schema

Machine-readable, redacted, diffable. Abridged but structurally exact:

```json
{
  "schema_version": 1,
  "probe_version": 1,
  "captured": "2026-08-28T05:14:22Z",
  "host": {
    "copilot_version": "<verbatim stdout of `copilot --version`>",
    "copilot_resolved_path": "<redacted to basename + parent>",
    "platform": "win32", "arch": "x64", "os_release": "10.0.26100",
    "node_version": "v22.22.2"
  },
  "runs": [{
    "id": "R2-primary", "launch": "direct",
    "declared": ["execute","read","edit","search","agent","web","todo"],
    "exit_code": 0, "duration_ms": 41230, "valid": true,
    "validator": {
      "warned": ["edit"],
      "silent": ["execute","read","search","agent","web","todo"],
      "raw_lines": ["Unknown tool name in the tool allowlist: \"edit\""]
    },
    "grant": {
      "self_reported": ["execute","read","edit","search","agent","web","todo"],
      "exercised": {
        "read":    { "result": "ok",           "evidence": "nonce echoed from sentinel-a.txt" },
        "edit":    { "result": "ok",           "evidence": "sentinel-b.txt carries the token" },
        "search":  { "result": "ok",           "evidence": "named decoy-17.txt" },
        "execute": { "result": "fail",         "evidence": "shell-proof.txt absent after run" },
        "agent":   { "result": "ok",           "evidence": "delegate-report.json written" },
        "web":     { "result": "not-testable", "evidence": "network probes disabled" },
        "todo":    { "result": "not-testable", "evidence": "no out-of-band side effect exists" }
      },
      "disagreements": [
        { "tool": "execute", "self_reported": "present", "exercised": "fail" }
      ]
    },
    "transcript_sha256": "…", "transcript_path": "<tmp>/R2-primary.log"
  }],
  "matrix": {
    "edit": {
      "class": "primary",
      "validator": "warned",
      "grant_direct": "exercised-ok",
      "grant_delegated": "exercised-ok",
      "runs": ["R2-primary", "R5-edit-family", "R10-edit"]
    }
  },
  "findings": {
    "warned_and_granted": ["edit", "grep", "create"],
    "silent_and_ungranted": ["bash"],
    "bogus_ignored": true,
    "base_set_direct": ["read","edit","search"],
    "base_set_delegated": [],
    "delegation_differs": true,
    "warning_free_spelling_exists": false
  },
  "not_measured": ["todo","playwright","session_store_sql","read_agent","write_agent"],
  "caveats": ["one host, one OS, one CLI build — this is a measurement, not a spec"]
}
```

`findings.warning_free_spelling_exists` is the single field the follow-on PR
branches on (§7). `findings.delegation_differs` is the single field the
capability-loss risk branches on.

### 4.5 Where it lives — and the `packs/` check the dispatch demanded

**Files (both additive, neither ever mirrored):**

| path | role |
|---|---|
| `scripts/host-tool-probe.mjs` | I/O shell: materialise, spawn, capture, redact, write |
| `scripts/lib/tool-conformance.mjs` | pure classification core, no I/O — what `--self-test` exercises |

This split is the repo's own clearest convention (`scripts/lib/pack-plan.mjs`
pure ↔ `scripts/pack-preview.mjs` I/O), and here it earns its keep: the pure core
is testable against recorded transcripts with **no CLI binary**, which is the only
way any of this runs in CI.

**Is `scripts/` mirrored into `packs/`? Checked — selectively, and by
reference only.** `observed`:

- `scripts/lib/pack-plan.mjs:869-872` — `ASSET_REF` matches **top-level**
  `scripts/<name>.<mjs|js|cjs|ps1|sh|py>` only, with the comment *"scripts/lib/
  is build-internal, and no shipped body tells anyone to run it."*
- `collectReferences()` (`pack-plan.mjs:973`) scans **only** agent and skill
  bodies. Nothing under `kai/`, `docs/`, or `test/` is scanned.
- `planAssetClosure()` (`pack-plan.mjs:1172`) then copies each referenced entry
  point **plus its relative import closure**.
- Result on disk: `packs/**/scripts/` holds exactly **15** files — the referenced
  entry points (`activity.mjs`, `observe-subagent.mjs`, `observe-watch.mjs`,
  `workspace-doctor.mjs`, `generate-catalog.mjs`, four `demo-*.mjs`) and their
  closure (`lib/activity.mjs`, `lib/coordination.mjs`, `lib/pack-plan.mjs`,
  `lib/migration-doctor.mjs`, `lib/loader-contract.mjs`, `lib/cursor-png.mjs`).
  `validate-plugin.mjs`, `pack-preview.mjs`, `release-guard.mjs`,
  `host-contract.mjs`, `check-syntax.mjs` are **absent from every pack**.

**Conclusion:** the probe is **not** copied into any published pack, subject to
one invariant that must be stated as a rule because it is one careless sentence
away from being violated:

> **No `agents/**` or `skills/**` body may ever contain the literal string
> `scripts/host-tool-probe.mjs`.** Naming it in a shipped body turns it into a
> routed asset and publishes it. Document it in `test/README.md` and
> `docs/reference/plugin-structure.md`, which are not scanned.

**Two consequences that ARE real and are not being softened:**

1. **`scripts/` is behavior-sensitive to the release gate.**
   `scripts/release-guard.mjs:20` — `BEHAVIOR_PREFIXES = ['agents/', 'skills/',
   'scripts/', 'packs/']`. Adding the probe therefore **forces a version bump +
   a CHANGELOG section + README status-stamp consistency** on the PR that adds
   it. That is correct behaviour, not an obstacle: `plugin.json` still ships the
   repo root, so a direct `OWNER/REPO` install copies the whole tree. The probe
   reaches a direct-install consumer's disk (inert — only `agents/` and `skills/`
   load) and reaches no marketplace pack at all.
2. **`check-syntax.mjs` picks it up automatically.** It recursively collects
   every `.mjs` under `scripts/` (`check-syntax.mjs:39`), so the new files are
   gated by `node --check` the moment they exist — a gate I cannot run this
   session, which is §4.8's argument.

**Alternatives considered and rejected.** `test/host-tool-probe.mjs`:
release-guard-exempt, but `check-syntax.mjs` scans only `scripts/` and
`examples/`, so it would silently lose the parse gate, and `test/` today holds
only fixtures — no executable convention exists there. A new top-level `tools/`:
exempt from both gates, but invents a directory the repo does not have, and
priority 8 says the established layout wins.

### 4.6 CLI surface

```text
node scripts/host-tool-probe.mjs --self-test
      offline. Classifies committed fixture transcripts. No host, no network,
      no temp tree. This is the leg that joins `npm test`.

node scripts/host-tool-probe.mjs --plan
      prints the run matrix and the exact frontmatter of every agent it WOULD
      materialise, plus the exact `copilot` argv per run. Writes nothing,
      spawns nothing. Plan before apply.

node scripts/host-tool-probe.mjs --run [--deep] [--allow-network]
                                 [--out <file>] [--keep-temp] [--timeout <s>]
      live. Requires `copilot` on PATH. Default --out:
      .kai/runs/eng/host-tool-conformance-<version>-<stamp>.json  (gitignored)

node scripts/host-tool-probe.mjs --update
      promote the most recent report to test/fixtures/host-tool-conformance.json
      (the same --update convention as host-contract.mjs)

node scripts/host-tool-probe.mjs --check
      live run + structural diff against the committed baseline; prints the
      drift. Operator/manual gate — NOT in `npm test`, because CI has no CLI.
```

`package.json` additions (specified, not written): `host-tool-probe`,
`host-tool-probe:self-test`, `host-tool-probe:plan`, `host-tool-probe:update`,
`host-tool-probe:check`; and `--self-test` appended to the `test` chain.

**Exit codes**, mirroring `workspace-doctor --migration-check`'s honesty
convention rather than inventing a new one:

- `0` — self-test passed, or a live run matched the baseline
- `1` — a failure or a real drift from the baseline
- `3` — **`unknown`**: the host was unreachable, timed out, or produced no
  parseable evidence. **Never reported as success.** A probe that cannot measure
  must not look like a probe that measured nothing wrong.

### 4.7 Self-test contract — the eight assertions

`--self-test` runs the pure core over committed fixture transcripts in
`test/fixtures/host-tool-probe/`. Each assertion states the rule it protects, in
the repo's existing `ok(cond, 'what this proves')` style:

1. **The collapse-proof assertion.** A transcript carrying
   `Unknown tool name in the tool allowlist: "edit"` **and** a `<<<KAI-PROBE>>>`
   block listing `edit` **and** the `sentinel-b.txt` side effect classifies as
   `validator: warned` + `grant: exercised-ok`, and `edit` appears in
   `findings.warned_and_granted`. *This is the one test that proves the schema
   cannot merge the two axes — the defect that would otherwise repeat.*
2. **Side effects outrank self-report.** A self-report claiming `execute` with no
   `shell-proof.txt` yields `exercised-fail` **and** a `disagreements` entry —
   never a silent downgrade and never a silent acceptance.
3. **Bogus control.** The bogus names warn, appear in no grant channel, and the
   real tool declared alongside them still classifies `ok` →
   `bogus_ignored: true`. *"Unrecognized names are ignored" becomes measured.*
4. **Silence is not denial.** A run with a missing or malformed `<<<KAI-PROBE>>>`
   block classifies every identifier `unobserved`, never `absent`.
5. **Fail closed.** A truncated transcript or non-zero exit marks the run
   `valid: false`, excludes it from `findings`, and still writes the report with
   the caveat. A partial measurement never becomes a whole verdict.
6. **Redaction before commit.** A fixture transcript seeded with `ghp_`-shaped
   and `Bearer`-shaped strings and an absolute home path emits a report
   containing none of them. *The baseline is committed to a public repo; a live
   CLI transcript is exactly the place a token or a user's home path leaks.*
7. **Determinism.** Identical fixture input yields byte-identical output modulo
   `host` and `captured`. Without this, `--check` diffs noise.
8. **Read-only over the repo.** Snapshot every file under `REPO_ROOT` before and
   after `--self-test`; assert byte-identical except the explicit `--out` target.
   *Proven, not promised — the same assertion `--migration-check` already makes.*

### 4.8 Should the probe be authored in this pass? No.

The argument for: both files are purely additive, nothing imports them, and the
STOP CONDITION's list of forbidden paths does not name them.

The argument against, which wins:

- The moment `scripts/host-tool-probe.mjs` exists it is **inside three gates I
  cannot run** — `check-syntax` (`node --check`, automatic on every `.mjs` under
  `scripts/`), `release-guard` (behavior path → version bump + CHANGELOG), and
  `npm test` once `--self-test` is wired in. Committing code into gates I cannot
  execute is the "apply without a plan" anti-pattern with the labels swapped.
- The self-test needs **committed fixture transcripts**, and a realistic transcript
  is a recording of a host I have never run. Fabricating one and then asserting
  against it produces a self-test that proves my imagination is self-consistent.
- The design is about to receive `principal-swe-architect` independent-architecture
  review. A verdict that changes the run matrix or the schema after the code is
  written wastes the write.

**Ruling: specify, do not commit.** §4.1–§4.7 are written to be implemented
mechanically by a shell-bearing pass — path, argv, schema, exit codes, and eight
named assertions. That pass writes the fixtures **from a real transcript the
operator captures**, not from imagination.

---

## 5. Ruling — `tools: ['*']` and omission vs least privilege

**Rejected. Both of them. Keep explicit enumeration.** The main agent warned this
might be unacceptable; it is, and for four reasons that compound.

**1. `*` is not in the documented vocabulary — so the documented rule makes it
mean the opposite of what it looks like.** §1.1 lists 7 primary and 13 compatible
aliases, and states plainly that **unrecognized names are ignored**. `*` is not
among them. Applying the documented rule literally, `tools: ["*"]` is one
unrecognized name, ignored, leaving an agent that has declared an **effectively
empty allowlist**. On the direct path that may be harmless if a base set exists.
On the **delegated** path, where 0.63.1 established an agent receives *only* its
declared tools, the plain reading is that it receives **nothing**. Rolling `['*']`
across 56 agents is a plausible silent, total capability wipe on the path this
repo runs on. `R1` in the run matrix exists solely to test this, and until it
returns, `['*']` is a change whose worst case is catastrophic and whose best case
is a quieter log.

**2. Omission carries the same defect plus a second one.** Omission only works if
the host base-grants — the exact hypothesis under test. And it is *already known
to fail for one tool*: 0.63.1 exists because a delegated agent did **not**
implicitly receive `skill`. Beyond that, omission deletes the repo's only
machine-readable statement of intent. Three mechanisms read the declared array
and all three go dark: `requires_tools` enforcement
(`validate-plugin.mjs:648-672`), the per-agent capability-loss disclosure rule
(§7.3), and any future audit of what a dispatched agent may do in a user's repo.

**3. Least privilege here is a designed boundary, not a slogan.** These agents
are dispatched autonomously into someone else's repository.
`validate-plugin.mjs:237-241` records that `principal-ai-researcher` and
`principal-ai-applied-engineer` hold **no shell by design** — an explicit,
reviewed privilege boundary. A wildcard erases it and hands a shell to two agents
documented as not having one. Six skills' `requires_tools` gates become
unverifiable. Priority 2 is not negotiable against a log line.

**4. The asymmetry settles it.** Cost of keeping enumeration: a cosmetic warning
that this design has now proven benign on the direct path. Cost of `['*']` or
omission: an unbounded, unauditable grant with a plausible silent-zero failure
mode on the delegated path. Not close.

### 5.1 Should the loader contract stop rejecting a missing `tools:` key and an empty array?

Current behaviour, `observed` at `scripts/lib/loader-contract.mjs:83-89`: a
missing `tools` key is rejected (`frontmatter is missing 'tools'`), and
`tools: []` is rejected (`frontmatter 'tools' array is empty`).

**Keep both rejections. Change only what they claim.** The rejections are
*correct as kai's authoring rules* and *wrong as statements about the host* — the
host demonstrably accepts agents with no frontmatter at all (its built-in agent
types have none). So the check stays and the framing is corrected:

> not — "the host would reject this"
> but — "kai requires an explicit, non-empty allowlist: least privilege is
> declared, not inherited."

This is a comment-and-message change with **zero behaviour change**, and it is
what keeps §5's ruling enforceable instead of merely recommended. `*` is **not**
added to `SUPPORTED_TOOLS`.

---

## 6. Ruling — the loader-contract correction

### 6.1 The false claim

`scripts/lib/loader-contract.mjs:3-4`, `observed` verbatim:

```js
// This is the single source of truth for how a Copilot host parses and accepts
// an agent/skill's frontmatter. Both guards import it so they can never drift:
```

It structurally cannot be. No file in this repo can be the source of truth for an
external binary's parser. That sentence is what turned an unmeasured list into a
CI-enforced certainty and is why a 112-file rename looked reasonable.

**It is worse than an internal comment: it ships.** `packs/kai-core/scripts/lib/
loader-contract.mjs` exists because `scripts/generate-catalog.mjs` is a
body-referenced asset and `loader-contract.mjs` is inside its import closure
(`observed`: `packs/kai-core/scripts/generate-catalog.mjs:23`). The false claim is
therefore **published inside the `kai-core` plugin** every department pack
requires. That raises it from a tidy-up to a correctness fix.

### 6.2 The correction, exactly

Replace the header:

```js
// Shared authoring contract for kai's agent/skill frontmatter.
//
// Single source of truth for what kai declares and requires of its OWN entries —
// not for how a Copilot host parses them; no file here can hold that authority.
// Host behaviour is measured, dated and recorded by scripts/host-tool-probe.mjs
// against test/fixtures/host-tool-conformance.json. Both guards import this so
// they cannot drift from each other:
```

Replace the `SUPPORTED_TOOLS` preamble (`:11-13`):

```js
// kai's declared tool vocabulary — a LINT HEURISTIC, not a host allowlist. It
// constrains what kai's own entries may declare. Whether the host recognises a
// name is a separate, measured question; see host-tool-probe.
```

Replace the rejection message (`:94`), because it asserts host knowledge:

```js
//  was: `declares unsupported tool "${tool}" (not in the host allowlist)`
//  now: `declares "${tool}", which is not in kai's tool vocabulary (SUPPORTED_TOOLS)`
```

**Coupled edit the next pass must not miss:** `scripts/host-contract.mjs:179`
asserts the rejection reason with `re: /unsupported tool/i`. Changing the message
without updating that regex turns a green `npm run host-contract` red. Retain the
words `unsupported tool` in the message, or change both in the same commit. This
coupling is `observed`, not predicted.

### 6.3 Measured evidence or labelled heuristic? — **Labelled heuristic now; measured provenance incrementally.**

Making `SUPPORTED_TOOLS` "measured-evidence-backed" **today** would be a false
claim of a different kind — nothing has been measured yet. The honest ladder:

1. **Now (the minimum correction, and it is not optional):** §6.2. The list is
   explicitly a lint heuristic; the message stops asserting host behaviour.
2. **After the first probe run:** annotate each entry with its provenance —
   `measured: CLI <version>, <date>, <run id>` or `assumed: never measured`.
   Still a comment. Still zero behaviour change. It converts an unfalsifiable
   list into a **dated** claim that can go stale visibly.
3. **Later, and only as a proposal:** `validate-plugin` fails when an entry is
   `assumed`, or when the newest measurement predates the CLI version the repo
   targets. **This adds a gate → `expands-scope` → PROPOSAL, not a commit.**

Bottom line, unchanged from the prior pass: only a host-backed check prevents
recurrence. Steps 1–2 stop the repo from *believing* it is protected, which is
the more urgent error, and step 3 is the operator's call to fund.

**Edit arithmetic.** `scripts/lib/loader-contract.mjs` is one hand-edited file
plus one **generated** mirror. The `packs/kai-core` copy is not a third source of
truth to hand-edit — it is regenerated by `pack-preview --write`, and skipping
regeneration turns `pack-preview --check` red. One edit, one regeneration, one
parity check.

### 6.4 The structural finding, restated so it is not lost

`test/README.md:41-45` claims the allowlist check means *"a shipped agent never
silently loses a capability."* It does not. It proves agents agree with a
hand-maintained list; nothing proves the list agrees with the host. That is **an
unfalsifiable assertion wearing a CI gate's uniform** — which is why this defect
reached users at `1.0.4` with CI fully green and was found by a user reading log
noise. The probe is the first thing in this repo that could have caught it, and
it is the concrete first implementation of the host-backed layer `test/README.md`
books as a follow-up under #33.

---

## 7. The follow-on replacement PR — specified, not executed

### 7.1 Expand / migrate / contract — the sequence, and why it is not one PR

The naive shape is one 214-file PR that changes the vocabulary and every
declaration at once. That PR is unreviewable, unrevertible in parts, and — because
both halves of every file regenerate from the same root — can be **green and
wrong**: a mistaken root edit reproduces faithfully into the mirror and byte
parity is *satisfied*. Parity proves the generator ran, not that the content is
right.

Split it on the vocabulary seam so every step is independently green and
independently revertible:

```text
  PR-A1  EXPAND        SUPPORTED_TOOLS accepts BOTH old and new spellings.
  (small)              + §6.2 header/message correction (+ host-contract.mjs:179)
                       + scripts/host-tool-probe.mjs + lib/tool-conformance.mjs
                       + fixtures + package.json wiring + CHANGELOG + version bump
                       ZERO declaration changes. 0 agent bodies touched.
                       Revert = revert. Nothing depends on it yet.
         |
         v
  PR-A2  MIGRATE       56 root agents + 56 regenerated mirrors.  (112 files)
  (mechanical)         Per-agent capability-loss disclosure table (§7.3).
                       Green because A1 already accepts both spellings.
         |
         v
  PR-A3  MIGRATE       51 root skills + 51 regenerated mirrors.  (102 files)
  (mechanical)         Same disclosure rule. Same reason it is green.
         |
         v
  PR-A4  CONTRACT      remove the retired spellings from SUPPORTED_TOOLS.
  (small)              Only now can a regression be caught by CI.
```

Total surface is **214 declaration files**, not 112 — the 51 root skills and
their 51 mirrors also declare the warned tokens (`observed`, prior pass). An
agent-only fix would leave half the declarations in the defective state while the
acceptance box read satisfied.

### 7.2 The branch is chosen by the probe, not by the documentation

Read `findings` from the probe report. Do not read the docs. The docs and the
binary disagree — that is the whole reason for the probe.

| probe result | branch | what ships |
|---|---|---|
| `warning_free_spelling_exists: true` and `delegation_differs: false` | **B1 — migrate** | PR-A1..A4 as above. Primaries + measured-necessary compatible aliases. |
| `warning_free_spelling_exists: false` (primaries still warn — drift confirmed) | **B2 — do not migrate** | **PR-A1 only.** Zero declaration changes. The warnings are documented as benign with the evidence, recorded in CHANGELOG the way 0.49.1 and 0.63.1 were, and an upstream bug is filed against the CLI. |
| `delegation_differs: true` and the delegated path grants only declared tools | **B3 — migrate, load-bearing** | PR-A1..A4, but every token is **replaced, never deleted**, and any token with no accepted replacement is a hard stop (§7.3). Highest risk; the probe is mandatory, not advisory. |

**B2 is not a cop-out, and it must be said out loud:** if the live binary warns on
`edit` — a documented primary alias — then **there may be no spelling that is both
warning-free and documented-correct**. In that case the honest engineering answer
is to spell it correctly, accept the residual warnings, and fix the drift at its
source. B2 contradicts milestone 0's committed Outcome ("the repeated runtime
warnings … stop"), so it is the steward's re-scope, not mine to write into a diff.
PROPOSAL-2 from the prior thread remains live and unanswered.

### 7.3 Capability-loss disclosure rule — binding on whichever branch runs

A `sed` over 214 files produces one diff and zero statements about 56 agents. The
rule, carried forward from the prior pass and now load-bearing:

1. **Per agent, per token — never fleet-wide.** For each changed declaration,
   state exactly one of: `replaced -> <accepted name>` /
   `removed, capability retained (measured base-grant, evidence: <probe run id>)` /
   `removed, CAPABILITY LOST: <what this agent can no longer do>`.
2. **Any row in the third class stops the PR** and routes to the steward. It is
   not a diff comment.
3. **Name the behaviour, not the tool.** "`principal-swe-infra` can no longer
   write a new IaC module" — not "`create` removed".
4. **CI will not catch a capability loss here.** `requires_tools` only guards
   `[bash, shell]` across six skills (`observed`), so none of the warned tokens
   is protected by any gate. The disclosure table is the **only** guard. Say so
   in the PR body.
5. **Every "the host grants it anyway" claim cites a `grant_delegated` value**,
   not a `grant_direct` one. 0.63.1 is the precedent and the warning.

### 7.4 Ordering against milestone 2's PR-3 — binding

**This item reaches its terminal state before `area-plugins-m2-mode-selection`
(milestone 2, PR-3, a 49-agent-body rewrite) opens.** Two whole-fleet rewrites
must not be in flight together:

- `pack-preview --check` is a **single boolean over byte parity** for 56 files.
  With one rewrite in flight, red names the file *and* the cause. With two, it
  names the file only.
- Worse than red is **green-and-wrong** (§7.1). Two concurrent rewrites remove
  the last attribution signal.
- The merge surface is 112–214 hand-resolved conflicted files. A mis-resolution
  that regenerates cleanly passes every gate in this repo.

**Scheduling consequence worth surfacing:** under **B1 or B3** the constraint
holds and PR-3 waits. Under **B2** this item touches **zero** agent bodies — the
collision dissolves entirely and milestone 2 unblocks early. Which branch obtains
is decided by the probe, not by preference.

### 7.5 Regeneration and parity, in every migrating PR

```text
edit roots -> node scripts/pack-preview.mjs --write
           -> node scripts/pack-preview.mjs --check        (byte parity)
           -> node scripts/pack-preview.mjs --gate all
           -> node scripts/validate-plugin.mjs
           -> node scripts/host-contract.mjs --self-test
           -> node scripts/release-guard.mjs --base <sha> --head <sha>
```

And the three-clause milestone-1 carve-out (scope-brief A11) must be named
explicitly in every PR body: topology-neutral; no `preflight-block.txt` /
`degraded-block.txt` / `inherits-block.txt` content change; green under existing
gates with `--check` parity re-established. A PR that cannot claim all three is
not exempt and escalates to the steward.

---

## 8. Scope classification

Per `kai-core-scope-discipline`, at implementation time there is no triage layer
in the loop, so each item is classified rather than quietly built.

| change | class | disposition |
|---|---|---|
| `scripts/host-tool-probe.mjs` + `lib/tool-conformance.mjs` + fixtures | **in scope** | The item's Outcome commissions exactly this. Specified here; authored next pass. |
| §6.2 loader-contract header/message correction (+ `host-contract.mjs:179`) | **in scope** | Item acceptance box 4 names it explicitly. Not written — STOP CONDITION forbids editing that file this pass. |
| `--self-test` added to the `npm test` chain | **in scope** | Offline, deterministic, no host. Same terms as every other guard. |
| Version bump + CHANGELOG for PR-A1 | **forced, not creep** | `release-guard.mjs:20` makes `scripts/` behavior-sensitive. Not a choice. |
| `--check` wired into CI as a required gate | **`expands-scope`** | Needs a CLI binary and credentials in CI. **PROPOSAL** (§6.3 step 3). |
| `validate-plugin` failing on `assumed`/stale `SUPPORTED_TOOLS` entries | **`expands-scope`** | Adds a gate. **PROPOSAL** (§6.3 step 3). |
| Migrating 214 declarations | **`expands-scope` relative to THIS item** | Branch-dependent, steward-gated, and B2 contradicts the committed Outcome. **PROPOSAL-2, still open.** |
| Adding `*` to `SUPPORTED_TOOLS` | **rejected** | §5. |

---

## 9. What could make this design wrong

Stated plainly, because a design that lists no failure mode has not been thought
about.

1. **The host may offer no non-interactive mode that surfaces validator warnings
   on stderr.** If `copilot -p` swallows them, CHANNEL A has no source and the
   probe measures only grants. Mitigation: `--plan` prints the exact argv so the
   operator can adjust it in one place; the first live run is an operator-assisted
   calibration, not an unattended job. If CHANNEL A proves unavailable, say so in
   `caveats` and report `validator: unobserved` — never `silent`.
2. **`--plugin-dir` may not accept a bare `agents/` tree without a `plugin.json`.**
   Mitigation: the materialised temp plugin carries a minimal `plugin.json`
   declaring `agents/` and `skills/`. Prior art: 0.49.1's live run and the
   pack-split first-install proof both used repeated `--plugin-dir`.
3. **One host, one OS, one build.** This is a measurement, not a specification.
   `caveats` says so, and the committed baseline is keyed by
   `host.copilot_version` + `platform` so a second measurement extends the record
   rather than overwriting it.
4. **The search-family proof is corroborating, not exclusive** — a read tool could
   brute-force the needle. Recorded honestly as *search-family capability present*.
5. **A model that refuses the probe prompt** yields an empty `<<<KAI-PROBE>>>`
   block → `unobserved`, not `absent` (self-test assertion 4). The failure mode is
   an admitted non-measurement, which is the correct one.

---

## 10. Evidence ledger

**`observed`** — first-hand file reads at `C:\src\kai`, this session:

- `scripts/lib/loader-contract.mjs:1-12` (the false "single source of truth"
  header), `:14-28` (`SUPPORTED_TOOLS`, 16 entries), `:83-89` (missing `tools`
  and empty-array rejections), `:94` (the "not in the host allowlist" message).
- `scripts/host-contract.mjs:26` (imports the contract), `:175-182`
  (`INVALID_FIXTURES`, `unsupported-tool.agent.md` matched by
  `/unsupported tool/i`), `:204+` (`--update` convention).
- `scripts/lib/pack-plan.mjs:869-872` (`ASSET_REF`, top-level scripts only,
  "`scripts/lib/` is build-internal"), `:973` (`collectReferences` reads agents
  and skills only), `:1073` (`planAssets`), `:1172` (`planAssetClosure`).
- `scripts/release-guard.mjs:20` (`BEHAVIOR_PREFIXES` includes `scripts/`).
- `scripts/check-syntax.mjs:39` (recursive `.mjs` collection under `scripts/`).
- `scripts/validate-plugin.mjs:237-241` (the two agents with **no shell by
  design**), `:648-672` (`requires_tools`), `:836-838` (allowlist enforcement).
- `packs/**/scripts/` holds exactly 15 files; `validate-plugin.mjs`,
  `pack-preview.mjs`, `release-guard.mjs`, `host-contract.mjs`,
  `check-syntax.mjs` appear in none of them.
  `packs/kai-core/scripts/generate-catalog.mjs:23` imports
  `./lib/loader-contract.mjs` — the shipping path of the false claim.
- `package.json` (`test` chain, `engines`, version `1.0.4`),
  `plugin.json` (`agents/` + `skills/`),
  `.github/plugin/marketplace.json` (`installSurface: packs`, five packs).
- `test/README.md:41-45` (the "never silently loses a capability" claim) and its
  "Host-backed checks (not yet automated)" section (#33).
- CHANGELOG `[0.49.1]` (`bash` → `view, skill, sql` on Windows; both names are
  the portable form) and `[0.63.1]` (delegated agents receive only declared tools).
- The prior pass's full enumeration: 56 root agents + 56 mirrors + 51 root skills
  + 51 mirrors = **214** declaration files.

**`reported`** — supplied by the operator or the dispatch, not verified here:

- The documented primary/compatible alias vocabulary and the "unrecognized names
  are ignored" rule (§1.1). No web tool was bound this session.
- The live CLI warning on lowercase `create`, `edit`, `grep`, with runtime
  capability retained.

**`not run`** — this session has **no shell**: `node`, `npm`, `git`, `gh`,
`copilot`. `npm test`, `pack-preview --check`, `--gate`, `validate-plugin`,
`host-contract`, `release-guard`, and the probe itself were **not executed**. No
claim above depends on an execution I did not perform.

---

## 11. Open question

`Q-area-plugins-host-tool-conformance-01` — the first live probe run. Recorded in
full in `kai/coordination/threads/area-plugins-host-tool-conformance.md`,
`kind: action`, `blocking: yes`, to `@operator`. It cannot be answered by any
role in this repo without a shell, and no branch in §7.2 may be selected without
it.
