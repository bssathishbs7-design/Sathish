# Faculty Management: proposed flow and implementation plan

Date: 4 November 2026  
Status: Planning only. No application implementation authorised or performed.

## 1. Recommendation

Build one Faculty Management workspace with three views: **Faculty**, **Teaching assignments**, and **History**.

Onboard a faculty member once. Then create separate teaching assignments connecting that faculty member to a course, study year, academic period, subject, SGT scope, and an explicitly reviewed student roster. Reuse Student Management as the source of students, batch calendars, study years, SGT membership, and subject/syllabus information.

**Main journey:** Add faculty → save profile → Assign students → choose teaching context → choose subject and SGT → review students → review assignment → publish → monitor changes.

The directory and assignment records must be separate. Editing a faculty name or phone must never replace teaching allocations.

## 2. Scope, evidence, and assumptions

The supplied [existing flow](FACULTY_MANAGEMENT_FLOW.md) is a baseline document, not an instruction to implement its defects. Current source was also inspected.

| Item | Evidence / confidence |
| --- | --- |
| Faculty directory and Add Faculty onboarding | Source-verified in FacultyManagementPageV2.jsx |
| Student Management calendars, roster, subjects, progression integration | Source-verified in the files listed at the end |
| Separate faculty onboarding screen | Not located in this checkout; current Add Faculty is the available comparison baseline |
| Live admin.medsy.ai behaviour | Not verified; do not assume local/production parity |
| Proposed screens, rules, services, permissions | Recommendations for review, not existing implementation |
| Application browser testing | Not performed for this planning task |
| Archify diagrams | Proposed future workflow, not a diagram of deployed functionality |

Planning assumptions:
- “Year wise” means study year; “academic year wise” means the configured teaching period. Admission/current batch remains a separate field.
- SGT means the existing A–O small-group values; N/A means not grouped and must not be interpreted as a teaching group.
- Onboarding lives within Faculty Management, using one reusable editor for add/edit.
- Initial scope is MBBS First–Fourth Year, matching the current calendar workspace. Internship exists in older model constants but is not in the current STUDY_YEARS calendar list; add it only with an explicit calendar/roster extension.
- Assignments are administrative teaching responsibilities, not automatic assessment assignments, logbook reviewer authority, login invitations, or unrestricted access to student records.
- Direct publication by an authorised administrator is the initial recommendation. There is no new HOD approval stage unless requested.

## 3. Comparison: existing versus proposed

| Capability | Existing Faculty / onboarding | Existing Student Management | Proposed Faculty Management |
| --- | --- | --- | --- |
| Entry | Directory with six in-file samples | Batch calendar workspace; batch details; year roster | Faculty directory with clear Add faculty and Assign students actions |
| Onboarding | Single identity/role modal; name/email presence only | Add/import with destination, validation and calendar-aware commands | Identity → teaching eligibility → review; persistent profile, assignment optional |
| Persistence | React state; reset on remount | Async command boundary and local mock persistence | Async faculty and assignment services with durable mock adapter; backend-ready contracts |
| Year context | Single display assignment, sample course/year-sem strings | Current batch, mother batch, First–Fourth Year, configured month ranges | Explicit reference to current teaching batch + study year + calendar period |
| SGT | Class/section text such as A / B | A–O or N/A, roster filtering and SGT operations | Multi-SGT selection, distinct ungrouped state, reviewed student IDs |
| Subject | Comma-separated assignment text | Subjects by study year, batch syllabus and individual overrides | One canonical subject per assignment; authorised faculty-subject mappings |
| Student link | Student count only | Stable student identity and current academic entries | Saved membership with student ID, attempt ID, context snapshot and revision |
| Find records | Search, role/designation/status filters | Guided roster; choose batch and study year before table appears | Compact guided filters; show prerequisites instead of an empty table |
| Edit | Profile save overwrites assignment with defaults | Separate profile/academic commands and revision checks | Separate profile, assignment and roster-change commands |
| Change management | Immediate deletion; no history | Progression/migration/history and stale-change protections | End/reassign teaching responsibility, audit history, reviewed roster differences |
| Import | Alert only | Student Excel preview and validation | Faculty import preview + duplicate handling; never repurpose student template unchanged |
| Permissions | No faculty-specific permission prop | canEdit passed to command adapter; production enforcement still required | Read, profile edit, assignment publish and scope checks in UI and service |
| Empty/error/loading | Limited states | Loading/retry and guided states | Explicit loading, empty, invalid, stale, saving and failed-save states |

Reusable patterns: compact tables, actions above the table, guided prerequisites, asynchronous command validation, reasoned changes and history. Reuse behaviour and services where appropriate; do not copy student-specific editing logic into faculty components.

