# Frontend orientation

- The frontend lives under `web/`.
- `web/package.json` declares the frontend stack as React, TypeScript, and Vite.
- The declared commands are:
  - `dev`: `vite`
  - `test`: `vitest run`

## Request flow

1. `web/src/App.tsx` renders `JobList`.
2. `web/src/components/JobList.tsx` calls `web/src/api/jobs.ts`.
3. `web/src/api/jobs.ts` fetches data from `'/api/jobs'`.
4. `web/test/JobList.test.tsx` covers loading and error states.

## External boundary

- The only supplied external API boundary is `fetch('/api/jobs')` in `web/src/api/jobs.ts`.
- No response schema, backend storage, or deployment detail is supplied here.

## What is known

- Frontend structure and the job-listing path are identified by the files above.
- Backend and deployment implementation are outside the requested scope and are not supplied.

## What remains unknown

- The `/api/jobs` response shape.
- Any frontend state management beyond the supplied component chain.
- Any backend implementation details.
