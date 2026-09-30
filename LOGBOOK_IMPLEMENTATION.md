# Approved Logbook fixes

Date: 29 September 2026

Scope: the 22 IDs marked Implement in the supplied CSV, confirmed in conversation. The malformed LB-23 CSV row was interpreted using its ID and the original consolidated audit. The other eight audit items were not included.

## Approved policy choices

- Existing subject catalogue owns certification targets; learner records cannot redefine them.
- Faculty readiness remains discretionary under the existing service prerequisites. Logged coverage, approved entries and certified skills are labelled separately.
- Withdraw retains its existing deletion semantics, now labelled Delete pending entry with an explicit, persistent confirmation.
- Evidence remains JPG, PNG or WebP, three photos maximum and 300 KB per stored photo. Larger source images can be resized locally; originals above 20 MB or 50 million pixels are rejected to bound browser memory use.

## Delivered scope

| ID | Change |
|---|---|
| LB-02 | Matching owner, subject, category and competency are required to resolve remediation. Parent links cannot be removed from existing remedial records. Subject actions resume matching drafts; forms lock competency and show original feedback. |
| LB-03 | Catalogue targets replace entry-derived maximums. Saved graded entries carry the catalogue version, and learner inputs cannot alter peer requirements. Unknown targets remain explicitly unconfigured. |
| LB-04 | Readiness remains a faculty decision; category coverage and certification metrics use distinct labels and explanatory copy. |
| LB-08 | Shared local-calendar date windows and latest-event ordering include decisions/comments. The old weekly certification metric is labelled as approved skill attempts over seven calendar days. |
| LB-09 | Ready/returned final subject submissions appear in dashboard actions and the Needs action destination. |
| LB-10 | Compact working headers, compact mobile creation controls, urgent learner tasks before charts, and faculty review lists before analytics. |
| LB-11 | Review controls precede conversation, with a persistent Review entry shortcut. Learners see a field summary before acknowledgement; future grading is a concise disclosure. |
| LB-12 | App-owned URL/history state, retained filters/sort and scroll, direct Search access, subject/date controls, and stable learner result sorting. |
| LB-13 | Mobile admin section selector, parent breadcrumb actions, bounded history controls and unavailable-student recovery. |
| LB-14 | Available categories remain discoverable without records; filters no longer silently fall back. Unknown targets and department/read-only scope are explicit. Learner empty categories offer creation. |
| LB-15 | Conditional assignment requirements and recipient counts are visible. Batch success states the saved recipient count. Student tasks appear once and retain deadlines in their completion form. |
| LB-18 | Persistent page feedback, in-dialog success messages, and focus restoration to a useful fallback when the trigger disappears. |
| LB-19 | Reusable contextual confirmations for deletion, assignment cancellation, bulk approval and final sign-off. Mixed selection and busy-state selection protection are included. |
| LB-20 | Entry review and comments share busy-state coordination. Review/reassignment drafts are tracked independently; ownership appears before detailed evidence. Existing service ownership checks and immediate cross-tab updates are retained. |
| LB-22 | Bounded image compression, accessible thumbnails/enlargement, nested-dialog Escape/focus handling and chronological audit disclosures. |
| LB-23 | Consistent My logbook/Admin logbook headings, clearer status units, neutral shared drawer copy and profile metadata bound to the selected learner. Missing profile details are identified instead of borrowing another learner's posting. |
| LB-24 | Semantic forest/on-brand primary controls and readable search labels, measured in light and dark themes. |
| LB-25 | Key navigation/actions/category controls have 44px minimum targets; important titles wrap. |
| LB-26 | Shared Logbook polish stylesheet, semantic action colours, consistent status/chart colours and opaque themed drawers. Removed duplicated task presentation and its exclusive styles. |
| LB-27 | Chart arrow-key navigation, focus/hover detail announcements, retained reduced-motion support and removal of creation-card attention animation. |
| LB-28 | Progressive 25-record rendering for learner/admin lists, history and skill lists; progressive comment retrieval in the drawer. Tested with 1,000 matching records. |
| LB-29 | Deterministic handoff, empty, error and large-data scenarios, plus focused integrity/date/fixture regressions. Existing populated sample data remains available. |

## Verification

- Production build passed. Existing shared bundle-size and ineffective-dynamic-import warnings remain; platform bundle work (LB-30) was excluded.
- 22 Logbook service tests passed, including five new regression cases.
- Targeted ESLint passed for changed Logbook JavaScript/components and new helpers. A broader Logbook-directory run also found an existing unused `StatusIcon` binding in unchanged `AdminLogbookCategoryDetail.jsx`; that unrelated finding was not changed.
- 48 browser layout checks across 320, 390, 768, 1024, 1366 and 1440px: no detected page overflow or runtime exceptions. Subsequent touch-target checks verified 44px navigation controls at 320px.
- 16 connected workflow assertions passed: assignment, submission, return/correction, approval, final sign-off through HoD/Dean/Director, remediation reuse, navigation and focus recovery.
- Evidence/theme checks passed: a 944,972-byte PNG became a 179,838-byte JPEG; preview/enlargement/Escape/focus return worked; the review drawer fit mobile dimensions.
- Primary-button contrast measured 6.81:1 in light mode and 8.97:1 in dark mode; admin search-label contrast measured 16.99:1 and 14.25:1 respectively.
- Nine scale/navigation checks passed, including 1,000 matching records rendered in increments of 25, browser back/forward state, restored document scroll, and the assignment dialog at 320 × 568px.

Browser evidence is stored under `.logbook-check.local/approved-evidence/`: `layouts.json`, `workflow.json`, `accessibility.json`, `scale-navigation.json` and screenshots. Test scripts use an isolated Chrome profile and do not alter the user's browser data.

## Handoff and limits

- `src/services/logbookScenarios.js` exports isolated asynchronous scenario data for repeatable QA; it never resets live storage. `src/services/logbookAudit.test.js` documents the integrity regressions.
- `src/services/logbookProgress.js` identifies the current requirement authority as `sample-catalogue-v1`. Backend integration must replace sample requirements with versioned institutional configuration.
- Current persistence remains a local prototype. Progressive rendering bounds visible UI, but the current service still reads and filters local records in memory. Server pagination, network conflict handling, durable uploads and authenticated policy enforcement remain backend work; they are not represented as completed here.
- Verified in headless Chrome, with selected screenshots inspected. Physical devices, Safari/Firefox, screen readers and complete OLED/compact-density coverage were not validated.
- No dependencies added. Unrelated Blueprint edits were preserved. Actual flow changes are recorded in `FLOW_CHANGES.md`.
