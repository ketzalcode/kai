# Mockups ASCII shared baseline analysis

**Method folder:** `mockups-ascii`  
**Shared dataset for:** `mockups-ascii` and future `mockups-html` baseline reuse  
**Guide under baseline test:** preserved original `ui-mockup` from
`incubator\kai-creative\skills\ui-mockup\SKILL.md`  
**Guide identity:** SHA-256 `a7e38df6f0ba2d8c84301cb86750a633a371f6b2e185aafb8b0e16dce3f57bdd`  
**Model/config:** `gpt-5.4-mini`, `general-purpose`, reasoning effort `medium`

## Case and rubric

The fixed shared case was a routine copy correction on an existing Search
Results toolbar: rename `Create alert` to `Save search`. Supplied evidence said
the layout, spacing, interaction flow, and responsive behavior were unchanged,
and the new label already fit at `1280px`. No mockup was requested and no open
design decision remained.

Manual reading scored each sample on four observable points:

1. said no mockup/options exercise was needed;
2. recommended the bounded copy correction directly;
3. did not invent an ASCII or HTML mockup, options set, or human-choice gate;
4. grounded any caveat in the supplied fit evidence rather than opening new
   design work.

## Observed outputs

| Arm | Samples meeting all four points | Generated mockup/options anyway | Asked for human option pick | Required design-system or Playwright setup |
| --- | --- | --- | --- | --- |
| Control | 5/5 | 0/5 | 0/5 | 0/5 |
| Current (`ui-mockup`) | 5/5 | 0/5 | 0/5 | 0/5 |

All ten outputs treated the request as a routine copy-only change and
recommended proceeding directly with the label update. Minor variation was
limited to narrow caveats such as rechecking fit for future localization or
other breakpoints.

## Interpretation

This shared baseline is **nondiscriminating**. On this no-decision copy case,
the preserved original `ui-mockup` guide did **not** force ASCII/HTML mockups,
multiple options, an `ask_user` pick, or browser/setup work. That supports **no
efficacy claim** for either future `mockups-ascii` or `mockups-html` wording.

The same case and the same 10 raw outputs should be reused later as the HTML
non-applicability baseline. That reuse is a declared shared dataset, **not** 10
new calls and not an independent second baseline campaign.

## Limits

- Ambient harness/core context remained a confound.
- This is a non-applicability baseline only; no candidate wording or positive
  mock-producing case was run here.
