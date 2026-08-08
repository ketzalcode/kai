# Brief — CSV export for saved reports

- **owner:** `principal-product-manager`
- **status:** accepted into `m1-export-ga`

## The need

Analysts rebuild saved reports by hand in a spreadsheet because there is no way
to get the rows out. Support sees this weekly; it is the single most common
"how do I…" ticket on the reporting surface.

## In scope

One on-demand CSV export of a report the user can already read, from the report
view they are already on.

## Explicitly out of scope

- Recurring or scheduled exports.
- Any format other than CSV.
- Changing what data a report contains or who may read it.

Out-of-scope items are not "later" by implication — they are only real if they
become accepted work. When the backend engineer found that scheduling was easy
to reach, it went to `csv-export-scheduling` as a proposal for this role to
decide, not into the branch.

## Success measure

The export path replaces the manual rebuild for the top three report types,
measured by a drop in the corresponding support ticket tag over one month.
