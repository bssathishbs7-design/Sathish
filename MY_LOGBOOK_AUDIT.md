# My Logbook: UI/UX audit and proposed plan

Date: 26 September 2026  
Status: Plan only. No application implementation changes made. Proposed work requires approval by item or package.

## 1. Assessment

My Logbook already supports a substantial student workflow: subject/category selection, schema-driven entry forms, drafts, faculty assignments, submission, comments, personal notes, corrections, linked remedial attempts, competency progress, and final subject approval.

The most urgent findings concern **remedial integrity and trustworthy progress**. The subject-level remedial shortcut can create an unlinked entry; a genuinely linked remedial can change competency and still clear the original warning; and a learner-entered draft can change the displayed certification requirement. Navigation continuity, final-submission discoverability, mobile content priority, and accessible feedback also need attention.

Recommended direction: preserve the connected learner/faculty model and the three-step form. Correct lifecycle inconsistencies first, then simplify working views and unify feedback, accessibility, and Medsy styling. Academic policy and production access rules must be confirmed rather than inferred.

## 2. Students, goals, and journeys

| Goal | Current journey | Main audit concern |
|---|---|---|
| Record a learning experience | Create entry → Subject/category → Details → Faculty verification | Accurate requirements, understandable saving, convenient evidence capture |
| Resume unfinished work | Dashboard / All entries → Draft → Edit → Submit | Preservation of input and navigation context |
| Complete an assigned task | Assigned to you → Complete entry → Submit | Deadline visibility and locked faculty-supplied fields |
| Respond to faculty feedback | Returned entry → Correct/resubmit or linked remedial | Correct linkage, visible feedback, clear distinction between correction and a new attempt |
| Monitor progress | Dashboard → Subjects → Subject skills/entries | Distinguishing entry approval, skill certification, and final subject approval |
| Complete a subject logbook | Subject → Approval details → Confirm submission | Discoverability, readiness explanation, and next approver |
| Discuss or annotate an entry | Entry detail → Personal notes / Comments | Clear privacy, persistence, and delivery feedback |

Assumed usage: students record experiences between teaching or clinical activities, often on phones, and later review feedback on a larger screen. This is a working assumption, not a user-research result.

## 3. Audit coverage and evidence

### Completed

- Inspected `/logbook`, App-owned navigation/account state, Dashboard, Subjects, subject detail, All entries, Profile, creation/editing, assignments, entry detail, comments, remedial handling, final approval, services, schemas, and relevant shared styles.
- Checked **seven views/states at six widths**: Dashboard, Subjects, General Medicine subject detail, All entries, Profile, new-entry drawer, and entry-detail drawer at **1440, 1366, 1024, 768, 390, and 320 CSS pixels**, with 900px height: **42 layout checks**.
- Additional interaction checks used **390 × 844**, **1024 × 768**, and **1366 × 768**, including a collapsed sidebar.
- Exercised ordinary entry submission, field validation/focus, implicit draft saving on close, search/back behaviour, both remedial entry points, linked submission and original-record navigation, assignment field locks, personal-note persistence, final subject submission, pending-entry withdrawal, category-change protection, oversized attachment rejection, and a simulated storage-quota failure.
- Reviewed light/dark dashboard and form screenshots, selected computed styles, and reduced-motion behaviour.
- Used isolated browser data and temporary fixtures for assignments and final approvals. Cleaned up those browser fixtures afterwards; no existing user browser records were used.
- Ran the four existing Logbook service test files: **17 passed, 0 failed**.
- Built the current application successfully. Large shared JS/CSS bundles and an ineffective dynamic import remain warnings.
- Reproduced two integrity problems with in-memory service probes, without writing application data: a different-competency remedial was accepted, and a draft changed a subject's requirement total.

```text
node --test --test-isolation=none src/services/adminLogbook.test.js src/services/logbook.test.js src/services/logbookFlow.test.js src/services/logbookCatalog.test.js
npm run build -- --outDir .logbook-check.local/my-audit-build
```

### Strengths to preserve

