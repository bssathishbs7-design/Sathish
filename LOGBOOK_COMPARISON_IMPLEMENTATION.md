# Logbook comparison implementation

29 September 2026. Scope: My Logbook and Admin Logbook.

Implemented the approved frontend findings from `LOGBOOK_PROTOTYPE_COMPARISON_PLAN.md`, using the user's confirmed prototype policy defaults. Existing headers and the desktop single-row search/filter card are preserved. No new packages are required.

## Findings addressed

| IDs | Result |
|---|---|
| G01, G02 | Shared service and UI guards seal Completed subjects and block record changes while final approval is Submitted. Assignments exclude these recipients and report assigned/skipped counts. |
| G03 | Pending subject/category remain immutable in both form and service. |
| G04 | Legacy learner faculty navigation resolves to learner Pending search; review controls require the faculty context. |
| G05 | Department membership controls chain configuration. New chains use subject-specific sample HoDs. Existing submitted chain snapshots remain intact. |
| G06 | App records use `medsy-logbook-app-v4`. Incompatible HTML data is detected and left untouched, with an explicit separate-app recovery action. Existing app-shaped legacy records remain readable and save into the new namespace. No prototype import occurs. |
| G07 | Faculty can read learner notes and their edit timestamp. Learner note updates require record ownership in the local service. |
| G08 | Pending entries support faculty/subject grouping, oldest wait and overdue context, with grouping retained in the URL. |
| G09 | Dashboard adds waiting age, certification progress, unstarted requirements, weekly submissions and available posting deadlines. Reference posting dates are visibly labelled as sample data. |
| G10 | Subject cards show final-approval state and completion context. |
| G11 | Changed valid drafts/tasks auto-save on close. Invalid or locked changes allow continued editing or explicit discard. |
| G12 | Optional initial comments are retained in drafts and appended once at submission. |
| G13 | Search indexes additional category/reviewer context and learner notes; faculty search also includes notes. |
| G14 | Category-aware titles and activity keys retain distinguishing competency/module/session/specimen/procedure details; admin subject groups use the shared title. |
| G15, G16 | Drafts and unsubmitted tasks do not count as logged attempts; dashboard destinations and skill status buckets use consistent populations. |
| G17 | New notes/comments/instructions use the approved 500-character limit. Existing longer content can be retained or shortened without truncation. |
| G18 | Unlinked Returned entries can be deleted with confirmation. Linked remedial history cannot be deleted. |
| G19 | Returned final approvals follow learner resubmission; faculty cannot reset them through Mark ready. |
| G20 | Named learner acknowledgement, category-specific faculty/facilitator attestation, readiness/submission metadata and returned-step status are shown. |
| G21 | Clinical sample fields are repaired; deterministic tests cover lifecycle states, sealed assignment eligibility, storage compatibility and field boundaries. |

## Policy and integration boundaries

- Catalogue targets and discretionary faculty readiness remain as previously approved. Unknown targets stay explicit rather than being invented.
- Completed/Submitted restrictions apply to the record body. Notes/comments remain available as separate annotations, matching the approved prototype defaults.
- C03: final submission snapshots the approval chain and logged record revisions; local approval rejects a changed record set. Older snapshots remain compatible, with the shared lifecycle guards applying to new mutations.
- C01/C04: real learner enrolments, department ownership, posting calendars and complete institutional requirements were not supplied. Existing sample rosters and clearly labelled sample schedules remain; these must be replaced with institutional data before deployment.
- C02: these are browser-backed asynchronous services, not server authentication or database transactions. The backend must enforce actor permissions, ownership, subject locks, revision checks and atomic assignment/approval updates. Local guards cannot protect against direct browser-storage manipulation or provide multi-user transaction guarantees.

## Verification

- Production Vite build passed. Existing large-bundle and mixed static/dynamic import warnings remain.
- All 30 Logbook service tests passed, including eight comparison regression cases.
- ESLint passed for changed/new Logbook files. A broader scan also found a pre-existing `StatusIcon` unused-variable error in unchanged `AdminLogbookCategoryDetail.jsx`.
- Isolated Chromium checks passed 16 workflow assertions: assignment, submission, return/correction, review, live cross-tab refresh, remedial resume, navigation/filter history and HoD/Dean/Director approval.
- Fourteen policy assertions passed: sealed controls, draft auto-save, longer notes, first comment, Returned deletion, faculty notes, recipient counts, chain permissions and prototype isolation.
- A further browser check passed safe discard/close after selecting a locked subject.
- Forty-eight route/viewport checks across 320, 390, 768, 1024, 1366 and 1440 pixels found no page overflow or application runtime exceptions. Light/mobile and actual app dark-mode subject cards were visually inspected.
- Browser fixtures used a separate temporary Chrome profile, not the user's normal browser data. This is Chromium verification, not a cross-browser or screen-reader certification.

Local evidence is under `.logbook-check.local/comparison-evidence/` and `.logbook-check.local/approved-evidence/`. Test source is `src/services/logbookComparison.test.js`; flow changes are recorded in `FLOW_CHANGES.md`.