## 4. Ownership and terminology

| Concept | Owner | Meaning |
| --- | --- | --- |
| Faculty profile | Faculty Management | Stable ID, employee ID, name, contact, department, designation, account status |
| Teaching eligibility | Faculty Management with institution configuration | Subjects the faculty may teach; distinct from their department and app roles |
| Student identity and enrolment | Student Management | Student ID, admission/mother batch, current teaching batch, current attempt and status |
| Study year | Shared calendar model | First, Second, Third or Fourth Year |
| Academic period | Student Management batch calendar | Exact from/to month range for a batch and study year |
| Subject/syllabus | Shared curriculum adapter | Canonical subject plus applicable batch default/student override |
| SGT membership | Student Management | Current group value within the relevant student attempt |
| Teaching assignment | Faculty Management | Responsibility of one faculty for one subject and a reviewed set of students during specified dates |

Important: the current roster control says “Admission batches” but filters students by current `student.batch`; `motherBatch` preserves original admission lineage. The new assignment flow should label its selector **Teaching batches** and show **Admission batch** separately in the roster. Consider a later consistency correction in Student Management as an explicit approved flow change.

Do not infer a student's eligibility solely from admission year, current date, department, or the display label “2026–2027”.

## 5. Proposed workspace

### Faculty

Compact columns: faculty name / employee ID; department; designation; account status; eligible subjects; active assignments; unique assigned students; actions.

Actions: View profile, Edit profile, Assign students, Deactivate. Add faculty and Import faculty appear above the table. Search covers name, employee ID and email. Filters: department, designation, account status and assignment coverage.

Separate account status (Active/Inactive) from coverage (Assigned/Unassigned). No “Not Assigned” account status. Onboarding drafts are draft records, not inactive accounts.

Unique assigned students count each student once within the selected active period even if that student appears in several subjects. Assignment count counts assignment records. Label counts clearly; do not add overlapping measures into a misleading total.

### Teaching assignments

Columns: faculty; subject; study year; academic period; teaching batches; SGTs; student count; lifecycle status; roster review indicator; actions.

Use filters for period, study year, subject, SGT and faculty. Show one row per assignment, with a read-only expandable roster or detail panel. One faculty can have multiple rows. “Needs review” is a separate indicator, not a replacement for Active/Ended.

### History

Filterable profile, onboarding, assignment publication, reassignment, ending and roster-reconciliation events. Show actor, time, reason and readable before/after changes. Historical rosters are immutable.

## 6. Onboarding flow

| Step | User action | System behaviour |
| --- | --- | --- |
| 1. Identity | Enter employee ID, name, email, optional phone, designation and department | Validate required fields, email, phone if supplied, and institution-scoped uniqueness |
| 2. Teaching eligibility | Select eligible subjects; authorised user selects app roles | Subjects use canonical curriculum IDs; no silent Course Lead default; roles do not imply teaching allocation |
| 3. Review | Review profile and eligibility | Highlight errors next to fields; show duplicate profile link rather than creating another record |
| 4. Save | Select Save faculty | Save atomically; show pending feedback; retain draft on failure |
| 5. Continue | Choose Assign students or Back to faculty | Assignment wizard opens for the saved faculty, or directory shows Unassigned |

Creating a profile alone must not mark it Assigned. Save-and-assign saves the profile first and then opens the wizard; cancelling the wizard leaves a valid unassigned profile. Do not silently send login invitations.

For bulk onboarding: download a faculty-specific template → upload → preview valid/invalid/duplicate rows → fix errors or explicitly choose valid rows → import → report per-row outcomes. Retry failed rows without duplicating successful rows.

Initial migration must map old faculty status “Not Assigned” to a reviewed account status and coverage separately; do not assume it means inactive. Preserve legacy display assignment details as migration evidence, not validated student memberships.

## 7. Assign students: four clear steps

### Step 1 — Teaching context

Faculty is preselected from its row, or chosen if starting from the assignments view.

1. Choose Course (MBBS initially).
2. Choose Study year.
3. Choose Academic period from existing configured batch calendars, displayed with full dates.
4. Choose one or more Teaching batches that have that exact period and study year.

Academic-period options are derived from configured calendars; retain separate references to every selected batch/calendar. Identical period labels can group matching date ranges in the UI, but are not an institution-wide calendar identity.

Initial version groups batches only when calendar dates match exactly. Different date ranges require separate assignments; explain this beside the disabled option. This avoids silently combining an 18-month period with a 12-month period.

Changing course/year/period clears incompatible downstream choices and requires a new roster preview. Show a persistent context summary.