- No page-level horizontal overflow was detected in the 42 default layout checks; sampled drawers also fit their widths.
- Ordinary student submission successfully creates a Pending record and gives a success message.
- Empty required fields show associated errors and focus the first invalid field.
- Changing category warns before removing incompatible entered information.
- A failed draft save preserves the open form and entered content; oversized-photo errors are announced and focused.
- The dedicated dashboard remedial flow creates the correct parent link, and its original-record link works.
- Personal notes save on normal drawer close; focus returns to an existing entry trigger.
- The shared modal uses native dialog focus containment; forms have a persistent footer, searchable grouped selectors, and disabled save states.
- The verification chart supports keyboard arrow navigation, visible values, and a live hint. Reduced-motion mode suppresses the creation-button pulse.
- Subject approval shows its approver chain and updates after submission.

### Limits

This is a source-backed Chromium audit, not certification across every browser or state. Physical iOS/Android, Safari/Firefox, screen readers, 200% zoom, forced colours, all dark/OLED/density combinations, sustained slow networks, realistic institutional data volumes, and every category form require acceptance testing. Existing tests cover category/schema rules, but every category was not manually completed in the browser.

No live backend or approved institutional policy was supplied. Policy questions are separated from confirmed defects. Build success and a lack of horizontal overflow do not establish visual or production acceptance.

Local evidence: [layout measurements](.logbook-check.local/my-audit/layout.json), [workflow observations](.logbook-check.local/my-audit/interactions.json), [edge-case observations](.logbook-check.local/my-audit/edge-checks.json). Representative screenshots are linked below.

## 4. Findings and proposed improvements

Evidence: **R** = reproduced in browser; **S** = verified in source; **E** = reproduced in an isolated service probe; **P** = policy/input needed. Priority reflects impact on this student workflow. “Critical before deployment” is a conditional integration blocker, not a claim about an existing deployed backend.

### A. Lifecycle integrity and trustworthy progress

| ID / Priority | Issue identified | Proposed improvement | Rationale | Expected impact |
|---|---|---|---|---|
| A01 — High | **R/S:** General Medicine shows IM1.1 as “Remedial due”, but its **Log attempt** action opens “New logbook entry” and saves a record without `linkedTo`. The dashboard's **Log remedial** action correctly links to the returned record. | Resolve the appropriate outstanding returned attempt from every entry point; offer “Continue remedial” for an existing draft. If a separate ordinary attempt remains allowed, make that choice explicit. | The same learning task should not acquire different lifecycle meaning depending on where it starts. | Remedial submissions consistently satisfy the intended follow-up. |
| A02 — High | **R/S/E:** The linked remedial form leaves competency editable. A probe submitted IM1.2 as a child of returned IM1.1; the service accepted it and `awaitingRemedial` for IM1.1 became false. | Lock the linked competency identity, validate it against the parent in the service contract, and reject mismatched children when calculating resolution. Define treatment of any existing mismatches. | A different competency cannot serve as evidence that the original remedial activity was completed. | Reliable remediation and progress without false clearance. |
| A03 — High | **R/S/E/P:** “Number required to certify” is learner-entered and initially blank even for a configured skill. `collectSkills` uses entry values, including drafts, to raise the target. Adding a draft with IM1.1 `numReq=99` changed General Medicine's total required attempts from **5 to 101**. | Confirm the authority for requirements. Derive targets from institution/faculty configuration; show the applicable requirement read-only to students. Keep any historical declared value separate from the current target. | A draft should not silently redefine completion expectations. | Stable, credible progress and less unnecessary data entry. |
| A04 — High | **R/S:** Ready/Returned final subject approvals are not included in Dashboard “Needs action”; that calculation only sees entry drafts, assignments, and returned entries. Final submission is available only inside subject approval details. | Surface final-submission/returned-logbook tasks in the student's action summary, with explicit subject links and counts distinct from entry counts. | A student can have an important unfinished action without the dashboard showing it. | Better completion of the final approval journey. |
| A05 — Medium | **S:** “Recent activity” sorts by `updatedAt`, `submittedAt`, or activity date; new faculty decisions and comments do not update those timestamps. It displays the activity date rather than the event that made the record recent. | Define “Recent activity” as actual events or rename it to “Recent entries”. Prefer a consistent last-activity timestamp and label the event/date. | Students return chiefly to find new feedback and decisions. | Fresh feedback is easier to discover and chronology is understandable. |
| A06 — Critical before live deployment | **S/P:** Accounts are preview identities, records/evidence are localStorage data, and Profile exposes sample reset. Service comments explicitly describe a prototype rather than authenticated production storage. | Separate preview tooling from live UI. Specify authenticated ownership, durable saving/uploads, server-side transition rules, conflict revisions, and privacy/access policies for notes and comments. | Frontend identity selection and browser persistence cannot establish production ownership or durable storage. | A clear backend handoff boundary and honest production-readiness criteria. |
| A07 — High, policy-dependent | **S/R/P:** Approved attempts, logged category coverage, certified skills, faculty readiness, and final approval have different rules. A Ready fixture with **1/2 skills certified** could submit for final approval. Pending entries remain editable, and final approval references live records rather than a fixed evidence snapshot. | Agree discretionary versus mandatory readiness, permitted Pending edits, and the evidence cutoff/late-entry policy. Explain each measure and enforce only the approved rules. | A status label should have an agreed academic meaning; the audit must not invent stricter requirements. | Consistent student/faculty expectations and defensible approval records. |
| A08 — High | **S:** Unsaved entry edits, personal-note edits, and comment drafts live in React state. Notes save on drawer close, and comment drafts survive normal drawer reopen, but there is no Logbook reload/unload recovery mechanism. | Adopt an explicit persistence model: recoverable draft edits, saved/unsaved status, and protection when leaving with unsaved changes. Keep draft comments separate from posted comments. | A reload or interrupted session bypasses the normal close-saving path. | Reduced loss of student work and predictable recovery. |

