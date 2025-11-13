# API Refactor Validation Log

## Build Check
- `npm run build` *(fails)*: Next.js compilation currently breaks in `app/dashboard/page.js` because of mismatched JSX tags around `<CardContent>` (existing issue prior to refactor). Fixing the JSX error is required before a production build can succeed.

## Suggested Manual Smoke Tests (Pending)
- Submit registration from landing page; confirm success response and Supabase insert.
- Admin dashboard:
  - Verify submission → status updates to `verified`.
  - Generate account → email is sent, credentials stored, status becomes `registered`.
  - Delete user → CV data, credentials, storage assets, submission, and auth user removed.
- User dashboard: load CV data, save edits, generate CV (PDF/Word), upload assets.
- Google Sheets:
  - `/api/sync-sheets` synchronises `verified` entries from the sheet.
  - `/api/test-google-sheets` returns 200 when creds and sharing are correct.
- Test email smoke endpoint (`/api/test-email`) returns success when Resend API key is valid.

> These manual checks have not yet been executed in this session; run them once the build issue is resolved.
