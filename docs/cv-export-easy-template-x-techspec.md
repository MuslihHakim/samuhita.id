# CV Export: Migrate DOCX to easy-template-x (Tech Spec)

## 1) Overview
- Objective: Replace the existing docx-templates flow with easy-template-x using the provided Word layout "TEMPLATE CV TURKEY with Emergency number .docx" and align PDF generation with the same structure.
- Motivation: Current DOCX downloads occasionally trigger Word's repair prompt, which results in unusable output for some users.
- Deliverables:
  - Easy-template-x based DOCX generator backed by the Turkey template.
  - Feature flag to toggle between the legacy and new generators.
  - Phase 1 keeps jsPDF for PDF export; phase 2 will evaluate DOCX-to-PDF conversion to match layout exactly.

## 2) Current State
- DOCX generator
  - `lib/cv-generator.js` exposes `generateWordCV` (docx-templates with `lib/templates/cv-template.docx`).
  - `generateWordCVEasy` now exists and is gated by `CV_DOC_ENGINE` (`docx-templates` or `easy`).
  - `easy-template-x` dependency is installed.
- PDF generator
  - `generatePDFCV` in `lib/cv-generator.js` still uses jsPDF; output contains text only while images ship separately in the ZIP bundle.
- Consumers
  - `buildCvArchive` in `lib/services/cv.js` drives single-user exports; honours `CV_DOC_ENGINE` and falls back to docx-templates on failure.
  - Admin bulk download `app/api/admin/bulk-download-cv/route.js` mirrors the same engine selection.
  - API endpoint `app/api/cv/generate/[userId]/route.js` proxies to `buildCvArchive`. Dashboard and admin UI call `GET /api/cv/generate/[userId]?format=word|pdf` from `app/dashboard/page.js` and `app/admin/edit-cv/[userId]/page.js`.
- Template mapping notes
  - `docs/cv-template-mapping.md` documents placeholder usage for the Turkey template and is kept in sync with `prepareEasyTemplateData`.

## 3) Goals & Non-Goals
- Goals
  - Produce a repair-free Word document using the Turkey layout.
  - Maintain or improve field coverage relative to the legacy XML approach.
  - Allow progressive rollout via environment flags.
  - Position PDF export to eventually mirror the DOCX layout.
- Non-Goals (phase 1)
  - Embedding images directly inside the Word document (still delivered as separate files in the ZIP).
  - Changing the dashboard CV form or database schema.
  - Altering ZIP filenames or archive structure.

## 4) Proposed Design
### 4.1 Template Placement
- Store the provided document as `lib/templates/cv-template-turkey.docx`.
- Authoring guidelines:
  - Keep placeholders contiguous inside a single run (`{{placeholder}}`) to avoid fragmented tags.
  - For repeating data, wrap entire table rows with `{{#each ...}}` and `{{/each}}` markers.
  - Avoid styling the braces or inserting manual line breaks within tags.

### 4.2 Data Mapping
- Introduce `prepareEasyTemplateData(cvData)` to return:
  - Scalars: `positionApply`, `name`, `fatherName`, `motherName`, `height`, `weight`, `maritalStatus`, `placeOfBirth`, `dateOfBirthFormatted`, `address`, `religion`, `citizenship`, `idnPassportNo`, `issueDateFormatted`, `issuedBy`, `expDateFormatted`, `mobileNo`, `email`, `emergencyContactName`, `emergencyContactNumber`, `emergencyContactRelation`, `emergencyContactAddress`, `computerSkillsSummary`, `skillsSummary`.
  - Arrays: `education` (years/school/subject/country), `workExperience` (dates, employer details, position, reason, end of contract), `languages` (language, speaking, reading, writing, extra).
- Helpers ensure nulls become empty strings and at least one blank row is emitted for empty arrays so table layout remains intact.