### B. Navigation, discovery, and working layouts

| ID / Priority | Issue identified | Proposed improvement | Rationale | Expected impact |
|---|---|---|---|---|
| B01 — High | **R/S:** The repeated introduction and creation panel consume roughly the first 560px on a 390px phone. All entries starts near the bottom of the first screen; actionable dashboard records follow the verification chart. See [mobile dashboard](.logbook-check.local/my-audit/Dashboard-390.png) and [All entries](<.logbook-check.local/my-audit/All entries-390.png>). | Use a compact header/action on working views and prioritise time-sensitive student tasks before secondary summaries on mobile. Retain an obvious creation action. | Completing work should not require scrolling past the same introduction on every view. | Faster access to assignments, feedback, and records. |
| B02 — Medium | **R/S:** Every subview remains at `/logbook`. Refresh returns to Dashboard; native browser history cannot represent subject/detail navigation. Custom history is in memory and capped at ten entries. | Encode supported view, subject, and filter state in the App-owned URL/history model, following the existing platform approach. Define drawer-link behaviour separately. | Users need reliable refresh, back/forward, and shareable return points. | Less lost context and more robust navigation. |
| B03 — Medium | **R/S:** Search in All entries is lost after switching to Subjects and using in-app Back. Subject category/query state also remounts. Navigation has no deliberate destination-focus/scroll policy. | Retain list/search/category state and restore useful scroll position; focus the destination heading when changing workspaces. | Returning to a task should restore the context the user left. | Less repeated filtering and clearer keyboard orientation. |
| B04 — Medium | **R/S:** All entries follows underlying array order: sample records are not newest-first, while added records are prepended. There is no explicit sort, subject/date filter, or one-action filter reset. | Use a documented default order and concise sorting/filter controls based on actual student needs, with visible active filters and Clear. | As records grow, the current mixed ordering becomes difficult to predict. | Faster retrieval and consistent result ordering. |
| B05 — Medium | **S:** Subject category choices are filtered to nonzero counts. Valid but unused categories disappear. In All entries a category silently falls back to All when search/status removes it, then can reappear as active when matches return. | Keep the distinction between available categories and categories containing matches clear. Show empty/zero-count options where useful and make filter reset/fallback explicit. | Navigation should not silently change the user's selection or hide ways to start logging. | Predictable filtering and easier first use of a category. |
| B06 — Medium | **R/S:** Assignments appear both in “Assigned to you” and “Needs your action”. The first section renders every assignment, and tasks are not prioritised by deadline. The completion form shows instructions and locks but omits the due date. | Consolidate task presentation or make each section's purpose distinct; sort by urgency and retain deadline/context in the completion form. | Duplicate tasks and missing due context increase scanning and uncertainty. | A clearer student work list and better deadline awareness. |
| B07 — Medium | **R/S:** The sidebar says “My Logbook”, the title/breadcrumb says “Logbook”, and the eyebrow says “My Skills”. Profile is an icon in the creation panel, separate from the shell account menu. Programme, batch, and posting come from one static sample for every selected learner. | Standardise naming and sentence case, make Profile discoverable in a suitable location, and obtain profile details from the selected learner's data shape. Clearly label preview-only data. | Students should understand where they are and whose information is being shown. | More coherent navigation and trustworthy identity context. |
| B08 — Medium | **S/R:** A new/empty subject offers a generic empty message without a contextual add action; several subjects say “Requirements not configured” without a next step. Unknown competency requirements can render as `0/0` in skill details. | Provide distinct states for no entries, no matches, no configured requirements, and completed work. Use contextual “Add entry”, “Clear filters”, or a clear explanation of who configures requirements. | Empty, unavailable, and complete are different conditions. | Better first-use guidance and fewer apparent dead ends. |

