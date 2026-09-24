# Flow changes

## 2026-09-21 - Compact subject catalogue

- Added subject/code search and phase filtering to the Subjects tab. Compact subject cards retain the existing subject-detail destination and approved-attempt progress calculation.

## 2026-09-21 - Compact learner overview

- Replaced the duplicate pending-record list with direct Continue draft and Log remedial actions. Verification bar/status counts link to filtered records; pending records remain accessible from the summary and Pending tab.

## 2026-09-21 - Progressive entry accordion

- New/edit/remedial forms now use Subject & category, Activity details and Faculty verification accordion sections. Completing selectors advances automatically; Continue validates activity inputs before verification.
- Completed sections can be reopened without losing values. Save draft remains available for eligible entries; submit appears only at verification. Validation opens and focuses the relevant section.

## 2026-09-21 - Header search and status filter (reverted)

- Reverted at user request: restored the Search tab and its original search/status controls in the results card.

## 2026-09-21 - Profile access in Logbook card

- Moved My profile from the Logbook tabs to an accessible profile icon in the top-right of the green entry card. The profile view and back/forward history remain available.

## 2026-09-21 - Logbook page navigation

- Reused the shared My Pages breadcrumb with back/forward controls. Logbook view history now supports forward navigation; choosing a new view clears the forward history.

## 2026-09-21 - Prototype category forms

- Subject and category now select the prototype field groups, date inputs and required/optional rules. Removed the universal record group, serial number and reflection inputs.
- Added subject-specific categories and Achievements, Phase I certification and Dermatology SDL variants, and read-only certification grading. Remedial remains linked to a returned record.
- Existing saved content is retained; fields absent from the new schema remain visible as previously recorded information during editing.

## 2026-09-21 - Category-driven Logbook drawer

- Restored new/edit/remedial entry to a full-height right-side drawer with fixed header and actions.
- Selecting a log category reveals its activity fields, optional supporting information and faculty verification in the same form.

## 2026-09-21 - Single-form Logbook entry

- Replaced the four-step entry wizard with a single modal containing subject, date, category, activity details and faculty confirmation. Save draft and Submit for verification remain visible while the form scrolls.
- Added searchable subject and grouped category pickers, plus recent-category shortcuts. Subject context is preselected when launched from a subject page; selecting a configured competency fills its editable activity title.
- Added the 19 screenshot subjects and 16 visible category types. Existing category IDs and Human Anatomy records remain compatible; older Community visits entries remain available for editing and remedial attempts. No options are inferred for the cut-off Other group.
- Subject/category changes preserve common fields and request confirmation only before discarding filled fields. Existing entry/remedial subject-category locks and draft recovery remain in place.

## 2026-09-21 - Logbook

- Added Logbook after My Skill Activity in the sidebar at `/logbook`, with overview, phase-grouped subjects, subject records, pending approvals, search and student profile.
- Added a subject > category > details > learner sign-off drawer, draft saving, pending edits/withdrawal, linked remedial attempts and independent notes/comments.
- Added Review Logbook from Approval Queue to a faculty demonstration verification view. Approval locks the signed entry and updates competency progress; return enables a linked remedial attempt.
- Logbook view navigation is owned by App with a capped ten-destination back history. Local demo changes persist over sample curriculum records; confirmed reset restores those records.

## 2026-09-18 - Unmonitored My Skills activity attempts

- `/my-skills/exam` starts without requesting fullscreen. Focus changes, tab switches, fullscreen exits and network changes no longer record monitoring violations or pause the activity.
- Removed monitoring instructions, warnings and resume overlays. Answer navigation, required-answer validation, submission confirmation and normal start/submission records remain available. Dedicated proctored-exam routes are unchanged.

## 2026-09-18 - Evaluation breadcrumb navigation

- Evaluation uses the shared My Pages / Evaluation breadcrumb with browser back and forward controls, matching Configuration and Approval Queue.

## 2026-09-18 - Configuration breadcrumb navigation

- Configuration uses the shared My Pages / Configuration breadcrumb with browser back and forward controls, matching Approval Queue. Removed the duplicate page title and old Skills breadcrumb.

## 2026-09-18 - Sort anchored to its header button

- Sort now toggles a small anchored panel without a modal backdrop or page scroll lock.
- Clicking outside or moving keyboard focus outside dismisses it; Escape, Close and Apply sort return focus to the Sort button. Unapplied changes are discarded.