Missing calendar: “Set the dates for this batch and study year in Student Management.” Offer a contextual navigation action, preserving the draft.

### Step 2 — Subject and SGT

- Select one subject valid for both the selected study year and the faculty's teaching eligibility.
- Allow multiple SGTs (A–O) within the chosen teaching context.
- Provide “All grouped students” as an explicit selection of existing A–O groups. Expand and save the selected values; do not silently include future groups.
- Show N/A separately as “Students without an SGT”. Recommend resolving their group in Student Management before SGT-based publication.
- No eligible subject: explain whether the faculty's eligibility or the curriculum mapping needs correction.
- Show students with differing syllabus versions distinctly in the next step. A subject assignment may include them if explicitly reviewed; do not overwrite their syllabus.

Department does not automatically equal subject. For example, map legacy Anatomy to the canonical Human Anatomy through an explicit reviewed alias, not fuzzy matching.

### Step 3 — Review students

Resolve candidates from the authoritative directory, not another sample faculty roster.

Eligibility requires:
- Same institution and course.
- Current teaching batch in the selected set.
- Matching study year and exact academic period/current entry.
- Active, tracked, non-graduated student with a current academic entry.
- Selected SGT value and applicable year-subject mapping.
- No unresolved current-entry/calendar mismatch.

Show a compact selectable table: student name / ID, study year, teaching batch, admission batch when different, SGT, syllabus, existing teaching responsibility and eligibility notes.

Provide “Select all N eligible students” across the full result set with explicit scope. Selection count stays above the table. Searching does not silently deselect hidden rows. Switching teaching context clears previous selection.

Show excluded students with reasons in an expandable summary. Zero eligible students disables Continue and offers a clear correction path. N/A students cannot enter an SGT-based assignment until grouped; a future whole-year/non-SGT assignment mode is a separate product decision.

### Step 4 — Review and publish

Summary: faculty, course, study year, exact dates, subject, teaching batches, SGTs, selected student count, exclusions and existing-assignment conflicts.

- Effective start/end must fall inside every selected calendar. Default to the remaining current period; a future start produces Scheduled.
- An ended period cannot create a new active assignment. Historical corrections need a distinct audited workflow.
- Show the proposed roster and all warnings before publication.
- Revalidate profile eligibility, permissions, directory/calendar revisions, membership and conflicts at save time.
- Save assignment, memberships and audit event atomically with an idempotency key.
- Success: “Students assigned” with View assignment and Assign another subject.
- Failure: retain the draft; never show success before persistence succeeds.
- Stale data: show what changed, return to roster review, require a refreshed review before retry.

## 8. Conflict and relationship rules

Recommended initial policy, subject to product confirmation:

| Situation | Proposed outcome |
| --- | --- |
| Same student, different subjects | Allowed |
| Same faculty, same subject/student, overlapping dates | Block duplicate; offer existing assignment |
| Different faculty, same subject/student, overlapping dates | Block second primary responsibility; offer explicit reassignment |
| Same subject/group split between two faculty, non-overlapping student sets | Allowed after preview |
| Same subject/group, non-overlapping teaching dates | Allowed |
| Faculty teaches multiple years/groups | Separate assignments per subject/year/period; no multi-dimensional mega-form |
| Co-teaching required | Later explicit Primary/Co-teacher role with limits; not silently allowed |
| Faculty inactive or subject no longer eligible | Block new publication; mark existing affected work for review |
| Empty roster | Draft may remain; active publication is blocked |

SGT labels alone are never unique keys: Group A in two batches must retain its batch/year/period context. A multi-batch assignment can include both, with roster grouping visible.

Reassignment is explicit: preview students and dates → select replacement faculty → validate replacement eligibility → close affected old memberships and create new ones in one transaction → retain history. Never delete historical ownership.

## 9. Ongoing changes and academic rollover

Use a **reviewed roster snapshot** for publication. This is the recommended balance between predictable teaching responsibility and accurate current enrolment.

1. Student Management saves a new student, SGT change, promotion, repeat/migration, status change, calendar correction or deletion.
2. Assignment service compares current eligibility to saved memberships.
3. Mark affected assignments “Needs review”; show Added / No longer eligible / Changed context.
4. Block newly ineligible membership from live assignment-derived access immediately; preserve the old membership in history. Newly eligible students gain no assignment-derived access until added by review.
5. Authorised admin reviews the difference and confirms a new membership revision.
6. Save history and clear the review flag only when all differences are resolved.

Initial browser mock listens to DIRECTORY_EVENT, storage and BroadcastChannel and rechecks on open/focus/save. Production needs authoritative backend change processing and access checks; browser notifications are not a security boundary.

