# Faculty Management implementation handoff

Implemented on 4 November 2026. Route: `/faculty-management`.

## Student Management design alignment

Restyled at the user's request to follow the existing Student Management page: shared overview/header and metric-card classes, compact buttons and tabs, search field, tinted table headings, and tighter dialog spacing. All faculty dropdowns use the reusable `ManagementSelect` native control with the same chevron treatment as Student Management. Workflow and service rules are unchanged.

The restyle passed focused ESLint, production build, existing browser workflows, and page/dialog bounds at 390, 768, 1024 and 1440 pixels. Light/dark and mobile dialog screenshots were reviewed. The visual inspector's gradient, icon-chip and shadow preferences are intentionally waived for the requested Student Management styling; shared-shell button effects and demo-control edge placement are retained. The existing shell profile-ID contrast warning is outside this page restyle.

## Delivered flow

1. Open Faculty management from the sidebar; search and filter the faculty directory.
2. Add a faculty profile, review identity and subject eligibility, then save. Excel import provides a template, row validation and explicit valid-row import.
3. Choose **Assign students** and select the study year, exact academic calendar and compatible batch.
4. Select the subject, primary faculty or co-teacher role, whole-batch or SGT scope, and effective dates.
5. Review eligible students and exclusions. Whole-batch includes eligible students with no SGT; SGT assignments allow reasoned individual exclusions.
6. Save a draft or publish the reviewed roster. Publication revalidates the preview against current data.
7. Review changes from Student Management before reconciling the saved roster. Historical roster versions remain available.
8. Reassign, end, deactivate or copy into a new academic context through explicit review steps. Primary changes handle dependent co-teachers together.

Faculty profiles, teaching assignments and audit history are separate views. Editing a profile does not silently rewrite teaching assignments. The default conflict rule allows one primary faculty per student and subject for overlapping dates, across assignment scopes. Co-teachers require matching primary coverage.

## Code ownership

| Area | Location |
| --- | --- |
| Page orchestration | `src/pages/FacultyManagementPageV2.jsx` and matching CSS |
| Forms, tables and dialogs | `src/components/faculty/` |
| Data shapes, catalog and validation | `src/services/facultyModel.js` |
| Academic context, eligibility and roster differences | `src/services/facultyAcademicContext.js` |
| Atomic command rules and audit | `src/services/facultyAssignments.js` |
| Asynchronous persistence boundary | `src/services/facultyDirectoryStorage.js` |
| Sample profiles, import and readable history | `facultySamples.js`, `facultyImport.js`, `facultyHistory.js` |
| Regression coverage | `src/services/facultyManagement.test.js` |

React JavaScript and vanilla CSS use the existing Medsy tokens. Existing native student-workspace dialogs provide focus trapping and Escape behaviour. No dependency was added. Actual navigation and workflow changes are recorded in `FLOW_CHANGES.md`.

## Persistence and backend integration

The frontend uses IndexedDB, with institution-scoped faculty state and atomic writes of profiles, assignments, roster history, audit and request IDs. Revision checks reject stale faculty updates; repeated request IDs cannot apply different commands. Sample records are available by default.

This is not production authentication or a shared backend. The current shell supplies demo identity and permissions. The backend must provide authenticated institution/actor context, enforce permission and eligibility rules, validate revisions across student and faculty domains in one server transaction, and persist idempotency keys and audit records. Student and faculty browser stores are separate; browser checks cannot guarantee server-grade cross-domain concurrency.

Student changes refresh the open page and produce review differences. There is no background worker when the app is closed. Scheduled assignments are evaluated on read and can be blocked by unreviewed roster changes; production scheduling and notifications require server jobs.

Academic restrictions are consumed only when explicitly available. Unknown restrictions are shown as unverified; repeaters are not assumed to be detained. Reconcile the institution's detention policy and authoritative restriction feed before production rollout. Teaching assignments do not grant generic application permissions or automatically integrate every assessment/logbook consumer.

## Verification

- 63 faculty and student regression tests passed, including overlapping scopes, co-teacher coverage, stale previews, atomic deactivation, historical reassignment, restrictions and scheduled activation.
- Focused ESLint passed; production build passed. Existing bundle-size and admin-logbook mixed-import warnings remain.
- Browser checks passed: onboarding and whole-batch publication, persistence after reload, fresh academic context on copy, SGT exclusions, a real Student Management change followed by reconciliation, unsaved-change confirmation, Escape, reduced motion and layouts at 390, 768, 1024 and 1440 pixels. No console errors were observed in that run.
- Light and dark page/dialog screenshots were reviewed. Whole-app automated visual inspection also reports existing shared-shell styling issues; this is not a claim that every screen in the application passed a visual audit.
- Excel row parsing/validation is covered at service level; a complete real-file upload/download browser round trip remains a manual acceptance check.

## Local review

Run `npm run dev -- --host 127.0.0.1 --port 5173` and open `http://127.0.0.1:5173/faculty-management`.

For acceptance, create a profile, publish an SGT assignment, change a student's SGT in Student Management, return to review the difference, reconcile, and inspect both roster versions. Also verify institution-specific permissions and restriction rules with the backend team before deployment.