### C. Forms, evidence, and interaction feedback

| ID / Priority | Issue identified | Proposed improvement | Rationale | Expected impact |
|---|---|---|---|---|
| C01 — Medium | **R/S:** Selecting a subject/category and pressing Escape on a new entry automatically saved an otherwise empty draft with “Changes saved”. Editing an existing entry instead prompts to keep/discard changes. The close control does not communicate this difference. | Choose and explain a consistent model: explicit Save/Discard, or visible autosave with a clear saved state and discard option. Avoid accidental empty drafts where possible. | Closing should have a predictable meaning. | Less draft clutter and fewer surprises without losing useful autosave protection. |
| C02 — High | **R/S:** The dashboard's remedial action opens the form directly but does not show the original faculty feedback or an original-record reference there. The student must remember what needs correcting. See [mobile remedial form](.logbook-check.local/my-audit/remedial-mobile.png). | Show the original decision, feedback, competency identity, and a read-only original-record disclosure within the correction/remedial form. | The purpose of a remedial attempt is to address that specific feedback. | More accurate corrections with fewer navigation steps. |
| C03 — Medium | **R/S:** Final entry submission asks students to confirm accuracy while the detail section is collapsed to a short activity label. Read-only faculty grading fields occupy substantial vertical space in the student details step. See [submission step](.logbook-check.local/my-audit/form-submit.png). | Add a concise review summary of meaningful submitted fields and evidence before acknowledgement. Present future faculty grading as a compact explanatory disclosure. | Confirmation is more useful when the student can see what they are confirming. | Fewer submission mistakes and a cleaner student form. |
| C04 — Medium, requirements-dependent | **R/S/P:** Evidence accepts only three JPG/PNG/WebP images at 300KB each; oversized files are rejected without resizing. The form lists filenames without previews, and detail images have no enlarge action. | Confirm intended evidence types and limits. For ordinary phone photos, offer bounded resizing/compression or a usable upload service, previews, removal, and accessible enlargement. Define allowed patient-identifying content before live use. | The current restriction creates preparation work outside the app and makes detailed evidence hard to inspect. | More practical evidence capture and review. |
| C05 — Medium | **R/S:** Withdraw changes into “Confirm removal” for only four seconds, then reverts. It deletes the entry rather than returning it to Draft. After confirmed removal, the focused trigger disappears and focus falls to BODY. | Explain whether withdrawal deletes or recalls an entry; confirm with persistent contextual controls or a recoverable action. Restore focus to the list/next record after removal. | The consequence and confirmation window should not be ambiguous or time-sensitive. | Safer removal and uninterrupted keyboard use. |
| C06 — Medium | **R/S:** Comment/final-submission success is sent to a page toast behind the open modal and auto-dismisses after 4.5 seconds. The dialog's status may update, but its dedicated success message is outside the active interaction context. | Show and announce success/error within the active drawer; preserve longer-lived confirmation for consequential submission. Keep page-level feedback for closed-drawer outcomes. | Students need to know that a post or submission succeeded without closing the drawer to check. | Clearer completion feedback and fewer repeat actions. |
| C07 — Medium | **R/S:** Corrupt saved JSON displays a raw parser error and only Reload. Reload repeats the same failure. Unlike Admin Logbook, this learner page correctly suppresses content and disables creation. | Preserve that safe failed state, replace parser text with a useful message, and provide an explicit non-destructive recovery/support path. Never automatically reset student records. | Repeating a permanent local-data failure is not recovery. | Understandable errors without risking saved work. |
| C08 — Medium | **S:** Main-page loading is handled, but the separately loaded subject workflow initially uses the “Faculty will mark this subject ready” fallback before its request resolves. Local immediate storage masks latency and stale-response cases. | Give subject approval its own loading/unavailable state; use cancellable or versioned refreshes and typed service errors when integrating APIs. | Absence of a response is not evidence that faculty have not marked a subject ready. | Accurate status messaging on real networks. |