### 4.3 DOCX Engine Implementation (easy-template-x)
- Dependency: `easy-template-x`.
- Function: `generateWordCVEasy(cvData)`.
  1. Load the cached template buffer via `loadEasyTemplateBuffer()` (reads `cv-template-turkey.docx` once per process).
  2. Build data with `prepareEasyTemplateData`.
  3. Reuse a module-scoped `TemplateHandler` to process the document.
  4. Return a Node `Buffer` for downstream ZIP packaging.
- Errors reading the template throw a clear message indicating the expected path.

### 4.4 PDF Strategy
- Phase 1 keeps `generatePDFCV` powered by jsPDF. Layout stays text-centric but continues to ship alongside images inside the archive.

## 4.4.1 Optional PDF via LibreOffice
- Flag: `PDF_ENGINE=libreoffice` (default remains `jspdf`).
- Implementation: generate DOCX using the selected DOCX engine, then convert to PDF via LibreOffice (`soffice --headless`).
- Env (optional): `SOFFICE_BIN` to point at a specific binary (e.g., `C:\Program Files\LibreOffice\program\soffice.com`).
- Fallback: if conversion fails or `soffice` is unavailable, service falls back to `jsPDF` and returns header `X-PDF-Fallback: true`.
- Phase 2 (future): evaluate DOCX-to-PDF conversion (e.g., LibreOffice, cloud renderers) and guard behind `PDF_ENGINE`. Maintain jsPDF fallback.

### 4.5 Feature Flags & Fallbacks
- `CV_DOC_ENGINE` (`docx-templates` | `easy`) chooses the generator; defaults to legacy.
- On easy-template errors, service layer logs the error and retries with docx-templates to ensure the user still receives a file.
- `PDF_ENGINE` reserved for future DOCX-to-PDF integrations; currently defaults to `jsPDF` only.

### 4.6 Error Handling & Logging
- Validate the requested format (`word`|`pdf`) early and respond with 400 for invalid values.
- Wrap generator invocations in try/catch, logging the engine name and error stack for observability.
- When both engines fail, bubble a 500 with a user-friendly message.

### 4.7 Data Prep & Sanitisation
- `safeText` coerces null/undefined to empty strings.
- `formatDateOrText` renders dates using `Intl.DateTimeFormat` and falls back to string values for non-date input.
- Work experience employer details are composed from available name/address/phone fields separated by line breaks.

### 4.8 Performance
- Templates are cached in-memory after first read and reused for subsequent requests.
- `TemplateHandler` instance is shared per module to avoid repeated instantiation overhead.
- ZIP assembly remains sequential to match current behaviour; revisit concurrency when profiling real datasets.

### 4.9 Security & Privacy
- No external services are called during DOCX generation.
- Image fetching continues to use signed URLs already in place; outputs remain inside the generated archive.
- If a cloud PDF service is introduced, ensure DPA coverage or keep processing on trusted infrastructure.

## 5) Acceptance Criteria
- Generated DOCX opens in Microsoft Word without prompting for repair.
- Field coverage matches the legacy template, including repeated rows for education, work experience, and languages.
- Admin bulk download and individual exports succeed for both DOCX and PDF outputs.
- Feature flags allow switching engines without code deploys.

## 6) Rollout Plan
1. Deploy with `CV_DOC_ENGINE=docx-templates` (flag off) in production; enable `easy` on staging for validation.
2. QA with a diverse set of user records (empty lists, long histories, special characters).
3. Flip production default once parity is confirmed; keep fallback flag available.
4. Plan phase 2 evaluation for DOCX-to-PDF conversion tools.

## 7) Risks & Mitigations
- Placeholder fragmentation in Word: enforce contiguous placeholders and lint template edits before release.
- Table row duplication errors: keep loop markers inside a single table row and validate with sample data.
- Template missing from deployments: runtime error clearly states the expected path; CI should ensure the asset ships.
- PDF layout disparity: communicate that PDF is text-only until DOCX-based conversion is in place.

