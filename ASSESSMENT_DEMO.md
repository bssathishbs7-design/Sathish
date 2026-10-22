# Assessment development fixtures

Run npm install followed by npm run dev. Local development automatically installs 23 connected assessment examples before React mounts. No manual localStorage setup is required.

Open Faculty > Assessment Suite > Assessment (/assessment/create) or Student > My Assessment (/my-assessment). The current sample student is Karthik Subramanian, MC2568.

## Scenario guide

| Where | Examples and screens |
| --- | --- |
| Draft (3) | MCQ, hybrid with nested questions, descriptive. Continue opens populated authoring/preview; configuration, question editing and publishing use the normal workflow. |
| Approval Queue (4) | Pending review, expired schedule/reschedule, approved, rejected/revise. Use the status filter to inspect each state. |
| Published (11 initially) | Practice and proctored, MCQ and hybrid, read-only descriptive, split section timing, live, future and final-ten-minute countdown. |
| Evaluation (5) | Manual marking pending; fully evaluated awaiting publication; offline attendance/marking; published MCQ and hybrid retained for correction. |
| Results (2) | Automatic MCQ publication and published hybrid. Open results for marks, question review and analytics. |
| My Assessment | Upcoming, live, completed/result pending, published/View Results, invigilator lock/Request Access and Request Sent. |
| Exam controls | Assigned five-student roster, attendance, warning history, time extension, lock and access request. |
| Practice/proctored workspace | Start from My Assessment. Live practice: 10 + 20 descriptive questions exercises large section navigation. Hybrid examples include nested answers. |
| Automatic result release | Complete Live practice: MCQ with automatic results. Normal submission starts the one-minute result countdown and opens the student result page. |

Completed fixtures include correct, incorrect and unanswered MCQs, descriptive answers and unanswered parts, a zero-mark present student, and an absent student. Four present students have results; the absent student is excluded. Results also appear in Evaluation intentionally for corrections, without duplicating their stored record.

## Refresh and direct access

The development-only Demo data button opens shortcuts to faculty/student lists and selected authoring, evaluation, result and control screens. Refresh demo data and schedules restores demo-owned records and anchors live/upcoming dates to the current local time. It retains assessments whose identity does not start with demo-assessment-.

Schedules are anchored on first installation, not reset on each reload. After two hours the live examples naturally finish. Refresh to explore live states again. Normal edits, submitted answers and publication changes persist between reloads. Approval queue demos also survive a new browser tab through a local mirror.

Exam entry uses the normal instructions/start flow. Fullscreen and proctoring enforcement are not bypassed. Test these behaviours in a supported interactive browser; desktop-only screens retain their existing mobile restriction. Empty/search/error states can be exercised using filters and normal validation rather than artificial successful data.

## Environment switch

- npm run dev: demo seeding enabled by default.
- VITE_ASSESSMENT_DEMO=false: disable seeding/tools in local development.
- Production builds: no automatic seeding or tools by default.
- VITE_ASSESSMENT_DEMO=true: explicitly enable in a demonstration build.

Set the switch in .env.local and restart Vite. Disabling seeding does not delete data already stored in that browser origin.

## Handoff and data contract

- src/services/assessmentDemo/questions.js: question bank shapes, nested parts, model answers and assigned roster.
- src/services/assessmentDemo/scenarios.js: stable scenario definitions, pure date-relative factory, async fetchAssessmentDemoData mock API boundary.
- src/services/assessmentDemo/storage.js: transactional installation into the existing mock adapters, attempts, evaluations, results, control history and default detail selections.
- src/services/assessmentDemoSession.js: environment gate and approval queue persistence.
- src/components/AssessmentDemoTools.jsx: local-only launcher and refresh.

Each assessment shares setup.assessmentId across the faculty list, student list, attempts and results. Stored evaluation keys use the existing automatedEvaluationKey helper and descriptive responses use descriptiveResponseItems canonical leaf keys. Question marks, attempts and result totals are calculated through the existing result service. Fixtures represent UI development data, not real student records or an external grading service.

Replace the mock storage adapters with backend API calls while preserving these shapes and identities. The installer never clears whole storage; failed writes attempt rollback. The retired one-time tracker reset no longer erases saved assessments on page entry.

## Verification

npm test covers fixture consistency, stage coverage, preservation of user records, reload behaviour, refresh and write-failure rollback alongside existing assessment workflow tests. npm run build validates the application bundle.