### D. Visual consistency, accessibility, and delivery quality

| ID / Priority | Issue identified | Proposed improvement | Rationale | Expected impact |
|---|---|---|---|---|
| D01 — High | **R/S:** The learner form's primary button uses 13px white text on `rgb(15,159,143)`, approximately **3.29:1** contrast. This is the same shared accent-fill problem found in the Admin audit. | Use Medsy semantic brand/text pairs with at least 4.5:1 for ordinary small text. Check link-like actions, helper text, hover/focus, and portal themes together. | Core submission controls must be readable, not just visibly colourful. | Stronger accessibility and clearer primary actions. |
| D02 — Medium | **R/S:** Verification charts use blue for Pending and amber for Returned, while entry badges use amber for Pending and coral for Returned. Teal accents and several card tones compete with forest as the main action colour. | Establish one semantic status map across charts, lists, drawers, and the Admin handoff, with text labels retained. | Status should not change its visual meaning between views. | Faster recognition and a calmer, consistent interface. |
| D03 — Medium | **R/S:** Navigation and recent-category controls are small; much metadata is 11–12px. Long activity titles in All entries and recent/action rows truncate, and a full title may require opening the record or hover. | Increase principal mobile hit areas towards 44px, give essential text room to wrap, and reserve micro text for secondary details. Provide full labels without relying only on hover. | Viewport fit does not guarantee readable, usable controls. | Easier touch use and better identification of similar records. |
| D04 — Low | **R/S:** The creation CTA pulses indefinitely when unfocused; the surrounding panel lifts and shows a pointer cursor even though only its buttons act. Reduced-motion mode correctly disables the pulse. | Use a restrained entrance/hover response; remove the continuous attention cue and false whole-panel click affordance. Preserve reduced-motion support. | Persistent motion competes with students' actual tasks. | A calmer, more precise premium feel. |
| D05 — Medium | **S/R:** The module inherits OSPE/My Skills/activity styles and late overrides. Some buttons use rounded rectangles despite the guide's pill rule; theme semantics are re-aliased to activity tokens. | Consolidate module styles around Medsy's canonical tokens and component contracts, with narrowly scoped changes and learner/Admin regression checks. Audit light, dark, OLED, and density only within confirmed support scope. | The final cascade, rather than one component stylesheet, determines appearance. | More consistent styling and fewer accidental regressions. |
| D06 — Medium | **S:** Lists, assignment cards, comments, and skill attempts render full collections and repeatedly scan arrays. No pagination or progressive loading contract exists. | Establish realistic volumes; add stable sorting/pagination or progressive disclosure where needed and define corresponding service parameters. | The sample's few entries do not test a multi-year logbook. | Predictable performance and manageable navigation at scale. |
| D07 — Medium | **S/R:** Default samples lack assignments and final-approval stages; most seeds lack realistic submission/decision history. Important states required temporary audit fixtures to inspect. | Add deterministic mock scenarios for assignments, Ready/Returned/Completed approvals, comments, long records, empty results, delay, and failure. Keep realistic sample content available by default. | Designers, testers, and backend engineers need repeatable access to the complete workflow. | More reliable QA and a smoother handoff. |
| D08 — Medium, shared dependency | **R/S:** The build passes but emits about **2.63MB JS** and **2.74MB CSS** before compression. The Logbook service's dynamic import is ineffective because the module is also statically imported. | Scope route-level code/style loading and performance measurement as shared-platform work, separate from local visual fixes. | Bundle cost affects entry to My Logbook but is not solely caused by this module. | A measurable performance plan without broad, unapproved refactoring. |

## 5. Open questions

