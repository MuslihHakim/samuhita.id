# Jobs API Smoke Tests (manual)

Prereq: Run the Next.js app (dev or prod) so routes are available at http://localhost:3211 or your host/port.

Public
- List jobs (published):
  - curl http://localhost:3211/api/jobs
  - Expect 200 JSON: { items: [], page: 1, total: 0, hasMore: false }
- Get job by slug (published):
  - curl http://localhost:3211/api/jobs/my-slug
  - Expect 200 JSON with fields: id,title,slug,description,jobdesk[],qualifications[],benefits[]; 404 if not found.

Admin (requires admin session cookie; obtain by logging in to /login and grabbing cookie from browser or use existing session)
- List all jobs:
  - curl -H "Cookie: admin_session=YOUR_COOKIE" http://localhost:3211/api/admin/jobs
  - Expect 200 JSON with { items: [...] }
- Create job:
  - curl -X POST -H 'Content-Type: application/json' -H "Cookie: admin_session=YOUR_COOKIE" \
    -d '{"title":"Perawat Jepang","description":"Deskripsi ...","jobdesk":["Merawat pasien"],"qualifications":["JLPT N3"],"benefits":["Asuransi"],"status":"published"}' \
    http://localhost:3211/api/admin/jobs
  - Expect 201 JSON with created job (slug generated if omitted).
- Update job (publish/unpublish, slug override):
  - curl -X PUT -H 'Content-Type: application/json' -H "Cookie: admin_session=YOUR_COOKIE" \
    -d '{"status":"draft"}' http://localhost:3211/api/admin/jobs/JOB_ID
  - Expect 200 JSON.
- Delete job:
  - curl -X DELETE -H "Cookie: admin_session=YOUR_COOKIE" http://localhost:3211/api/admin/jobs/JOB_ID
  - Expect 200 JSON { success: true }.

UI Flows
- Landing shows CTA “Daftar” and Lowongan section (if any published jobs).
- /lowongan lists published jobs; if none, shows empty state with CTA to /daftar.
- /lowongan/[slug] shows detail; when not found shows Not Found copy with CTAs.
- /daftar submits to /api/submissions and opens WhatsApp on success.

Notes
- Slug normalization: lowercase ASCII; manual override allowed; must remain unique.
- Description is plain text; arrays are rendered as bullet lists.
