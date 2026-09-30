# All-tab Logbook comparison - second-pass review

30 September 2026. Review only. No application code changed. Reference: Digital Logbook.dc.html and the latest supplied screenshots.

## Main finding

The previous fixes covered important transitions, but did not restore every field, summary and contextual link from the prototype. A passing workflow test does not establish presentation or field parity. The sign-off screenshot identifies real remaining gaps: role and signature date per step, step count, summary tiles and warning visibility.

This is a source-level comparison of all nine Admin tabs and their shared learner handoffs. It is not a claim that every browser state was manually exercised during this turn. The current schema/workflow regression subset was rerun: 23 tests passed. No new full browser sweep was performed.

## Tab coverage

| Tab | Present | Remaining findings |
|---|---|---|
| Dashboard | Metrics, search, longest waiting, attention list, charts and drill-downs | T01, T09 |
| Queue | Oldest-first student groups, filters, eligible bulk approval, individual graded review | T02, T08, T15, T18 |
| Students | Roster filters, coverage, subject readiness, entries and assignment | T02, T03, T10, T11, T14, T18 |
| Subjects | Phase catalogue, category sidebar, activities, student attempts and readiness/approval links | T14, T16; preserve recent fixes |
| Categories | Category cards, counts, status filters and entry opening | T02 |
| Skills | Catalogue targets, certification counts, per-student attempts and remedials | T12, T13 |
| History | Chronological entry decisions, feedback, resubmitted indicator and pagination | T17 optional |
| Sign-offs | Status/student/subject filters, stable details, exact review links, chain decisions and history | T04-T07, T14 |
| Search | Multi-field search, filters, entry opening and read-only cross-subject review | T01, T02, T14 |

## Findings and correction plan

