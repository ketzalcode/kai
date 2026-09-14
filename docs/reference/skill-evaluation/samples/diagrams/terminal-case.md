# Diagram boundary: explicit supported relationship

## Task

Produce one terminal-readable diagram of the relationships below, using the
attached diagram guidance and any provided catalog reference. Include a short
caption. Return the diagram, not a plan to draw it.

## Established relationships

- The API publishes jobs to a queue.
- A worker consumes jobs from the queue.
- The worker reads configuration from a database.
- The API does not access that database directly.

Use only these components and relationships. Do not invent retries,
deployment zones, additional stores or trust boundaries.
