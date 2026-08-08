# Channels — proactive notification bindings (local · gitignored)
#
# TEMPLATE. Your real file lives at kai/personal/proactive/channels.md, which is
# gitignored (the whole kai/personal/ lane is). It binds ONE consented channel for
# v1. It stores a secret_ref — the NAME of a secret your runner holds — never the
# secret itself. Webhook URLs, tokens, and channel IDs live in the runner's
# secret store (e.g. GitHub Actions secrets), not here and not in git.

```yaml
channel:
  type: webhook          # webhook | email | slack | file
  secret_ref: KAI_NOTIFY_WEBHOOK   # name of the runner-side secret holding the real URL/token
  consent: yes           # a channel is delivered to only with explicit consent
  enabled: true
```

Notes:

- kai's `workflow-proactive-scan` only **emits** the payload to
  `kai/personal/proactive/outbox/`. Your external runner reads consent here and
  performs the delivery, resolving `secret_ref` from its own secret store.
- No `consent: yes` → the payload stays in the outbox and nothing is sent.
- v1 targets exactly one channel; multiple channels need per-channel delivery
  tracking (out of scope for v1).
- Never paste a real credential or channel ID here; if one leaks, rotate it.