| ID | Priority | Area | Classification | Confirmed finding | Proposed correction | Source |
| --- | --- | --- | --- | --- | --- | --- |
| T01 | High | Search / dashboard search | Functional inconsistency | Dashboard quick search omits learner notes; the Search tab includes them. The same query can return different results. | Use one shared search index and matching function, retaining role visibility. | AdminLogbookQuickSearch.jsx matches vs AdminLogbookPage.jsx results |
| T02 | High | Queue / Categories / Students | Functional inconsistency | The prototype includes legacy remedial-category records under Certifiable Skill. Only Subjects currently normalises remedial to cert; other category filters/groups compare raw category IDs. | Use consistent category membership across filters, cards, groups and counts. Preserve the underlying attempt and parent IDs. | HTML catIn; AdminLogbookCategories.jsx; AdminStudentEntryGroups.jsx; AdminLogbookPage.jsx filters |
| T03 | High | Student detail > Assign entry | Context loss | Student detail retains a selected subject, but Assign entry passes only student ID; the drawer defaults to the first actor department. A multi-department reviewer can assign in the wrong subject. | Pass and validate the selected subject into the assignment drawer; retain student and subject together. | AdminLogbookPage.jsx onAssign; LogbookFacultyActions.jsx initial form |
| T04 | High | Sign-off drawer | Missing exception warning | The pending-work warning now appears only for Ready/Returned. A legacy or externally changed Submitted logbook with pending work has no advance warning, although approval is blocked by the service. The HTML screenshot explicitly shows this warning. | Show outstanding-work counts for Submitted too, explain why approval is unavailable and offer the allowed return/review path. Do not allow new work during submission. | LogbookSignoff.jsx eligibility message; adminLogbook.js approval guard; HTML soD.pendingWarn |
| T05 | Medium | Sign-off drawer / learner approval | Missing displayed fields | Each approval-chain step lacks a separate approver role, signature/return date and step-specific remarks. The data is partly in history but not presented beside the step. | Render role, current-round decision date and remarks per approver; keep historical rounds separate. | HTML soSteps; LogbookSignoff.jsx lb-signoff-steps |
| T06 | Medium | Sign-off lists and drawer | Missing progress context | The prototype displays step X of Y. Current lists show the current approver but no numeric chain position. | Show current step and chain length for Submitted records, and state-appropriate text for Ready/Returned/Completed. | HTML soRow; LogbookSignoff.jsx statusLabel and list rows |
| T07 | Medium | Sign-off drawer | Presentation and summary gap | The four separate summaries in the screenshot are not reproduced: entries, approved, skills certified and requirements met. The first three exist as prose; category detail exists, but aggregate requirements-met count is absent. | Add a compact four-value summary using existing computations. Label category coverage as logged requirements, not certification. | HTML soD.tiles; LogbookSignoff.jsx rows, req and skills |
| T08 | Medium | Queue | Missing summary fields | Overall queue summary lacks affected-student count and overdue count; student group headers lack longest waiting time. The HTML has both summary and per-student waiting information. | Add totals and per-student oldest wait from the same filtered records. Retain oldest-first ordering and graded-skill exclusions. | HTML fQueueSummary/fQueueGroups; AdminLogbookPage.jsx queue rendering |
| T09 | Medium | Dashboard | Missing supporting context | KPI cards omit the prototype supporting figures: affected students, longest wait, total approved skill attempts, and overdue assignment count. | Restore useful supporting lines using the current metric definitions and the same drill-down datasets. | HTML fTiles; AdminLogbookPage.jsx metrics |
| T10 | Medium | Students | Missing explanation | Needs attention is calculated, but student cards/details do not explicitly state why a learner is at risk. Prototype studentSummary exposes reason and reasonSentence. | Expose calculated reasons such as low logged coverage or unresolved returned work, alongside existing counts. | HTML studentSummary; logbookProgress.js learnerSummary; AdminLogbookStudents.jsx |
| T11 | Medium | Student readiness | Missing pre-action context | The planned chain and ready-by/date are not visible directly in the readiness section before opening approval details; before marking Ready, the chain cannot be reviewed there. | Show the configured chain before marking Ready and readiness attribution afterwards. Keep faculty judgement unchanged. | HTML fStuSo.chainLine/readyLine; AdminLogbookStudentDetail.jsx |
| T12 | Medium | Skills | Missing prioritisation and status | The HTML puts remedial students first and exposes pending state. Current expanded skill students stay in roster order and generic In progress conceals whether attempts are pending. | Order remedial/awaiting-review learners first and show pending-attempt counts, with certified/not-started states distinct. | HTML fSkillRows students; AdminLogbookSkills.jsx people rendering |
| T13 | Medium | Skills > student | Context loss | Opening a student from a skill loses subject and competency context. Both the current app and prototype have this limitation. | Carry the selected subject and skill to the student review and provide a return path. Treat this as a workflow enhancement, not a prototype omission. | AdminLogbookSkills.jsx onStudent; AdminLogbookPage.jsx Skills onStudent |
| T14 | Medium | All student and approval views | Data-field mapping gap | The model has registerId, but several lists, searches and drawers display studentId instead. The prototype has distinct internal ID and roll number. Current sample values happen to match. | Display/search registerId with studentId as fallback; retain internal IDs exclusively for record identity. Supply real register IDs through the roster integration. | logbookPeople.js LEARNERS; AdminLogbookRecords.jsx; LogbookSignoff.jsx; AdminLogbookStudents.jsx |
| T15 | Medium | Entry verification drawer | Validation consistency | Unlike the improved sign-off return flow, individual entry review still attempts the service call before reporting missing feedback or grading selections. | Validate attempt, rating and return feedback next to their fields before invoking review. Preserve service-side checks. | FacultyReview.jsx run and action handlers; adminLogbook.js reviewEntries |
| T16 | Low | Subjects | Missing subject metadata | Subject detail omits the phase and faculty-member total visible in the prototype header. Category navigation and activity/attempt grouping are already restored. | Add phase and faculty count using the current catalogue and reviewer memberships, without changing the header style. | HTML fSub.phase/line; AdminLogbookPage.jsx subject heading |
| T17 | Low | History | Discoverability improvement | Entry decision history is present, including earlier decisions and feedback. It has no subject/student/date/decision filtering. This is an enhancement, not a confirmed missing prototype control. | Add compact filters only if desired; keep entry decisions separate from final sign-off history. | AdminLogbookHistory.jsx; HTML fHistory |
| T18 | Low | Tab entry headings | Presentation gap | Several tabs rely on the shared Admin logbook hero without the prototype-specific visible title and scope summary, notably Queue and Students. | Add compact tab titles and context within existing content cards; preserve the common hero and navigation. | HTML Approval queue/Students headings; AdminLogbookPage.jsx and AdminLogbookStudents.jsx |

