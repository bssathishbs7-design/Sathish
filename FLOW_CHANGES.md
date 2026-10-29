## 2026-10-28 - Collapsible demo library

- Replaced demo series tabs with For this page, Recently watched, All videos, Question Bank and Skill Assessment accordion sections. For this page opens by default; opening another section collapses the previous one.
- Recently watched lists the five most recently played videos and resumes unfinished playback using saved viewer progress.

## 2026-10-08 - Disable practice retakes

- Disabled Retake in the practice session list and Retake Practice / Resume Retake in submitted practice reviews. Submit Practice retains its existing availability during an active attempt.

## 2026-10-08 - Disable Start practice analytics navigation

- Disabled View analytics in the Start practice header. Practice session actions remain available.

## 2026-10-08 - Disable practice card analytics navigation

- Disabled Analytics on Learn & Practice cards. Start practice remains available.

## 2026-10-08 - Disable shared competency analytics navigation

- Disabled View Analytics on Share to Students competency rows. Practice report View buttons remain available.

## 2026-10-07 - Student file selection

- Added Upload beside Add Student in the Student Management action card. Upload opens a file picker and displays the selected filename; it does not import student records.

## 2026-10-07 - Student Management navigation header

- Replaced the static Admin breadcrumb with the shared My Pages / Student management header and browser back/forward controls used across the app.

## 2026-10-07 - Student Management sidebar access

- Added Student Management directly below Query Request in the faculty sidebar, opening the existing student directory at `/student-management`.

## 2026-09-25 - Explicit Blueprint question filters

- Saving or updating a Blueprint now opens Question Bank without automatic requirement filters. Existing question selections and Blueprint progress remain intact.
- Apply filter and View LAQs in the floating progress panel explicitly set the requirement filters; the active requirement alone no longer filters the bank.

## 2026-09-25 - Blueprint selection through floating progress

- In the Question Bank, hide the Blueprint dropdown, Next requirement, and Create question toolbar controls when the floating Blueprint panel is available. Requirement selection, step navigation, and creation remain available through the progress circle and panel.
- Preserve other filters, question selection, sidebar actions, and the empty-results creation shortcut.

## 2026-09-25 - Floating Blueprint requirements panel

- Restored the bottom-left progress circle. It opens a non-modal panel above it; the bank remains interactive without a backdrop. Outside click, Escape, close, and the circle dismiss the panel.
- MCQ and SAQ tables now separate QB availability, row actions, and completion; SAQ categories are inline rather than extra separator rows. LAQ actions sit beside each whole-question split table.

## 2026-09-25 - Browse competency-relevant LAQs

- LAQ requirements always offer View relevant LAQs, including when no whole question matches the exact split. Bank competency filters include nested question parts.
- Exact split matching still controls Blueprint progress; creation remains available for missing matches.

## 2026-09-25 - Compact Blueprint steps

- Replaced the floating circle and competency cards with a toolbar progress button and compact MCQ, SAQ, LAQ steps. SAQ requirements follow Direct, Reasoning, Aetcom, Application order.
- Requirement rows use actual bank availability to offer picking or creation; completed rows offer Preview review. Whole LAQ requirements display their saved part assignments and count once.
- Next requirement follows the same type and category order, and the summary opens on the active requirement type.

## 2026-09-25 - Row-by-row Blueprint selection

- Blueprint dropdown shows each saved requirement with its live picked count and Done status. Adding or creating a question opens Preview and retains the active requirement.
- Next requirement moves to the next pending row and applies its bank filters. The floating progress summary provides another route to individual requirements and displays LAQ parts without counting them as whole questions.

## 2026-09-25 - Allow unrelated questions in Blueprint Preview

- Question Bank selection and Add to Assessment now allow questions outside the saved Blueprint. Duplicate protection remains.
- Unallocated questions remain in the original Preview with a Not relevant to Blueprint badge and do not increase Blueprint progress. Card styling is unchanged.

## 2026-09-25 - Restore the existing Question Bank and Preview flow

- Removed the added Blueprint picker panels and their exclusive styles. Requirements are chosen from the existing Question Bank filter bar.
- Visible bank filters are the sole list filter; Blueprint rules validate selection capacity and marks without hiding contradictory results.
- Add to Assessment returns to the existing Preview. Its header shows Blueprint progress, and existing Configuration/publication checks enforce completion.

## 2026-09-25 - Open the active blueprint question requirement

- Pick questions now collapses the requirement list and focuses the matching question-bank panel, with competency, thinking level, marks and remaining count visible. Back to requirements restores the list.

## 2026-09-25 - Saved blueprint question selection and preview

- Saving a matched blueprint opens inline requirement rows derived from its allocation, replacing the floating progress table.
- Each row filters question-bank selection by competency, type, category, thinking level and marks. Whole LAQs retain explicit part assignments in the saved planner.
- Users can create a prefilled matching question when bank coverage is missing, review selections, replace a question without removing the original until its replacement is accepted, and move to the next pending requirement.
- Preview remains available while selection is incomplete; configuration and publication require all blueprint requirements to be satisfied without duplicate or surplus questions.

# Flow changes

## 2026-09-24 - Manual LAQ part marks

- LAQ part marks are entered independently. Editing one part no longer redistributes marks to other parts; allocation totals and validation continue to update. This supersedes the automatic LAQ remainder allocation.

## 2026-09-24 - Automatic calculations with Both-only SAQ count editing

- Removed Auto tally. SAQ LoT-only and HoT-only rows calculate their counts automatically and lock both cognition count fields. Both rows permit complementary count edits. Switches and marks trigger automatic recalculation; incompatible percentage targets retain the visible difference without changing switches.

## 2026-09-24 - Preserve switches during Auto tally

- Auto tally now treats every LoT / HoT / Both selection as fixed and adjusts only MCQ counts and existing Both rows. LAQ parts remain unchanged. An impossible target leaves all values and selections untouched and shows the remaining cognition difference. This supersedes the earlier automatic switch-to-Both behaviour.

## 2026-09-24 - Auto tally percentage conflicts

- Added Auto tally in question specifications. For complete, valid inputs with a cognition mismatch, it finds an exact whole-question split and changes the fewest necessary SAQ selections to Both. LAQ part marks and classifications remain fixed. Failed searches preserve the current configuration and explain the conflict; successful searches show Matched and highlight updated numbers and selections briefly.

## 2026-09-24 - Percentage rebalancing and LAQ remainder allocation

- Each Blueprint edit preserves the latest manual input and releases earlier cognition-count overrides so eligible rows can rebalance against the assessment percentage targets. Fixed SAQ cognition selections remain respected; unattainable targets show marks remaining or over. Editing LAQ part marks distributes the remainder across the other parts while retaining their cognition selections.

## 2026-09-24 - Editable Blueprint calculations

- MCQ and SAQ cognition counts support manual edits with complementary counts and eligible automatic allocations recalculated. Editing an excluded SAQ level selects Both. LAQ summary counts reclassify the existing parts while preserving their marks. Each edit highlights its changed fields and dependent totals, and invalidates previous competency allocations.

## 2026-09-24 - SAQ cognition selection

- Each SAQ category now uses a LoT / HoT / Both toggle. Direct defaults to LoT; Reasoning, Aetcom and Application default to HoT. SAQ counts are calculated rather than manually edited; Both uses the configured cognition percentages and whole-question allocation. Changing a selection clears previous competency allocations for recalculation.

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

## 2026-08-07 â€” Overall analytics student result navigation

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
# Admin Logbook faculty workflow â€” 23 September 2026

- Expanded Admin Logbook into Overview, Queue, Students, Subjects, Categories, Skills, History, Sign-offs and Search; mobile uses a section selector.
- Reviews are scoped to the demo faculty department and assigned reviewer. Certifiable entries require grading; returns require feedback; bulk approval excludes individually graded entries. Reassignment records an audit event.
- Faculty can assign entries to a student or cohort. Assigned work appears in the student's Dashboard, retains its subject/category/reviewer, and returns to the faculty queue after submission. Only unsubmitted assignments can be cancelled.
- Faculty mark subject logbooks ready; learners submit through the configurable final approval chain. Each submission snapshots its approvers; returns allow resubmission and retain history.
- Learner views show only the current demo student's entries. Faculty identity selection is explicitly a local demo control pending authenticated backend integration.
# Admin Logbook compact navigation â€” 23 September 2026

- Moved navigation into the shared Logbook header. Dashboard, Queue, Students and Subjects remain directly visible; More views contains Categories, Skills, History, Sign-offs and Search. Mobile retains the complete section selector. Review and approval workflows are unchanged.

- Removed the Admin Logbook department/demo reviewer strip at user request. The page retains its default faculty reviewer; the demo identity switch is no longer exposed.

- Admin Logbook navigation now displays every available section in one separate tab card below the header. Removed More views and the mobile selector; smaller screens scroll the same single row horizontally.

- Removed the Final logbook approval section and its submission/history controls from the learner Dashboard at user request. Assigned activities remain available; existing sign-off records are retained.

## Connected Logbook workflow â€” 23 September 2026

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

## 2026-09-29 - Approved Logbook audit workflows