At period end, assignment becomes Ended based on dates even if no browser is open. Membership history remains viewable. “Copy to next period” creates a draft with the subject and eligible faculty prefilled, then requires new batch/year/SGT selection and fresh student review. Do not promote students from Faculty Management or copy last year's student IDs blindly.

Deactivation requires an impact preview. Active teaching responsibility must be ended/reassigned as part of a validated command; outstanding references remain historical. Hard deletion is limited to an unreferenced mistaken draft/profile, with confirmation and audit.

## 10. Illustrative example

These dates and numbers illustrate the proposal, not a verified current production assignment.

Dr Anika → MBBS → First Year → Aug 2026–Jul 2027 → Teaching batch 2026 → Human Anatomy → SGT A and B → review 60 eligible students → publish.

A student admitted in 2025 who now repeats First Year with teaching batch 2026 belongs in that preview if their current attempt matches the selected calendar and SGT. Their admission batch stays 2025.

The same faculty can receive another assignment for Physiology only if authorised to teach it. Selecting another subject creates another assignment; it does not overwrite Anatomy.

## 11. Proposed data contracts

Use JavaScript with JSDoc, stable IDs and versioned records. Names below describe proposed shapes, not an agreed server schema.

| Record | Required fields / purpose |
| --- | --- |
| Faculty | id, institutionId, employeeId, name, email, optional phone, departmentId, designationId, roleIds, eligibleSubjectIds, accountStatus, revision |
| Calendar reference | batchId, studyYear, fromMonth, toMonth, revision or stable calendar fingerprint; future backend calendarId |
| Teaching assignment | id, institutionId, facultyId, courseId, studyYear, calendarRefs[], subjectId, selectedSgtValues[], startsOn, endsOn, state, rosterRevision, revision |
| Membership | assignmentId, studentId, academicEntryId, batchId, sectionAtAssignment, syllabusAtAssignment, validFrom, validTo, sourceAcademicRevision |
| Review state | assignmentId, addedCandidates[], ineligibleMembers[], contextChanges[], detectedRevision, reviewedRevision |
| Audit event | id, institutionId, entityId, action, actorId, timestamp, reason, before/after reference, requestId |

Assignment state: Draft → Scheduled or Active → Ended; Draft/Scheduled may be Cancelled with reason. Scheduled becomes Active when its start arrives only if still valid; otherwise remain blocked for review with no live access. “Needs review” is an independent condition. Profile account status is independent of all these.

Proposed service boundaries:
- getFacultyDirectory, saveFacultyProfile, previewFacultyImport, importFaculty.
- getTeachingContexts, getFacultySubjectOptions, previewAssignmentRoster.
- saveAssignmentDraft, publishAssignment, reconcileAssignmentRoster.
- reassignMemberships, endAssignment, deactivateFaculty, getFacultyHistory.

All writes carry institution scope, expected revisions and a request/idempotency key. Server integration must validate permissions and source versions independently. Distinguish permission, field-validation, conflict, stale-data and persistence errors.

Canonical subject IDs and faculty subject eligibility are prerequisites: current Student Management uses subject strings. Add a shared mapping adapter without a wholesale student-storage rewrite. Preserve batch syllabus defaults and individual overrides.

## 12. Implementation sequence

| Phase | Work | Completion condition |
| --- | --- | --- |
| 1. Shared domain contract | Confirm calendar/SGT/conflict rules; canonical subject and faculty identity mapping; sample scenarios | Same context resolves identically from Student and Faculty views |
| 2. Faculty foundation | Async mock service, seeded data, profile validation, add/edit, import preview, compact directory | Reload retains records; edit preserves independent assignments |
| 3. Assignment resolver | Pure eligibility resolver, calendar references, conflict checks, student/attempt identity snapshots | Positive and exclusion cases pass focused tests |
| 4. Guided assignment UI | Four steps, context summary, roster selection, review, publish, safe cancel and draft recovery | Complete keyboard-operable flow; no ambiguous empty tables |
| 5. Lifecycle and history | Version checks, reconciliation, reassignment, deactivation impact, period ending and next-period draft | No silent student carryover or loss of historical ownership |
| 6. Integration and QA | App navigation, faculty profile/assignment deep links, responsive/theme checks, build and backend handoff | Browser and service acceptance matrix passes; limitations documented |