1. **Remedial policy:** Should every attempt started from “Remedial due” be linked to the returned competency, and can a student also record a separate ordinary attempt? Proposed default: linked/continue-remedial is primary; a different competency cannot resolve the original.
2. **Requirement authority:** Who sets the required attempts for certification? May students ever declare a target, or must it always come from the institution/faculty? This determines A03.
3. **Readiness and evidence:** Is faculty judgement allowed to override incomplete requirements? Do final approvers sign a fixed submission snapshot? How should late entries and post-submission edits behave? Coordinate with the Admin audit before changing shared rules.
4. **Saving and withdrawal:** Prefer visible autosave or explicit Save/Discard for entry drafts? Should “Withdraw” delete a Pending entry or recall it to Draft? Should personal notes be autosaved, and who is permitted to read them?
5. **Evidence:** Which formats, size limits, image detail, patient-reference rules, and retention requirements are needed? Is evidence enlargement/export a requirement?
6. **Curriculum/profile:** What supplies student programme, cohort, posting, allowed subjects/categories, competency codes, and required reflection fields? Current catalogues are samples; no new academic requirements are inferred.
7. **Scale/support:** Expected entries per student, comments/attachments per entry, supported devices/browsers, and whether OLED/compact density are required for this release?
8. **Optional capabilities:** Are PDF/export, reminders, a request-readiness action, or editable posted comments required? They are not assumed additions to this plan.

## 6. Assumptions and missing requirements

### Assumptions

- Scope is the learner `/logbook` experience and directly connected faculty handoffs. Admin redesign and unrelated platform pages are excluded.
- Keep Dashboard, Subjects, All entries, Profile, and the three-step form unless a specific navigation change is approved.
- Preserve assignment locks, signed-record protections, the distinction between editable corrections and remedial attempts, sample data, and per-account comment read indicators.
- Medsy is the visual authority. Changes to shared components must preserve both student and faculty use.
- Browser fixtures and isolated service probes are audit evidence only, not product changes.

### Missing requirements

- Authoritative academic rules: competency identity, required attempts, reflection requirements, override authority, readiness, and signature evidence cutoff.
- Authentication/ownership, faculty visibility, personal-note privacy, comment correction, and evidence data policy.
- Backend contracts for record versions, conflicts, upload references, pagination, errors, retries, and offline/recovery behaviour.
- Real student profile/curriculum datasets, expected workloads, and platform/browser accessibility support targets.
- Confirmed scope for export, reminders, submission receipts, and optional evidence tools.

## 7. Technical constraints and shared dependencies

- `App.jsx` owns learner navigation and shell state. Improve its existing model rather than introducing a separate router casually.
- Entry form/detail, drawer, subject cards, sign-off, status styles, and services are shared with Admin Logbook. Coordinate overlapping fixes with [the Admin Logbook audit](ADMIN_LOGBOOK_AUDIT.md), particularly contrast, approval rules, and API boundaries.
- `logbookSchemas.js` determines category fields; `logbookCatalog.js` provides sample skills; `logbookProgress.js` and `logbook.js` calculate different progress measures. Requirements should have one agreed authority before calculation changes.
- Storage saves are immediate and local. Existing stale faculty-decision checks are useful, but do not replace server revisions or asynchronous conflict handling.
- The current shell persists `vx-theme`; the project guide describes `medsy-theme` and HTML attributes. A theme-storage/OLED/density migration is shared-shell work and requires explicit scope.
- The baseline build warnings concern the application bundle. No device-speed or network-performance improvement is claimed from source inspection alone.
- No application source, dependency, or flow-change log was modified. Existing Blueprint edits and the Admin audit document were left intact.

## 8. Proposed implementation packages — not yet authorised

| Package | Finding IDs | Reviewable outcome |
|---|---|---|
| 1. Correctness and student completion | A01–A04, C02, D01 | Consistent linked remedials, protected competency identity, authoritative targets, discoverable final actions, readable primary controls. A03 requires the requirement-policy decision first. |
| 2. Navigation and responsive working views | B01–B08, D03–D04 | Compact mobile workspaces, retained navigation/filter context, predictable record order, useful empty states, clearer tasks and labels. |
| 3. Saving, evidence, and feedback | A05, A08, C01, C03–C08 | Clear saving/recovery behaviour, usable evidence workflow, explicit confirmation, in-context feedback, robust loading/error states. |
| 4. Policy, integration, and consistency | A06–A07, D02, D05–D08 | Approved lifecycle/access contracts, shared status/theme alignment, realistic fixtures, and separately scoped scale/performance work. |

