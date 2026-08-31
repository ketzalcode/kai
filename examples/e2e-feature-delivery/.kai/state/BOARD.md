# Board

Derived index. `.kai/state/items/<id>.md` is authoritative; if these
disagree, the item record wins and this file is regenerated.

| id | title | initiative | milestone | priority | state | owner | next | depends-on | waiting-on | updated |
|----|-------|------------|-----------|----------|-------|-------|------|------------|------------|---------|
| csv-export-api | CSV export endpoint for saved reports | csv-export | m1-export-ga | 10 | shipped | principal-swe-backend | — | — | — | 2026-03-04-1610 |
| csv-export-ui | Export button and progress state on the report view | csv-export | m1-export-ga | 20 | in-review | principal-swe-frontend | principal-qa-ui | csv-export-api | — | 2026-03-05-1015 |
| csv-export-scheduling | Recurring scheduled exports | csv-export | — | 90 | proposed | — | principal-product-manager | csv-export-api | — | 2026-03-02-1120 |
