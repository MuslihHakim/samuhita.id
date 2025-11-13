# CV Template Data Mapping

This reference maps Supabase `cv_data` fields to the placeholders used by the easy-template-x
Word layout (`lib/templates/cv-template-turkey.docx`). Data prep lives in
`prepareEasyTemplateData` inside `lib/cv-generator.js`. The legacy docx-templates path
(`cv-template.docx`) remains available as a fallback when `CV_DOC_ENGINE !== 'easy'`.

## Scalar Placeholders (`{{field}}`)
- `positionApply`, `name`, `fatherName`, `motherName`
- `height`, `weight`, `maritalStatus`
- `placeOfBirth`, `dateOfBirthFormatted` (formatted via `Intl.DateTimeFormat`)
- `address`, `religion`, `citizenship`
- `idnPassportNo`, `issueDateFormatted`, `expDateFormatted`, `issuedBy`
- `mobileNo`, `email`
- `emergencyContactName`, `emergencyContactNumber`, `emergencyContactRelation`, `emergencyContactAddress`
- `computerSkillsSummary` (multi-line text generated from `computerSkills` array/string)
- `skillsSummary` (bullet-style text built from truthy booleans inside `skills`)

## Education Table (`{{#each education}}`)
Each item expands one table row with:
- `years`
- `schoolName`
- `subject`
- `country`

Empty datasets render a single blank row to keep the table structure consistent.

## Work Experience Table (`{{#each workExperience}}`)
Rows contain:
- `dateFromFormatted`, `dateToFormatted`
- `employerDetails` (joined lines from employer/company name, address, phone, contact person)
- `positionDetails`
- `reasonToLeave`
- `endOfContract` (date or free-form text)

Additional per-row fields available for direct use in the easy-template-x engine:
- `companyName` — workplace/company name (e.g. put `{companyName}` inside the row)

As with education, an empty array produces one placeholder row.

## Languages Table (`{{#each languages}}`)
Per-language row fields:
- `language`
- `speaking`
- `reading`
- `writing`
- `extra` (optional notes column in the template)

## Notes
- The engine keeps photo and document assets out of the DOCX; they ship separately inside the
  generated ZIP alongside the Word/PDF file.
- All helper functions coerce `null`/`undefined` values to empty strings so the template never
  renders literal `undefined` text.
- Date formatting uses the existing locale helper; adjust `formatDate` in `lib/cv-generator.js`
  if localisation rules change.
