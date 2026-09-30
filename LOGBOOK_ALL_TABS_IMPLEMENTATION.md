# All-tab fixes implemented

30 September 2026. Implements the approved LOGBOOK_ALL_TABS_RECHECK.md plan.

| Items | Delivered |
|---|---|
| T01 | Shared dashboard/full-search index includes learner notes, feedback, comments, IDs and registration numbers. |
| T02 | Shared category membership across queue/search filters, category cards/details and student groups includes legacy remedial under certifiable skills. |
| T03 | Assignment receives and validates the selected student subject. |
| T04 | Submitted approvals show unexpected outstanding-work warnings and disable approval while allowing return. |
| T05-T07 | Shared learner/faculty approval summary has four totals, current step, roles, current-round dates and remarks. |
| T08-T09 | Queue cohort/overdue summaries and longest waits; dashboard supporting context and consistent metric drill-downs. |
| T10-T11 | Student attention reasons, planned chain and readiness attribution. |
| T12-T13 | Remedial/pending learners prioritised; pending counts visible; exact subject/skill navigation and return path. |
| T14 | Registration display/search mapping uses registerId with internal ID fallback; record identity unchanged. |
| T15 | Inline attempt/rating/return-feedback validation and focus before submission. |
| T16 | Subject phase and faculty membership count. |
| T17 | URL-backed subject/student/decision/date history filters and working All decisions navigation. |
| T18 | Queue and student tab headings and scope summaries. |

Existing header styling, category schemas, certification targets, approval permissions and chain snapshots remain. Actual institutional names, enrolments and registration numbers still depend on supplied roster data. No invented institutional data or backend integration.

Validation: 39 service tests (37 existing/regression plus two new search/category tests), targeted ESLint and production build. Isolated browser checks cover the new functional cases, all nine tabs at 1440/768/390 pixels, and return/resubmit/completion at each approval stage. Evidence is under .logbook-check.local/all-tab-fixes and approval-recheck. Screenshots are test fixtures, not production data.
