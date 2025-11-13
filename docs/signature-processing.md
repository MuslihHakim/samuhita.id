## Signature Background Removal Pipeline

This document describes how the new signature upload and cleanup flow works and how to run it locally or in production.

### Overview

Users can upload a handwritten signature image from the Personal Details section of both the user dashboard and the admin CV editor. The system stores the original upload, removes the background, and saves a transparent PNG that can be reused when generating documents.

### Components

- **Next.js API** (`/api/signature` and `/api/signature/status`): receives uploads, stores originals, creates processing jobs, and exposes job status.
- **Supabase**:
  - `cv_data` table now has `signature*` columns to store URLs, status, errors, job id, and timestamps.
  - New `signature_jobs` table tracks processing lifecycle.
  - Files live in the existing `cv-photos` storage bucket under `signatures/{userId}/`.
- **Python background service** (`services/signature-processor`): FastAPI app backed by `rembg` (U2-Net) that removes the background and returns a transparent PNG.

### Environment Variables

Add the service endpoint to `.env.local` (and production env):

```
SIGNATURE_SERVICE_URL=http://localhost:8001
```

### Database Changes

Apply the latest SQL in `lib/init-db.js` or run the statements captured in `database-migration.sql` to:

1. Add signature columns to `cv_data`.
2. Create the `signature_jobs` table with service-role-only access.
3. Create indexes for quick lookups.

### Running the Processing Service

```
cd services/signature-processor
python -m venv .venv
. .venv/Scripts/activate   # Windows
pip install -r requirements.txt
uvicorn main:app --host 0.0.0.0 --port 8001
```

The Node API streams the raw image bytes to `POST /process`. The service responds with a transparent PNG. Health checks are available at `GET /health`.

### Runtime Flow

1. User uploads a PNG/JPEG (max 8 MB). Client sends it to `/api/signature`.
2. API stores the original file, records a job (`signature_jobs`), updates `cv_data` to `processing`, and fires off background processing.
3. Background worker calls the Python service, saves the transparent PNG, and updates Supabase (job plus CV row).
4. Front-end polls `/api/signature/status?jobId=...` until status becomes `ready` or `failed`. Users see live status and a preview.
5. CV exports now bundle both the transparent and original signature images.

### Status Codes

- `idle`: No signature yet.
- `processing`: Upload accepted and background removal in progress.
- `ready`: Transparent PNG is stored and ready for use.
- `failed`: Processing failed (error message stored in `signatureError`).

### Operational Notes

- Limit concurrent jobs by adjusting infrastructure (the service is CPU-bound).
- Ensure the Python service runs on the same private network or expose it securely (HTTPS/auth if remote).
- Log retention: `signature_jobs` keeps timestamps and last error; prune or archive rows if needed.
