# Thread — area-plugins-m2-doctor-standalone

Append-only communication log mirroring
`kai/coordination/items/area-plugins-m2-doctor-standalone.md`. Never edited after
the fact — only appended. See `kai-core-work-coordination`.

---

## NOTE 2026-08-27-1922 — principal-swe-manager (record created, `proposed`)

Emitted by the milestone-2 decomposition
(`kai/coordination/threads/area-plugins-m2-decomposition.md`, PLAN
2026-08-27-1922) as **WS-5**, one of two children of the architect's **PR-5**.
Created `proposed` with `owner: null` and a cleared lease. **Only
`principal-product-manager` may promote it.**

**Disposition: Spike. This item is deliberately unsized, and that is the honest
answer, not a gap.**

**The finding, with exact citations.** The accepted architecture scoped PR-5 as
"doc/UX only — `workspace-doctor` should report a core-less run as `standalone`
rather than 'not onboarded'". Grounding it found the real contradiction one layer
down and stronger:

- `scripts/lib/migration-doctor.mjs:736-741` emits a **`refusal`**-severity
  finding, `partial-pack-set`: *"…installed without `kai-core` — a department pack
  inherits its operating contract from core, and core missing does not raise a
  host error."* It appends the remediation step
  `copilot plugin install kai-core@kai-plugins   # core is required, never optional`.
- `scripts/workspace-doctor.mjs:661-666` pins that verdict as `status: blocked` in
  the self-test's `MIGRATION_CASES`.

That is **shipped, self-tested, user-visible copy asserting the exact proposition
this milestone exists to retire**, in a file the architecture record's per-gate
disposition table never reaches — a fourth encoding of "core is required",
alongside the preflight block, the skew refusal, and the degraded refusal.

**The spike question, time-boxed to one day.** *Can `--migration-check`
distinguish a deliberate standalone install from a failed or partial core install
using host state alone?* Both present identically: a department pack installed, no
core.

- **Good answer (a sound signal exists):** reclassify — `standalone` notice for
  the legitimate case, `blocked` preserved for the broken one. Size **L**; the
  status vocabulary is asserted across roughly thirty `MIGRATION_CASES`.
- **Bad answer (no sound signal):** the choice is between losing the
  broken-install signal and keeping a false alarm for a legitimate user. That is a
  product call and **returns to the steward**, not to a default. Size **S**.
- **Third, permitted outcome:** defer to `migration-complete` with the disclosure
  carried by `standalone-block.txt` alone. **A legitimate result of the spike, not
  a failure of it.**

**Why it split from the docs.** One owner each; `release-guard`'s
`BEHAVIOR_PREFIXES` (`scripts/release-guard.mjs:20`) covers `scripts/` but exempts
`docs/`; and decisively — half of PR-5 was this spike, and shipping it inside an
item labelled "doc/UX only, nothing else depends on it" would have buried an
unsized unknown.

**`required_for_milestone: false` is faithful to the acceptance as written, and it
is a question, not a verdict.** Milestone 2's acceptance does not name the doctor.
Whether it *should* is routed to the steward as **scope negotiation 1** in the
decomposition plan: *does `optional-core-contract` close with its own doctor
contradicting its outcome statement?* The manager did not answer that by setting a
flag.

- next: `principal-product-manager` — rule on scope negotiation 1, then promote or
  hold; then `principal-swe-infra` runs the spike once
  `area-plugins-m2-mode-selection` is `shipped`.
