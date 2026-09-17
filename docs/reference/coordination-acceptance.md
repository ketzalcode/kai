# Coordination runtime: acceptance record

Recorded 2026-09-17 against the prepared `12.0.0` source metadata.

This document is the public claim surface for the coordination runtime prepared
for version **12.0.0**. It walks the acceptance-case table in
`docs/superpowers/plans/2026-09-16-core-coordination-evidence.md` (section
**Task 11**) and gives every case exactly one verdict:

- **Covered by automated test** — a named suite and case assert the behaviour.
- **Measured against the installed host** — a named artifact records what was
  actually observed when the installed Copilot CLI ran.
- **Not verified** — nothing here establishes it, and the missing piece is named.

There is no fourth verdict. A case that is only partly established is split into
the part that is covered and the part that is not.

## Release stop conditions the 12.0.0 preparation does not fix

- `npm test` is **RED**. It fails at `validate-plugin` with **260 errors**
  (observed on 2026-09-17 with Node 24.15.0). None come from the
  coordination runtime: 250 are in pre-release packages and repository docs, and
  the 10 in `plugins/kai-core/**` are pre-release package-family naming and
  references to retired `principal-*` agents. Those same references exist on
  `origin/main`, so they pre-date the coordination runtime.
- `node scripts/pack-preview.mjs --self-test` and
  `node scripts/pack-preview.mjs --gate all` both abort with a pre-existing
  `TypeError: Cannot read properties of undefined (reading 'includes')` at
  `scripts/pack-preview.mjs:390`. `--check` passes.
- Both are release stop conditions. The 12.0.0 preparation fixes neither, so the
  runtime is **not released**.
- The `12.0.0` metadata is prepared metadata only. It is
  not a tag, not a release, not a publication, and not a host-verification claim.

## What is not claimed anywhere in this document

- **No latency, cost or quality improvement.** No baseline/new comparison was
  run, so no speedup, saving or quality gain is claimed or implied.
- **Premium-request units and nano-AIU are not dollars.** Session usage counters
  observed in host captures are cumulative session observations. They must not be
  summed as independent per-attempt costs or converted to currency.
- **Human approval fixtures are synthetic.** Every operator approval used by a
  test is a clearly labelled synthetic fixture written into an isolated test
  home. No case here rests on a real human acceptance decision.
- **The workflow YAML was eye-reviewed, not parsed.** The comment reflow in
  `.github/workflows/validate.yml` was read by eye; no YAML parser or schema
  check was run against it for this record.

## Acceptance cases

