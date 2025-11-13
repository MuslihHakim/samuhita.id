# API Route Refactor Notes

## Status of Former Catch-all (`app/api/[[...path]]/route.js`)

- ✅ All functionality has been decomposed into dedicated nested route handlers.
- ✅ The catch-all file has been removed from the codebase.
- ℹ️ Any lingering references to the legacy path should be cleaned up in downstream consumers or environmental configs.

## Proposed Route Tree (Next.js Nested Route Handlers)

```
app/api/
- submissions/
  - route.ts                     # GET (list), POST (create)
  - purge/route.ts               # DELETE bulk/test clean-up (emailPattern toggle)
  - [submissionId]/
    - route.ts                   # DELETE single submission
    - verify/route.ts            # PUT verify
    - generate-account/route.ts  # POST create account + email
- check-existing/route.ts        # GET duplicate check
- auth/
  - login/route.ts               # POST login
- cv/
  - route.ts                     # GET/POST CV data
  - generate/
    - [userId]/route.ts          # GET ZIP (query ?format=)
- upload/route.ts                # POST file uploads
- init-db/route.ts               # GET init SQL
- init-admin/route.ts            # POST seed admin user
- test-email/route.ts            # POST email smoke-test
- sync-sheets/route.ts           # GET sheets sync
- test-google-sheets/route.ts    # GET sheets connectivity
- admin/
  - user-by-email/route.ts       # POST fetch auth user
  - submission-by-user-id/route.ts # POST fetch submission via auth user
  - credentials/
    - [submissionId]/route.ts    # GET credentials record
  - users/
    - [submissionId]/route.ts    # DELETE full teardown (submissionId acts as key)
```

> Update: `submissions` rows now persist `userId` during account creation (with backfill on fetch), removing the need for per-row auth lookups in the dashboard.

## Shared Services & Helpers (Target State)

- `lib/services/supabase-server.js`: wrapper exporting shared `supabase` and `supabaseAdmin` clients to avoid deep relative imports.
- `lib/services/auth.js`: credential hashing/comparison, admin guard helpers, username/password generation.
- `lib/services/email.js`: resend client plus templating helpers for credentials and test emails.
- `lib/services/submissions.js`: verification/account orchestration used by catch-all and new nested routes.
- `lib/services/credentials.js`: persistence + retrieval logic for `user_credentials` with audit helpers.
- `lib/services/cv.js`: read/write CV data plus `generateCVFileName`, `generateWordCV`, `generatePDFCV`, `extractAndProcessImages`.
- `lib/services/storage.js`: wrappers for Supabase storage upload/remove/list with consistent error reporting.
- `lib/services/uploads.js`: high-level upload validator orchestrating storage writes and public URL generation.
- `lib/services/admin.js`: admin utilities for user lookup, submission detail, credential retrieval, and teardown workflows.
- `lib/services/google-sheets.js`: host existing sheet sync/test helpers, re-exported for routes.
- `lib/utils/errors.js`: normalized response helpers (for consistent NextResponse payloads).
- Optional: `lib/middleware/admin-only.js` for shared admin route guards once auth tokens are introduced.