Suggested files:
- Retain the existing route in src/config/appPages.js and App.jsx; App.jsx owns page navigation.
- src/pages/FacultyManagementPageV2.jsx initially becomes a small orchestration container; rename only with its imports updated.
- src/components/faculty/: directory, shared profile editor, assignment wizard, roster table, assignment detail, history and impact confirmation.
- Every new JSX component has a co-located CSS file. Use Medsy tokens and existing accessible overlay primitives.
- src/services/: facultyManagement.js, facultySamples.js, facultyAssignments.js, facultyAssignmentResolver.js and shared academic-context/subject mapping helpers.
- Reuse Student Management read APIs and event constants. Do not create a second writable student store.
- Add FLOW_CHANGES.md entries only during approved implementation of real navigation/flow changes, not for this plan.

No new package is assumed necessary. Future implementation checks: focused Node tests for pure services, appropriate existing student regression tests, npm run build, and browser QA. No app build is needed solely to create these planning artifacts.

## 13. Acceptance and regression plan

| Scenario | Required result |
| --- | --- |
| Add duplicate employee/email | Clear inline conflict; no duplicate profile |
| Edit phone/name | Existing assignment and student memberships unchanged |
| Choose context out of order | Guided prerequisite, no misleading zero-result roster |
| First Year subject choices | Only canonical valid subjects intersecting faculty eligibility |
| N/A SGT | Explained exclusion; no accidental inclusion in Group A or All grouped |
| Multiple teaching batches | Exact compatible calendars required; each student's batch retained |
| Repeater/migrated student | Resolve from current batch and attempt; preserve mother batch |
| Inactive/graduated/untracked student | Excluded with reason |
| Different syllabus overrides | Visible and preserved |
| Same primary subject/student/date overlap | Block duplicate or require explicit reassignment |
| Profile/calendar/SGT changes during review | Reject stale publish and show differences |
| Publish double click or retry | One logical assignment, no duplicate memberships |
| Save failure | Draft retained; no partial assignment or false success |
| Student joins or changes SGT later | Review difference; no silent new teaching access |
| Student becomes ineligible | Remove live eligibility, preserve historical membership |
| Period ends | Ended view remains accurate without relying on an open browser |
| Copy next period | New draft, fresh roster; previous history unchanged |
| Faculty deactivation | Impact reviewed; affected responsibility ended/reassigned |
| Import partial outcome | Row-level success/failure; retry does not duplicate success |
| Student regressions | Calendar, onboarding, SGT, migration, promotion and undo still work |
| UI | 390/768/1024/1440px; light/dark; reduced motion; table overflow; keyboard; dialog focus and scroll |

## 14. Product choices to confirm before coding

The plan remains usable with these recommended defaults; they are not established institutional policies.

1. Co-teaching: default one primary faculty per student/subject/overlapping dates; confirm whether co-teachers are needed.
2. Roster changes: default reviewed additions/removals with immediate eligibility restrictions; confirm whether automatic additions are ever appropriate.
3. Onboarding: use Add Faculty as the verified baseline. If there is a separate onboarding screen elsewhere, compare it before implementation.
4. Publication: direct authorised-admin publication; add HOD approval only if required.
5. SGT: initial assignment requires A–O groups; confirm whether whole-year teaching must include ungrouped students.
6. Calendar grouping: exact date-range match for multi-batch assignments; differing calendars use separate assignments.

## 15. Source evidence

- FACULTY_MANAGEMENT_FLOW.md: existing flow and known limitations.
- src/pages/FacultyManagementPageV2.jsx: local state, Add/Edit, default assignment overwrite, import message, filters and table.
- src/pages/StudentManagementPage.jsx: batch/roster navigation, canEdit, service reads/writes, student change subscriptions.
- src/components/students/StudentRosterFilters.jsx: guided batch/year prerequisites and SGT options.
- src/components/students/StudentSubjects.jsx: subjects/syllabus by stage, batch defaults and override semantics.
- src/services/studentCalendar.js: First–Fourth Year, month-range calendars, running/admission destinations and migration helpers.
- src/services/studentModel.js: canonical current subject strings, identity/current entry helpers, older Internship constant.
- src/services/studentManagement.js: async command boundary, local mock qualification, permission/revision checks and change events.
- src/services/studentCalendarCommands.js: calendar/SGT/progression commands.
- src/App.jsx and src/config/appPages.js: shell route and page registration.

## 16. Archify diagrams

All three diagrams describe the proposed future workflow:
- [Onboarding and readiness](.archify/workflow-faculty-plan-20261104-144515/onboarding.html)
- [Assign students](.archify/workflow-faculty-plan-20261104-144515/assignment.html)
- [Roster changes and rollover](.archify/workflow-faculty-plan-20261104-144515/maintenance.html)

Artifact verification: all three passed Archify validation, delivery, artifact checks and automated browser checks. Manual visual review was not performed. These checks validate the diagram artifacts, not implementation of the proposed application flow.

