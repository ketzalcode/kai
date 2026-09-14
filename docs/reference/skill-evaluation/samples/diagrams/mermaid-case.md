# Explicit diagram format

Create a Mermaid diagram for a GitHub Markdown document showing only these
established relationships. Apply the supplied diagram guidance and any
provided reference catalog.

- The API publishes jobs to a queue.
- A worker consumes jobs from the queue.
- The worker reads configuration from a database.
- There is no direct API-to-database connection.

Return the requested diagram with a short caption. The requested format is
Mermaid; do not substitute another format by default or invent components.
Do not claim renderer validation or other execution occurred.