## 2026-09-18 - Question bank sort-only panel

- Replaced the combined Sort & filter panel with a compact Sort panel: Year, Subject, Topic, Competency or Code, ascending/descending direction, and Apply sort.
- Removed the panel's search fields, filter checkboxes, filter count and Clear all. Existing header filters remain unchanged. Applying a sort orders all matching questions and returns to page 1.

## 2026-09-18 - Question bank sort and filter

- The question-list header now opens a Sort & filter panel with linked academic-year, subject, topic and competency filters, code search, and ascending/descending sorting.
- Apply updates the existing header filters and returns to page 1; Clear all resets the panel draft before applying. Closing or pressing Escape discards unapplied changes.

## 2026-09-17 - Analytics from competency cards

- The Analytics button at the bottom-left of each Learn & Practice card opens that competency's analytics directly, beside Start practice on the right. The selected card is retained for refresh and return to practice.

## 2026-09-11 - Blueprint specification actions

- Reset Matrix and Create Competency Matrix appear only after Create Questions Split has completed, keeping the initial cognition stage focused on entering LoT/HoT percentages.

## 2026-09-10 - Live practice sharing updates

- Newly shared sessions appear in the selected competency's practice list without reloading, including shares from another tab.
- Updates preserve the active filter, page, existing attempts, and current answers.

## 2026-09-10 - Competency analytics

- View Analytics opens the selected competency's completed-attempt summary, score trend, type breakdown, and history.
- Back returns to the practice list with its previous filter and page.

## 2026-09-10 - Confirm leaving unfinished practice

- Home during an unfinished practice or retake asks whether to continue practice or save and leave for the session list.
- Closing the confirmation keeps the current answers; Home from a completed review returns directly.

## 2026-09-10 - Resume practice retakes

- Returning Home during a retake preserves its draft and keeps the last completed marks, Score, and Review accessible.
- Unfinished retakes show Retake in progress and Resume Retake; reviewing a completed attempt does not overwrite the draft.
- Submitting a retake updates the completed result and restores the Retake action.

## 2026-08-07 — Overall analytics student result navigation

- Student search on Overall Analytics now opens the existing completed student-result view by click or keyboard selection.
- Returning from a result opened through Overall Analytics restores the Overall Analytics page and its active filters instead of returning to the evaluation list.

## 2026-08-12 - LAQ question creation layout

- LAQ creation now opens with a case-stem-first layout, subject/topic selectors in the header, and an initial sub-question row.
- LAQ sub-questions now carry their own competency, thinking level, marks, category, cognitive level, and difficulty controls, with total weightage calculated from sub-question marks.

## 2026-08-18 - Create assessment question authoring flow

- Create Assessment now uses the same MCQ, LAQ, and SAQ authoring flow as Question Bank's Create New Question tab.
- Questions generated from Create Assessment continue into the Preview step so the assessment can be reviewed before approval.

## 2026-08-20 - Learn and practice navigation

- Learn & Practice is now available from the main sidebar immediately after My Assessment.
- Selecting Learn & Practice opens the new practice overview page at `/learn-practice`.

## 2026-09-17 - Attempt history analytics popup

- Each completed attempt has a View analytics action that opens its own saved Bloom's taxonomy coverage in a modal.
- Closing the modal returns focus to that row's View button without leaving competency analytics.

## 2026-09-17 - Practice report search and pagination

- Faculty practice reports support student name/ID search and five-row pagination. Searching and opening another report reset the report page; unavailable Previous/Next actions are disabled.

## 2026-09-17 - In Progress faculty filter

- Added In Progress between Completed and Scheduled. Its count and results include competency groups with at least one In Progress practice, using the existing search and pagination reset behaviour.

## 2026-09-17 - Faculty competency analytics

- View Analytics on a shared competency opens /facultyviewanalytics with the selected competency; Back preserves the faculty list's search, status filter, page and expanded groups.
- The faculty page supports practice selection, cohort participation/score summaries, question coverage charts, and student search/status filtering with pagination.
- Student View opens /facultyviewanalytics/student using only that student's results, and returns to the prior faculty analytics filters.
- Faculty analytics reads identified student submissions from shared practice history and accepts an explicit cohort roster. Missing data no longer falls back to sample students. Learn & Practice acts as the student workflow: new submissions use the current profile identity regardless of its shell role and appear in faculty analytics through shared browser storage. Anonymous legacy attempts remain unassigned. Without a complete roster, assigned and pending totals remain unavailable.


