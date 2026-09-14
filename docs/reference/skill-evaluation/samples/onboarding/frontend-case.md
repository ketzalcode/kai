# Explicit frontend-only orientation

Map only the frontend workspace for a teammate using these facts and the
attached onboarding guidance. Return a cited orientation note, not backend
or infrastructure documentation. Do not modify files.

- `web/package.json` lists React, TypeScript and Vite. Its commands are
  `dev: vite` and `test: vitest run`; dependency versions are not supplied.
- `web/src/App.tsx` renders `JobList`.
- `web/src/components/JobList.tsx` calls `web/src/api/jobs.ts`.
- `web/src/api/jobs.ts` uses `fetch('/api/jobs')`.
- `web/test/JobList.test.tsx` covers loading and error states.
- Backend and deployment implementation are outside the requested scope and
  are not supplied.

Identify the frontend flow, its external API boundary and declared commands.
Do not invent versions, response schemas, line numbers, commands or backend
storage. Do not claim execution or validation occurred.
