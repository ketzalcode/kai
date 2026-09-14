# Explicit repository orientation

Map this small service for a new teammate using the supplied source facts and
attached onboarding guidance. Return the useful cited orientation itself;
do not modify files or invent unprovided infrastructure.

- `package.json` declares an ESM Node service, Node `>=24.15.0`, no external
  dependencies, `start: node server.mjs`, and `test: node --test`.
- `server.mjs` uses `node:http` and routes job requests to `routes/jobs.mjs`.
- `routes/jobs.mjs` calls `store.mjs` to create and list jobs.
- `store.mjs` keeps jobs in a process-local `Map`; restart loses that state.
- `test/jobs.test.mjs` covers creating and listing jobs.
- `.github/workflows/test.yml` runs the declared test command.
- No deployment or persistent database configuration was supplied.

The goal is to help a teammate find the entry point, request path, data
lifetime, and existing commands. Do not claim tests or commands ran.