- My Logbook subviews and filters now use App-owned browser URL/history state; section returns retain list filters and scroll. Admin Search is again directly reachable, with a mobile section selector and actionable parent breadcrumbs.
- Ready and returned subject approvals appear in student Needs action; assignment tasks appear once, with deadlines. Skill remediation links resume an existing matching draft or create a linked attempt for the original competency.
- Students review a submission summary before acknowledgement. Faculty review controls precede comments and have a persistent Review entry shortcut.
- Pending-entry deletion, bulk approval, assignment cancellation and final sign-off use persistent contextual confirmations. Existing deletion semantics and discretionary faculty readiness are retained as approved.
- Evidence thumbnails open an accessible inspection dialog; long record lists progressively reveal further results.

## 2026-09-29 - Approved prototype comparison workflows

- Completed subject logbooks are sealed; submitted final-approval logbooks block entry changes and assignments until returned. Assignment batches skip these learners and report actual recipient counts. Notes and comments remain separate from the sealed record body.
- Pending corrections retain their subject/category. The legacy learner faculty route now opens learner Pending search without review controls.
- Changed valid drafts and assigned tasks auto-save on close. Invalid or locked changes offer a discard/continue choice. An optional initial comment is posted once upon submission.
- Faculty can read learner notes. Unlinked Returned entries may be explicitly deleted; records with remedial links retain their history.
- Approval-chain configuration belongs to subject departments. New default chains use a subject HoD; submitted chains retain their snapshot. Returned approvals resume through learner resubmission rather than being marked ready again.
- Pending search supports faculty/subject grouping; progress signals and subject cards lead into the existing entry and approval journeys.
- Incompatible HTML prototype storage offers a separate app Logbook without altering the prototype data.

## 2026-09-29 - End-to-end approval recheck

- Sealed/in-review work no longer appears as actionable learner work or faculty review selections. Direct learner edit/remedial actions enforce the same lock.
- Faculty Ready details display the planned approval chain. Returned rounds retain their historical chain while resubmission displays the current chain.
- Confirmation captures the approval round/step and submission chain. Changed context requires a fresh confirmation; learner submission requires the owning learner identity.
- When a remedial is returned again, follow-up continues from that latest returned attempt. Previous records link forward to existing attempts; creating another branch from the earlier parent is prevented. Existing historical records remain intact.

## 2026-09-29 - Direct Admin Logbook account switching

- Added the missing Viewing as selector below the existing header, available throughout Admin Logbook. Faculty, subject HoD, Dean and Director previews share App-owned identity and persistence with the profile account drawer.
- Switching refreshes the account's queue, review permissions and approval views without a reload. Compatible sections stay open; switching to an office account from a department-only section returns to Overview.
- Verified 11 browser assertions covering switching, persisted selection, role navigation and overflow at 1440, 768 and 390 pixels. Production build and component/page lint passed; App.jsx retains three pre-existing effect-related lint errors outside this change.

### 2026-09-30 ? Admin subject browsing
- Restored subject category navigation with filtered counts, category activity cards and one expanded activity at a time.
- Certifiable activities include remedial attempts; each student attempt opens the existing permission-controlled entry drawer.
- Added faculty subject summaries and aligned logged student counts. Existing review and sign-off permissions remain in force.

### 2026-09-30 - Sign-off handoff continuity
- Review links carry exact student ID and subject with a return-to-approval action; subject browsing links to readiness and approval details.
- Sign-offs use URL-backed status, student and subject filters; dashboard metrics select the corresponding queue. Selected approval details persist when decisions move records between queues.
- Learner approval tasks open details directly, with next-action summaries on subject pages. Shared prerequisites and inline return-feedback validation explain blockers before confirmation.
- Existing approval permissions, chain snapshots and office pre-submission visibility are preserved.

### 2026-09-30 - All-tab parity fixes
- Dashboard and full search share notes, feedback and registration matching; certifiable category navigation consistently includes legacy remedial records.
- Student assignment keeps the selected subject; skill-to-student links retain subject/competency with a return action.
- History filters persist in the route, and metric links clear incompatible filters. Entry review validates missing grading/feedback before mutation.
- Submitted sign-offs with unexpected pending work expose a blocking warning while retaining return/review actions.

### 2026-10-05 - Focused approval order editing
- Subject pages show the saved signing order in a compact preview. Edit order opens a shared drawer for adding, removing and reordering approvers.
- Saving returns to the subject; cancelling changed drafts asks whether to discard. Current approval chains remain unchanged.

### 2026-10-05 - Compact approval order popup
- Edit on the subject approval-order preview now opens a centred compact dialog, preserving save, discard, keyboard focus and approval permissions. Subject counts share the heading row.

### 2026-10-06 - Skills to Logbook tracking
- Assigning a skill creates a read-only To do record for each student. The Certifiable toggle selects Skill competency or Certifiable skill.
- Student submission shows Awaiting evaluation. Faculty decisions update the same attempt to Completed, Repeat or Remedial; Repeat/Remedial creates the next To do attempt in Skills and both Logbooks.
- Logbook records link back to Skills; all performance changes stay in the Skills workflow. Unscored activities support faculty decisions.

### 2026-10-06 - Manual log category choices
- Removed Skill competency and Certifiable skill competency from student entry creation and faculty assignment category lists. Skills-module records remain visible in Logbook views; locked existing records retain their category label.

### 2026-10-06 - Combined skill activity rows
- My Logbook and Admin Logbook lists show one row per student, subject and assigned skill, using its latest attempt status. Recent activity sorts by the latest event across that activity's attempts.
- Opening the row retains the complete attempt history; historical attempts remain available for performance review. Filtering and pagination operate on combined rows.
## 2026-10-08 - Assessment ID on creation

- Create Assessment reserves an `ASSTMMDDNNN` code using India time and a daily sequence starting at 001, alongside a separate unique internal ID. The code appears beside the header details and persists through draft, approval, and publication workflows.
- Repeated clicks during creation are blocked. Loading a template or clearing configuration retains the current assessment identity. Sequence allocation is local to this browser; the service adapter supports replacement with a backend allocator.

## 2026-10-08 - Assessment exit confirmation

- Exit opens a confirmation with the current assessment ID and Save as Draft, Discard, and Cancel actions.
- Save as Draft accepts incomplete work and returns to Drafts only after persistence succeeds. Reopening or resaving retains the assessment identity; matching titles remain separate assessments.
- Discard restores the last saved workspace for existing assessments or removes the new unsaved workspace. Cancel and Escape keep the editor open. Save failures retain the editor and display an error.

## 2026-10-09 - Reusable question breakdown templates

- Save Template below Question Type Breakdown opens a name dialog with Save and Cancel. Names must be non-empty and unique; storage errors keep the dialog open.
- Saved templates persist locally and appear in Blueprint Template alongside Create Blueprint (Default). Selecting one restores only question-type marks, cognition allocations and LAQ parts; curriculum and distribution remain unchanged.
- Changing templates clears dependent competency allocations. Existing total and cognition validation prevents continuing with an incompatible breakdown.

## 2026-10-09 - Template-controlled total marks

- Selecting a saved Blueprint Template fills Total Mark with its saved total and makes the field read-only. Distribution and suggestion marks recalculate, and dependent matrices reset for the new total.
- Selecting Create Blueprint (Default) clears Total Mark and restores manual entry.

## 2026-10-09 - Include cognition in blueprint templates

- Save Template now stores Level of Cognition percentages alongside Question Type Breakdown and LAQ parts. Selecting a template restores both sections and retains template-controlled Total Mark.
- Templates continue to exclude subject, topics, competencies, distribution and Assessment Blueprint allocations. Older templates without cognition data prompt for percentages rather than inheriting unrelated values.

## 2026-10-09 - Template detail cards and confirmed deletion

- Blueprint Template lists saved names, marks, creator and LoT/HoT percentages in selectable cards. New templates record the current profile name; older entries show Creator unavailable.
- Each saved template has a separate Delete action with Yes, delete and No confirmation. Default cannot be deleted. Failed deletion keeps the template available.
- Deleting a selected template retains a snapshot in the current assessment so its loaded data and locked total survive saving and reopening; only its reusable list entry is removed.

## 2026-10-09 - Validate totals before saving templates

- Save Template is enabled only when total marks and both cognition mark targets tally, used question rows are complete, and LAQ parts are valid. Unused blank question types remain optional.

## 2026-10-09 - Dependent blueprint fields

- Blueprint inputs follow Subject, Topics, Competency, then optional Template and Total Mark. Template and marks stay disabled until a valid competency is selected.
- Changing subject clears topics and all downstream values; changing topics clears competencies and downstream values. Changing or removing competencies clears the selected template, total, cognition, breakdown and dependent calculations.
- Saved templates remain available across subjects. Selecting one after competency selection continues to restore its data and lock its total.

## 2026-10-09 - Direct Assessment Blueprint for saved templates

- With a saved template selected, Create Blueprint Matrix validates the saved cognition and breakdown, creates the competency matrix, and focuses Assessment Blueprint directly. Failed validation or allocation keeps the user on Distribution with an explanation.
- Template cognition, question-type values, SAQ thinking modes and LAQ parts are read-only; Reset Matrix cannot clear them. Default creation keeps the existing editable steps.

