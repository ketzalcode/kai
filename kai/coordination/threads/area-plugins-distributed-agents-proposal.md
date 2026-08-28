# Thread — area-plugins-distributed-agents-proposal

Append-only communication log mirroring
`kai/coordination/items/area-plugins-distributed-agents-proposal.md`. Never
edited after the fact — only appended. See `kai-core-work-coordination`.

**Environment limit (2026-08-27-2130):** no agent in this session has a shell,
so `kai/initiatives/area-plugins/` cannot be created and the canonical
`artifact_target`
(`kai/initiatives/area-plugins/artifacts/decisions/area-plugins-distributed-agents-proposal.md`)
cannot yet be written. That target is recorded and unchanged. Until one operator
`mkdir` runs, **this thread is the durable record of the proposal framing** — a
real canonical coordination path, not a substitute workspace. When the
initiative directory exists, the packet below is transcribed verbatim.

**This item is `required_for_milestone: false` on purpose.** Nothing in it gates
the P0 sequence, and nothing in it is scope for `area-plugins`. It exists to
produce a GitHub issue the operator files, and then to sit still.

---

## SECURITY-PROPOSAL 2026-08-27-2130 — principal-security

**Mode:** THREAT-MODEL (proposal framing). Not CHANGE-REVIEW — there is no
implementation, no `change_ref`, and nothing to review.
**Scope:** a security-led framing for a GitHub issue about kai agents on
different machines communicating through an exposed endpoint. Framing only.
**Authorization:** read-only inspection of the local worktree at `C:\src\kai`.
**No shell in this session:** nothing was executed, no network call was made, no
scan was run, no tunnel was opened, and no production, script, agent, skill, or
pack file was edited. Every execution-dependent claim below is `reported` or
`inferred` and labelled as such.
**Sensitivity:** public open-source repository. No credentials, customer data,
tenant identifiers, private topology, or incident material is in scope, and none
appears in this record.
**Verdict:** **CONDITIONAL** — the proposal may be filed and discussed as an
RFC, under the conditions in *Required controls*. Any **implementation** of any
option in it starts at **BLOCK by default** until the four design questions
marked `must-answer-before-code` are resolved with evidence. Filing the issue is
not risk acceptance, and this record is not a design sign-off.

---

## 1. Decision and scope

The decision this record supports is narrow: **may the operator's main agent
file a GitHub issue proposing distributed multi-PC kai agent communication, and
what must that issue carry so that "exploring it" cannot quietly become "we
started building it"?**

Reviewed, exactly:

1. kai's current coordination model as written in
   `skills/kai-core-work-coordination/SKILL.md`;
2. the current telemetry surface — `hooks.json`,
   `scripts/observe-subagent.mjs`, `scripts/observe-watch.mjs`,
   `scripts/lib/activity.mjs`, and the `.gitignore` lines that cover their
   output;
3. the workspace/identity model in
   `skills/kai-core-workspace-conventions/SKILL.md`, including
   `corpus_visibility` and the existing linked-workspace registry;
4. the release boundary in `skills/kai-core-definition-of-done/SKILL.md`;
5. prior in-repo security judgment for tone and actor vocabulary
   (`kai/initiatives/pack-split/artifacts/security/pack-split-degraded-refusal.md`).

**Deliberately excluded**, named so absence is not read as approval: any
protocol design, any wire format, any dependency selection, any tunnel-provider
evaluation, any key-management design, any cost/effort estimate, and any
statement about whether the operator *should* want this feature. Product desire
is `principal-product-manager`'s and the operator's call, not mine.

---

## 2. The draft GitHub issue

Everything between the fences is the deliverable. It is written to be filed with
minimal editing. Placeholders are marked `<…>`.

```markdown
RFC — Distributed multi-PC kai agents over an exposed endpoint (proposal only, threat model first)
```

Alternative title if a shorter one is wanted:

```markdown
RFC: can kai agents on different machines coordinate safely? (proposal only)
```

### Issue body