## 2026-09-17 - Faculty analytics default sidebar

- Faculty Analytics opens with the sidebar collapsed to icons, including direct entry and refresh. The top navbar stays visible and its sidebar toggle remains available.

## 2026-09-22 - Compact subject workspace
- Replaced the subject category sidebar with a counted category dropdown and entry search. One Add entry action preselects the subject and eligible category; skill-specific Log attempt retains competency prefill.

## 2026-09-22 - Subject entry tabs
- Added All entries and Drafts tabs above the subject filters. Category and search apply within the selected tab; certifiable skills display under All entries.

## 2026-09-22 - Subject category drawer
- Combined All entries, Drafts, View more, search and Add entry in one scrolling toolbar. View more opens the shared right-side drawer; selecting a category filters all subject records. All entries and Drafts clear category selection.

## 2026-09-22 - Disable empty log categories
- Category drawer rows with zero entries remain visible but are disabled and cannot open a category view.

## 2026-09-22 - Pending record discovery
- Added combined search, Subject/Faculty grouping selector, dependent name filter and Pending/Draft status filter. Matching records now share one list instead of separate subject, draft and remedial panels. Group changes clear the dependent selection; Clear filters restores defaults.

## 2026-09-22 - Hide Logbook Search tab
- Hid Search from the Logbook navigation. Existing entry search fields and contextual search destinations remain available.

## 2026-09-22 - Draft navigation tab
- Added Draft after Pending with a live draft count. It opens a draft-only list using the existing search, subject/faculty filters and entry detail workflow. Clear filters retains the draft-only scope.

## 2026-09-22 - Separate Pending and Draft records
- Pending now contains only Pending records. Draft records remain exclusively in the Draft tab; filtering and clearing preserve each tab's status scope.

## 2026-09-22 - Subject category workspace
- Moved All entries, Drafts and category selection to a persistent right sidebar, replaced by a dropdown on tablet/mobile. The left column groups records by category and includes certifiable skill actions in the certification category. Search and Add entry now sit in the slim subject header; the View more drawer was removed.

## 2026-09-22 - Category sidebar scrolling
- Removed the sidebar's internal scroll and sticky positioning. Compact single-line category labels now flow with the page; full labels remain available on hover and to screen readers.

## 2026-09-22 - Hide empty subject categories
- Sidebar and mobile category navigation now hide zero-count categories and Drafts. All entries stays available as the default; a selection that becomes empty falls back to All entries.

- Logbook: existing Draft and Pending entries allow subject/category changes, using the existing confirmation when category-specific values would be cleared. Linked remedial attempts retain their original context.

- Added Approved tab with a live count and status-scoped search, subject/faculty filters, and entry details.

- Dashboard metrics now link to all entries or the corresponding Draft, Pending, Approved and Returned records. Counts consistently represent entries.

- Simplified Logbook navigation to Dashboard, Subjects and All entries. Status selection is in All entries; Dashboard metrics are informational and banner counts are removed. Existing status history opens All entries with the matching filter.

- All entries now includes shared Log Categories navigation; category selection combines with search/status and counts reflect those filters. Zero-count categories are hidden; mobile uses a dropdown.

- Added a manual recent-update carousel in the Logbook header. Arrows, dots and touch scrolling browse the latest four entries; selecting an update opens its details.

- Header updates now auto-advance every five seconds without a heading or arrow controls. Dots and swipe remain; rotation pauses on hover, focus, hidden tabs and open dialogs, and respects reduced-motion preferences.

- Removed header carousel dots and replaced horizontal auto-scrolling with a fade transition. Automatic updates, swipe and keyboard navigation remain available.

- Removed the activity carousel from the Logbook header. Recent activity remains available in the Dashboard card.

- Moved Dashboard, Subjects and All entries tabs inside the Logbook header below its description; removed the separate navigation container.

- Removed the duplicate Add entry action from the subject header; the main Create New Logbook Entry action remains available.

- Removed the Review Logbook shortcut from the Approval Queue header.

- Added Faculty/Student header navigation modes. Student shows My Skill Activity, My Logbook, My Assessment and Learn & Practice; Faculty shows other menus. Mode and last destinations are persisted, direct links select their matching mode, and switching away from an edited form asks for confirmation.