## 2026-10-09 - Suggested cognition adjustments

- Editable question breakdowns with matching total marks and mismatched cognition now offer exact HoT/LoT adjustments, with the fewest question moves recommended first and alternatives collapsed.
- Apply updates classifications without changing question totals or LAQ parts. Undo restores the previous breakdown while its context remains unchanged. Saved templates stay read-only.

## 2026-10-09 - Percentage recommendations by question type

- Replaced the general adjustment panel with recommendations beneath each populated breakdown row. MCQs and Both-mode SAQs offer the nearest whole-question split from cognition percentages, with Apply for that row and Undo.
- Fixed SAQ selections and LAQ parts remain unchanged. LAQs show part counts and marks alongside percentage targets. Rounding and overall target differences are shown rather than claiming that applying one row balances the assessment.

## 2026-10-09 - Remaining-budget allocations per question type

- Row suggestions now subtract other completed rows from the assessment LoT/HoT mark targets. They show possible total marks and whole-question counts, including questions multiplied by marks per question.
- Use fills the selected row's total and cognition counts while preserving other rows and fixed thinking levels. Blank totals offer smaller allocations as well as the maximum; entered totals constrain the options. Undo restores the previous breakdown.
- Incomplete or overallocated rows explain why no option can be offered. LAQ parts remain fixed and contribute their actual marks to the remaining budget.

## 2026-10-09 - Clickable allocation cards

- Replaced allocation text and separate Use buttons with compact two-line cards. Clicking a card or activating it with the keyboard applies that row's allocation; a green border and check indicate the current selection.
- Undo remains beside the cards. LAQ part summaries are read-only cards, and allocation calculations remain unchanged.

## 2026-10-09 - Show allocation cards after row total entry

- Allocation cards stay hidden until the row has a positive Total Marks value and disappear when it is cleared. Options use only the entered row total.

## 2026-10-09 - Suggestions from thinking-level selection

- Selecting LoT, HoT or Both can now reveal suggestions before row Total Marks is entered, superseding the previous total-entry gate. With no marks per question, the row prompts for that value first.
- Once marks per question is available, cards offer allocations within the remaining assessment budget; selecting a card fills the row total. An entered total still constrains options.

## 2026-10-09 - Explicit SAQ selection and row reset confirmation

- New SAQ rows start without a selected thinking level and with their inputs disabled. Choosing LoT, HoT or Both enables the row. Empty rows no longer show the marks-per-question suggestion prompt.
- Changing the thinking level of a populated row asks for Cancel or Reset row. Cancel preserves the selection and data; Reset clears only that row and applies the new selection. Empty-row changes and repeated selection need no confirmation.
- Saved templates remain read-only, and populated legacy drafts keep their historical thinking-level classification.

## 2026-10-09 - Full SAQ row reset

- Confirming Reset row now clears the thinking-level selection as well as the row values. Fields return to disabled until a new selection is made. Cancel continues to preserve the row.

## 2026-10-09 - Nearest percentage breakdown choices

- Cards now wait for a row total and offer floor/ceiling whole-question splits closest to the assessment cognition percentages. The closest feasible card is Recommended; the other is Alternative. Unrelated all-LoT/all-HoT endpoints are removed for mixed rows.
- Other rows' allocations filter these choices against remaining marks. Fixed SAQ modes and existing LAQ parts remain respected; no distant split is substituted when neither percentage choice fits.

## 2026-10-09 - Two-stage allocation cards

- With marks per question entered and the row total blank, cards use the remaining assessment LoT/HoT budgets. Entering a row total switches cards to its nearest percentage splits, still constrained by other allocations.
- Clearing the row total returns to the available assessment allocation. Fixed SAQ selections, actual LAQ parts, card selection, Undo and reset confirmation remain intact.

## 2026-10-09 - Independent breakdown row editing

- Removed shared HoT/LoT redistribution and cross-row clearing of split counts. Editing marks, counts, LAQ parts, selecting cards or resetting changes only the affected breakdown row; totals and recommendations still recalculate.
- Cognition percentage changes preserve the currently displayed allocations. Undo restores only the row associated with its card and remains available after unrelated row edits.

## 2026-10-09 - Row correction cards for cognition mismatch

- When assessment marks match but cognition totals do not, eligible MCQ/SAQ rows offer a correction card that moves whole questions toward the target and shows the remaining mismatch. Rows with nothing to contribute show no correction.
- Corrections preserve row totals and marks per question. Changing a fixed thinking level requires Reset and apply confirmation; Cancel preserves values. Applying or undoing a correction affects only its row and recalculates the other suggestions.

## 2026-10-09 - Mathematical correction cards and LAQ parts

- Correction cards distinguish exact matches from partial corrections and never move more marks than the cognition gap. A row with no eligible whole-question or whole-part move has no correction card.
- LAQ cards select existing parts whose combined marks best reduce the gap. Confirmation changes only their thinking levels; Cancel preserves them and Undo restores only the LAQ row.

## 2026-10-09 - Remaining-balance breakdown selection

- Row cards use the remaining assessment LoT and HoT budgets after excluding the row being edited. Entered row totals use that remaining ratio, constrained to whole questions within both budgets.
- Entering or changing a non-LAQ row's marks leaves its cognition split pending until the user selects a card or enters a split. Applying a card and Undo affect only that row; other values remain unchanged. LAQ counts continue to come from explicitly configured parts.

## 2026-10-09 - Optional pending breakdown rows

- Empty and incomplete question-type rows no longer block suggestions in other rows. Only completed, valid allocations consume the total, LoT and HoT budgets and contribute to the table summary.
- Applying a card includes that row in the allocation totals; Undo restores its prior allocation state. Draft marks remain available for that row's suggestions without reserving the assessment budget.

## 2026-10-09 - Stable selected allocations and available thinking levels

- Completed rows retain a Selected card; alternatives appear only through Edit allocation. Applying a replacement previews that row's before/after cognition marks and supports Cancel and row-only Undo.
- SAQ thinking levels and LAQ part choices that exceed the remaining cognition budget are unavailable, with an accessible explanation. Existing SAQ selections remain available, and replacement budgets exclude the row's own allocation. No other row is automatically changed.

## 2026-10-09 - Explicit alternative for insufficient cognition marks

- Fixed LoT/HoT SAQ rows explain the exact remaining marks when their requested allocation cannot fit. If the same row total fits wholly in the opposite level, a Use HoT/LoT card offers that alternative.
- The alternative previews and confirms the selection change before applying only that row. Cancel preserves the draft; Undo restores its values and thinking level. Invalid question totals or insufficient opposite budgets do not produce an alternative.

## 2026-10-09 - Question-type outline before detailed breakdown

- Create Questions Split opens a compact outline ordered MCQs, SAQ subtypes, and LAQs. Each entered row uses marks per question and whole-question count to calculate its total; SAQ inputs require LoT/HoT/Both selection.
- Next requires an exact match to the assessment total and valid entered rows. It carries marks, counts and subtype selections into the detailed breakdown without applying cognition allocations. Unused rows remain optional.
- Back preserves outline values. Back to question setup restores the current breakdown quantities; unchanged allocations survive the next handoff. Draft saving includes the outline stage and values.

## 2026-10-10 - Hide unused types after question setup

- Next carries only valid entered question types into the detailed breakdown. Unused MCQs, LAQs, and SAQ subtypes are hidden, including their editors and messages; the SAQ heading appears only when at least one subtype is included.
- Accepted rows stay visible while edited. Back to question setup retains every optional type for adding it later. The included type list is saved with the draft and refreshed on Next.

## 2026-10-10 - Automatic breakdown from confirmed setup

- Edit setup in the breakdown header returns to the populated outline. Next recalculates whole-question cognition counts assessment-wide while preserving fixed SAQ levels and row quantities. Infeasible splits keep the user in setup with a specific explanation.
- Removed suggestion cards, allocation selection/Undo controls and their exclusive component/styles. Breakdown setup fields are read-only; editing happens through setup and applies only on Next.
- Existing complete LAQ parts are preserved when quantities are unchanged. Incomplete LAQs reserve residual cognition marks and retain the part editor, with a target note rather than a suggestion card.

## 2026-10-10 - Automatic LAQ parts and remaining marks

- Next creates positive LAQ parts matching the allocated cognition marks: a single part for one thinking level, or two parts when a question needs both. Existing complete parts are preserved.
- When a part's marks edit is committed by leaving the field, the remaining marks create the next part(s) using the remaining cognition budget. Generated remainder parts refresh on subsequent edits; explicit parts and other questions/rows are preserved. Invalid or over-total edits are not force-filled.

## 2026-10-10 - Derived LAQ part count and live remainder

- Replaced manual Number of parts input with the read-only Parts count derived from visible rows.
- Valid marks changes create or update remainder parts immediately while typing, preserving the question total and cognition budget. Removed the separate count-entry handler and exclusive input styles.

