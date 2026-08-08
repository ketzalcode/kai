# Ship record — csv-export-api

Produced by `workflow-ship` at item version 9, `change_ref` `4f1c8ae`.
A ship record is written **before** the deploy and completed **after**
production verification.

## Readiness verdict — RELEASE-READY

| Dimension | Verdict | Basis |
| --- | --- | --- |
| Complete | Clear | All four acceptance criteria checked at `4f1c8ae`. |
| Verified | Clear | Unit + integration tests by the implementing engineer; staging load check at 1M rows. |
| Reviewed | Clear | Independent code and security reviews, both bound to `4f1c8ae`. |
| Safe | Clear | Additive migration `0043`; row-level authorization verified server-side. |
| Operable | Clear | Export error rate, p99 latency, and service memory already on the reporting dashboard. |
| Documented | Clear | `design-api.md`; endpoint added to the public API reference. |

Design sign-off sub-gate: **does not fire**. This item adds no user-facing
surface. (`csv-export-ui` does, and carries its own design-conformance review.)

## Deploy handoff — the operator runs these

kai does not deploy. These are the exact steps handed to the human:

1. `migrate up 0043` on the reporting database (additive; no backfill).
2. Deploy `reporting-2026.03.04` to canary at 5% for 20 minutes.
3. If the canary signals hold, promote to full rollout.

## Reversibility

Roll back to the prior release. Migration `0043` is additive and needs no
down-migration; the previous build ignores the new column.

## Deployment record

- Executed by: operator, 2026-03-04 15:05
- Release: `reporting-2026.03.04`
- Canary: 5% for 20 minutes, clean; promoted to full rollout.

## Production verification

Window: 24h from full rollout. Proportional to blast radius — a read-only
endpoint on an existing service, behind existing authorization.

| Signal | Threshold | Result |
| --- | --- | --- |
| Export endpoint error rate | no increase over baseline | unchanged |
| Reporting p99 latency | within 10% of baseline | unchanged |
| Service memory | no sustained growth | flat |

Verification passed at 2026-03-04 16:10. Only then was the item marked
`shipped`.
