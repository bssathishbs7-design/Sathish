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