| Case (plan coverage row) | Verdict | Evidence |
| --- | --- | --- |
| Existing protocol defects and three-package authority | Covered by automated test | `test/coordination-authority-self-test.mjs` and `test/coordination-source-routing-self-test.mjs` assert the shipped core skill and agent sources — the routing verbs, authority wording and three-package ownership. These are source-contract assertions over documents, not runtime behaviour. |
| One transactional authority, idempotency, concurrency, recovery | Covered by automated test | `coordination-store-self-test.mjs`: *receipt insertion failure rolls back the primary write and event*, *late receipt failure rolls back and exposes rollback uncertainty*, *read operations translate SQLite lock exhaustion to STORE_BUSY*. `coordination-engine-self-test.mjs`: *duplicate message command returns its original receipt*, *recovery requires expiry plus reconciled evidence and invalidates the stale token*, *conflicting recovery blocks and routes to operator without a new lease*. `coordination-cli-self-test.mjs`: *real SQLite writer contention returns retryable exit 2 without replaying the command*. |
| Typed addressed messages and multiple-blocker restoration | Covered by automated test | `coordination-thread-self-test.mjs` (thread/question parsing and reconciliation). `coordination-engine-self-test.mjs`: *blocking questions update item, question, and message atomically*, *answers enforce addressed sender, recipient, parent, and operator reservation*, *the required two-blocker restore case refuses role-name-only authority*, *out-of-lane and contradictory answers do not clear blockers*. |
| Bounded context with retrievable evidence | Covered by automated test | `coordination-context-self-test.mjs`: *all mandatory obligation, hold, question and reference bytes overflow explicitly at 24 KiB*, *mandatory Unicode context uses actual UTF-8 bytes and never truncates acceptance*, *10,000 messages keep projection metadata bounded and remain pageable*, *projection holds one SQLite snapshot while a WAL writer advances*. A real coordinated agent reading this projection through the CLI was **attempted and failed** — see scenario 1 below. |
| Content-bound engineering/creative evidence and independent acceptance | Covered by automated test | `coordination-evidence-self-test.mjs`: *observed evidence needs trusted capture, successful complete results, privacy and exact coverage*, *a valid capture cannot be replayed against a different claimed outcome*, *review and approval cannot self-accept an exact subject artifact produced outside item history*, *post-registration byte changes prevent later review, even while original manifest exists*. `coordination-inputs-self-test.mjs` covers input-basis invalidation. `coordination-cli-self-test.mjs` runs the whole engineering and creative chain as real processes. |
| Offline HTML, privacy, provenance, snapshot honesty | Covered by automated test | `coordination-report-self-test.mjs` (45 cases), including *renderers escape untrusted text, stamp snapshots and never invent model or cost*, *lease bearer tokens never reach either human renderer or derived sidecars*, *visible provenance and redaction notice include actual omitted bearer fields*, *derived immutable outputs carry identity, sequence, time, hashes and no YAML header*. CI runs this suite on Node 22, 24 and 26. The browser leg (`npm run coordination:report-browser-self-test`) is **not** part of `npm test` or CI and was **not** run for this record. |
| Explicit profiles, actual-versus-requested models, measured costs — profile/model policy and telemetry handling | Covered by automated test | `coordination-host-self-test.mjs`: *only approved available models and supported overrides are planned, never an invented fallback*, *six real core sources retain their profiles and acquire the shared approved model pins*, *unknown model, effort, usage, cost and timings survive actual persisted host results as null*, *allowlisted telemetry keeps premium/nano-AIU cumulative checkpoints, not fabricated dollars or internals*, *failed and mismatched model or effort observations remain explicit gaps, not domain acceptance*. |
| Explicit profiles, actual-versus-requested models, measured costs — requested versus observed model on a **coordinated dispatch** | Not verified | Observed models exist only for **direct** role runs (`host-engineering-direct-baseline.json`: `gpt-5.6-terra`; `host-creative-direct-baseline.json`; `host-creative-direct-noeng.json`: `claude-opus-5`). No run pinned a model through a coordinated dispatch and then compared the requested pin against the observed `assistant.message` model. Elapsed times and usage counters were captured, but no baseline/new pair was run, so no comparison of any kind is claimed. |
| Legacy inspection, schema-4 migration, private/shared semantics | Covered by automated test | `coordination-migration-self-test.mjs` (57 cases), including *explicit offline migration preserves bytes and IDs while converting safe source authorities*, *actual rename failure before activation leaves source authoritative and explicit recovery usable*, *tracked SQLite is refused and shared privacy admission only changes private Git metadata*, *a competing real process cannot migrate while the offline owner holds its lock*. `coordination-cli-self-test.mjs` adds the schema-3 inspect-only and rollback process cases. |
| Direct-use preservation — direct work needs no database and no sibling package | Measured against the installed host | Scenario 2 below: a real creative direct run with only `kai-core` and `kai-creative` installed completed with `changedFileCount` 0 and created no coordination database (`host-creative-direct-noeng.json`, `scenario-direct-creative.json`). Supporting test: `coordination-cli-self-test.mjs` *direct domain commands have no implicit workspace or database requirement*. |
| Host capability degradation — role absent from the installed roster | Measured against the installed host | Scenario 3 below: `ROLE_UNAVAILABLE`, `retryable: false`, no substituted role, no model prompt (`scenario-role-unavailable.json`). Supporting test: `coordination-host-self-test.mjs` *missing exact role and ambiguous qualified IDs fail rather than alias matching*. |
| Host capability degradation — missing `node:sqlite` | Covered by automated test | `coordination-cli-self-test.mjs` *SQLite-disabled process is a precise host gap; context override cannot exceed 24 KiB*. No run on a host without `node:sqlite` was performed. |
| Packaging and pack ownership | Covered by automated test | `test/coordination-foundation-self-test.mjs` asserts that `materializePacks` emits `kai-core/scripts/coordinate.mjs` and the runtime module closure, and that neither `kai-creative` nor `kai-engineering` receives the executable. `node scripts/pack-preview.mjs --check` passes against the committed `plugins/` tree. |
| Release policy gate | Not verified | `pack-preview --self-test` and `--gate all` abort on the pre-existing `TypeError` above, so the generator's own gates never execute. `npm test` never reaches them because `validate-plugin` fails first. |
| Actual-host acceptance — coordinated handshake (prepared identity, reservation ordering, worker environment, exact CLI receipt) | Measured against the installed host | `test/coordination-native-handshake-self-test.mjs`, one real Copilot 1.0.85 run (gated by `KAI_TEST_NATIVE_HANDSHAKE=1`, recorded in `native-permission-report.md`): the prepared UUID became the actual session, model work followed the reservation, and both the environment identity and the CLI receipt matched. The human approval was a synthetic fixture, so this is not human acceptance. |
| Actual-host acceptance — coordinated evidence registration by a real agent | Not verified | Attempted once in scenario 1 below and failed: both worker tool calls were denied by the host, so no context read, no content proof and no observed evidence were produced from a real run. |

