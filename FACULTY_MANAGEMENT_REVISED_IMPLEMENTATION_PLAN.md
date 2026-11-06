# MBBS Faculty Management: reviewed implementation plan

Date: 4 November 2026  
Status: Proposed implementation plan; application coding has not started.

## 1. Review conclusion

Use the supplied plan as the functional direction, with the contract corrections below. Its separation of faculty profiles and teaching assignments is appropriate for this project. Whole-batch teaching and co-teachers should be included in the planned scope, with explicit eligibility and conflict rules.

The attached document labels itself “Approved for Implementation”. That is document content, not execution approval in this conversation. The current request is to review and provide a plan.

This document updates the earlier proposal for whole-batch scope and co-teaching. It does not overwrite the supplied file or the earlier baseline. Earlier Archify diagrams remain historical planning artifacts: they do not fully describe the newly added whole-batch and co-teacher paths.

## 2. What stays, what changes

| Area | Review | Implementation decision |
| --- | --- | --- |
| Separate profiles and assignments | Keep | Profile saves cannot write assignment or membership fields |
| Reviewed roster snapshots | Keep | Save immutable publication revisions; review subsequent differences |
| Exact calendar matching | Keep | Multi-batch assignment requires identical from/to months and the same study year |
| Whole-batch teaching | Add to earlier proposal | Include eligible N/A students; bypass only the SGT filter, never other eligibility checks |
| Co-teachers | Add to earlier proposal | Require a real primary assignment reference and validate coverage |
| Four-step wizard | Keep | Context, subject/scope, student review, final review/publication |
| Detained students | Missing source contract | Do not infer detention from repeat/backlog/inactive labels |
| Typed lifecycle events | Not currently implemented | Adapt current directory-change events; propose backend event contracts separately |
| Static snapshot vs immediate revocation | Contradictory wording | Preserve history; deny current assignment-derived eligibility when invalid |
| Calendar durations | Spec mentions 12/18 months | Current calendar validator allows 6–24 months; consume configured calendars rather than imposing a new 12/18-only rule |
| TypeScript interface examples | Illustrative shapes only | Implement JavaScript and JSDoc, consistent with project rules |
| Clinical target | Broader than detailed flow | First–Fourth Year subject allocations are in scope; ward/unit rotations, timetables and Internship need separate requirements |

## 3. Contract issues to resolve before coding

### 3.1 One primary faculty: across all teaching, or per delivery scope?

The supplied rule blocks a second PRIMARY for the same student, subject and overlapping dates. As written, it also blocks an SGT primary when another primary already owns whole-batch theory for that subject.

Recommended initial interpretation: one overall primary responsibility across both scopes, with other instructors represented as co-teachers. Whole-batch primary plus SGT co-teachers then works without a second primary.

If the institution wants independent theory and practical/SGT primaries, add a distinct responsibility dimension and revise the conflict key. Do not silently add scopeType to the conflict key: that changes the institution's ownership policy. This is the main product decision to confirm before implementation.

### 3.2 Co-teacher relationship

Add primaryAssignmentId to co-teacher assignments.

Recommended rules:
- Required for CO_TEACHER; absent for PRIMARY.
- Referenced record is a PRIMARY in the same institution, course, subject and study year.
- Co-teacher's batches, dates and reviewed students must be covered by the primary assignment.
- A whole-batch primary can have an SGT subset co-teacher.
- Co-teacher must be a different active faculty member and eligible for the subject.
- One co-teacher assignment references one primary; split records when coverage spans different primaries.
- Multiple different co-teachers may be allowed; duplicate coverage for the same co-teacher faculty is blocked.
- Ending, shrinking, cancelling or reassigning a primary requires a dependent co-teacher impact preview and atomic resolution.
- A DRAFT primary cannot support publication. A SCHEDULED primary may support a scheduled co-teacher within its dates, subject to activation revalidation.

### 3.3 Meaning of “Whole batch”

“All enrolled students” must mean all eligible students in the selected context, not inactive, graduated, unmatched or untracked records.

Recommended UI:
- WHOLE_BATCH: all currently eligible students included; read-only membership selection with an exclusions report.
- SGT: select groups, then select all eligible members by default; permit explicit student exclusions with a reason.
- Store excludedStudentIds and exclusion reasons for intentional omissions. Otherwise reconciliation would keep proposing deliberately excluded students as “new entrants”.
- If a whole-batch assignment needs arbitrary omissions, use an explicit exception policy or different scope; do not leave a subset labelled Whole batch.

New students still require a reviewed roster update after publication. Label this “Whole-batch scope · roster reviewed on [date]” so scope intent is not mistaken for automatic membership.

### 3.4 Detention and repeating students