### 2026-10-10 ï¿½ Reset question type setup
- Added Reset Setup beside Next with No / Yes, reset confirmation.
- Confirmation clears question inputs, cognition selections, LAQ parts and generated breakdown/matrix state, staying on setup. Assessment subject, total and cognition targets are retained.
- Cancelling preserves values; reset is disabled when setup is empty.

### 2026-10-10 ï¿½ Question-count suggestions in setup
- Focusing or entering a row shows count options based on remaining total and cognition marks. Selecting a card fills only that row's question count; manual input and exact breakdown validation remain available.

### 2026-10-10 ï¿½ Preserve setup row allocations
- Added total, HoT and LoT remaining balances and per-card after-selection balances.
- Editing or selecting a row reserves its cognition marks; later edits release only their own row and cannot rebalance completed rows. Edit Setup preserves existing allocations.
- Added precise row limits and guidance for remainders that cannot be filled with entered unused row marks. Create Breakdown still requires all targets to match.

### 2026-10-10 ï¿½ Read-only cognition badges
- SAQ cognition labels and LAQ part thinking levels now display as badges. Removed LAQ thinking-level toggles; part marks remain editable and setup controls the planned allocation.

### 2026-10-10 â€” Suggestions follow entered setup fields
- Marks-only rows suggest counts; count-only rows suggest marks. Selection fills only the missing field.
- Rows with both fields entered show one read-only calculation. Invalid values show guidance without proposing replacement inputs.

### 2026-10-10 - Additional valid count suggestions
- Completed rows retain the current calculation and offer nearby higher counts, preferring exact percentage splits. Show more reveals further options in ascending order.
- Selecting an alternative updates only the active row and preserves other allocations.

### 2026-10-10 - Reset cognition and question setup together
- Reset Setup confirmation now clears LoT/HoT percentages along with question setup and generated allocations, while retaining the subject and assessment total.
- Reset remains available when only percentages are filled; unset cognition summaries display dashes.

### 2026-10-10 - Preserve LAQ setup allocation during split edits
- Split mark edits preserve existing splits and thinking levels; they no longer generate remainder parts or remove blank splits.
- Planned HoT/LoT marks and counts stay visible. Errors compare edited marks against the setup allocation and block saving or matrix creation until valid.

### 2026-10-10 - Complete remaining marks with an LAQ suggestion
- Setup shows remaining total and cognition marks and offers an explicit LAQ option when the remaining allocation fits.
- Newly generated LAQs distribute cognition marks evenly where whole marks permit; existing split edits still preserve their allocation.

### 2026-10-10 - Remove unsolicited setup guidance
- Removed the remaining-marks strip and LAQ shortcut. Restored numeric-only setup totals; retained calculation logic.

### 2026-10-10 - Compact suggestion pagination
- Replaced expanding Show more with previous/next pages, three cards on desktop and one on mobile; open on the current option.
- Preserved allocation calculations and explicit card selection.

### 2026-10-10 - Prioritise fully allocated suggestions
- All question types place the fully allocated suggestion first on page one, followed by remaining options in ascending order. Current selection stays separate from completion status.

### 2026-10-12 - Student administration workflow
- Student Management uses Admin Logbook navigation, cards and shared modal shells for the directory, batches, graduates, progression history and missing year setup.
- Add/edit and Excel preview/import update a persistent local service. Students enter First Year; batch/year selection leads to promotion, repeating or internship completion with dates and history.
- Student records expose status changes, year corrections and syllabus assignments. Deletion requires confirmation; progression undo requires a reason and rejects newer records. Read-only access hides mutation controls.

## 2026-10-12 - Descriptive online answer flow
- Enabled descriptive Answer Input for practice and proctored assessments, independent of MCQ mode.
- Added persisted responses, resume and submission recovery, leaf-level faculty review, and evaluation-required result release.
- Retained Read-Only mode and existing scheduling design.


## 2026-10-12 - Compact exam navigation
- Practice and proctored exams now use a left question navigator on desktop and an expandable Questions & progress panel above the questions on mobile.
- Answering, timers, submission and proctoring behaviour remain unchanged.


## 2026-10-12 - Restore original exam interface
- Reverted the exam redesign and expandable navigation; restored original practice and proctored layouts and timer placement.
- Retained descriptive answering, persistence, validation and submission fixes.


### 2026-10-12 - Practice exam exit dialog dismissal
- Clicking the backdrop of the practice exam exit confirmation closes the dialog and returns to the active exam. Clicking inside the dialog does not dismiss it.


### 2026-10-12 - Rich descriptive answers in practice exams
- Students can format each descriptive response, edit tables and upload, resize or remove images. Existing plain-text responses remain readable.
- Pending image uploads block manual submission, exit and section switching. Submitted responses remain locked and faculty review displays sanitised rich content.
- Images use the asynchronous mock upload service (PNG, JPEG or WebP, up to 512 KB and three per answer) and persist inside the saved response. The upload function is the backend API integration point.


### 2026-10-13 - Retain completed exams in Published
- Published keeps every published assessment visible after the exam ends and after results are published, using the same stored assessment record.
- Completed cards show an "Exam completed" badge and total duration. Evaluation and Results retain their existing actions and progression.
- Schedule transitions refresh while Published, Evaluation or Results is open; counts and the Completed filter include retained cards.

### 2026-10-13 - Separate assessment stages across tabs
- Supersedes the earlier retention flow: Published shows upcoming/live exams, Evaluation shows completed exams awaiting result publication, and Results shows published results.
- Each assessment appears in one tab only, so tab counts no longer overlap. Evaluation cards show Exam completed alongside their existing evaluation status and action.
- Automatic schedule updates remain enabled across all three tabs.

### 2026-10-13 - Rich descriptive answers in proctored exams
- Reused the practice exam rich-text editor for every descriptive answer, with formatting, tables and image insertion, retaining scoped saved responses and submitted faculty rendering.
- Restricted typing and formatting to enabled answer editors; clipboard paste and drop remain blocked. Manual submission and section switching wait for image processing. Existing fullscreen, focus-loss, timeout and violation enforcement remain active.


### 2026-10-13 - My Assessment filters
- Student assessment filters now expand inline beneath the search controls, following Student Management's filter-panel pattern. Existing search, status selection, apply/reset and assessment navigation remain unchanged.


### 2026-10-13 - My Assessment featured entry and quick filters
- Added a featured assessment entry point that uses the existing exam-start flow for unlocked live exams; upcoming exams show their schedule and completed exams are excluded.
- Added visible status chips alongside search, sharing the existing filter state and reset behaviour.


### 2026-10-13 - Featured assessment carousel
- Featured assessments now support previous/next navigation and automatic rotation, pausing on focus, hover, hidden tabs and reduced motion. Each slide retains the existing start action for its own eligible live assessment.


## 2026-10-13 - Evaluation response confirmation
- Online submitted answers with content no longer offer the Not attempted action. Empty submitted responses offer Confirm unanswered; offline/read-only evaluation retains manual Not attempted marking.
- Online MCQ correctness controls remain disabled before submission and for empty responses. Reset restores pending evaluation; question and parent progress remain distinct from answer correctness.

## 2026-10-13 - Compact per-student marking
- Added All questions / Pending only filtering and Next pending navigation. Enter on valid descriptive marks saves and focuses the next pending marks field; invalid marks stay in place.
- Moved Reset evaluation into question actions. Complete evaluation remains gated on valid marking, then changes to Next student.
- Expanded MCQ options replace the duplicate student-answer paragraph; descriptive responses stay visible during marking.

## 2026-10-13 - Unified bottom evaluation actions
- Combined View students, question filters, question/student progress, Next pending and Complete evaluation / Next student in one bottom floating card.
- Removed the separate top filter bar and moved View students out of the overview header. The card reserves its measured height below the question list and uses two rows on tablet.

## 2026-10-13 - Evaluation summary confirmation
- Student evaluation uses one header progress indicator. Fully marked questions show Ready to complete; Final score and Outcome appear after Complete evaluation is confirmed.
- Removed the duplicate student completion badge from the evaluation header. Resetting a question returns the summary to pending.

### 2026-10-13 - Pending correction navigation
- Replaced student evaluation question filters and Next pending with one Pending correction action. All cards remain visible; the action cycles focus through unevaluated cards and disables when none remain.


### 2026-10-14 - Continue unfinished student evaluations
- Next student skips completed and absent students and wraps to earlier unfinished evaluations. Returns to the evaluation table only when no eligible students remain.


### 2026-10-14 - Restore direct blueprint breakdown editing
- Restored the 9 October editable Question type breakdown and its original calculations. Create question split opens this table directly, without separate Question type setup and Create breakdown steps.
- Removed suggestion and preview cards. Marks, cognition counts, and LAQ parts are edited in the original breakdown before creating the competency matrix.

### 2026-10-14 - Use the blueprint behaviour available on 2 October
- Changed the restored table baseline to commit 4f3b204 (1 October, the latest snapshot available by 2 October). SAQs use their original defaults, and changing cognition retains marks and recalculates counts immediately without a row-reset confirmation.
- The single editable breakdown remains; no setup, suggestions, or preview step is introduced.

