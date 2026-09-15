# Preserved creative sources

These files preserve the original creative definitions from
`ca685d871682fa77f35cac8ce6b213c5e8d90bc5`. They are inactive: source collectors
do not load them and generated packs do not emit them from this location.
The migration guard checks their original normalized hashes.

The approved replacements below supersede these interfaces; their execution
status is recorded in the creative foundation plan. Preservation does not
approve every old definition for re-entry. Only desktop recording is an
explicitly deferred capability candidate, requiring separate design, evidence,
and operator approval. Interactive prototypes and a separate identity skill
have no placeholder runtime definitions.

| Component | Kind | Original path | Disposition |
| --- | --- | --- | --- |
| `principal-product-designer` | agent | `plugins/kai-creative/agents/principal-product-designer.agent.md` | Superseded by `creative-lead-design`. |
| `principal-brand-designer` | agent | `plugins/kai-creative/agents/principal-brand-designer.agent.md` | Superseded by `creative-lead-design`. |
| `creative-video-director` | agent | `plugins/kai-creative/agents/creative-video-director.agent.md` | Superseded by `creative-lead-video`. |
| `ui-mockup` | skill | `plugins/kai-creative/skills/ui-mockup/SKILL.md` | Replaced by independent `mockups-ascii` and `mockups-html` methods. |
| `video-direction` | skill | `plugins/kai-creative/skills/video-direction/SKILL.md` | Necessary craft belongs to `creative-lead-video`, not another skill. |
| `create-product-demo` | skill | `plugins/kai-creative/skills/create-product-demo/SKILL.md` | Procedure belongs to `workflow-creative-demo-production`; format checking remains a helper. |
| `demo-narrate` | skill | `plugins/kai-creative/skills/demo-narrate/SKILL.md` | Split into `video-create-narration` and `video-align-narration`. |
| `demo-zoom` | skill | `plugins/kai-creative/skills/demo-zoom/SKILL.md` | Approved replacement is `video-render-zoom`. |
| `demo-capture` | skill | `plugins/kai-creative/skills/demo-capture/SKILL.md` | Preserved for history and possible separately approved recording re-entry; excluded from the approved active target. |
