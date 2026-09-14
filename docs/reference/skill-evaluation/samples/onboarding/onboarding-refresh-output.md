Authentication orientation (synthetic revision r2)
session.mjs validates sessions.
middleware.mjs attaches identity after session validation.
Auth tests: node --test test/auth.test.mjs
Operator note: retain the rollout discussion for the next onboarding session.

Explanation: The two authentication module facts and the operator note remain unchanged because their source hashes did not change. Only the auth test command is refreshed from `node --test auth.test.mjs` to `node --test test/auth.test.mjs` based on the package.json update.