### 2026-10-14 - Optional final cognition suggestions
- When total marks match but HoT/LoT targets differ, the breakdown offers exact single-row and combined question transfers beneath the total row. Apply updates the selected changes together and returns focus to the breakdown.
- Suggestions use existing editable MCQ/SAQ questions, retain LAQ parts and single-level selections, and disappear when targets match.

### 2026-10-14 - Show applied cognition adjustments inline
- Applying a suggestion highlights only changed HoT/LoT counts and displays signed question deltas until the next table edit. Affected SAQ selections reflect the result: HoT-only, LoT-only, or Both.

### 2026-10-14 - Include single-level SAQs in cognition suggestions
- Suggestion cards can now propose transfers for LoT-only and HoT-only SAQ rows. Applying a card updates the affected thinking-level selection; generating suggestions leaves current selections unchanged.

### 2026-10-14 - Navigate to blueprint allocation mismatches
- Added Go to first mismatch beside the competency status. It scrolls to the first unmatched competency and focuses its first editable count, retaining the existing allocation workflow.

### 2026-10-14 - Allocate individual blueprint questions from remaining cards
- Added LAQ-part and SAQ-category Add controls that allocate one identified unit to a suggested competency with enough remaining marks. Counts, marks, remaining cards, and information breakdowns update together. Retained unit identities are included in planner/draft persistence.

### 2026-10-14 - Field-specific blueprint allocation suggestions
- Focusing or clicking a count opens matching remaining units for that competency, question type, and thinking level. Add allocates directly to the active field. Manual entry remains available after AutoFill and rejects unavailable or over-capacity increases without changing other competencies. Popups support keyboard entry, Escape, outside dismissal, and viewport-aware placement.

### 2026-10-14 - Preserve manual blueprint allocations during AutoFill
- Manual typing and Add mark a populated field as manual. AutoFill and Reshuffle reserve those fields and exact unit identities, filling only the remaining allocation. Impossible fills leave the draft unchanged with an explanation. Clearing releases a manual field; source metadata persists in saved planners and drafts.

### 2026-10-14 - Retain partial blueprint AutoFill progress
- AutoFill and Reshuffle now apply allocations that fit around manual fields even when a complete allocation is unavailable. Unplaceable questions remain available for manual allocation, with an inline remaining-count notice instead of blocking all progress.

### 2026-10-14 - Remove blueprint mismatch navigation
- Removed the competency-attention footer and Go to first mismatch action from the assessment blueprint.

### 2026-10-14 - Preview saved blueprint templates before selection
- Each saved template now has a separate preview action. Hover or focus opens its read-only breakdown, clicking keeps it open, and Escape or outside click dismisses it without loading the template.

### 2026-10-14 - Open template previews only on click
- Removed hover and focus opening. Clicking the eye toggles the preview; Escape, close, and outside click still dismiss it.

### 2026-10-15 - Per-type assessment automation rules
- Practice and Proctored share independent MCQ/Descriptive evaluation and publishing settings. Read-only disables automatic actions; evaluation No turns publishing off. Hybrid policy requires both types to permit automatic publishing. Existing MCQ automatic marking respects the effective policy.

### 2026-10-15 - Configuration field validation
- Editing configuration validates touched fields without exposing unrelated missing fields. Publishing validates all active requirements and focuses the first invalid field. Offline scheduling does not require the hidden supervision selector.

### 2026-10-15 - Simplified configuration entry
- Required assignment controls stay open; saved college/year use an Edit action. Answer mode and automation share one table, and Add instructions opens the editor directly. Unavailable course/group selectors are omitted. Existing evaluation and publishing rules are retained.

### 2026-10-15 - Configuration reading order and empty state
- Assessment details, exam schedule, and audience/submission are numbered and always visible. College and academic year are directly editable. Optional settings follow required fields. Empty assessments show Add questions and an explanation beside submission.

### 2026-10-15 - Reference configuration section order
- Restored the reference presentation order: publication details and upload, summary, schedule, instructions/thresholds, assignment, and actions. Existing controls, availability, validation, and publishing rules remain unchanged.

### 2026-10-15 - Common answer and result rules
- MCQ, Descriptive, and Hybrid use Automatic/Manual evaluation and publishing choices. Manual evaluation forces manual publishing; read-only preserves saved preferences while showing the manual workflow. One derived outcome explains Hybrid publishing. Unsupported descriptive evaluation and automatic publishing are unavailable until their executors are connected.

### 2026-10-15 - Online evaluation prerequisite for publishing
- Online answer-input MCQ evaluation is always automatic, including previously saved manual choices. Descriptive offers AI or Manual evaluation; Manual turns auto publish off and returning to AI does not enable publishing automatically. Read-only and Offline retain manual workflows.
- Faculty can save preferences independently of connected executors. Hybrid automatic publishing requires both sections to permit it and complete evaluation. The UI identifies pending integrations; descriptive AI and automatic publishing do not execute until connected. AI descriptive evaluation displays its additional cost to Medsy; changing settings does not execute AI or incur charges.

### 2026-10-15 - Shared Hybrid result publishing
- Hybrid displays one Auto publish On/Off control below both question-type cards. It saves both existing publishing fields atomically; legacy mixed choices display Off. Manual descriptive evaluation, Read-only in either section, or Offline turns shared publishing Off; returning to eligible settings does not turn it on. Single-type controls remain unchanged.

### 2026-10-15 - Visible scheduling steps
- Schedule and answer settings follow three visible steps: choose exam mode and supervision, set the schedule, then set answers and results. All applicable fields remain on the same page with existing validation; no Next/Back actions were added. Offline displays its existing schedule fields and a manual-results explanation.

### 2026-10-15 - Progressive scheduling with editable summaries
- Scheduling opens one step at a time. Continue validates only that step; Done collapses the final answer settings. Completed steps expose Edit and Save changes while preserving draft values. Invalid dependent steps show Needs attention and reopen after saving an earlier step. Offline results are summarised automatically. Final submission requires completed, valid scheduling steps; draft saving is unchanged.

### 2026-10-15 - Single scheduling form and summary
- Replaced progressive cards with one aligned form. Save settings validates all applicable scheduling fields and collapses the form into a compact labelled summary with one Edit button. Save changes updates the summary; Cancel restores only the saved scheduling fields, preserving unrelated configuration. Offline omits answer controls and summarises manual evaluation and publishing.

### 2026-10-15 - Instructions and thresholds popups
- Replaced the optional accordion rows with compact summary-toolbar buttons. Instructions and thresholds open the shared native-dialog shell with reduced-motion-aware animation. Save validates the relevant fields; Cancel, close, and Escape restore the opening snapshot. Instructions remains available for Online exams; threshold settings retains existing defaults and controls.

### 2026-10-15 - Restore SGT assignment
- Restored the optional SGT group/class selector between Student year and Publishing action. It loads and updates the existing assignGroup field used by saved and published assessments, retaining previously saved custom groups.

### 2026-10-15 - Show split option before duration entry
- Hybrid proctored exams now show Configure split before a duration is entered. The button stays disabled until Total Duration is valid and greater than zero.

### 2026-10-15 - Apply schedule settings directly
- Removed the separate Save settings, collapsed summary and edit/cancel step. Schedule and answer controls stay editable; publication validates the current draft directly.

### 2026-10-15 - Default descriptive automation selections
- New/reset assessments default to Enter answers with AI evaluation for Descriptive and Auto Publish On. Both section publish flags default On so Hybrid uses the shared On selection. Existing saved values retain precedence.

### 2026-10-16 - Move configuration options to the bottom
- Moved Add/Edit instructions and Threshold settings below Assign Information, above the final Clear and publication actions. Existing popup behaviour is unchanged.

### 2026-10-16 - Assignment and approval action dialogs
- Replaced inline assignment fields and publication toggle with Direct Publish and Send to Approval actions. Required assessment fields are checked before opening either popup.
- Direct Publish collects required Student Year and optional SGT, then Assign publishes. Approval collects a linked faculty identity and optional note without requiring a year. Cancel leaves draft assignment unchanged; confirmation prevents duplicate submissions.


### 2026-10-16 ? Confirm clearing assessment settings
- Clear now opens a Yes/No confirmation. Yes resets the configuration form; No or Escape keeps the current entries. Selected questions are retained.


### 2026-10-16 ? Gate publication actions on valid settings
- Direct Publish and Send to Approval remain disabled until required configuration, questions, preview sections, and applicable blueprint requirements are valid. Readiness updates with form changes; assignment and reviewer choices remain validated in their respective dialogs.


### 2026-10-16 ? Clear existing assessment tracker cards
- Apply the requested one-time browser-local reset of Draft and Published storage (also supplying Evaluation and Results). Keep a local recovery snapshot; retain new assessments on later visits. Sample cards no longer repopulate after reset. Pending, Approved, and Rejected already contain no records.


### 2026-10-16 ? Submission countdown and automatic result release
- After saved exam submission, existing exit flow returns to My Assessment. Eligible cards show a persisted two-minute countdown and open the student result when evaluation is complete.
- Grade submitted MCQs from stored answer keys and synchronise faculty evaluation marks and per-student publication status. Manual/offline/read-only settings do not auto publish; hybrid waits for all marks.
- Descriptive AI execution remains pending until a real evaluator is connected. No simulated marks or timer-only publication. Local reconciliation resumes after refresh; server-side execution is required for cross-device/background processing.


