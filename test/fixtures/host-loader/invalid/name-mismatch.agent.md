---
name: a-different-name
description: An agent whose frontmatter name does not equal its file id.
tools: [read]
---

# name-mismatch (malformed fixture)

Proves the loader mirror rejects an entry whose `name` disagrees with its path
id. Do not "fix" it — it must stay malformed.