Current student services support study year, current academic entry, status, repeat/migration and backlog calculations. A detention field and the named STUDENT_DETAINED event were not found in the inspected services.

Do not exclude all repeaters: an active repeater with a valid current attempt may be eligible.

Proposed integration requirement: Student Management owns an explicit teaching-eligibility restriction with reason and effective dates. Faculty Management consumes it. Missing restriction data must be treated according to an agreed adapter contract, not silently asserted to mean “not detained”. Production detention enforcement remains incomplete until that source contract exists.

### 3.5 Historical snapshots and live access

The executive summary says not to silently revoke access, while section 4.1 requires immediate restriction. Use this precise rule:

- The saved historical membership is not silently rewritten.
- Current assignment-derived eligibility is evaluated against current student/faculty status, dates and permissions.
- Ineligible members lose that specific live eligibility immediately and the admin sees Needs review.
- New eligibility never grants access before reviewed addition.
- Ending one assignment does not remove access legitimately granted by another assignment or separate permission.
- Teaching assignments alone grant no new application permission. Downstream modules must explicitly consume the eligibility service.

Browser events can refresh mock UI; they cannot guarantee production access restriction or background processing.

## 4. User-friendly workspace and flows

### Workspace

Three top-level views: Faculty, Teaching assignments, History.

Faculty table: name/employee ID, department, designation, account status, eligible subjects, active assignments, unique assigned students, actions.

Assignment table: faculty, Primary/Co-teacher, subject, study year, academic period, batches, scope/SGTs, student count, lifecycle state, Needs review, actions.

Use compact tables, a clear search/filter strip and selected-row actions above the table. Keep required-filter guidance visible before showing the student roster. Counts must state whether they refer to filtered results, active-period assignments or unique students.

### Onboarding

Identity → subject eligibility and permitted roles → review → Save faculty → Assign students or Back to faculty.

Employee ID/email uniqueness is institution-scoped and normalised. Invalid fields show inline messages. Faculty is saved before the assignment wizard opens; cancelling that wizard leaves an unassigned profile.

Coverage is derived from assignments, not stored as accountStatus. Distinguish Unassigned, Scheduled only, and Active assignments. Do not automatically grant Course Lead or send invitations.

### Assignment wizard

| Step | Inputs and behaviour | Continue condition |
| --- | --- | --- |
| 1. Teaching context | Faculty, MBBS, study year, exact academic period, compatible teaching batches | Active faculty and complete, valid calendars |
| 2. Subject and scope | Eligible subject, Primary/Co-teacher, primary reference if needed, Whole batch or SGT groups | Valid eligibility and required role/scope inputs |
| 3. Student review | Eligible roster, excluded reasons, syllabus variants, admission/current batch, intentional exclusions in SGT mode | At least one member; selection and primary coverage valid |
| 4. Final review | Effective dates, full summary, conflicts, exclusions and changes since preview | Fresh validation and authorised atomic publication |

When choosing Co-teacher, offer only compatible primaries and narrow remaining choices to their coverage. Changing upstream context invalidates the preview and incompatible selections.

Whole batch includes N/A if otherwise eligible. SGT excludes N/A with an explanatory link to Student Management. Repeaters are resolved by current batch and academicEntryId while admission batch remains visible.

Search never silently alters selection. Any select-all action states whether it covers the page or all eligible results. Save failures retain the draft; double clicks reuse the same request ID.

## 5. Proposed implementation structure

Reuse:
- src/pages/FacultyManagementPageV2.jsx as the initial page orchestration entry.
- App.jsx for top-level navigation and src/config/appPages.js for shared identifiers.
- getStudentDirectory and DIRECTORY_EVENT from studentManagement.js.
- studentCalendar.js for configured periods and First–Fourth Year.
- studentModel.js and StudentSubjects.jsx semantics for year subjects and syllabus fallback.
- Existing Medsy tokens, accessible overlays, feedback components and compact table patterns.

Add focused modules, splitting further only as responsibilities grow:

| Layer | Proposed files | Responsibility |
| --- | --- | --- |
| Domain | facultyModel.js, facultySamples.js | JSDoc types, normalisation, seeded scenarios |
| Academic adapter | facultyAcademicContext.js | Subject IDs, current attempts, calendar references, syllabus and restriction mapping |
| Profiles | facultyManagement.js | Read/save/import/deactivate profile commands |
| Assignment logic | facultyAssignmentResolver.js, facultyAssignmentConflicts.js | Pure eligibility and overlap/primary-coverage rules |
| Assignment commands | facultyAssignments.js | Draft, publish, revise, end, reassign and rollover |
| Persistence | facultyDirectoryStorage.js | Versioned IndexedDB mock transactions and request ledger |
| Change review | facultyAssignmentReconciliation.js | Added/removed/context/primary-dependency differences |
| UI | components/faculty/ | Directory, editor, wizard steps, roster, details, review and history |