### 2026-10-16 ? Reuse Practice descriptive grading for assessments
- Submitted online descriptive responses with automatic evaluation enabled now use the shared Practice keyword-coverage grader, including nested answer parts. Valid scores update faculty and student records and release under the existing two-minute rule.
- Assessment grading requires usable model answers; missing guidance, image responses and invalid maximum marks remain for faculty review. Manual/offline/read-only modes and existing faculty marks are preserved.

## 2026-10-16 - Reset before editing automatic descriptive marks
- Faculty must select Reset evaluation before changing automatically evaluated SAQ/LAQ marks, including individual sub-parts.
- Reset keeps that part pending for manual marking across automatic reconciliation; other parts retain their marks.

## 2026-10-16 - Reset before editing automatic MCQ marks
- Automatically evaluated MCQ marking actions remain locked until Reset evaluation is selected.
- Reset and subsequent manual corrections persist without being overwritten by automatic reconciliation.

## 2026-10-16 - Student result answer review
- Question reviews open by default with submitted MCQ choices and each descriptive sub-part answer, key, marks and automatic-only feedback.
- Threshold labels show Threshold Meet or Below Threshold alongside correctness; descriptive totals use persisted sub-part marks.

## 2026-10-16 - Retain an accidentally reset evaluation
- After resetting an evaluated MCQ or descriptive part, its action menu offers Retain evaluation until replacement marks are entered.
- Retaining restores the saved marks, automatic lock and feedback for that part; the snapshot persists across refresh.

## 2026-10-16 - Edit action for automatically evaluated students
- Student rows with recorded automatic evaluation show a single Edit action, opening the existing evaluation screen. Manual and absent rows retain their existing actions.

## 2026-10-17 - Shared assessment lifecycle history
- Draft, approval-stage, Published, Evaluation and Results cards show the stable assessment identity and open a shared animated history dialog.
- Pending, Approved and Rejected cards now read the existing assessment approval queue.
- Draft saves, approval actions, evaluation changes and automatic result transitions append browser-persisted history under the assessment identity. Existing publishing and exam-control logs remain accessible.
- The dialog supports Escape, focus trapping/restoration, scrolling and reduced motion. Missing legacy activity is not invented.

## 2026-10-17 - Blueprint identity and optional approval gate
- Saving a valid blueprint offers Continue to assessment or Send to approval. The first confirmed action allocates a persistent ASSTBP sequence ID linked to the unchanged assessment ID.
- Blueprint submissions use the existing faculty popup and Assessment module in Review-Approve. Reviewers inspect the submitted snapshot and approve or reject with remarks.
- Pending/rejected/revised blueprints block question preparation and configuration. Approved cards continue to the same assessment; editing an approved planner requires resubmission. Existing questions are retained and checked by the existing blueprint matching logic.
- Cards and history display the blueprint identity and status; blueprint approval remains separate from final assessment approval.

## 2026-10-17 - Editable blueprint approval
- Pending blueprint reviews now expose the existing Distribution and Specifications planner tabs. Reviewer edits stay local until Save and approve validates and persists the complete matrix.
- Approval retains the blueprint ID, increments the revision for changed content, logs reviewer edits, and passes the approved snapshot to the assessment continuation. Rejection preserves the submitted snapshot and requires remarks.

## 2026-10-17 - Read-only blueprint preview while approval is pending
- Create Assessment now shows the complete saved Distribution and Specifications planner during pending approval, with a status notice and locked downstream assessment steps.
- Tabs, view switches, information tools and exit remain available; editing, allocation and save controls are disabled until review completes.
- Approval received while the page is open restores the reviewed snapshot before question preparation continues. Existing rejection and resubmission handling is retained.

## 2026-10-17 - Preserve the original pending blueprint page layout
- Pending approval now uses the original Create Assessment header, planner and right action rail. Removed the separate preview wrapper and duplicate navigation controls.
- Existing planner and assessment actions remain disabled while pending; view tabs and tooltips stay available. Exit leaves the read-only page without offering a draft save.

## 2026-10-17 - Remove decided assessment requests from the review queue
- Assessment and blueprint cards leave Review-Approve immediately after approval or rejection, including the tab count. Stored decisions and assessment history remain available in the assessment workflow.

## 2026-10-21 - Allow configuration before blueprint question selection is complete
- Configuration is available during question preparation and preview, including a partially filled blueprint.
- Pending blueprint approval remains read-only. Existing blueprint completeness checks still apply when submitting for approval or publishing.

## 2026-10-21 - Make blueprint fulfilment optional for assessment submission
- Direct Publish and Send to Approval no longer require selected questions to fulfil every blueprint target, including their confirmation handlers.
- Blueprint progress remains informational. Required configuration, non-empty questions and preview sections, and blueprint approval locks remain enforced.

## 2026-10-21 - Submit assessments to a read-only review
- Send saves the draft and submitted blueprint/question snapshot, confirms the selected reviewer, and returns to Draft. Pending submissions appear once in Draft with a read-only View action.
- Review-Approve opens assessment submissions with Blueprint (Distribution and Specifications) and Preview questions available; authoring tabs are disabled. The separate editable blueprint-approval flow is unchanged.
- Approval and rejection return to Review-Approve and remove the decided card; rejection requires remarks. Blueprint question targets remain optional.

## 2026-10-21 - Reuse assessment workspace in approval view
- Assessment review now presents the original Blueprint, Preview and Configuration panels and right action rail. Configuration is viewable with all fields disabled; authoring and publication remain locked.

## 2026-10-21 - Open approval cards in the original full assessment workspace
- Assessment and blueprint View actions open without the app sidebar/navbar, using the original assessment header, panels and action rail. Exit returns to the source queue (or Draft for author viewing).
- Blueprint decisions now approve/reject the submitted snapshot without editing it. Future blueprint submissions capture any existing questions for read-only preview. Reviewer remarks and decision buttons are in the right rail.

## 2026-10-21 - Edit only the blueprint in blueprint-only approval
- Blueprint-only approval enables Distribution and Specifications editing, Clear and AutoFill while all other workspace tabs and publication actions stay disabled.
- The compact floating card uses Save and approve to validate and persist the edited matrix; rejected or abandoned edits do not change the submitted snapshot. Assessment approval remains read-only.

## 2026-10-21 - Edit assessment submissions during approval
- Pending assessment reviews allow Blueprint, Create new question, Question bank, Preview and Configuration editing; Assessment history, Save as Draft and Send to approval remain disabled.
- Review changes stay local until Save and approve validates configuration and saves the edited submitted snapshot. Rejection retains the original submission; Exit confirms discarding unsaved review changes. Blueprint-only approval remains limited to Blueprint.

## 2026-10-21 - Rework rejected assessments
- Rejected cards offer Continue to reopen the submitted questions, sections and setup. A rejection-reason dialog names the reviewer and date before rework; remarks remain accessible from the header.
- Rejected blueprint submissions stay in Blueprint editing. Resubmission replaces the active queue entry while retaining previous submissions and review remarks in its history; existing send confirmation and return-to-Draft flow are retained for assessments.

## 2026-10-21 - Save rejected rework into Draft
- Explicit Save as Draft moves a rejected rework card into Draft and returns to that tab, retaining the same assessment ID/code. The rejected submission remains archived in the queue data with its remarks, but is excluded from active status cards/counts.
- Internal draft saves during submission do not trigger this transition. Failed saves retain the rejected stage and open edits.

## 2026-10-21 - Submitted assessments move to Pending
- Sending an assessment for approval now opens Pending; the submitted assessment is excluded from Draft cards and counts and appears once in Pending with a read-only View action. Existing IDs and rejection/rework history remain unchanged.

- Expired pending assessment submissions show an expiry message and disable opening from the assessment tracker and approval queue. Draft editing and published exam workflows are unchanged.

- Replaced the expired pending-card lock with Reschedule in both tracker and approval queue. A shared dialog validates a future start (and a later practice end), updates the existing submission and linked draft, and retains Pending approval and the same assessment ID.

- Save and approve for assessment reviews now validates a future schedule, saves the reviewed assessment as Published, removes its draft duplicate and shows a shared animated confirmation. It then opens Published and highlights the same assessment ID. Blueprint approval and rejection remain separate.

- Assessment Send to Approval now requires Assign to Year and SGT before sending. Changing Year clears SGT; both selections persist through draft saving, review and publication. Direct Publish retains optional SGT, and blueprint reviewer submission keeps its existing fields.

- Assessment Send to Approval is now a two-step popup: required Year/SGT enable Next, then explicit faculty selection enables Send. Back preserves selections and note; changing Year resets SGT. Direct Publish and blueprint approval remain single-step.

- SGT is now optional in assessment Send to Approval. Year alone enables Next; faculty selection still enables Send.