- Added Admin Logbook at /adminLogbook directly after Skills in the Faculty navigation.
# Admin Logbook faculty workflow — 23 September 2026

- Expanded Admin Logbook into Overview, Queue, Students, Subjects, Categories, Skills, History, Sign-offs and Search; mobile uses a section selector.
- Reviews are scoped to the demo faculty department and assigned reviewer. Certifiable entries require grading; returns require feedback; bulk approval excludes individually graded entries. Reassignment records an audit event.
- Faculty can assign entries to a student or cohort. Assigned work appears in the student's Dashboard, retains its subject/category/reviewer, and returns to the faculty queue after submission. Only unsubmitted assignments can be cancelled.
- Faculty mark subject logbooks ready; learners submit through the configurable final approval chain. Each submission snapshots its approvers; returns allow resubmission and retain history.
- Learner views show only the current demo student's entries. Faculty identity selection is explicitly a local demo control pending authenticated backend integration.
# Admin Logbook compact navigation — 23 September 2026

- Moved navigation into the shared Logbook header. Dashboard, Queue, Students and Subjects remain directly visible; More views contains Categories, Skills, History, Sign-offs and Search. Mobile retains the complete section selector. Review and approval workflows are unchanged.

- Removed the Admin Logbook department/demo reviewer strip at user request. The page retains its default faculty reviewer; the demo identity switch is no longer exposed.

- Admin Logbook navigation now displays every available section in one separate tab card below the header. Removed More views and the mobile selector; smaller screens scroll the same single row horizontally.

- Removed the Final logbook approval section and its submission/history controls from the learner Dashboard at user request. Assigned activities remain available; existing sign-off records are retained.

## Connected Logbook workflow — 23 September 2026

- Connected learner and faculty records to the selected sample account, available inside the existing profile menu. Kept the removed reviewer strip out of the page. The local account preview is not authentication.
- Ordinary returned entries now support corrections and same-entry resubmission; graded returns use linked remedial attempts. Draft remedials remain outstanding until submitted, and existing drafts are resumed instead of duplicated.
- Assignments accept schema-specific fixed task details, optional deadlines and contextual student selection. Learners save progress without leaving To do, then submit to the assigning faculty. Returned assignments retain their Returned state while corrections are saved.
- Added subject-level readiness and learner final-approval submission in a compact row and shared drawer. Subject-specific approval chains are snapshotted at submission; each approver can approve or return with feedback. The removed dashboard approval card stays removed.
- Faculty navigation now preserves tabs, filters and drilldowns in browser history. Queue grouping, eligible bulk approval, department browsing, student/category/skill progress and dated decision history use shared records.
- Dashboard metrics open their matching records, including outstanding remedial work, assignments and recent certification decisions. Learner resets preserve other students and subject chain settings. Stale forms cannot overwrite a newer decision or reassignment.

## 2026-09-23 - Featured practice shortcut

- Learn & Practice now offers a header shortcut to unfinished practice, prioritising started sets then the latest shared sets. Manual previous/next controls select a set; Start practice and Continue practice use the existing practice destination.

## 2026-09-24 - Student catalogue discovery

- Admin Logbook Students supports name/ID search, status filters, sorting and reset. Student cards retain their existing detail destination.

## 2026-09-24 - Faculty dashboard chart navigation

- Added entry-status chart links to filtered Search and subject bars to existing subject details; sign-off summaries link to Sign-offs. A local subject filter updates the dashboard charts only.

## 2026-09-24 - Dashboard universal search

- Added compact dashboard search with optional status, subject, category and date filters, five quick results, existing entry-drawer access, and View all results navigation preserving filters in the Search tab URL.

## 2026-09-24 - Dashboard search entry point

- Removed Search from the Logbook tab bar. Dashboard universal search is the search entry point; View all results and dashboard chart links retain the full Search results route.

## 2026-09-24 - Per-account comment read status

- Incoming comments highlight logbook entries and show unread counts. Viewing individual messages in the drawer marks them read for that account in this browser; opening an entry alone does not clear unseen comments. Read chat icons and attachments remain available.

- 2026-09-24: Enabled Correlation Rating on phone viewports; the route now opens the page instead of the desktop-only notice. Metrics and filters wrap, with horizontal scrolling for the detailed table.

- 2026-09-24: Added the shared My Pages / Learn & Practice / Start practice breadcrumb and history controls to the practice session list and empty state. Active practice retains its existing guarded exit.