## 8) Testing & QA
- Unit/Script level: Use `tmp/generate-easy-doc.mjs` to render a DOCX with representative data and ensure the buffer is non-empty.
- Manual: open the output in Word, verify table row counts, text wrapping, and check filenames from `generateCVFileName`.
- Bulk sanity: run the admin bulk download against staging data once the flag is enabled.

## 9) Work Breakdown / TODO
- Dependencies & Template
  - [x] Add `easy-template-x` to dependencies.
  - [x] Place `lib/templates/cv-template-turkey.docx` sourced from the provided document.
- Data & Generators
  - [x] Add `prepareEasyTemplateData(cvData)` covering scalars and array loops.
  - [x] Implement `generateWordCVEasy(cvData)` with template caching.
  - [x] Keep `generateWordCV` (docx-templates) available as a fallback path.
- Service & API
  - [x] Update `lib/services/cv.js` to honour `CV_DOC_ENGINE` for Word exports.
  - [x] Update `app/api/admin/bulk-download-cv/route.js` to use the selected engine with fallback.
  - [x] Add `app/api/cv/generate/[userId]/route.js` delegating to `buildCvArchive`.
- PDF
  - [x] Keep `generatePDFCV` (jsPDF) as the active default (`PDF_ENGINE=jsPDF`).
  - [ ] Investigate DOCX-to-PDF conversion (LibreOffice/cloud) and guard behind `PDF_ENGINE`.
- Docs & QA
  - [x] Update `docs/cv-template-mapping.md` with easy-template placeholders.
  - [x] Add sample data and test script in `tmp/` for local DOCX generation.
  - [ ] QA with varied datasets; capture sample outputs/screenshots.

## 10) Appendix A – Field-to-Placeholder Guide
- Scalar placeholders: `{{positionApply}}`, `{{name}}`, `{{fatherName}}`, `{{motherName}}`, `{{height}}`, `{{weight}}`, `{{maritalStatus}}`, `{{placeOfBirth}}`, `{{dateOfBirthFormatted}}`, `{{address}}`, `{{religion}}`, `{{citizenship}}`, `{{idnPassportNo}}`, `{{issueDateFormatted}}`, `{{issuedBy}}`, `{{expDateFormatted}}`, `{{mobileNo}}`, `{{email}}`, `{{emergencyContactName}}`, `{{emergencyContactNumber}}`, `{{emergencyContactRelation}}`, `{{emergencyContactAddress}}`, `{{computerSkillsSummary}}`, `{{skillsSummary}}`.
- Education table rows: `{{#each education}} … {{/each}}` with cells `{{years}}`, `{{schoolName}}`, `{{subject}}`, `{{country}}`.
- Work experience rows: `{{#each workExperience}} … {{/each}}` with cells `{{dateFromFormatted}}`, `{{dateToFormatted}}`, `{{employerDetails}}`, `{{positionDetails}}`, `{{reasonToLeave}}`, `{{endOfContract}}` (append text in template if required).
- Languages rows: `{{#each languages}} … {{/each}}` with cells `{{language}}`, `{{speaking}}`, `{{reading}}`, `{{writing}}`, optional `{{extra}}`.

## 11) Open Questions
- Should we embed a short note inside the DOCX/PDF clarifying that photos and supporting documents are delivered separately in the ZIP?
- What infrastructure (self-hosted vs SaaS) is acceptable for automated DOCX-to-PDF conversion in phase 2?
- Do we want to add automated tests that diff generated DOCX XML to catch placeholder regressions?

---
- References
  - `lib/cv-generator.js`

## Additional Notes
- Within `{{#each workExperience}} ... {{/each}}`, you can also use `{{companyName}}` to render the workplace/company name directly.
  - `lib/services/cv.js`
  - `app/api/admin/bulk-download-cv/route.js`
  - `app/api/cv/generate/[userId]/route.js`
  - `docs/cv-template-mapping.md`
