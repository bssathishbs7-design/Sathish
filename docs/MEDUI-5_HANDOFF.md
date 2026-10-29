# MEDUI-5: faculty approval queue

Implemented locally on 27 October 2026 and corrected against the supplied Downloads/APPROVAL_QUEUE_SPEC.md. ARCHIVE_DELETE_RESTORE_WITHDRAW_SPEC.md is still unavailable; lifecycle execution remains a separate dependency.

## Decisions and scope

- Faculty grouping is the primary layout. An optional oldest-first view spans all faculty.
- The user confirmed that assessment results keep their existing publication flow; no new result-approval step is introduced.
- Assessment and blueprint editors, publication rules, and permanent-ID issuance reuse the existing MED-19/MED-43 code.
- No Linear updates, commits, or pushes were performed for this implementation.

## Implemented behaviour

- The Approval Queue route now opens `ApprovalQueueByFaculty.jsx`. Faculty order is new count, pending count, oldest pending submission, then name. Each question is a separate queue item while its submission remains intact for review. Pending items are oldest first; decided items are newest decision first. Mixed question decisions appear in their respective tabs.
- Requests / Approved / Returned and All / Question / Assessment / Blueprint / Skill Assessment filters include counts. Reviewed items remain available in read-only views. Search includes faculty names/employee IDs/designations, request titles, item IDs, tags, and question metadata.
- New state is per viewer and per submission. Opening a faculty clears its unseen badges while retaining New tags during that viewing session; opening a request marks its submission seen; mark-all only affects requests visible to that viewer. The sidebar uses the same visibility and new-state functions. Resubmissions are new again.
- Faculty header shows employee ID, number of current requests, first/last submission including previous attempts, and 90-day insights using median decision time. Insights use approval-rate wording at 80% and 50%, and compare speed with a 20% band around the whole-queue median. Decision metrics include recorded previous submission attempts and exclude entries without valid decision dates. Empty metrics are not shown as fabricated zero percent.
- Waiting chips start at seven days. The existing expired-assessment reschedule action is retained. Question countdowns start three days before the 14-day deadline. Local automatic returns run on load and every 30 seconds while the app is open, return unanswered questions to Draft through the author result cache, preserve decided/withdrawn items, and record history. Lifecycle requests are excluded. Duplicate warnings compare normalised word-bigram Dice similarity at >=80% against pending questions and institution-bank records, excluding self, overwrite originals, Medsy bank records, and lifecycle requests. This is advisory wording similarity, not semantic AI.
- Question rejection requires remarks for each rejected active question. Withdrawn questions cannot be selected or decided, and are excluded from submission completeness and result writes. An entirely withdrawn request can be closed. Question and skill decisions use the same focus-trapping confirmation dialog, with Escape, restored focus, saving state, and error feedback.
- Skill rejection requires remarks. Approval still precedes publication by faculty. Assessment and blueprint rejection already required remarks and continues to do so.
- Existing question rejection remarks are visibly labelled `Rejected:` on author cards.
- Decision handlers reject stale submissions, already-reviewed requests, and unauthorised reviewers before the review action. Blueprint validation occurs before its local template write.
- All completed reviews return to the queue. Assessment approval confirmation labels its destination correctly. Blueprint templates record the approving user name and ID. The queue is available on phones; other pages' device restrictions are unchanged.
- The former queue page and its exclusive stylesheet, and the replaced question confirmation styles, were removed.

## Local mock persistence and identity

`approvalQueue.js` documents the additive request fields: `reviewerId`, legacy `seenBy`, per-item `seenItemsBy`, and earlier `previousSubmissions`, alongside existing domain payloads. Existing records are not rewritten simply to change historical reviewer names.

The app still uses a demo Admin identity. Admin sees all requests; non-admin visibility is restricted to the selected reviewer employee ID. This is a frontend filter, not production access control.

All future reviewer selections use `approvalReviewers.js`, including the compatibility export used by assessment/blueprint dialogs. The legacy directories conflicted on EMP1120: the assessment directory's Dr. Kavitha Rao identity is retained in the shared directory. Actual users must come from the backend directory before release.

The session queue is mirrored into `medsy-approval-queue-v1` in local storage. A fresh session restores the cache; an explicit existing session takes precedence. Storage mirroring failures leave the session available. Development sample data adds question and skill requests alongside the existing assessment fixtures; it does not seed production when demo mode is disabled.

## Backend contract required for real users

Replace local storage with an authenticated approval service. Suggested operations:

| Operation | Required server behaviour |
| --- | --- |
| List requests | Scope to tenant and authenticated reviewer; return current version, author/reviewer profiles, history, seen state, and pagination. Admin access requires an explicit permission. |
| Submit/resubmit | Validate reviewer eligibility, lock source, preserve previous submission, and issue a new revision and submission time. |
| Mark seen | Persist per authenticated viewer and request revision. |
| Decide | Compare expected revision and pending state; validate all required remarks; apply decisions, IDs, publication/template writes and audit events atomically. Reject stale or unauthorised updates. |
| Reviewer directory | Return valid account IDs and employee metadata instead of the mock directory. |
| Notifications | Deliver the outcome and remarks to the author across sessions/devices. |

Browser state cannot provide cross-user delivery, server permissions, transactional ID allocation, or race-free decisions. Local question-bank/template writes are not a replacement for an atomic backend transaction.

## Remaining specification dependencies

- Archive/delete/restore request execution and the author withdrawal flow for assessment, blueprint and skills require the missing lifecycle spec (MED-64/MED-71). Existing withdrawn question records are handled; new lifecycle actions have not been invented.
- Production requires a server deadline job and an atomic return-to-draft transaction; the frontend simulation does not run while the app is closed.
- Duplicate matching uses the currently loaded local corpus. Production must provide the complete authorised institution corpus or a server similarity endpoint.
- Real account authentication, authorised API integration, durable cross-user notifications, concurrency and production permission QA remain backend work.

## Verification

- Focused tests cover reviewer visibility, faculty sorting, seen state, resubmission, stale review rejection, remarks requirements, history metrics, local cache, existing blueprint identity and assessment publication rollback.
- Browser checks use an isolated QA profile. Verified: faculty grouping, mark-all-seen, no horizontal overflow at 390/768/1024/1440px, withdrawn row controls, required question remarks, complete question and skill rejection paths, Escape dismissal, and dark-theme rendering.
- Production build and lint results are reported in the implementation response. Existing App/Sidebar hook-lint findings are tracked separately from the new queue modules.
- Backend role enforcement and live multi-user end-to-end acceptance are not verified.

### Specification correction verification

- 24 focused tests passed for queue projection, seen revisions, mixed outcomes, median metrics, duplicate exclusions, deadline boundaries/idempotency, blueprint workflow and assessment publication.
- New queue modules passed ESLint. Production build passed with existing bundle-size and mixed-import warnings.
- Isolated browser confirmed individual question rows, correct mixed-outcome tabs, countdown and duplicate warnings, faculty-open seen clearing with temporary New tags, revisit clearing, Insights Escape, remarks validation and question rejection persistence. No horizontal overflow at 390, 768, 1024 and 1440px.
- Final browser checks also confirmed return-to-queue after rejection and automatic deadline return producing an author Draft result. Existing App/Sidebar lint remains at five errors and one warning; the new modules are clean.
