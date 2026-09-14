# Repository orientation

This service is a small ESM Node app.

## Entry point

- `package.json` declares Node `>=24.15.0`.
- `start` runs `node server.mjs`.
- `server.mjs` uses `node:http` and sends job requests to `routes/jobs.mjs`.

## Request path

- `routes/jobs.mjs` handles creating and listing jobs.
- It delegates storage to `store.mjs`.

## Data lifetime

- `store.mjs` keeps jobs in a process-local `Map`.
- Job data is lost when the process restarts.

## Existing tests

- `test/jobs.test.mjs` covers creating and listing jobs.
- `.github/workflows/test.yml` runs `node --test`.

## Commands already declared

- `npm start` → `node server.mjs`
- `npm test` → `node --test`

## What is not established

- No deployment setup was supplied.
- No persistent database configuration was supplied.