## My Logbook and form checks

- The learner dashboard and Needs action results already include Ready/Returned final submissions; these are not missing. Subject tasks now open approval details directly.
- Apply T05-T07 to the shared approval drawer so learner and faculty see consistent steps, dates and totals.
- Existing category-schema tests cover catalogue restrictions, practical/clinical fields, reflection groups, grading constraints, remedial linkage and required-input submission. They passed in this review. This does not prove every optional field or label matches visually.
- Learner identity, faculty selection, submission confirmation, evidence, notes, comments, grading and entry history are already implemented; do not list them as missing wholesale.
- Assignment exposes student, subject, category, due date, activity fields and instructions. T03 concerns lost subject context, not absent assignment fields.
- Returned correction, remedial resubmission, final return/resubmit and completed locks have regression coverage. Core approval stages should not be rebuilt to address presentation gaps.

## Explicit distinctions

1. Prototype sample names, counts and dates differ from app samples. This is not proof of missing records.
2. Approver role, step and signature dates are available/derivable; named institutional HoDs, Dean and Director require a real roster. Do not hardcode screenshot names.
3. Certification targets remain catalogue-owned as previously approved, even where the prototype uses entry-owned values.
4. App search intentionally exposes all visible subjects with permission-controlled review. The prototype faculty search is department-scoped. Preserve current scope unless explicitly changed.
5. The app includes the full sample roster and configured skills before entries exist. The prototype derives some roster/skill lists from logged records. Denominator differences are a policy/data-scope decision, not automatically a bug.
6. Submitted logbooks with pending work, as shown in the prototype screenshot, are prevented by current normal submission rules. The warning is still required for legacy/external inconsistencies; restoring it must not weaken those rules.
7. The previous exact-context sign-off links, stable post-decision drawer and status filters are now implemented. They are not repeated as missing.

## Proposed order after approval

1. T01-T04: search consistency, category membership, assignment context and submitted-work warning.
2. T05-T12, T14-T15: restore the missing fields and review context; align validation.
3. T13, T16-T18: optional workflow/discovery refinements and compact metadata.

Keep existing header style, navigation placement, button treatment and typography. Restore information within existing cards and drawers.

## Verification for implementation

- Check all nine tabs under faculty, HoD, Dean and Director; office-only tab restrictions must remain.
- Use a notes-only search term in dashboard and Search; results must agree.
- Use legacy remedial and normal linked certifiable attempts; category totals and filtered records must agree across tabs.
- Assign from a second department's student-subject view and verify both retained identifiers.
- Check Submitted records containing unexpected pending work: show warning, prohibit approval, preserve return.
- Confirm roles, dates, remarks and step counts across initial approval, partial approval, return, resubmission and completion.
- Use differing studentId/registerId and repeated display names to verify identity and navigation.
- Verify long names/text, empty results, keyboard controls, mobile/tablet/desktop and light/dark.

## Open inputs and limitations

- Institutional roster and registration numbers are not supplied; use current sample data with explicit mappings.
- Enrolment/subject membership is needed before replacing full-roster denominators.
- No new overdue SLA, reopening policy or notification channel is assumed.
- Browser storage remains a local prototype service; backend authentication, atomic approvals and durable audit persistence remain integration requirements.
- This plan does not authorise implementation; await approval of scope.