### Host-acceptance sub-cases named in the Task 11 checklist

| Sub-case | Verdict | Evidence |
| --- | --- | --- |
| Requested versus observed model on a coordinated dispatch | Not verified | No coordinated run pinned a model and then compared it to the observed model. |
| Observed model on a direct role run | Measured against the installed host | `host-engineering-direct-baseline.json` (`gpt-5.6-terra`), `host-creative-direct-baseline.json`, `host-creative-direct-noeng.json` (`claude-opus-5`). The model is read from `assistant.message` metadata. |
| Elapsed time and actual usage | Measured against the installed host | `host-creative-direct-noeng.json` records per-call `durationMs`, `apiDurationMs` 4563, `sessionDurationMs` 8692, `totalNanoAiu` 6771700000 and `premiumRequests` 15. These are raw cumulative session observations, not dollars, and are not compared to anything. |
| Independent outcome for equivalent baseline/new cases | Not verified | No equivalent pair was run. The direct baselines and the scenarios recorded below are different prompts against different package sets; comparing them would be dishonest. |
| Long-thread case | Not verified | Covered in tests only, which is not host acceptance: `coordination-context-self-test.mjs` *10,000 messages keep projection metadata bounded and remain pageable*, `coordination-report-self-test.mjs` *agent context stays bounded while human export uses linear bounded keyset pages*. No long thread was driven through a real agent. |
| Missing peer | Not verified | The installed host's advertised `peerDispatch` is `false` (measured metadata, `host-acp-capabilities.json`), and planning behaviour is covered by `coordination-host-self-test.mjs` *no-peer planning emits an ordered manual queue with the exact host ID and fresh context*. No run exercised a peer that went missing mid-flight. |
| Interrupted dispatch | Not verified | Covered in tests only, which is not host acceptance: `coordination-host-self-test.mjs` *timeout is unknown liveness even with elapsed local timing, and a later host fact may resolve it*, *unsupported resume, uncertain liveness and attempt bounds prevent redispatch*, *lost acknowledgement is durable uncertainty and the same operation retrieves its original receipt*. |
| Private HTML evidence from a host run | Not verified | The report suites render and check HTML from seeded runtime state. No HTML report was produced from a real coordinated host run, and the browser acceptance leg was not run for this record. |

## Installed-host scenarios recorded here

Three scenarios were run once each against the installed Copilot CLI **1.0.85**
on 2026-09-17, under narrow `--allow-tool` command stems (never `--allow-all`),
with `--deny-tool=write`, `--no-ask-user` and built-in MCP servers disabled. They
are driven by `test/coordination-native-scenarios-self-test.mjs`, which is gated
by `KAI_TEST_NATIVE_SCENARIOS=1` and is deliberately **not** part of `npm test`
or CI. Every host capture was sanitized through the existing allowlist
(`sanitize-host-output.mjs`): allowlisted response and execution metadata only,
with the raw capture deleted. No reasoning or cache internals are retained.

### Scenario 1 — coordinated engineering worker reads context and records evidence: **FAILED**

Goal: a real agent, launched under a prepared identity with a persisted lease,
reads its bounded context through the CLI and produces the content proof that an
observed-tier evidence record then binds to.

What actually happened:

1. Preparation, the synthetic-fixture grant and the lease reservation all
   succeeded against the real host (`prepare` is metadata-only;
   `modelPromptSent` was `false`).
2. The launched worker exited 0 and started both requested commands, but **both
   tool calls completed with `success: false`, error code `denied`, message
   "Permission denied and could not request permission from user"**. Nothing ran.