```markdown
> **Status: PROPOSAL / RFC. Nothing here is scheduled, designed, or agreed.**
> No implementation is in scope. This issue exists to hold the brainstorming and
> to force the threat model to be written before any code is. It does not gate
> any milestone.
>
> Filing this issue is not a decision to build it. See *Decision criteria* and
> *What would make this not worth building* before proposing an approach.

## 1. Problem

kai's coordination model assumes **one synchronized working tree**. That
assumption is load-bearing, not incidental:

- `kai/coordination/items/<id>.md` is the authoritative state for one work item;
  `threads/<id>.md` is its append-only log; `BOARD.md` is a derived index.
- There is exactly **one lease grantor per item per tree**. The grantor reserves
  items one at a time, so no two writers race the same record.
- A grant is `holder` + `token` + `version_at_grant` + `acquired` + `expires`,
  and the grantor **re-reads immediately after writing** to confirm nothing
  intervened.
- Every dispatched role **re-reads and verifies** `holder`/`token`/`version`
  before *each* state-changing write, and stops with a `COLLISION` record if
  they no longer match.

Safety here comes from one property: **every writer shares one filesystem, and
the authoritative record is a local file that can be re-read.**

The contract already states the limit plainly:

> Serial granting is only atomic **within one synchronized working tree**.
> Across machines, clones, or unmerged branches the committed lease state is not
> shared until synchronization, so two trees can grant the same item
> independently. kai does **not** claim to prevent that.

and it already names the escape hatch:

> A host that exposes an atomic lock primitive may layer it under this protocol,
> but the contract does not require one.

So the honest problem statement is **not** "kai cannot do multi-machine." It is:
*the supported multi-machine story today is git plus human serialization, and we
have not written down a use case that story provably cannot serve.* Section 6
asks for those use cases before anything is designed.

## 2. Motivating use cases — TO BE FILLED IN, deliberately empty

This section is intentionally blank. It is the single most important part of the
issue and it is the operator's to write.

Each entry should say: what someone was doing, on which two machines, what went
wrong, and **why pushing a branch did not solve it.** A use case that a shared
git remote already serves is not a motivating use case for a network transport.

    | # | Scenario | Machines | Why git/branching does not solve it |
    |---|----------|----------|--------------------------------------|
    | 1 | <…>      | <…>      | <…>                                  |

**Nothing below this line should be designed until at least three rows exist.**

## 3. Non-goals

- Not a remote code execution channel. If a remote peer can cause files to be
  written on another person's machine, that is the headline feature and it must
  be justified as such, not slipped in as a side effect of "coordination."
- Not a replacement for git. Git already synchronizes the corpus, is
  content-addressed, is hash-chained, and is reviewable.
- Not a hosted service, an account system, or a SaaS product.
- Not a way to run kai unattended. The human approval boundaries in section 8
  do not move.
- Not a way for a machine to mark work `shipped`. kai never deploys; a human
  runs the deploy and a human's evidence is what makes `shipped` true.
- Not in scope for the current initiative. This issue must not acquire
  implementation tasks.

## 4. Threat model (this section leads, on purpose)

A feature list written before a threat model produces a design that has to be
un-built. The order here is deliberate.

### 4.1 Assets

| Asset | Why it is the asset |
|---|---|
| **Integrity of the coordination corpus** (`kai/coordination/**`, `kai/initiatives/**`) | A forged item state, review record, or HANDOFF is a lie a human later acts on. |
| **Integrity of the developer's working tree** | Agents write code. A channel that can cause a write is a channel that can cause a supply-chain change. |
| **Truthfulness of claims** — `completed_reviews`, `change_ref` binding, `shipped` | This is kai's actual product. A replayed "shipped" is worse than a normal security bug: it corrupts the promise, not just the data. |
| **Telemetry payload** — `.kai/observed.jsonl`, `.kai/activity.jsonl` | Derived from full subagent response text and absolute paths. Both are gitignored *because* of what they derive from. |
| **Local secrets reachable from the tree** | `.env`, credentials, tokens. kai holds none today; a transport creates the first path by which any of it could leave the machine. |
| **The operator's attention** | A trustworthy-looking forged HANDOFF spends it. This is a real asset and it is the one most cheaply attacked. |

### 4.2 Adversaries

| ID | Adversary | Capability assumed |
|---|---|---|
| A1 | **Network attacker on the tunnel** | Reaches the public URL; observes, drops, reorders, and replays; attempts MITM. |
| A2 | **Malicious or compromised peer workspace** | A legitimately enrolled machine that is now hostile — stolen laptop, compromised session, or a peer acting in bad faith. |
| A3 | **Malicious repo content / prompt injection** | Untrusted content an agent reads while working — issue bodies, fetched pages, files, dependency READMEs. kai's own prior security work already treats this as a first-class actor. |
| A4 | **Confused deputy via forged work packet** | Supplies something packet-shaped that a receiving agent treats as an authorized dispatch. |
| A5 | **Replay / reorder adversary** | Captures valid traffic and re-sends it later, or out of order. |
| A6 | **Stale-lease / clock-skew adversary** | A resurrected crashed run, or a peer whose wall clock is wrong, acting on an expired grant. |
| A7 | **Insider with the tunnel URL** | A teammate, a screenshot, a URL pasted into a chat or an issue. Tunnel URLs are routinely treated as unguessable-therefore-secret. |
| A8 | **The tunnel provider** | TLS terminates at their edge. They see plaintext unless something above the tunnel is authenticated and encrypted end to end. |
| A9 | **Supply chain of the transport** | kai currently ships no networking dependency at all. The first one is a new trust relationship for every installer. |
| A10 | **A curious future contributor** | Not malicious. Enables the transport because it is there, without understanding the boundary. Design for this one; it is the most likely.

### 4.3 Abuse cases

Each is written against a specific kai mechanic, not as a generic checklist.

| ID | Abuse case | Why kai's current defence does not transfer |
|---|---|---|
| AC1 | **Forged grant.** Attacker mints `holder`/`token`/`version_at_grant` and dispatches a remote agent. | "Verify before every state-changing write" means *re-read the authoritative record and compare*. On one filesystem that is a real check. Over a network it becomes *ask a peer and believe the answer* — and if the record is attacker-supplied, the verification is circular. **This is the deepest problem in the whole idea.** |
| AC2 | **Split brain.** A partition lets two trees grant the same item; both act. | The contract's declared backstop is git conflict detection *at integration time*. Over a live channel the work has already been done on both machines, and two divergent authoritative records now exist, each with a HANDOFF that reads as sequential. |
| AC3 | **Replayed release.** A captured "lease cleared / handoff complete" message is replayed after the item was re-granted. | Clears a live holder's lease and enables a legitimate-looking double write. Nothing in the current record shape is replay-aware, because a local file write cannot be replayed. |
| AC4 | **Forged or replayed evidence.** A `completed_reviews` entry is fabricated, or an old one is replayed against the current `change_ref`. | The contract's anchor — only reviews matching the current `change_ref` count — is good, but it only helps if `change_ref` can be resolved and checked *by the machine reading it*. See AC10. |
| AC5 | **Remote `shipped` claim.** A peer asserts production deployment and verification. | `shipped` is the state a human trusts most and can verify least remotely. It is the highest-value forgery in the system. |
| AC6 | **Confused-deputy file write.** A packet declares a benign `touches` set; the instruction body induces writes elsewhere. | `touches` is explicitly a **claim, not a proof**, reconciled by the grantor *after* work is handed back. Over a network the write already landed on someone else's disk. |
| AC7 | **Telemetry exfiltration.** The observed/declared logs cross the wire, or through a provider edge. | Those files are gitignored specifically because the payload they derive from carries absolute paths and full response text. The current redaction boundary was designed for a *local, gitignored file*, not for a network peer or a third-party edge. |
| AC8 | **Secret material inside a work packet.** Context artifacts and file contents ride along. | kai has **no work-packet scrubber**. The only redaction primitive that exists applies to short log notes, caps at 120 characters, and refuses exactly one thing: path-shaped text. It is not a secret scanner and was never claimed to be. |
| AC9 | **Tunnel URL leak.** The URL is pasted, screenshotted, or captured in a log summary. | The optional summary feature stores the first prose line of a subagent reply verbatim and is documented as **not secret-scrubbed**; its one refusal rule targets filesystem path shapes, not URLs. If "the URL is unguessable" is any part of the auth story, this is a live leak path. |
| AC10 | **Unverifiable `change_ref`.** A review is recorded against a commit SHA the recording machine cannot resolve. | `change_ref` is always a git commit/PR SHA, and touch-set reconciliation runs a real `git merge-base` / `git diff --name-only` against it. A reviewer that cannot resolve the object is recording an unverifiable review while it looks identical to a verified one. |
| AC11 | **Attribution laundering.** Two machines' actions are merged into one timeline and mis-paired. | Observed-tier start/stop pairing is documented as *ordering, not identity*, and the run-correlation digest is explicitly a short **non-cryptographic** hash for correlation only. Neither can carry identity across a trust boundary. |
| AC12 | **On-by-install.** A future transport starts listening for everyone who installed the plugin. | Plugin hooks already fire for every installer from their next session; that is precisely why the observer puts its consent gate *inside the script* rather than in host config. Any transport must inherit that discipline or it is a network listener nobody opted into. |

### 4.4 The trust boundary that actually moves

Everything above reduces to one sentence:

> **Today the authoritative record is a local file. Distributed, it becomes a
> remote assertion.**

Every kai guarantee phrased as "re-read the authoritative record" has to be
re-derived under that change. Any proposal that does not address this directly
is not addressing the problem.

## 5. Design questions

Each is a **question with options**, not a settled answer. Four are marked
`must-answer-before-code`: no implementation of any option should begin until
those four have written, evidenced answers.

### 5.1 Authentication — `must-answer-before-code`

*What is authenticated: a connection, a machine, a workspace, an agent role, or
a human?*

| Option | Pro | Con |
|---|---|---|
| Tunnel-provider auth (OAuth / basic / IP allowlist) | Zero build; provider-hardened | Authenticates the **connection**, not the packet. Terminates at the provider edge (A8). Leaves no verifiable artifact after the fact. |
| Pre-shared key + per-message MAC | Simple; survives the provider | Symmetric — any holder can forge as any peer; rotation is manual; a leaked key is total. |
| Per-machine asymmetric keypair, packets signed | Non-repudiable; survives proxies, replay, and later audit | Real key management: generation, enrollment, revocation, rotation. |
| Reuse the operator's existing SSH/commit-signing key | No new key material; already backed up and already trusted by the git host | Widens the blast radius of one key; agent-mediated signing is its own problem. |
| Federated IdP (OIDC device code) | Real identity, real revocation | Heavy; requires an IdP; wrong shape for a local dev tool. |

**The question under the question:** is the unit of authentication the
*connection* or the *packet*? Only packet-level authentication produces an
artifact that is still checkable tomorrow, which is what an audit trail needs.

### 5.2 Authorization — `must-answer-before-code`

*Given an authenticated peer, what may it actually cause?*

| Option | Pro | Con |
|---|---|---|
| Full peer parity | Simplest mental model | Every peer is a remote write path into every other tree. Largest possible blast radius. |
| Capability tokens scoped to `(item-id, action, expiry)` | Least privilege; naturally auditable | Needs an issuer, and the issuer becomes the trusted thing. |
| Role-scoped: a peer may only act as a named `next_role` on a named item | Maps onto kai's existing dispatch model | Still permits writes; only narrows them. |
| **Read-only replication; all writes stay local** | Kills AC1, AC6, and most of AC2 outright | Is it still useful? If yes, this is the answer. If no, say why in section 2. |

**Candidate invariant to argue about:** *grants stay local. A remote peer may
only execute under a grant issued by the tree that owns the item, and may never
issue one.* This preserves single-grantor exactly and costs availability during
a partition — which is the honest trade.

### 5.3 Tenancy / workspace identity

*What names a workspace, and is identity the repository or the checkout?*

Today there is **no workspace identity**. The anchor is a manifest at a resolved
root, and `workspace_root` is stored as `.` in repository mode precisely so it
carries no machine-specific path. Two clones of one repo are the same repository
and different checkouts — and leases are per-checkout, so identity must
distinguish them.

Options: manifest-declared workspace ID plus a public key; git remote URL plus
branch; the repository's root-commit SHA; a machine-level identity independent of
the tree. Note also that the contract already requires `.kai/manifest.json`
`schema_version` compatibility **before claiming** — cross-machine, that check
now has to hold between peers, and a version-skewed peer must fail closed.

### 5.4 Replay protection

*What stops a valid message from being useful twice?*

The interesting observation: **kai already has a monotonic per-item counter.**
Every item carries `version`, every grant carries `version_at_grant`, and a grant
always has `version_at_grant` strictly less than the current `version`. A message
bound to `(item-id, version_at_grant, token)` and rejected once the local version
has moved is a replay defence that reuses an invariant the system already
maintains, rather than inventing one.

Options: per-sender monotonic sequence plus receiver high-water mark; nonce cache
with TTL; item-version binding (above); all three. Limits worth stating: item
binding protects item-scoped messages only — not telemetry, not discovery, not
enrollment. And `expires` is a **wall-clock timestamp**, so expiry must never be
evaluated on the receiver's clock alone (A6).

### 5.5 Trust boundaries

Enumerate them and say which are new:

operator ↔ host · host ↔ plugin · **agent ↔ untrusted in-context content**
(already an actor today) · **tree ↔ tree** (new) · **peer ↔ tunnel provider**
(new) · **workspace ↔ transport process** (new).

### 5.6 Secret handling

*Where does key material live, and what stops a work packet from carrying
secrets?*

Options for keys: OS keychain; environment variable; a gitignored file under
`.kai/` (there is precedent — the observer's consent marker lives there and is
gitignored); or never stored, pasted per session.

Two rules worth proposing as hard:

1. **No key material in `kai/`** — that is the committed corpus. If key material
   lands under `.kai/`, the managed ignore block must already cover it *before*
   the first write, and the workspace doctor should assert that.
2. **No packet is transmitted unscrubbed.** kai has no scrubber today. Building
   one is a real project, and "the model will be careful" is not one.

### 5.7 Tunnel lifecycle

*Who opens it, how long does it live, who closes it, and what happens on crash?*

Options: operator-started and explicitly torn down; session-scoped with automatic
teardown; long-lived background service.

Non-negotiable inherited from the observer's design: **never on by
installation.** Plugin hooks fire for everyone who installs, from their next
session, which is exactly why consent is a gate *inside* the observer script and
the declined path is the cheapest one. A network listener needs at least that
much. Also answer: what is the blast radius of a tunnel left open overnight, and
does anything notice?

### 5.8 Discovery

*How does one machine learn another exists?*

kai already has a federation primitive worth copying: an **optional, local,
gitignored** registry of linked workspace roots, read **read-only**, with **no
back-pointer written into the linked workspace**, that skips unavailable roots
with an explicit gap. It is unidirectional and local by design.

Framed against that, this whole proposal is: *make that bidirectional and
remote.* Every security question in this issue comes from those two words.

Options: manual paste (no discovery at all); a committed registry in
`kai/coordination/` (**leaks endpoints into git**, and under
`corpus_visibility: local` it does not propagate anyway); a gitignored local
registry (matches existing precedent); a rendezvous broker. General tension: any
discovery mechanism convenient enough to be pleasant is also an enumeration
surface.

### 5.9 Offline behavior

*What happens when a peer is unreachable mid-item?*

There is a strong in-repo precedent to reuse rather than re-invent: kai's
degraded-mode stance is **fail-closed for claims, not for loading** — an agent
may run without its coordination substrate but is mechanically forbidden from
claiming a lease, writing a handoff, recording a review, or asserting durable
state. The distributed analogue writes itself.

Options: hard fail-closed (no peer, no work); degrade to local-only with claims
prohibited; optimistic offline with later reconciliation. Note both obvious
answers to "does an offline peer keep its lease?" are wrong in different
directions — keeping it blocks the item until expiry, losing it invites AC2.

### 5.10 Audit trail

*What makes a remote action attributable, and where does the record live?*

Constraint that is easy to miss: **the local JSONL logs are not an audit store.**
Both rotate at 512 KB and retain exactly one previous generation. Anything that
must survive is in the committed corpus or nowhere.

Options: signed HANDOFF packets (a detached signature line inside the thread —
human-readable, git-versioned, verifiable later); hash-chained thread entries;
transport-level logging only (private, but rotates, and is missing exactly when
it matters).

Also decide whether disagreement is **resolved** or **made visible**. kai's
existing instinct is visibility: threads are append-only and never edited after
the fact, and the two telemetry tiers are documented as merged for display and
**never reconciled**, because they answer different questions and neither is
complete. That instinct is probably right here too.

### 5.11 Human approval — `must-answer-before-code`

See section 8. The question is not *what* requires a human — that list is
knowable. It is **where the check is enforced.**

## 6. Coordination-specific questions

These are the ones a generic RPC proposal would miss.

**Q1. How does single-grantor leasing survive a partition?**
It does not, for free. With one grantor, a partition means the minority side
cannot obtain grants — consistent, unavailable. Anything else buys availability
by giving up the single-writer guarantee. The honest options are: make the
grantor a service (hub); require a genuinely atomic external primitive (a
database, a git ref compare-and-swap, an object store with conditional writes);
or accept split brain and make reconciliation a first-class, human-facing
operation. `must-answer-before-code`.

**Q2. Does a remote HANDOFF carry the same evidentiary weight as a local one?**
Proposed answer: **no** — not without a signature and a locally-resolvable
`change_ref`. A local HANDOFF's weight comes from being appended to a committed,
human-reviewable file in a tree with one writer. Remove any of those three and
the weight is not the same, and the record should not *look* the same either.

**Q3. What is authoritative when two machines disagree?**
Options: the git merge, resolved by a human (already the declared backstop);
last-writer-wins by `version` (**unsafe** — `version` is not globally monotonic
across a partition, so two machines can legitimately reach the same number);
the tree that owns the initiative (already the declared serialization model); or
keep both and make the disagreement visible. Prefer the last two.

**Q4. Can a remote agent ever mark something `shipped`?**
Proposed answer: **no.** `shipped` requires confirmed production deployment plus
verification, and kai never deploys — it writes the exact steps and a human runs
them. Cheapest safe rule: `shipped` may only be written by the tree holding the
production evidence, after a human ran the deploy. Anyone proposing otherwise
should have to say so out loud in this issue.

**Q5. How does `change_ref` binding work when the code lives on another
machine?**
A SHA is only meaningful if the object resolves locally. Touch-set reconciliation
literally shells out to `git merge-base` and `git diff --name-only` against it.
So either the commit is pushed to a shared remote — which makes **git the actual
transport**, see option (a) — or the reviewer cannot verify what it is reviewing.
Proposed invariant: **no review evidence may be recorded against a `change_ref`
the recording tree cannot resolve.** That single rule removes a large slice of
AC4 and AC10 at zero infrastructure cost, and it is worth adopting whether or not
anything distributed is ever built.

## 7. Options

### (a) Do nothing — a shared git remote is the transport

Push and pull branches. Coordination state travels inside `kai/coordination/`.
Humans do the merges.

- **Security surface:** ~zero new surface. Authentication is the git host's,
  already hardened and already audited. Authorization is branch protection and
  review. Replay resistance is content addressing. History is hash-chained and
  signable by construction.
- **Complexity:** none. Nothing to build, nothing to operate, nothing to rotate.
- **Failure modes:** sync is human/CI-paced, not live. `items/*.md` conflicts.
  Leases stay advisory across trees — which is already the documented state.
  **Real blocker:** under `corpus_visibility: local` the entire corpus is
  gitignored, so git carries nothing at all for those workspaces.
- **Truthfulness:** **best preserved.** Every claim lands in a reviewable,
  hash-chained, human-merged history.

### (b) Hub-and-spoke broker

One machine or small service is the single grantor; spokes request grants and
report results.

- **Security surface:** one place to authenticate, authorize, rate-limit, and
  audit. Preserves single-grantor semantics *exactly*, which is its strongest
  argument. But it is a new trusted service and therefore the highest-value
  target: compromise it and every peer's grants are attacker-controlled — AC1 at
  fleet scale.
- **Complexity:** medium-to-high. Uptime, keys, upgrades, an owner.
- **Failure modes:** hub down means nobody can claim. Consistent, unavailable.
- **Truthfulness:** good, *if* the hub only grants and the corpus still lands in
  git. Bad if the hub becomes the record.

### (c) Direct peer tunnels

Every machine exposes an endpoint; peers talk directly.

- **Security surface:** **the worst of the four.** N×N trust. Every machine is a
  publicly reachable endpoint. URL sprawl (A7). Provider edge sees everything
  (A8). Every machine must independently get authentication, authorization, and
  replay protection right, and they will not all be patched together.
- **Complexity:** deceptively cheap to prototype, expensive to secure. That gap
  is the trap.
- **Failure modes:** partition means split brain by default; there is no single
  grantor to lose.
- **Truthfulness:** poor. No single authoritative record.

### (d) Append-only shared log

All peers append signed records to a shared ordered log; state is a fold over the
log.

- **Security surface:** signatures plus total order give replay resistance and
  non-repudiation nearly for free, and **the log is the audit trail** rather than
  needing a separate one. Requires real key management.
- **Complexity:** medium. The crux is the ordering primitive — who assigns
  sequence, and what happens when two peers append concurrently.
- **Failure modes:** log unavailable means fail-closed, which is acceptable. A
  compacting or rotating log is not an audit store.
- **Truthfulness:** **strongest of the "build something" options.** It matches
  instincts kai already has: append-only threads, never edited after the fact,
  disagreement made visible rather than reconciled.
- **The observation that matters:** **git is already an append-only signed log.**
  Option (d) implemented over a git ref collapses into a hardened option (a) —
  which is a strong hint about where the answer actually is.

### Recommendation

**Adopt (a) now. Treat (d) as the only design worth prototyping later. Reject
(c) outright. Hold (b) for the case where a real use case demands live
grant arbitration.**

And, honestly: **the evidence does not currently support picking a live
transport at all**, because section 2 is empty. There is a documented gap
(cross-tree leases are advisory) and there is a hypothesis (people want live
multi-machine agents). They are different problems. The documented gap is solved
by serialization discipline plus git — no tunnel required. Until section 2 has
three rows that git demonstrably cannot serve, "build a transport" is a solution
looking for its problem.

Two things are worth doing **regardless** of whether anything distributed is ever
built, because they are cheap and they harden the existing single-tree model:

1. the Q5 invariant — never record review evidence against a `change_ref` the
   recording tree cannot resolve;
2. writing down what `corpus_visibility: local` means for multi-machine
   continuity, since it silently disables option (a).

## 8. Human approval boundaries

**What a distributed kai must never do without a human**, and where the check
lives. The right-hand column is the important one: today almost every guarantee
kai has is prompt-level, and a forged packet is *made of attacker-authored
prompt text*.

| Action | Never without a human | Where the check must live |
|---|---|---|
| Mark anything `shipped` | Yes | Receiving code path — reject the state transition, do not instruct against it |
| Deploy, merge, tag, push, run a migration | Yes (already contract) | Already human-only; must not be relaxed by a remote packet |
| Open, rotate, or close the tunnel | Yes | Transport process; explicit operator action, never automatic |
| Enroll or revoke a peer / trust a new key | Yes | Enrollment code path; out-of-band confirmation of the key fingerprint |
| Accept residual risk or waive a BLOCK | Yes | Operator only. No agent, local or remote, may waive on the operator's behalf |
| Write outside the declared `touches` on a remote machine | Yes | Receiving code path, **before** the write — not post-hoc reconciliation |
| Execute a remote-supplied command or script | Yes — arguably never at all | Receiving code path; the safest answer is that this capability does not exist |
| Send any file content not named in `context_artifacts` | Yes | Sending code path, plus a scrubber |
| Reclaim another machine's lease | Yes | Recovery path; a timestamp is a signal, never permission |
| Disclose a tunnel URL or peer key | Yes | Everywhere. Treat both as credentials |

### The single most important architectural statement in this issue

**Verify before render.** A packet's signature and authorization must be checked
by code **before its content ever enters a model's context.** Once attacker-
authored text is in context it is instruction-shaped, and every downstream
protection that depends on an agent choosing to obey a prompt has already been
bypassed (A3, A4).

Trading a mechanical guarantee for a prompt-level hope is a critical operator
boundary, not an engineering detail. If a proposed design's safety rests on an
agent deciding to behave, it has **no** safety property against A3 or A4 and
should be treated as unsafe by default.

## 9. What would make this not worth building

State these plainly, and check them before proposing an approach. Any single one
is sufficient reason to close this issue.

1. **Git already serves the use cases.** If section 2 fills with scenarios a
   pushed branch handles, the answer is documentation, not a transport.
2. **The use case cannot be stated without "it would be cool."** Novelty is not
   a requirement.
3. **A remote peer would be able to write files.** Then kai ships a remote code
   execution channel into a developer's working tree, and that liability dwarfs
   the convenience. If the answer is *no writes*, then what is left is a
   notification bus — **and a notification bus does not need an exposed
   endpoint.**
4. **It requires kai to hold long-lived secrets.** kai holds none today; its
   local state is gitignored logs and a consent marker. Adding a key store
   changes what installing kai *costs* a user, permanently.
5. **The `shipped` / human-approval boundary cannot be enforced mechanically.**
   A prompt-level boundary is not a boundary here.
6. **Nobody owns the operations.** Tunnel lifecycle, key rotation, and peer
   revocation are ongoing work. kai has no on-call.
7. **It would make an installed plugin listen on a network by default.**
   Non-negotiable. If the design cannot guarantee otherwise, it is finished.
8. **It requires reconciling the two telemetry tiers into one truth.** They are
   deliberately never reconciled. A design that needs one authoritative timeline
   is fighting an intentional property.

## 10. Smallest safe validating experiment

The riskiest assumption is **not** "can two machines talk" — obviously they can.
It is:

> **Can a remote grant be made verifiable enough that a human would trust a
> HANDOFF that arrived from another machine?**

Test that with **no network, no tunnel, no keys, and no real workspace.**

### Experiment 1 — offline packet-forgery drill (do this one first)

1. Two throwaway kai workspaces, same machine, separate directories. Synthetic
   item IDs. No real repository, no real code, no secrets.
2. Move work packets between them **by hand, as files.** A human copying a file
   *is* a hostile unauthenticated channel: anything can be edited in transit.
   This models the adversary more faithfully than a working prototype would.
3. Run the adversary as a checklist. For each of AC1–AC6 and AC10, hand-edit the
   packet and record whether the receiving side's **existing** contract steps —
   verify-before-write, the version check, `change_ref` resolution, touch-set
   reconciliation — catch it.
4. **Deliverable:** one table. Which abuse cases the current contract already
   catches with zero new mechanism, and which require a signature. That table is
   the actual input to every design decision above, and it does not exist today.
5. Cost: zero infrastructure, zero exposure, no network, no secrets. Reversible
   by deleting two directories.

### Experiment 2 — only if experiment 1 justifies it

A **loopback-only** signed-packet prototype: `127.0.0.1`, ephemeral keys held in
memory, synthetic workspace, no tunnel, no provider. Measures one thing: does
packet signing plus item-version binding actually reject replay and reorder.

### Explicitly not the experiment

Do **not** stand up a dev tunnel against a real workspace "to see how it feels."
That is the experiment that skips the threat model, and it is the one that would
have to be un-built.

## 11. Decision criteria

Name in advance what evidence would move this from *proposal* to *design*:

- [ ] At least **three** use-case rows in section 2 that a shared git remote
      demonstrably cannot serve.
- [ ] A written answer to *"may a remote peer cause a file write?"* If **no**,
      re-scope this to a notification bus and drop the exposed endpoint.
- [ ] The experiment-1 table: which abuse cases the current contract already
      catches.
- [ ] Written answers to all four `must-answer-before-code` questions (5.1, 5.2,
      5.11, Q1).
- [ ] A named owner willing to carry key rotation, peer revocation, and tunnel
      lifecycle **indefinitely**.
- [ ] An agreed rule for `shipped` (Q4) and for review evidence against an
      unresolvable `change_ref` (Q5).
- [ ] `principal-swe-architect` on system shape and `principal-privacy-compliance`
      on whether cross-machine telemetry movement creates an obligation.

Absent these, the correct outcome is to **close this issue as "answered: use
git"** — which is a good outcome, not a failure.

## 12. Open questions

- Is the goal live coordination, or resumable continuity? They have different
  answers, and only one needs a network.
- Does a "machine" or a "person" hold identity? Two machines, one operator, is
  not the same trust model as two operators.
- Does this interact with the plugin distribution model at all, or is it
  orthogonal? (Assumed orthogonal; not verified.)
- What is the smallest thing that would make multi-machine work *feel* solved
  without any transport — better conflict messaging on `items/*.md`? A doctor
  check for divergent leases at pull time? Both are cheap.
- Should `corpus_visibility: local` workspaces be excluded from any distributed
  story by construction, given that they already opt out of sharing?
```

---

## 3. Assets, data classes, actors, and trust boundaries

Condensed here; the issue body above carries the full tables.

| | |
|---|---|
| **Primary asset** | Integrity of the durable coordination corpus and of any code an agent writes on an operator's behalf. |
| **Secondary asset** | Truthfulness of claims — `completed_reviews`, `change_ref` binding, `shipped`. This is the product, not a property of it. |
| **Data classes today** | Public repository content; gitignored local telemetry derived from full subagent response text and absolute paths; no credentials, no PII, no tenant data. |
| **Current network exposure** | **None.** `observed`: a search of `scripts/` for `node:http`, `node:https`, `node:net`, `fetch(`, `WebSocket`, and `createServer` returns no matches. kai ships no network primitive of its own today, so every finding below has **zero current exposure** and is design-blocking rather than live. |
| **Boundary that moves** | The authoritative record stops being a local file and becomes a remote assertion. |

---

## 4. Findings

**Severity convention for this record.** Nothing is implemented, so current
exposure is zero for every finding. `P1` here means *design-blocking against any
future implementation* — it would be release-blocking if built without an
answer. `P2` means *should be owned before design begins*. No `P0` exists and
none should be manufactured.

| ID | Sev | Finding | Basis |
|---|---|---|---|
| S1 | P1 | **Verification becomes circular over a network.** "Verify before every state-changing write" is a real check only because the authoritative record is a local file. Remotely it degrades to trusting the answering peer, so a forged grant (AC1) passes verification that *looks* identical to a real one. | `inferred` from the single-grantor and verify-before-write rules in `skills/kai-core-work-coordination/SKILL.md`. |
| S2 | P1 | **Distributed leasing without a lock.** The contract states plainly that serial granting is atomic only within one synchronized tree and that kai does not claim to prevent divergent cross-tree grants; git is the declared backstop *at integration time*, which is after the work exists on two machines. | `observed` — *Multi-machine and cross-branch scope*, same file. |
| S3 | P1 | **The transport would move the exact payload that is gitignored for being sensitive.** `.gitignore` covers `/.kai/observed.jsonl`, its rotation, `/.kai/observer-consent`, and `/.kai/activity.jsonl`, with the stated reason that the payload they derive from carries absolute paths and full response text. The existing redaction boundary was built for a local file, not a peer or a provider edge. | `observed` — `.gitignore`; `scripts/observe-subagent.mjs` header and `buildObserved` whitelist. |
| S4 | P1 | **No packet scrubber exists, and the nearest primitive must not be mistaken for one.** `safeNote` caps at 120 characters and refuses exactly one shape — path-like text; `looksAbsolute` targets filesystem paths, so a URL-shaped secret is not covered. `digest()` is documented as a short **non-cryptographic** correlation hash and is unusable as an authentication or integrity primitive. | `observed` — `scripts/lib/activity.mjs:60-92`. |
| S5 | P2 | **A tunnel URL treated as a secret can be captured verbatim by an existing feature.** The optional summary path stores a subagent's first prose line and is documented as not secret-scrubbed; its refusal rule is path-shaped, not URL-shaped. Only material if "unguessable URL" is part of the auth story — which is the reason to say now that it must not be. | `observed` — `skills/kai-core-fleet-observation/SKILL.md`, *Summaries carry real risk*; `scripts/lib/activity.mjs` `ABSOLUTE` regex. |
| S6 | P2 | **Review evidence can already be recorded against an unresolvable `change_ref`.** Touch-set reconciliation requires resolving the SHA locally; nothing forbids recording a review whose object the recording tree cannot resolve. Worth fixing in the single-tree model regardless of this proposal. | `observed` — *Touch-set reconciliation* and *Review routing*, coordination skill. `inferred`: no enforcement mechanism exists. |
| S7 | P2 | **Enforcement today is overwhelmingly prompt-level.** A forged packet is attacker-authored prompt text, so any protection expressed as an instruction is bypassed by the same input it is meant to stop. Hence *verify before render*. | `inferred`, consistent with prior in-repo security judgment on prompt injection narrowing rather than widening capability, and with the steward's "mechanical guarantee vs prompt-level hope" boundary. |
| S8 | P2 | **On-by-install is a real hazard for a network listener.** Plugin hooks fire for every installer from their next session; the observer's consent gate lives inside the script for exactly that reason. A transport that inherits the hook model without inheriting the consent model is a listener nobody opted into. | `observed` — `hooks.json`; `scripts/observe-subagent.mjs` *Consent* section. |
| S9 | P2 | **Local logs are not an audit store.** Both tiers rotate at 512 KB retaining one generation. Any distributed audit trail must live in the committed corpus or it will be missing exactly when it is needed. | `observed` — `MAX_BYTES = 512 * 1024` and `rotate()` in `scripts/lib/activity.mjs` / `scripts/observe-subagent.mjs`; retention caveat restated in the fleet-observation skill. |
| S10 | P2 | **`corpus_visibility: local` silently disables the git option.** Under `local` the whole `kai/` corpus is ignored, so the zero-surface option (a) carries nothing for those workspaces. This is the strongest *legitimate* argument for the proposal and it should be stated honestly rather than discovered later. | `observed` — `skills/kai-core-workspace-conventions/SKILL.md`, *Manifest* / `corpus_visibility`. |

**Counts: P0 = 0, P1 = 4, P2 = 6.**

---

## 5. Required controls and acceptance criteria

Conditions attached to the **CONDITIONAL** verdict. These bind the proposal, not
a design.

| # | Control | Acceptance criterion | Owner |
|---|---|---|---|
| C1 | The issue is filed with the `PROPOSAL / RFC` banner intact and section 2 left empty. | Filed issue body contains both, verbatim. | operator's main agent |
| C2 | No implementation task is opened against this issue until the four `must-answer-before-code` questions have written answers. | Zero linked implementation issues/PRs until then. | operator |
| C3 | Nothing from this proposal enters `area-plugins` scope. | The item stays `required_for_milestone: false`; no `area-plugins` item references it as a dependency. | steward |
| C4 | No exposed endpoint is stood up against a real workspace at any point during exploration. | Experiment 1 is offline; experiment 2 is loopback-only. | operator |
| C5 | If a design phase begins, `principal-security` re-engages in THREAT-MODEL mode on the chosen option **before** any code, and in CHANGE-REVIEW mode against an exact `change_ref` before any release. | Recorded `independent-security` evidence bound to the ref. | `principal-security` |
| C6 | If cross-machine movement of telemetry or work-packet content is ever proposed, `principal-privacy-compliance` states the obligation. | Recorded privacy verdict. | `principal-privacy-compliance` |
| C7 | System shape — hub vs peer vs log — is `principal-swe-architect`'s call, not mine. This record supplies the security constraints it must satisfy. | Architecture decision references these constraints. | `principal-swe-architect` |

---

## 6. Residual risk and decision owner

- **Whether to pursue this at all** is the operator's and
  `principal-product-manager`'s decision. My recommendation is that the evidence
  does not currently support a live transport, and that recording that honestly
  is more useful than a design.
- **Residual risk of filing the issue itself: low.** The issue is public and
  contains no secret, no private topology, no customer identity, and no exploit
  material. It does publish a candid account of where kai's coordination
  guarantees stop — which is already stated in the shipped contract text and is
  a strength, not a disclosure.
- **Residual risk of building any option: not accepted by me and not acceptable
  to accept yet.** It cannot be sized until the four `must-answer-before-code`
  questions are answered.
- **I have accepted nothing.** A CONDITIONAL verdict is not risk acceptance;
  only the operator can accept residual risk, and only after there is something
  concrete to accept.

---

## 7. Sanitized evidence register

All read-only, all local, all in a public repository.

| ID | Source | Used for |
|---|---|---|
| E1 | `kai/coordination/items/area-plugins-distributed-agents-proposal.md` | Authoritative item state, lease verification, acceptance criteria. |
| E2 | `skills/kai-core-work-coordination/SKILL.md` | Item/thread/board model; lease block; single grantor; verify-before-write; COLLISION; RECOVERY; multi-machine scope; touch-set reconciliation; review routing; `change_ref` rules. |
| E3 | `hooks.json` | `subagentStart` / `subagentStop` fire for every installer. |
| E4 | `scripts/observe-subagent.mjs` | Payload carries absolute `cwd` and full `response`; neither stored; whitelist record construction; consent gate inside the script; rotation. |
| E5 | `scripts/observe-watch.mjs` | Watcher is strictly read-only; a second writer would break append-only integrity. |
| E6 | `scripts/lib/activity.mjs` | `MAX_NOTE=120`, `MAX_LINE=1024`, `MAX_BYTES=512KB`; `digest()` is a non-cryptographic correlation hash; `looksAbsolute` targets path shapes only. |
| E7 | `.gitignore` (kai-managed block) | `/.kai/observed.jsonl`, `.1`, `/.kai/observer-consent`, `/.kai/activity.jsonl` ignored, with the stated reason. |
| E8 | `skills/kai-core-fleet-observation/SKILL.md` | Observed tier emits nothing for `kai:<name>` agents; pairing is ordering not identity; summaries are not secret-scrubbed; both logs rotate with one retained generation; tiers are never reconciled. |
| E9 | `skills/kai-core-workspace-conventions/SKILL.md` | Manifest anchor; `workspace_root` is `.` in repository mode; `corpus_visibility`; the local, gitignored, read-only, no-back-pointer linked-workspace registry. |
| E10 | `skills/kai-core-definition-of-done/SKILL.md` | kai never deploys; `shipped` requires human-run deployment plus verification. |
| E11 | `kai/initiatives/pack-split/artifacts/security/pack-split-degraded-refusal.md` | Untrusted in-context content as a first-class actor; prompt injection narrows rather than widens capability. |
| E12 | `kai/coordination/threads/area-plugins-scope-brief.md` | "Fail-closed is relaxed for loading, never for claims"; mechanical guarantee vs prompt-level hope as an operator boundary. |
| E13 | Negative search over `scripts/` for `node:http` / `node:https` / `node:net` / `fetch(` / `WebSocket` / `createServer` | No matches — kai ships no network primitive today. |

---

## 8. Unknowns and exclusions

- **`unknown`: the motivating use cases.** Nothing in this repository records a
  session that failed because two machines could not talk. Section 2 of the issue
  is empty because I found no evidence to fill it with, not as a rhetorical
  device.
- **`unknown`: host behaviour under any network transport.** No shell, nothing
  executed, nothing measured. Every claim about runtime is `inferred`.
- **`unknown`: whether any tunnel provider's terms or edge behaviour is
  acceptable.** Not evaluated; deliberately no provider is named as suitable.
- **`unknown`: whether the plugin distribution model interacts with this.**
  Assumed orthogonal; not verified.
- **Excluded:** protocol design, wire format, dependency selection, key
  management design, effort estimation, and product desirability.
- **Search scope caveat:** E13 covered `scripts/`. I did not exhaustively prove
  the absence of networking across every file in the repository, and
  `node_modules/` was not in scope.
- **This is not a design sign-off.** It is brainstorming framing produced in
  THREAT-MODEL mode. If a design phase starts, C5 applies.

---

## 9. Handoffs

- `principal-swe-architect` — system shape (hub vs peer vs log) if this ever
  advances. Not now; do not fold into `area-plugins-taxonomy-round-2`.
- `principal-privacy-compliance` — obligation question if cross-machine movement
  of telemetry or packet content is ever proposed.
- `principal-product-manager` / operator — whether to pursue at all, and the
  section 2 use cases. This is the actual gate.
- `principal-swe-infra` — only if and when a transport is designed. Nothing now.

## HANDOFF 2026-08-27-2130 — principal-security -> @operator

- did:       Produced a security-led, proposal-only GitHub issue framing for
             distributed multi-PC kai agent communication: draft title (plus one
             alternative), a full copy-pastable RFC body with the threat model
             leading (10 named adversaries, 12 abuse cases mapped to specific kai
             mechanics), all 11 named concerns as design questions with options
             and tradeoffs, 5 coordination-specific questions a generic RPC
             proposal would miss, 4 options compared on security surface /
             complexity / failure modes / truthfulness, a stated recommendation,
             8 reasons this may not be worth building, an offline smallest-safe
             experiment, and human-approval boundaries with their enforcement
             points. Verdict CONDITIONAL with 7 named controls.
- state:     completed (knowledge item; `review_requirements: []`)
- needs:     Nothing further from an agent. The operator's main agent files the
             issue from section 2 of this packet; the operator decides whether
             the idea advances at all.
- artifacts: kai/coordination/threads/area-plugins-distributed-agents-proposal.md
             (this thread — the durable record while
             `kai/initiatives/area-plugins/` cannot be created)
- evidence:  E1-E13 in the sanitized evidence register above; all read-only local
             repository files, captured 2026-08-27 in this session. No shell, no
             network, no execution.
- questions: none blocking. The open questions are inside the issue, addressed to
             the operator, and are the point of filing it.
- next:      @operator — file the GitHub issue, then decide. Nothing is blocked
             on this item and nothing gates the P0 sequence on it.

### DoD self-check (`kai-core-definition-of-done`, knowledge item)

| # | Dimension | Result |
|---|---|---|
| 1 | scope-true | **Clear.** Proposal-only. No code, no scripts, no agents, no skills, no packs, no `plugin.json`. `kai/initiatives/area-plugins/` not created. `kai/initiatives/pack-split/` untouched. Writes confined to the two declared `touches` paths. |
| 2 | verified | **Clear**, proportional. Every assertion about current kai behaviour is cited to a file read in this session; execution-dependent claims are labelled `inferred` and the no-shell limit is stated. |
| 3 | reviewed | **Waived with reason.** `review_requirements: []` — the item declares none, and self-review is prohibited. C5 records that a real `independent-security` review is owed against an exact `change_ref` if this ever becomes code. |
| 4 | shippable-safely | **Waived with reason.** Nothing deployable. Reversibility is deleting one markdown file. |
| 5 | documented | **Clear.** The durable record is this thread, with the environment limit and the canonical `artifact_target` both stated so transcription is mechanical once the directory exists. Not promoted to `kai/library/` — it is a proposal, not a reusable decision. |
| 6 | coordination-closed | **Clear.** Item record updated to `completed`, `next_role: null`, lease cleared on all five fields, `version` 1 -> 2, acceptance boxes checked, this HANDOFF appended. No blocking questions. No backlog spillover — the proposal *is* the parked idea, and it is parked in a GitHub issue by the operator's instruction. |

**Gate result: RELEASE-READY equivalent for a `knowledge` item — `completed`.**
Nothing here was deployed and nothing is claimed as `shipped`.
