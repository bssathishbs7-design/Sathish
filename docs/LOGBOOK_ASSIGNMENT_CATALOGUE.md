# Department logbook assignment catalogue

Implemented 29 October 2026. Source: `Fwd__LOGBOOK_ALL_Department.zip`.

## Faculty and learner flow

1. Open Admin logbook > Assign logbook entry.
2. Choose a student or the entire three-student sample cohort, then a department.
3. Keep Department logbook documents selected; choose the posting phase and log category.
4. Search and select one document activity. The code, topic and available integrated departments/week fill automatically. Source values are locked; View source shows the original file, table and row.
5. Optionally enter a due date and instructions, then assign the activity.
6. Alternatively, select Preview sample assignments. It proposes one activity per available category for this department and posting, shows named recipients, deadline, instructions, new/duplicate/locked counts, and requires Assign entries before saving.
7. Students see separate To do tasks. They complete their own fields/reflections and submit through the existing faculty review flow.

The representative batch does not use the individually selected activity: it shows its own exact proposed activities before confirmation. Changing department, phase, recipient, deadline or instructions invalidates the batch preview. Preview itself performs no storage writes.

Manual activity remains available for categories outside the documents and for Forensic Medicine, whose document was not supplied. Existing records and historical categories are preserved. Skills, certification and remedial attempts remain in the existing Skills workflow; no document skill rows are seeded as editable Logbook tasks.

## Imported data

20 DOCX documents cover 18 departments. The Anaesthesia posting timetable is reference-only. Forensic Medicine and Toxicology is absent. The supplementary General Surgery skills document is retained as a reference.

| Assignable source category | Activities/templates |
| --- | ---: |
| Early clinical exposure | 13 |
| AETCOM | 27 |
| Vertical integration | 28 |
| Self-directed learning | 179 |
| Curricular achievements | 18 |
| Co-curricular achievements | 18 |
| Field visits | 7 |
| Clinical case presentation | 22 |
| Clinical clerkship | 14 |
| Family adoption | 1 |
| Total | 327 |

The full generated catalogue contains 1,196 records including reference-only skills. Its 105 extraction notes comprise 103 rows without a code, one conflicting certification count, and the reference-only posting timetable. Six uncoded non-skill topics remain selectable with no invented code; uncoded skill/certification rows are retained in the issue report rather than assigned. These source gaps require curriculum-owner review before production curriculum approval. Imported content is document-derived demo/reference data, not a verified NMC curriculum.

Blank clinical/community/achievement tables and blank teaching tables have explicitly labelled sample templates. Dates of completion, patient details, reflections, signatures and grades are not seeded. The entry's completion date is blank; assignment timing is retained separately in `assignment.assignedAt`. Source-coded topics are preserved, while whitespace in codes is normalised. Two different Biochemistry module 1.1 topics have distinct IDs. Phase remains part of activity identity even when code/topic repeat.

Curricular and co-curricular records use the existing persisted `ach` schema, with their distinct source category retained in assignment metadata. Reflection tables do not become independent activities. The Orthopaedics Phase III Part 2 table preceding its skills heading is recognised by its competency/activity columns.

## Implementation and data contract

- `scripts/extract-logbook-documents.ps1`: reads nested DOCX XML from ZIP in memory; preserves paragraph/table order. No document instructions are executed and no source files are changed.
- `scripts/build-logbook-catalogue.mjs`: generates stable IDs, document provenance, phase/category coverage and extraction notes.
- `src/data/logbookDocumentCatalogue.json`: static source catalogue available without storage seeding.
- `src/services/logbookAssignmentSamples.js`: department/phase filters, category mapping, sample selection and safe task-field projection.
- `src/services/adminLogbook.js`: existing single-assignment adapter plus asynchronous preview and atomic batch assignment adapters.
- `LogbookSamplePreview`: explicit batch review, eligibility counts and success/error feedback.
- `LogbookAssignmentNotice`: shared faculty/learner source, phase, template and deadline notice.

Source activity shape:

```js
{
  id, subject, phase, category, code, name, sample,
  sources: [{ file, heading, table, row }],
  departments, // optional, from document
  week, // optional, from document
  requiredAttempts // reference-only skill data; not used to change certification targets
}
```

Single assignment request extends the existing request with `activityId` and `phase`. Source identity must match subject, category and phase. Source code/topic values are resolved by the service rather than trusted from the form.

Batch request: `{ activityIds, studentId, due, instructions }`. `studentId: 'all'` selects the existing three demo learners; otherwise it must name one of them. The batch accepts at most 30 unique activity IDs, validates all rows, stages them in memory, and writes once. A failure midway does not save earlier rows.

Assignment metadata includes `{ by, due, instructions, locked, assignedAt, activityId, phase, sourceCategory, activityName, sample, sources }`. Idempotency uses student plus activity ID across active persisted entries. Completed/pending/draft tasks prevent reseeding; cancelled assignments may be assigned again. Subject locks and duplicate detection are rechecked at submission, so eligibility can decrease after preview. Existing entries are never reset or overwritten.

## Backend handoff

This remains the existing localStorage demo adapter. API integration must authenticate faculty/student identities, enforce department/subject access and subject locks, validate source revisions and schema fields, and use a server-side transaction plus a unique active assignment key for cross-client idempotency. A browser preview cannot guarantee eligibility or atomicity across different tabs/devices. Replace the local catalogue with an approved versioned curriculum endpoint when available; keep persisted source IDs/provenance stable through migration.

## Rebuild source data

From the repository root in PowerShell (Node and .NET ZIP support already used by this project):

```powershell
$rawPath = Join-Path $env:TEMP 'medsy-logbook-document-blocks.json'
./scripts/extract-logbook-documents.ps1 -ZipPath 'C:\Users\Medsy\Downloads\Fwd__LOGBOOK_ALL_Department.zip' -OutputPath $rawPath
node scripts/build-logbook-catalogue.mjs $rawPath src/data/logbookDocumentCatalogue.json
```

No dependency installation is required. Review generated changes and extraction notes before accepting a changed source archive.

## Verification

- 58 Logbook/Skills tests passed, including every assignable source activity, stable duplicate-code identities, source value locks, permission failures, atomic batches, no-save preview, fresh subject locks, cancelled/repeated assignments and existing review/sign-off flows.
- Targeted ESLint and production build passed. Existing large-bundle and mixed static/dynamic import warnings remain.
- Browser checks at 390, 768, 1024 and 1440px: drawer fits, no horizontal overflow, footer remains inside viewport.
- Light and dark assignment views checked. Tooltip Escape dismisses before the picker; closing the picker restores trigger focus.
- Isolated browser: 18 Biochemistry tasks saved for three demo students as To do; repeat preview showed 0 new / 18 skipped. Same-code AETCOM rows select independently. Community Medicine Phase I lists FAP only; blank General Medicine SDL is labelled Sample.
- A single Anatomy ECE assignment was also saved through the UI. The learner form showed its source notice and locked topic/code, with Date completed blank and assignment timing displayed separately.
- Tests are local frontend checks, not backend or cross-device acceptance.
