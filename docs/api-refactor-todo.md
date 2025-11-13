# API Route Refactor To-Do

## Phase 1 - Shared Foundations
- [x] Create `lib/services/supabase-server.js` to export `supabase` and `supabaseAdmin` without deep relative paths.
- [x] Move auth utilities into `lib/services/auth.js`; re-export `generateUsername`, `generateTemporaryPassword`, `hashPassword`, `comparePassword`.
- [x] Extract email-specific helpers into `lib/services/email.js` (wrap `resend` + credential template).
- [x] Create `lib/services/submissions.js` to host shared submission verification and account generation helpers.
- [x] Extract CV helpers into `lib/services/cv.js` (Word/PDF generators, image processing, filename helper).
- [x] Introduce `lib/services/storage.js` for uploads/removals with consistent error handling.
- [x] Consolidate Google Sheets helpers in `lib/services/googleSheets.js` (re-export existing dynamic imports).
- [x] Add `lib/utils/http.js` for common NextResponse patterns (`ok`, `badRequest`, `serverError`, etc.).

## Phase 2 - Route Extraction
- [x] `app/api/submissions/route.js` (GET list, POST create) - reuse submissions service; ensure Google Sheet sync preserved.
- [x] `app/api/submissions/[submissionId]/route.js` (DELETE single) - legacy delete.
- [x] `app/api/submissions/[submissionId]/verify/route.js` (PUT) - status update.
- [x] `app/api/submissions/[submissionId]/generate-account/route.js` (POST) - orchestrate account creation, email, credential persistence.
- [x] `app/api/submissions/purge/route.js` (DELETE) - handle `emailPattern` vs test clean-up.
- [x] `app/api/check-existing/route.js` (GET) - duplicate lookup.
- [x] `app/api/auth/login/route.js` (POST) - separate admin vs user flows with shared auth service.
- [x] `app/api/cv/route.js` (GET, POST) - user CV data.
- [x] `app/api/cv/generate/[userId]/route.js` (GET) - zipped CV export.
- [x] `app/api/upload/route.js` (POST) - storage upload with validation.
- [x] `app/api/init-db/route.js` (GET) - return SQL.
- [x] `app/api/test-email/route.js` (POST) - email smoke-test.
- [x] `app/api/init-admin/route.js` (POST) - admin seeding.
- [x] `app/api/sync-sheets/route.js` (GET) - sheets sync.
- [x] `app/api/test-google-sheets/route.js` (GET) - connectivity test.
- [x] `app/api/admin/user-by-email/route.js` (POST) - Supabase auth lookup.
- [x] `app/api/admin/submission-by-user-id/route.js` (POST) - fetch submission via auth user.
- [x] `app/api/admin/credentials/[submissionId]/route.js` (GET) - credential retrieval with audit.
- [x] `app/api/admin/users/[submissionId]/route.js` (DELETE) - full teardown.

## Phase 3 - Client Updates & Verification
- [x] Update `app/admin/lib/adminApi.js` to call new endpoints (rename URLs, adjust fetch paths).
- [x] Update `app/admin/hooks/useBulkActions.js` to new delete endpoint path.
- [x] Confirm `app/page.js`, `app/dashboard/page.js`, `app/admin/edit-cv/[userId]/page.js`, `app/admin/process/[userId]/page.js`, and `app/login/page.js` use the new route URLs.
- [ ] Search for `/api/` usages in repo; adjust any remaining references to old catch-all patterns.
- [x] Update docs (`README_VERIWEB.md`, Google Sheets docs, deploy scripts) with new endpoint URLs.

## Phase 4 - Validation & Cleanup
- [ ] Run lint/tests (if available) and manual smoke tests for submissions, login, admin dashboard actions, CV upload/generation, sheet sync.
- [ ] Monitor server logs for unexpected 404/405 after migration.
- [x] Remove `app/api/[[...path]]/route.js` once parity confirmed.
- [ ] Document new API structure for the team (e.g., update `docs/api-refactor-notes.md` with final state).