Approve individual IDs or selected packages. Policy-dependent items remain blocked on their specific decisions; they do not prevent independent approved visual/correctness work. Actual navigation or step-sequence changes should be recorded in the root flow-change log only when implemented.

## 9. Acceptance checks for approved work

- Starting or continuing a remedial from any supported entry point uses the intended parent; changing competency cannot clear another competency's warning.
- Saving a draft does not change institutional requirement targets. Logged activity, approved attempts, certified skills, readiness, and final approval have explicit, consistent meanings.
- Students can create, save/recover a draft, complete a locked assignment, submit, inspect feedback, correct/resubmit, complete a linked remedial, and submit a ready subject logbook.
- Final-action counts include the approved set of tasks and lead to exactly those tasks; assignment deadlines remain visible during completion.
- Refresh and navigation retain supported context; back/forward, search, filters, ordering, focus, and scroll behave deliberately.
- Validation identifies and focuses the relevant fields. Save/upload failure preserves work; comments and submissions provide feedback inside the active drawer.
- Normal close, Escape, explicit discard, reload, failed save, deleted triggers, and external updates have defined data/focus outcomes.
- Verify layouts at 320/390, 768, 1024/1366, and 1440+ widths, with long names, full evidence, extended comments, empty/full lists, expanded/collapsed sidebar, and small-height mobile drawers.
- Verify keyboard navigation, searchable selectors, chart interactions, error announcements, a screen reader, zoom, contrast, focus restoration, and reduced motion. Test light/dark and any other explicitly supported theme/density.
- Re-run existing service tests/build; add targeted regressions for the approved integrity fixes and browser journeys. Passing the build alone is not visual acceptance.
- Preserve the learner/faculty handoff and avoid unapproved academic rules, permission changes, new packages, or unrelated UI changes.

## 10. Source map

- Learner orchestration and remedial entry points: [LogbookPage.jsx](src/pages/LogbookPage.jsx)
- Shell navigation/account state: [App.jsx](src/App.jsx)
- Dashboard task and recent-activity selectors: [LogbookDashboard.jsx](src/components/logbook/LogbookDashboard.jsx)
- Lists, filters, profile, sample reset: [LogbookViews.jsx](src/components/logbook/LogbookViews.jsx)
- Subject progress and Log attempt: [LogbookSubjectDetail.jsx](src/components/logbook/LogbookSubjectDetail.jsx)
- Form state, saving, validation, attachment limits: [LogbookEntryForm.jsx](src/components/logbook/LogbookEntryForm.jsx)
- Searchable selector and step accessibility: [LogbookPicker.jsx](src/components/logbook/LogbookPicker.jsx), [LogbookAccordionSection.jsx](src/components/logbook/LogbookAccordionSection.jsx)
- Notes, comments, withdrawal, and original links: [LogbookEntryDetail.jsx](src/components/logbook/LogbookEntryDetail.jsx)
- Assignments and final submission: [LogbookStudentWorkflow.jsx](src/components/logbook/LogbookStudentWorkflow.jsx), [LogbookSignoff.jsx](src/components/logbook/LogbookSignoff.jsx)
- Entry service and state transitions: [logbook.js](src/services/logbook.js), [adminLogbook.js](src/services/adminLogbook.js)
- Progress and remedial calculations: [logbookProgress.js](src/services/logbookProgress.js), [logbookPeople.js](src/services/logbookPeople.js)
- Sample requirements and forms: [logbookCatalog.js](src/services/logbookCatalog.js), [logbookSchemas.js](src/services/logbookSchemas.js), [logbookSample.js](src/services/logbookSample.js)
- Shared styling: [LogbookPage.css](src/pages/LogbookPage.css), [LogbookEntryForm.css](src/components/logbook/LogbookEntryForm.css), [LogbookDashboard.css](src/components/logbook/LogbookDashboard.css), [LogbookStatus.css](src/components/logbook/LogbookStatus.css), [activity-visual-tokens.css](src/styles/activity-visual-tokens.css)
