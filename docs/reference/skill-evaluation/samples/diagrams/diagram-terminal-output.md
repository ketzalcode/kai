Caption: API publishes jobs to a queue; a worker consumes them and reads configuration from a database. The API does not access that database directly.

```text
  ┌─────────┐   publishes jobs   ┌───────┐   consumes jobs   ┌────────┐
  │   API   │ ─────────────────► │ Queue │ ─────────────────► │ Worker │
  └─────────┘                    └───────┘                    └───┬────┘
                                                                    │ reads config
                                                                    ▼
                                                              ┌───────────┐
                                                              │ Database  │
                                                              └───────────┘

  API  ──x────────────────────────────────────────────────────────► Database
       no direct access
```