### 2026-10-22 ? Published assessment resubmission
- Editing an approval-published assessment requires resubmission; Direct Publish is disabled. Direct-published assessments can use either route.
- Successful submission atomically withdraws the published card and draft and places the same assessment in Pending. Cancelling edit leaves publication unchanged; approval republishes the same ID.

### 2026-10-22 ? Hide draft actions during published editing
- Published assessment editing hides the assessment Save as Draft action and the exit-dialog draft action for both publication methods. New and draft assessments retain their save actions.

### 2026-10-22 ? One-minute student result preparation
- Successful exam submission returns to the student card. Eligible auto-published results show a persisted one-minute sand timer and release only after evaluation completes.
- Result readiness reveals the score and View Results action on the card instead of automatically navigating away. Manual publication remains pending without a timer.

### 2026-10-22 ? Compact result countdown and automatic reveal
- Auto-published student attempts display preparation and the remaining minute inside the action button. When evaluation and the countdown finish, open the student result page once per submitted attempt.

### 2026-10-22 ? Automatic evaluation for present students after exam end
- When all applicable sections have automatic evaluation enabled, close present students' unsubmitted attempts at the scheduled end (including saved time extensions). Preserve saved answers and evaluate blanks as zero; exclude absent students.
- Auto publication remains governed by its existing configuration and evaluation completion.

### 2026-10-22 ? Automatic result publication controls
- Disable manual result publishing when Auto Publish is enabled or results are already published. Tracker cards and counts refresh immediately on automatic publication, placing the assessment exclusively in Results after all present students are published.

### 2026-10-22 ? Shared mock evaluation roster
- The evaluation table and automatic evaluator now resolve the same roster, including the local sample roster when no explicit assignment is stored. Persist the resolved roster with evaluated results so present students cannot remain display-only rows.
### 2026-10-22 — Review published results from Evaluation
- Keep published-result assessments visible in both Evaluation and Results using one stored record. Evaluation shows Results published and Review evaluation, preserving publication when opening corrections.
- Existing mark correction history and result reconciliation remain shared with the Results view.
### 2026-10-22 — Combined Approval Queue
- Replace Pending, Approved and Rejected tracker tabs with Approval Queue, showing a unique combined count and per-card status.
- Add All/Pending/Approved/Rejected filtering; preserve existing actions and redirect legacy stage entry points to the queue.
### 2026-10-22 — Compact practice descriptive question navigation
- Default to one descriptive question with all its subquestions. Offer View all questions and section-grouped numbered navigation with answer progress.
- Previous/Next navigate across sections; mounted editors retain answers when changing view. Mobile navigation appears above the questions and can collapse.
### 2026-10-22 — Expandable descriptive question groups
- Show five numbered questions per row in expandable sections, with a scrollable navigator.
- Persist Viewed and Try Later flags per question, retain MCQ-style status colours, and add Try Later/Clear Try Later alongside descriptive navigation.
### 2026-10-22 — Shared practice/proctored exam presentation
- Apply the practice design system to the proctored workspace and reuse the section-based descriptive question navigator.
- Add single/all views, question grids, Previous/Next, and persisted Viewed/Try Later statuses to proctored descriptive questions. New actions respect exam locks; fullscreen, violations, sequence timers and submission remain controlled by the proctored page.

### 2026-10-22 - Local assessment handoff fixtures
- Seed connected faculty and student assessment examples once before app mount in development; preserve existing user records and edits.
- Add local demo shortcuts and an explicit demo-only refresh for current schedules. Persist demo approval rows across browser sessions.
- Retire the destructive automatic tracker reset. Exam controls use the assigned assessment roster when available.

## 2026-10-23 - Assessment presentation selector

- Added View beside Filter in Draft, Approval Queue, Published, Evaluation and Results. Six layouts share a saved selection across tabs and reloads.
- Compact layouts retain KPIs and primary actions; secondary settings open on hover, keyboard focus or tap. Existing assessment stages and action destinations are unchanged.

## 2026-10-23 - Remove extra large assessment view

- Removed Extra large cards from the shared View menu. Previously saved selections fall back to List; the other five views remain available.


## 2026-10-23 - Simplify assessment view choices

- Removed Small cards and Details from the shared View menu across assessment tabs. Saved selections for these views fall back to List. Large cards, Medium cards and List remain available.


## 2026-10-23 - Default assessment presentation

- Assessment tabs now default to Medium cards when no valid saved view exists. Explicit view preferences continue to persist.


## 2026-10-23 - Online question paper downloads

- Published and Evaluation cards now offer Download PDF for online Practice and Proctored assessments, using the existing offline questions-only export. Downloads show a preparing state and report failures through the existing page error message.


## 2026-10-23 - Live assessments available in Evaluation
- Live assessments appear in Published and Evaluation as projections of one saved record. Tab counts include their visible cards; the overall count remains unique.
- Published keeps Exam Controls. Evaluation shows the live timer and enables evaluation when a roster member submits a section; unfinished sections remain unavailable for marking.
- Completed assessments leave Published and remain in Evaluation; released results remain available for review.


## 2026-10-23 - Live evaluation monitoring access
- Continue evaluation remains enabled for live assessment cards before submissions arrive. The existing evaluation table refreshes attempts, session progress and configured evaluation/publication outcomes without resetting search, filters or pagination.
- Unsubmitted input sections stay pending and cannot produce completed results; manual cohort publication waits for all present students to complete evaluation.


## 2026-10-23 - Floating blueprint checklist
- Replaced the permanent allocation guide sidebar with a floating checklist containing live allocation progress, expandable remaining questions and the quick guide. The allocation table uses the available width; Add retains the existing allocation behaviour.

## 2026-10-23 - Quick guide suggestions shortcut
- Added a Suggestions button in the Quick Guide row that opens the existing unallocated-question checklist.

## 2026-10-23 - Suggestions access
- Removed the floating Blueprint checklist launcher; the Quick Guide Suggestions button opens the panel.

## 2026-10-23 - Completion-aware suggestions
- Suggestions starts open for an incomplete blueprint matrix. Both the panel and launcher hide when marks, question counts and competency targets are complete.

## 2026-10-24 - Student management master flow
- Replaced the general directory entry with batch overview, per-batch year tabs, cross-batch student search and reloadable Student Record routes.
- Limited onboarding to First Year and added Tracking IDs, photo handling, import error export and Finish step.
- Added separate year attempts, academic-only undo, latest-decision correction, subject syllabus overrides, bulk legacy setup and read-only Graduated lists.
- Migrates version 1 records without reconstructing missing historic attempts; the first successful write backs up the previous version.


### 2026-10-24 - Student management inline workspace
- Replaced student task drawers and discard popups with inline form workspaces and inline confirmations. Back or Cancel returns to the existing batch/year or student record.
- Grouped academic stage navigation, contextual actions and student directory into one batch workspace.


### 2026-10-24 - Centred student task popups
- Student forms and imports now open as centred modal windows over the current batch or record. Fade and scale entrances replace inline task navigation; no sliding panels.


### 2026-10-24 - Student toolbar cleanup
- Removed the Needs setup shortcut from the search toolbar. Searching for an untracked student still opens their setup view.


### 2026-10-24 - Empty batch deletion shortcut
- Editable empty batch rows now expose a delete icon with a centred confirmation. The save transaction rechecks emptiness, updates the directory and shows a toast. Populated and read-only rows do not offer this shortcut.


### 2026-10-24 - Student actions in page header
- Moved Add Student, Upload Excel and Subjects And Syllabus beside Add New Batch in the page header. Their selected batch, year and permission conditions are preserved; Select All Active remains with the student table.


### 2026-10-24 - Inline batch subjects and syllabus
- Batch academic stages now show a compact Subjects & Syllabus section below their tabs, including empty stages. Per-subject dropdowns save batch defaults immediately with a toast; All Subjects filters the cards. Replaces the page-header syllabus action, preserves individual student overrides, and is read-only without edit permission.


### 2026-10-24 - Show all stage subjects
- Removed the All Subjects filter from the inline syllabus section. All subjects for the selected academic stage remain visible.


### 2026-10-24 - Automatic student joining date
- Joined On is disabled in the student form. New students inherit the selected batch start date; changing destination batch refreshes this date and academic year. Valid batch start dates are allowed for future batches while other date checks remain in place.


### 2026-10-24 - Delete only empty batches from batch workspace
- The batch header shows Delete Batch only for editable batches with zero students across all stages, including graduated and untracked students. The confirmation uses the empty-only deletion command, which rechecks current records before saving.


### 2026-10-24 - Batch table sorting and pagination
- Admission Batches supports sorting by batch, course, student count and start date. Footer adds row totals, selectable page sizes and previous/next page navigation; sorting resets to page one.


### 2026-10-24 - Add batch action placement
- Moved Add New Batch from the page header to the right of Admission Batches. Batch creation remains available to users with edit permission, including when the batch list is empty.


### 2026-10-24 - Student directory introduction and actions
- Added the two-panel Student Management introduction with Add Student and Upload actions. Actions use the selected batch or newest batch from the overview, and are disabled without edit permission or a batch. Add New Batch stays on Admission Batches.