3. The capture conversion then failed with `AUTHORITY_REQUIRED`: *canonical
   request must match one native interaction*.
4. A second, independent defect was observed in the same journal: the command
   recorded by the host omitted the `# Kai capture <nonce>` comment line that the
   runtime prepends to a capture request, so the exact-match rule would not have
   matched even if execution had been permitted. The earlier handshake run *did*
   reproduce that line verbatim, so exact-command capture currently depends on
   the agent reproducing a generated comment line — model-dependent behaviour,
   not a guarantee.

No evidence was registered. The scenario is recorded as a failure and was not
retried; a retry that passed would not change what this run measured.

A plausible cause of the denial is that this launch, unlike the passing handshake
launch, granted no `--add-dir` trusted read directory for the runtime source the
command references, while `--no-ask-user` prevented any prompt. **That
explanation is a hypothesis, not a measurement** — confirming it needs another
host run, which the 12.0.0 acceptance work did not spend.

The same runtime plumbing (bounded context read, content proof, capture
conversion, `EVIDENCE_GAP` without a capture, observed-tier registration bound to
the receipt) does pass in the test's `rehearsal` mode, where the commands run
locally inside clearly synthetic native frames. That establishes the runtime
path, **not** host acceptance.

### Scenario 2 — direct creative work with core+creative installed, no engineering: **PASSED, with a gap**

- Only `kai-core` and `kai-creative` provider directories were supplied. The
  measured roster contained six `kai-core:*` and three `kai-creative:*` agents and
  **no** `kai-engineering:*` entry.
- The real run completed (exit 0). Observed model: `claude-opus-5`.
  `changedFileCount` was 0. Artifact: `host-creative-direct-noeng.json`.
- No coordination database was created anywhere in the workspace, and
  `coordinate direct` reports `coordinationRequired: false`. Direct work needs
  neither a database nor the sibling engineering package.
- Gap: the agent's own `node scripts/coordinate.mjs direct` call was **denied**
  with the same `denied` code as scenario 1, so the in-host confirmation of that
  command is missing; the `direct` result quoted here was produced by the local
  harness process, not by the agent. The agent reported the denial plainly rather
  than inventing output, which is the behaviour the runtime depends on.

### Scenario 3 — role the installed host does not advertise: **PASSED**

- With only `kai-core` and `kai-creative` installed, `coordinate prepare` for
  `eng-builder-software` returned exactly
  `{"ok": false, "code": "ROLE_UNAVAILABLE", "retryable": false}` with the message
  *requested preparation role is absent from the actual native roster*.
- `modelPromptSent` was `false`: discovery is metadata-only and no model was
  invoked. No prepared identity was left behind.
- A role that **is** installed (`creative-lead-design`) prepared normally, so the
  refusal is specific and not a blanket failure. No substitute role and no
  fabricated fallback was produced.
- Artifact: `scenario-role-unavailable.json`.

## Evidence index

Repository (public):

- `test/coordination-*-self-test.mjs` — 13 suites in `npm test`; CI runs the nine
  runtime suites on Node 22.22.2, 24.15.0 and 26.0.0.
- `test/coordination-native-handshake-self-test.mjs` — one real coordinated
  handshake, gated by `KAI_TEST_NATIVE_HANDSHAKE=1`, synthetic human fixture.
- `test/coordination-native-scenarios-self-test.mjs` — the three scenarios above,
  gated by `KAI_TEST_NATIVE_SCENARIOS`.

Private session evidence (not committed; kept under `.superpowers`):
`host-creative-direct-baseline.json`, `host-engineering-direct-baseline.json`,
`host-creative-direct-noeng.json`, `host-acp-capabilities.json`,
`scenario-coordinated-engineering.json`, `scenario-direct-creative.json`,
`scenario-role-unavailable.json` and the run log for the three scenarios.

## Summary of what remains unverified

1. Coordinated evidence registration by a real agent (scenario 1 failed).
2. Requested-versus-observed model on a coordinated dispatch.
3. Any baseline/new comparison, and therefore any performance or cost claim.
4. Long-thread, missing-peer and interrupted-dispatch behaviour against a real
   host.
5. Private HTML evidence produced from a real coordinated run, and the browser
   report acceptance leg.
6. The release policy gates, which cannot run while `pack-preview` aborts.