All new JSX components get a matching CSS file. Use JavaScript/JSDoc and Medsy semantic tokens; no new styling framework or package is assumed necessary.

Do not clone a writable student directory or use separate sample student IDs as real memberships. Do not introduce a global context unless live state is genuinely needed across distant branches.

## 6. Data additions and state rules

Retain the supplied entities with these additions:

| Record | Required correction |
| --- | --- |
| Faculty | Version/schema metadata, normalised unique identity keys; derive coverage rather than persist UNASSIGNED |
| Assignment | primaryAssignmentId; excludedStudentIds/reasons for SGT; created/updated/published actor and timestamps; draft version |
| Calendar reference | Stable batch + study-year reference and dates; fingerprint includes those identity fields, not dates alone |
| Membership revision | Snapshot revision, source student revision and academicRevision, source entry ID and historical change linkage |
| Review difference | Added, ineligible, context-changed and dependent-primary changes, each with reason and source versions |
| Audit | Entity/action/actor/time/reason and before/after version references |
| Request ledger | Institution + request ID + command fingerprint + committed result for safe retry |

Avoid one mutable membership status serving both history and current eligibility. Store immutable roster revisions and separate current review/eligibility projections. Old revisions retain their original values.

Assignment lifecycle:
- DRAFT can be edited or cancelled.
- Publication creates SCHEDULED when startsOn is in the future; otherwise ACTIVE if eligible.
- SCHEDULED activation requires fresh validity checks. A blocked record remains Scheduled with an explicit blocked reason; it is not presented as active.
- ACTIVE can be ended through a dated audited command; ENDED preserves history.
- CANCELLED applies to unpublished drafts or not-yet-started schedules. Do not erase active history by cancelling it.
- needsReview is independent of lifecycle state.

Use institution-local ISO dates. startsOn and endsOn are inclusive; an assignment ends after its endsOn date. Overlap uses inclusive boundaries. A handover effective on a date ends old membership the preceding day; reject impossible/empty intervals. All membership dates stay inside assignment dates, calendar bounds and primary coverage.

Past-period corrections are separate audited operations. Copy-next-period produces a draft, clears old roster/primary references and requires fresh selection.

## 7. Persistence and concurrency plan

The existing student store uses IndexedDB, with localStorage as a migration source. Mirror the asynchronous adapter approach for faculty without overwriting student data.

Faculty transaction scope includes profile changes where relevant, assignments, membership revisions, audit entries and request-ledger result. Resolve success only after commit. In-memory idempotency alone is insufficient.

At publication:
1. Read current authoritative student/calendar context and faculty/primary revisions.
2. Resolve candidates, dates, coverage, conflicts and permissions.
3. Compare against the reviewed preview fingerprint.
4. Atomically write the faculty-domain records or return a stale/conflict error.
5. Notify UI only after commit.

A separate faculty IndexedDB database cannot atomically lock a separately written student database. The mock can coordinate cooperating app commands with a shared lock and recheck on open/save/events, but this is not a substitute for server-side transactional version checks. Record that limitation explicitly in the backend handoff.

For production, enforce institution/permissions, uniqueness, overlapping assignment conflicts, primary dependencies and idempotency on the server. Two admins must not publish conflicting primaries after both pass a client preview.

Local seeds must exercise whole batch, SGT, N/A, repeaters, differing calendars, co-teachers and needs-review states. Use deterministic mappings to real mock-directory students. Keep raw legacy faculty display assignments as migration evidence until memberships can be validated.

## 8. Reconciliation and ongoing operations

Use the current medsy-students-changed event, BroadcastChannel, storage notifications where relevant, and revalidation on load/focus/save. Do not subscribe exclusively to named events that do not exist.

Production may add typed domain events, with event IDs, entity versions, deduplication and replay handling. Reconciliation must be repeatable and compare versions, not depend on receiving every browser notification.

For each affected assignment:
1. Re-resolve against current data, including faculty and primary dependencies.
2. Update current eligibility projection and mark Needs review when differences exist.
3. Show New entrants, No longer eligible, Context changes and Primary coverage changes.
4. Respect intentional SGT exclusions; a dismissed suggestion must not recur without a relevant change.
5. Admin previews and confirms changes.
6. Revalidate, save a new roster revision plus audit, then clear resolved differences.

Whole-batch assignments are not affected by an SGT-only change for eligibility, but may show updated context. SGT assignments may lose the student and propose them to another matching assignment; never assign them elsewhere automatically.

Faculty deactivation previews ACTIVE and SCHEDULED work and all co-teacher dependencies. End/reassign affected responsibility atomically with deactivation. A future-dated closure cannot justify immediate deactivation; either end now or support a separate scheduled deactivation.