### 2026-10-24 - Header batch action
- The Student Directory card now contains Add New Batch, replacing its Add Student and Upload actions. Removed the duplicate batch creation button from Admission Batches; student onboarding actions now appear in the selected batch First Year table toolbar.


### 2026-10-24 - Admission batch header filters
- Moved the global search and batch selector into the right side of the Admission Batches header on the overview. Selected batch views retain their filter strip.


### 2026-10-24 - Focused batch workspace
- Header introduction, metrics and Add New Batch card appear only on All Batches. Removed the search/filter strip from selected batch views; All Batches returns to the overview and its search controls.


### 2026-10-25 - Add students from directory card
- Added Add Students beside Add New Batch in the overview card. Opens the student form with the newest batch initially selected; users can change the destination batch. Disabled for read-only users or when no batches exist.


### 2026-10-25 - Student page content scrolling
- Student Management scrolls within its page surface while the navbar and sidebar remain fixed. Viewport-sized batch grid continues to account for the content scroll position.


### 2026-10-25 - Revert content-only scrolling
- Reverted the preceding content-only scroll change at user request, restoring the previous shell and page scrolling behaviour.


### 2026-10-25 - Select batch before entering student details
- Add Student opens with no destination batch selected. Other fields, photo upload and Save Student stay disabled until a valid batch is selected; batch selection fills the joining date and academic year. Edit Student remains unchanged.


### 2026-10-25 - Batch workspace browser navigation
- Batch selection, academic stages, search results and All Changes now create browser history entries. Back and Forward restore batch, year and view while clearing stale row selection and transient popups. App owns history writes.

### 2026-10-25 - Batch header navigation
- Removed the All batches button from the batch header; the page Back and Forward arrows handle navigation history.

### 2026-10-25 - Consolidated student selection
- Removed the separate Select all active button. The table header now selects active students in the current batch/year and toggles to Unselect all. Inactive students remain individually selectable; promotion eligibility is unchanged.

### 2026-10-25 - Batch title return button
- The batch title is now a back-arrow button that opens the Admission Batches table using the existing workspace navigation history.

### 2026-10-25 - Collapsible batch syllabus
- Subjects & Syllabus now starts collapsed. Its header toggles the subject controls and resets closed when switching batch or academic stage. Saved syllabus values remain unchanged.

### 2026-10-26 - Simplified student selection toolbar
- Removed Not promoted and Delete selected from the bulk selection toolbar. Promotion/completion and Clear remain available. Individual row deletion remains available.

### 2026-10-26 - Floating student selection actions
- Selected count, promotion/completion and Clear now appear in a bottom floating card centred within the student table content width. The card hides when selection clears and bottom space protects table content.

### 2026-10-26 - Movable selection card
- Added a mouse/touch drag handle and keyboard arrow movement to the selection card. Movement stays within the visible content area; Home resets its position. Clearing selection resets the card for next use.

### 2026-10-26 - Batch header student actions
- Moved Add Student and Upload Excel from above the student table to the batch header before Undo Last Change and All Changes. Existing first-year, permission and selection visibility rules remain in place.

### 2026-10-26 - Undo action in change history
- Moved Undo Last Change from the batch header into the All Changes view beside Change list. Existing undo eligibility, edit permissions and confirmation remain unchanged.

### 2026-10-26 - Student table pagination footer
- Added an always-visible student count and pagination footer with 5/10/20/50 rows per page (default 10). Page-size changes reset to page one; sorting still precedes pagination and selection remains scoped to the batch/year.

### 2026-10-26 - Change note popup
- Replaced expanded note blocks with a note icon beside the student count. Click opens the shared floating tooltip; outside click, Escape or a second click dismisses it without toggling the history card.

### 2026-10-26 - Latest change review card
- Replaced the standalone undo action with a Latest change card containing affected students, saved before/after academic values, timestamp, note and undo availability. Existing confirmation remains. New progression records preserve an after snapshot; older records use current values only while revisions still match, otherwise unavailable details are identified explicitly.

### 2026-10-26 - Collapsible latest change
- Latest Change now starts collapsed. Its header expands the academic comparison and undo action, while the note remains independently accessible.

### 2026-10-26 - History header cleanup
- Removed Year List from the history header. Academic stage tabs and browser history remain available for returning to the student list.

### 2026-10-26 - History collapsed by default
- All individual change-history cards now start closed, matching the Latest Change card. Each header expands its own details on demand.

### 2026-10-26 - Visible students needing setup
- Added a batch-scoped Needs setup tab so untracked students included in totals are accessible. Batches with only untracked students open this tab automatically. Setup lists and bulk setup are scoped to the selected batch.

### 2026-10-26 - Return from student profile to year list
- The profile return button now opens the student's batch and academic stage (or Needs setup), rather than the admission-batch overview. App records the destination in navigation history.


## 2026-10-26 - Promotion review
- Promotion now suggests a compatible academic year and start date from the end date, shows the destination stage and student count, and validates fields before enabling Promote students. A different start date remains optional; manual dates are preserved when the end date changes.


## 2026-10-26 - Import destination selection
- Upload students now offers editable destination batch and academic year dropdowns. Preview revalidates against the selected destination; later academic years require the existing earlier-batch reason. Imports remain First Year only.


## 2026-10-26 - Batch-linked import academic year
- Upload students now derives academic year from the destination batch and offers only that year. Removed later-year selection and its earlier-batch reason fields from this flow.


## 2026-10-26 - Six-column student import
- Sample and error spreadsheets use Student ID, Student Name, Email, Code, Phone No and optional SGT. Blank SGT defaults to N/A; the other five values are mandatory. Course, joining date, batch and academic year come from the selected batch; Department defaults to N/A and admission stays First Year.


## 2026-10-26 - Excel analysis before preview
- Upload now shows an analysing state for at least 30 seconds and waits for validation before revealing results. Cancel aborts pending results; Import remains disabled until a valid preview is ready.


## 2026-10-26 - Two-step Excel upload
- Step 1 contains destination selection, template download and timed analysis. Analysis completion opens Step 2 with validation results, error download and Import. Back to upload clears the preview for a replacement file.


## 2026-10-26 - Original workbook with Errors sheet
- Error download now preserves the uploaded workbook and adds/replaces an Errors sheet with original row, student identity, field and message. Re-upload ignores Errors and reads the original student sheet. The source file is not overwritten.


## 2026-10-26 - Separate valid and invalid Excel rows
- Error downloads now put valid student rows in the first sheet and invalid rows with all six input fields and messages in Errors (second sheet). Re-upload combines both for fresh validation; prior message-only reports remain ignored.

## 2026-10-27 - Standard IDs and reference lookup (MED-19)
- Creating an assessment/question/skill/blueprint issues a temporary display ID; first assignment, publication or approval issues its permanent ID without changing internal links.
- Profile menu opens the ID guide. Question Bank and My Questions support ID lookup; Question Bank supports ID sorting and history.
- Assessment History lets faculty send published assessment-owned questions for Question Bank approval, retaining their AQ provenance and issuing a separate QB ID on approval.


## 2026-10-27 - Compact ID guide
- ID guide keeps its overview visible and groups type-specific explanations in collapsed, keyboard-accessible sections. The header remains visible while the content scrolls.

## 2026-10-27 - Faculty approval queue (MEDUI-5)

- Approval Queue now starts with faculty selection, status/type filters and an optional oldest-first view across faculty. Reviewed requests remain accessible.
- Opening a request marks its current submission seen; the sidebar and mark-all action share the same new-request state.
- Question and skill decisions require confirmation; all rejections require remarks. Withdrawn question rows are excluded from review and an all-withdrawn request can be closed.
- Assessment approval returns to the queue after publication confirmation. The queue is now available on phones. Assessment results keep the existing publication flow.
- Archive/delete/restore, new author withdrawal actions and automatic returns await the referenced lifecycle specification.

## 2026-10-27 - Approval queue specification corrections

- Show each question separately in faculty queues and preserve its own outcome tab; open the original submission focused on that question.
- Opening faculty clears unseen badges while keeping New tags until leaving. Completed reviews return to Approval Queue.
- Pending questions automatically return to author Draft after 14 days in the local mock; production requires a server deadline job. Assessment results retain their existing publication flow.


## 2026-10-27 - Hide empty approval type filters
- Approval Queue shows only request types with results in the current faculty/status/search context. A type that becomes empty resets to All; an entirely empty result hides the type row. Status tabs remain available.


## 2026-10-27 - View all approval requests
- Replaced the oldest-first checkbox with View all. It opens the existing all-faculty request view; selecting a faculty returns to that faculty. Existing ordering is preserved.

- Approval queue decision notifications: successful decisions create a persistent per-viewer faculty badge. Opening the card targets unseen Approved/Returned results; only viewed decision results are acknowledged. Existing decisions without notification versions are not flagged.

## 2026-10-28 - MEDUI-4 in-app demo walkthroughs

- Added a persistent Demos dock with page suggestions, library, video playback and Go there navigation across supported pages.
- Added viewer-specific Demo videos controls in the profile menu and library; exams, unsupported mobile screens and sign-out stop playback.
- Added replay/resume and next-unwatched flow based on actual playback coverage for the two supplied Medsy video series.
