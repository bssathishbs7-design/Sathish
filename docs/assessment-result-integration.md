# Assessment result workflow handoff

The frontend supports direct manual release and a separate result-approval cycle:

`Completed evaluation -> select reviewer -> Pending Approval -> approve and publish`

`Pending Approval -> reject with remarks -> faculty correction -> resubmit`

`Direct release -> confirm -> persist -> Results`; failed writes retain the confirmation for retry. Success and Results navigation follow persistence.

## Local implementation

- `assessmentResultWorkflow.js` owns commands and rollback across publication, approval cache/session, history and selected-record writes. Rollback is best effort if browser storage becomes unavailable; recovery failure is reported.
- The reviewer sees a read-only student/score snapshot. Approval rechecks reviewer, submission, paper, roster, marks, attendance and attempt version. Changed evaluations must be rejected and resubmitted. Rejection never publishes.
- Submitted results cannot bypass review through direct or automatic release. Faculty marking and attendance remain read-only while review is pending.
- Shared question identities and mark limits validate persisted marks, not just the page's Completed label.
- Assignment resolves active students in the selected year/SGT from the existing Student Management adapter. Registration IDs identify exam students; directory IDs are retained. No matching students blocks publication. Demo papers retain explicit sample rosters.
- Automatic evaluation and the student assessment list exclude unassigned students. Empty rosters stay empty.
- Automatic descriptive grading is labelled keyword coverage; MCQs use answer keys. No external AI grader was added.

## Backend work still required

This checkout has no assessment authentication/API backend. Browser storage, local comparison tokens, queue filtering and the demo account are not security boundaries.

The server must supply authenticated faculty/reviewer/student and institution identity, enforce assignment/reviewer permissions, transact result commands, persist history, and run expiry/evaluation/release without an open browser. Published edit/delete demo verification is disabled outside demo mode until authentication is integrated.

Suggested command contract; these are proposed interfaces, not existing endpoints:

| Command | Request | Required behaviour |
| --- | --- | --- |
| Submit review | Assessment ID, evaluation version, reviewer ID, note, idempotency key | Pending request and immutable evaluated snapshot |
| Review | Request ID, submission/evaluation versions, decision, remarks, idempotency key | Authorised transaction; approval releases the reviewed scores |
| Direct publish | Assessment ID, evaluation version, idempotency key | Permission-checked release and publication timestamp |
| Read student result | Authenticated student and assessment ID | Only the assigned student's released current-attempt result |
| Verify protected action | Action, assessment ID, session-bound challenge | Expiring action-bound authorisation rechecked by the mutation endpoint |

Return structured validation, conflict, authorisation and retryable persistence errors. Never overwrite a stale version silently. Cross-device synchronisation and background release remain backend responsibilities.

## Remaining product scope

MEQ remains excluded from this authoring picker; existing Upcoming types remain disabled. Their answer models, scoring rules and acceptance criteria require separate implementation.

Browser proctor controls cannot guarantee operating-system screenshot or application-switch prevention.