Backend jobs handle persisted expiration and reconciliation without an open browser. The frontend also derives effective lifecycle from dates on read; it cannot claim to run background jobs after closing.

## 9. Delivery phases and acceptance gates

| Phase | Deliverables | Must pass before continuing |
| --- | --- | --- |
| 1. Contract and adapters | Resolve primary ownership policy, detention source, whole-batch selection; subject mapping and calendar helpers | Fixtures cover real current student shapes and repeaters without guessing fields |
| 2. Faculty foundation | Versioned mock store, seeded records, compact directory, reusable add/edit, validated import | Reload retains data; profile edits preserve all assignments; duplicate errors are clear |
| 3. Assignment engine | Candidate resolver, intentional exclusions, overlap checks, co-teacher dependency rules | Pure service tests cover cross-scope conflicts and date boundaries |
| 4. Assignment UI | Four-step wizard, guided empty states, roster and final preview, idempotent save | Whole-batch and SGT flows work with keyboard; failures preserve drafts |
| 5. Lifecycle and review | Details, history, differences, reassignment, deactivation, rollover, source-event adapter | No silent new access; no lost history; dependent co-teachers cannot become orphaned |
| 6. Integration and handoff | Route state, backend contracts, regression suite and responsive/theme QA | Existing student flows pass; build passes; backend-only guarantees are documented |

Keep the existing faculty route during replacement. Make code changes in small reviewable phases. Update FLOW_CHANGES.md only when approved implementation actually changes navigation or user flow.

Faculty import remains in scope from the earlier plan: template → upload → validate/duplicate preview → explicit selection of valid rows → import → row-level results and safe retry. It must not publish teaching assignments.

## 10. Verification matrix

- Profile: uniqueness normalisation, missing fields, role permissions, inactive faculty, assignment-preserving edits.
- Context: identical versus mismatched calendars, missing calendars, First–Fourth Year, invalid/future/past dates.
- Students: current attempt, active/tracked/graduated status, repeaters, migration, deleted records, unknown restriction data.
- Scope: Whole batch includes eligible N/A; SGT excludes N/A; intentional exclusions persist; scope switch clears stale selections.
- Primary conflicts: same student/subject/overlap, cross-scope duplicates, same faculty duplicates, exact start/end boundaries.
- Co-teachers: missing/inactive/draft primary, different subject, date or roster overreach, duplicate faculty, primary shrink/end/reassignment.
- Reconciliation: SGT change impacts SGT eligibility but not whole-batch eligibility; arrivals need review; syllabus changes preserve historical snapshots.
- Transactions: double click, retry after committed response loss, two competing publishers, stale preview, quota failure, no partial audit/membership writes.
- Lifecycle: scheduled activation, blocked activation, early ending, expiration without active UI, scheduled work on deactivation, fresh rollover roster.
- Integration: student onboarding/calendar/SGT/progression/undo regressions.
- UI: 390/768/1024/1440 widths; light/dark; reduced motion; keyboard; accessible labels; focus trap/restoration; table overflow; loading/error/disabled states.

During implementation, run focused service tests and existing student regression tests, npm run build and browser scenarios. This planning review performed source inspection only, not application QA.

## 11. Decisions needed before implementation

These choices do not block delivering this plan; they must be settled before coding the dependent rules.

1. Primary responsibility: one overall subject primary (recommended to match the supplied conflict rule), or separate theory/SGT primaries?
2. Detention: which Student Management field/service owns effective restrictions, and what should happen when that data is unavailable?
3. Whole batch: confirm all eligible members, with no manual subset selection (recommended).
4. Co-teaching: confirm primary coverage subset rules and whether institution-specific co-teacher limits are required.

## 12. Sources and verification

Reviewed input: C:/Users/Medsy/Downloads/mbbs_faculty_management_implementation_plan.md, all six sections.

Current repository files checked:
- src/pages/FacultyManagementPageV2.jsx: local faculty state and assignment replacement on save.
- src/services/studentManagement.js: DIRECTORY_EVENT, async adapter, revision/permission contract.
- src/services/studentDirectoryStorage.js: IndexedDB snapshot persistence and localStorage migration qualification.
- src/pages/StudentManagementPage.jsx: change subscriptions and academic revision capture.
- src/services/studentCalendarCommands.js: academic revision checks.
- src/services/studentCalendar.js: First–Fourth Year, 6–24-month validation and calendar defaults.
- src/services/studentModel.js: current subject strings, study-year values and current-entry model.
- FACULTY_MANAGEMENT_IMPLEMENTATION_PLAN.md: earlier planning baseline.

Searches in student services/components did not locate detention or the supplied named lifecycle events. Production behaviour and any external onboarding screen remain unverified.

