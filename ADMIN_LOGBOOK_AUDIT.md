# Admin Logbook UI/UX audit and proposed plan

Date: 26 September 2026  
Status: Review only. No application implementation changes made. Every proposed change remains subject to approval.

## 1. Overall assessment

Admin Logbook has a useful foundation: connected learner/faculty records, department-aware review actions, grouped queues, individual skill grading, assignment handoff, and a separate final-approval chain. Its main weakness is that the interface does not consistently prioritise the faculty member's immediate task or preserve the meaning of the information they select.

The highest-impact confirmed problems are a dashboard count-to-results mismatch, misleading zero counts after a loading failure, review controls below a large comments area, insufficient contrast on small primary controls, and excessive repeated page chrome on mobile. Production readiness also depends on resolving approval policies and replacing the explicitly local prototype identity/storage layer.

Recommended direction: retain the existing sections and connected workflows initially; improve task hierarchy, data consistency, navigation continuity, accessible controls, and feedback together. Do not merge sections, change readiness rules, or expand permissions without an explicit decision.

## 2. Intended users and journeys

| User | Main goal | Current journey audited |
|---|---|---|
| Department faculty | Clear assigned reviews and give useful feedback | Dashboard → Queue → Entry → Approve, return, or reassign |
| Faculty supervising students | Identify gaps and assign appropriate activities | Students → Student → Subject readiness / Entries → Assignment |
| Faculty tracking competency | Distinguish logged activity from successful certification | Subjects / Categories / Skills → Student or entry detail |
| Head of department and final approvers | Inspect evidence and advance or return subject logbooks | Dashboard → Sign-offs → Approval details → Student logbook / Decision |
| Returning faculty user | Recover context and inspect previous decisions | Filters / Search / History → Detail → Back |

Assumed context: frequent short review sessions on laptops, with tablet/mobile access for checking records and taking decisions. This is an assumption, not a validated user-research finding.

## 3. Evidence, coverage, and limits

### Completed checks

- Inspected `/adminLogbook`, its App-owned route/account state, all nine section implementations, shared entry/assignment/sign-off drawers, account preview, service rules, progress calculations, and relevant CSS.
- Loaded Dashboard, Queue, Students, Subjects, Categories, Skills, History, Sign-offs, and Search at **1440, 1366, 1024, 768, 390, and 320 CSS pixels**, each at 900px height: 54 section/viewport combinations.
- Examined representative desktop/mobile screenshots, student/category drill-downs, expanded skills, subject approval-chain configuration, entry review, assignment validation, and final sign-off. Additional mobile drawer checks used 390 × 844; collapsed-sidebar check used 1366 × 768.
- Checked light/dark rendering on the dashboard and assignment drawer; measured selected computed colours and control sizes.
- Reproduced chart/result mismatch, filter loss on return, invalid student URL behaviour, assignment validation inconsistency, corrupt-storage loading failure, and focus loss after a sign-off decision.
- Used an isolated browser profile. A temporary sign-off fixture exercised a state that the default sample does not populate; it was removed afterwards. Existing user browser data was not used.
- Existing Logbook service tests: **17 passed, 0 failed**.
- Baseline production build: **passed**, with large-bundle and ineffective-dynamic-import warnings.

Commands run:

```text
node --test --test-isolation=none src/services/adminLogbook.test.js src/services/logbook.test.js src/services/logbookFlow.test.js src/services/logbookCatalog.test.js
npm run build -- --outDir .logbook-check.local/audit-build
```

### What the evidence does not establish

- No page-level horizontal overflow was detected in the 54 default-section checks. This does not prove every expanded state, long-content case, or real device is free of overflow.
- Ordinary assignment-drawer Escape restored focus to its focused trigger. Native dialog semantics, existing focus styles, disabled mutation buttons, live status messages, and reduced-motion CSS are strengths to preserve.
- This was Chromium emulation, not physical iOS/Android or Safari testing. Screen-reader behaviour, 200% zoom, forced colours, all theme/state combinations, OLED/compact-density integration, real network latency, and production-scale performance remain acceptance work.
- No backend, authenticated permission model, or institutional readiness policy was available. Security and academic-policy findings below are explicitly conditional or questions; they are not claims about a deployed backend.
- Baseline build success is not visual acceptance. Existing automated tests mostly exercise service rules, not the rendered workflows found problematic here.

Evidence files: [viewport results](.logbook-check.local/audit/layout.json), [interaction observations](.logbook-check.local/audit/interactions.json), [computed styles](.logbook-check.local/audit/style-checks.json). Screenshots are linked beside relevant findings. These are local audit artifacts.

## 4. Findings and recommended improvements

Evidence labels: **R** = reproduced in browser; **S** = verified in source; **P** = product/policy decision required. High = materially affects task completion, correctness, or accessibility; Medium = recurrent friction or consistency issue; Low = secondary polish. Critical is reserved here for the conditional production access-control blocker.

### A. Correctness, status meaning, and production boundaries

| ID / Priority | Issue and evidence | Proposed improvement | Rationale | Expected impact |
|---|---|---|---|---|
| A01 — High | **R/S:** RM's dashboard shows **3** awaiting-review entries; clicking that bar opens **5**, including Pathology and Physiology. Charts use department records; Search uses all visible records. A selected subject is also passed as free text instead of an exact subject filter. | Carry an explicit department/subject scope into the destination and derive both count and results from one selector. Display that scope. | A clickable number promises a matching set of records. Text matching is not a reliable scope boundary. | Counts and drill-downs agree; users reach the intended work. |
| A02 — High | **R/S:** Invalid saved JSON shows a raw parser error, followed by a fully rendered zero-count dashboard and an enabled primary action. Retrying does not re-enter the loading state. See [load failure](.logbook-check.local/audit/load-error.png). | Separate initial loading, loaded-empty, stale-data, and failed states. Show a human-readable recovery message; suppress success-like zero totals on failure; make retry visibly busy. Preserve saved data. | Unavailable data must not look like an empty workload or completed work. | Trustworthy status reporting and a usable recovery path. |
| A03 — High, policy-dependent | **S/P:** “Requirements met” counts logged records, including Pending/Returned, while Skills counts approved attempts. Readiness requires one approved entry and no Pending/To do entries, but does not require category minimums or completed skills. The UI states that faculty judgement determines readiness. | Agree whether readiness is discretionary or rules-based. Label logged coverage, approved attempts, and final readiness separately. If overrides are permitted, make the override and its reason explicit. | These are different measures; changing them silently would alter academic workflow. | Users understand progress without mistaking activity coverage for certification. |
| A04 — High, policy-dependent | **S/P:** A submitted sign-off freezes its approver chain, but displays live entries. Approve-sign-off validates the current approver, not whether entries changed or new pending work appeared after submission. Completed records mention later entries, but no explicit evidence snapshot is stored for the decision. | Define the evidence cutoff. Use a submission snapshot/revision or explicit changed-since-submission review with revalidation. Define how late entries affect an existing signature. | A signature needs an unambiguous relationship to the evidence reviewed. | Reliable approvals and clear handling of post-submission changes. |
| A05 — Critical before live deployment | **S/P:** Identity is a local account selector; visibility excludes drafts but otherwise allows cross-department record access. Mutations and workflow state use browser storage. Source comments explicitly identify this as a prototype. | Keep preview mode clearly separate. Specify authenticated identities, permitted read/comment/review scopes, server-enforced transitions, durable records, and revision/conflict responses for backend integration. | Hiding buttons and choosing a demo account do not constitute production authorisation. | A defined production integration boundary; no claim that frontend polish alone makes this safe for real records. |
| A06 — High, policy-dependent | **S/P:** Subject-chain editing is offered to department faculty and office approvers; the chooser permits any reviewer, including faculty from other departments. Minimum chain length is one. | Confirm who may configure chains, which roles are mandatory, and whether cross-department approvers are allowed. Enforce the approved policy in UI and service contracts. | Chain configuration can change who is responsible for final approval. | Predictable approval governance without accidental bypasses. |
| A07 — Medium | **S:** “Certified this week” is a rolling seven-day count of approved graded-entry events, not unique fully certified skills or a calendar week. “Last 7 days” uses `waitingDays <= 7`, a different boundary. “Overdue” means pending more than seven days, distinct from assignment due dates. | Use precise labels and a shared date-range helper; explicitly distinguish review age, assignment deadline, approved attempts, and completed certification. Confirm the review SLA. | Similar-looking numbers currently answer different questions. | Consistent reporting and fewer interpretation errors. |

### B. Navigation and task efficiency

| ID / Priority | Issue and evidence | Proposed improvement | Rationale | Expected impact |
|---|---|---|---|---|
| B01 — High | **R/S:** On a 390px mobile queue the repeated introduction, assignment panel, tabs, and filters consume almost the entire first screen; the actual entries start below it. Dashboard review lists follow four charts. See [mobile queue](.logbook-check.local/audit/Queue-390.png), [dashboard](.logbook-check.local/audit/Overview-1366.png). | Use a compact contextual header on working sections; retain a concise assignment action. Put urgent reviews/signatures ahead of secondary analytics, with a larger summary only where useful. | Reviewing records is the immediate task; repeated introductory content delays it. | Faster access to actionable records and substantially less mobile scrolling. |
| B02 — High | **R/S:** The sample review drawer places verification below comments. At 1366 × 900 the verification section begins around **y=924**; the sticky footer exposes only Done. See [review opening](.logbook-check.local/audit/review-top.png). | Put record context and verification before optional discussion. Use a persistent decision area with grade/feedback validation and clear read-only variants. | A reviewer should not need to discover the decision controls below an empty comment form. | Faster, clearer approval and return workflows. |
| B03 — Medium | **R/S:** Filtering Students to Ananya/pending, opening the student, and using Back to students resets to `?view=Students`. Skills filters and sort state are local and also disappear on navigation. | Preserve list filters, sort, expanded context, and useful scroll position; make in-app Back return to the originating list state. | Repeated reviews should not require reconstructing the same search. | More efficient sequential work. |
| B04 — Medium | **R/S:** Search is omitted from the section navigation; it is entered through dashboard search or metrics. The Search page has no subject selector, even when a subject filter is active. | Provide a consistent search entry point from working sections and a complete set of visible/removable active filters, including subject and scope. | Search should remain discoverable after leaving the dashboard; hidden constraints confuse results. | Easier finding and refinement of records. |
| B05 — Medium | **R/S:** Eight faculty navigation pills scroll horizontally on phones; later sections have limited discoverability. Breadcrumbs become heavily truncated and are plain text. History arrows default to enabled even without meaningful in-app history. | Keep the section model initially; improve mobile section selection and active-section visibility. Provide meaningful parent links and accurate history availability where the shell can track it. | A user needs to know where they are and how to return without relying on hidden tabs or browser history. | Clearer orientation on small screens and direct links. |
| B06 — Medium | **R/S:** Invalid student IDs render an ordinary empty entries view, no student summary, and no dedicated recovery action. URL values are only partially normalised. | Validate route IDs and filter values against the catalogue and allowed section state; show a specific unavailable-record view with a valid return action. | Missing records and valid empty results are different situations. | Recoverable links and fewer apparent dead ends. |
| B07 — Medium | **R/S:** Dean metrics for awaiting, with others, and completed all navigate to the same unfiltered Sign-offs page. “Other logbooks” mixes states and has no search/status controls. | Pass the selected state into Sign-offs; add student/subject search and clear awaiting, in-progress, returned, and completed filtering. | Each metric should lead to the population it describes. | Faster final approval and retrieval of completed logbooks. |
| B08 — Medium | **S/P:** Categories displays only categories with entries, which conceals valid but unstarted activities. Subjects shows all 19 subjects without a “my departments” affordance. | Explain the current scope; optionally expose configured-but-unstarted categories and a department filter without inventing counts for unconfigured requirements. | An empty workload should not make available categories disappear or imply all subjects are actionable. | Better discovery and clearer distinction between available, active, and permitted work. |

### C. Forms, decisions, and feedback

| ID / Priority | Issue and evidence | Proposed improvement | Rationale | Expected impact |
|---|---|---|---|---|
| C01 — High | **R/S:** Assignment marks both Activity details and Instructions optional, then rejects submission when both are empty: “Add task details or instructions for the student.” See [assignment error](.logbook-check.local/audit/assignment-error.png). | State “Provide activity details or instructions” before entry and associate the validation message with those fields. Show recipient count for Entire cohort and use a count-aware action/success message. | The form must explain its actual rules and the scope of a batch assignment. | Fewer failed submissions and clearer assignment intent. |
| C02 — High | **S:** Changing assignment subject/category clears entered activity values immediately. Close protection only considers category, instructions, and values; a changed due date or recipient alone is not treated as dirty. Approval-chain edits have no dirty-navigation protection. | Track meaningful changes consistently. Preserve compatible fields; confirm before discarding incompatible content; protect unsaved chain edits. | Legitimate user input should not disappear without warning. | Reduced re-entry and accidental data loss. |
| C03 — High | **R/S:** Review submission with missing attempt/rating yields one generic error; fields have no `aria-invalid`/error association. Required feedback is described but errors are not placed beside it. Return-decision fields appear even when approving. | Validate per action, show field-level errors and required indicators, focus the first invalid field, and reveal only decision-relevant inputs. Apply the same pattern to sign-off returns. | Users need to know what to fix and why without guessing. | More accessible and dependable review decisions. |
| C04 — Medium | **R/S:** Success notices are owned by the page behind an open native dialog. After approving a sign-off, the record moves between lists, its drawer disappears, and keyboard focus falls to BODY even when the trigger was focused. | Show decision feedback in the active context, announce the result, and deliberately move focus to the next relevant record/list heading when the original trigger disappears. | Modal users cannot reliably see or interact with feedback behind the dialog. | Clear completion feedback and uninterrupted keyboard navigation. |
| C05 — Medium | **S:** Bulk approval, cancellation, and discard use browser `confirm`; final sign-off has no explicit decision summary. Bulk selection lacks an indeterminate state and individual checkboxes are not disabled while a bulk save is running. | Reuse a Medsy confirmation dialog where confirmation is warranted; name action, recipients/count, and consequences. Make partial selection clear and freeze mutation scope while saving. Avoid adding confirmations to routine navigation. | Consequential actions need context, and the visible selection must match what is being saved. | Safer batch work with consistent interaction feedback. |
| C06 — Medium | **S:** Review and comment posting maintain separate busy states; comment controls are not disabled by `reviewBusy`. With a real asynchronous adapter, simultaneous mutations need coordination. Current immediate storage calls hide this timing risk. | Coordinate per-entry mutations and handle conflicts explicitly, preserving feedback/comment drafts on failure. | Backend latency should not introduce conflicting saves or lost changes. | A smoother API handoff and resilient feedback entry. |
| C07 — Medium | **S/R:** Read-only responsibility is communicated at subject level and at the bottom of the detail drawer, but entry lists do not consistently expose who may review. Reassignment and review feedback share a dirty flag; changing one workflow can clear protection for the other. | Show “Assigned to you” or the responsible reviewer near the record identity. Keep reassignment separate from decision drafts and confirm/discard each intentionally. | Review permission and ownership should be known before scrolling to an unavailable action. | Fewer fruitless opens and clearer ownership handoffs. |

### D. Visual quality, accessibility, and maintainability

| ID / Priority | Issue and evidence | Proposed improvement | Rationale | Expected impact |
|---|---|---|---|---|
| D01 — High | **R/S:** Light assignment primary buttons use white 13px text on `rgb(15,159,143)`, approximately **3.29:1** contrast. The 12px search label is approximately **3.08:1** on its surface. Small muted text on white measures approximately **4.47:1**, leaving no margin as surfaces vary. | Use Medsy semantic text and brand-fill pairs; target at least 4.5:1 for ordinary small text. Audit active, hover, disabled, light/dark, and portal states together. | Small essential text must remain legible; the chart accent is unsuitable as this small white-text button fill. | Improved readability and consistent accessible emphasis. |
| D02 — Medium | **R/S:** Many navigation controls are 32px tall; primary drawer controls measure about 37.5px. Entry metadata and several instructions sit at 11–12px. | Increase touch areas towards 44px for principal mobile controls, enlarge essential reading text using existing type tokens, and reserve micro text for secondary metadata. | Fitting the viewport is insufficient if users struggle to read or tap controls. | Easier mobile use without unnecessary visual bulk on desktop. |
| D03 — Medium | **R/S:** The module combines Medsy, My Skills, OSPE, and activity-chart styles. Buttons alternate pills and 12px rectangles; teal competes with forest, and Returned is violet in the chart but coral in badges. Some shadow/backdrop values are literal neutral colours. | Map the module to canonical Medsy semantics, pill buttons, spacing/radii, and a shared status map. Scope the change locally; verify shared learner components before changing their defaults. | The current cascade produces an inconsistent visual vocabulary and makes isolated fixes fragile. | A cohesive premium finish with lower regression risk. |
| D04 — Medium | **S/R:** Custom dashboard charts use native `title` hints for some data and do not implement the project's VizKit tooltip, focus, and arrow-navigation vocabulary. Static day bars have a useful overall accessible label that should be retained. | Use existing chart/VizKit primitives if compatible, or implement the same keyboard and tooltip contract with visible values and a usable static state. Keep reduced-motion support. | Touch and keyboard users need the same information as hover users. | Consistent, discoverable chart interactions. |
| D05 — Medium | **R/S:** Faculty and office views inherit “Your learning record”; Dean renders “Dean | Dean” and “Faculty review”. Mixed labels include Assigned/To do and Approved/Certified; configuration field labels mix title and sentence case. | Introduce role-appropriate headings and a short status glossary. Standardise sentence case while preserving medically meaningful abbreviations and distinctions between entry approval and certification. | Language should match the user's role and the actual unit being described. | A more professional, understandable experience. |
| D06 — Medium | **S:** History and record results render their full collections; skill expansion renders all learners and attempts; subjects have deeply nested groups. Repeated full-array scans are inexpensive only at demo size. | Confirm expected volumes. Add service-level pagination/filter contracts and progressive loading where necessary; preserve stable ordering and counts. Add history search/date controls. | Three sample learners do not represent an institution's workload. | Practical retrieval and predictable performance at realistic scale. |
| D07 — Medium | **S/R:** Default fixtures cover several entry states but contain no final-sign-off workflow, so Ready/Submitted/Returned/Completed sign-off experiences are empty until manually created. Error/latency states are also not routinely previewable. | Add deterministic mock scenarios behind the existing service boundary for approval stages, empty results, long content, latency, and failures. Keep realistic default data. | Reviewers and backend engineers need repeatable access to every important state. | More reliable QA and easier handoff without manual storage setup. |
| D08 — Medium, shared dependency | **R/S:** The baseline application emits approximately **2.63 MB JS** and **2.74 MB CSS** before compression. The Logbook dynamic import is ineffective because the service is also statically imported. | Assess route-level splitting and shared-style loading separately from visual fixes; measure on representative devices before setting budgets. | Global bundle cost affects this route but cannot be attributed solely to Admin Logbook. | A scoped performance plan without claiming an unmeasured speed improvement. |
| D09 — Low | **S:** Evidence attachments display as small inline images with filenames; there is no enlarge/open control in the entry drawer. Long audit trails are a sequence of plain paragraphs. | Add an accessible evidence viewer if detailed image review is required; group audit events into a compact chronological disclosure with actor, action, date/time, and feedback. | Evidence and decision history should be inspectable without overwhelming the review form. | Better inspection and cleaner long-record presentation. |

## 5. Open questions for approval

1. **Readiness:** May faculty mark a subject ready despite unmet category/skill requirements, or must requirements be fulfilled? Are reasoned overrides allowed? This determines A03.
2. **Final signatures:** Do approvers sign a frozen submission snapshot, or all current entries? What should happen when new work appears during approval or after completion? This determines A04.
3. **Permissions:** Is cross-department reading/commenting intentional? Who may edit chains, and are HoD/Dean/Director mandatory or configurable? This determines A05–A06.
4. **Scope and scale:** How are cohorts, academic years, and departments assigned, and approximately how many learners/entries must one faculty member handle? This determines recipient selection and D06.
5. **Time/status language:** Is overdue a seven-day review SLA? Does “this week” mean the calendar week or the past seven days? Should “certified” mean an approved attempt or a fully completed competency? This determines A07.
6. **Layout priority:** Proposed default: reviews and signatures first, with a compact header on working sections. Keep the current sections initially; any section consolidation would need separate approval.
7. **Optional requirements:** Are PDF/export, evidence enlargement, reminders, or editing an already assigned task required? They are not assumed to be in the approved scope.

## 6. Assumptions and missing requirements

### Assumptions

- The selected scope is `/adminLogbook`, its shared drawers, and directly connected learner handoffs; unrelated platform screens are excluded.
- Existing review, assignment, correction/remedial, and sign-off behaviour should be preserved unless an approved item explicitly changes it.
- The project Medsy guide is the design authority. Existing styling differences are not assumed to supersede that guide.
- Realistic sample content remains available by default. Audit fixtures are not production data.
- Native-dialog focus trapping and existing reduced-motion handling should be retained and improved, not rebuilt without need.

### Missing requirements

- Approved role/permission matrix, cohort membership source, institutional completion rules, grading compatibility rules, and approval authority.
- Definitions for metrics, date boundaries/timezone, review SLA, and late-entry handling.
- Backend endpoints, validation/error shapes, pagination, versioning/conflict handling, attachment storage, and audit retention contracts.
- Representative data volumes and long-content examples; supported browsers/devices; decision on OLED and compact-density support.
- Confirmed requirements for reporting/export, notifications/reminders, evidence review, and assignment editing.

## 7. Technical constraints and dependencies

- `App.jsx` owns accounts, theme, and navigation; `useAdminLogbookRoute.js` owns module URL state. Route/focus work must integrate with those owners.
- Shared entry, drawer, sign-off, subject, and status components also serve My Logbook. Their learner flows require regression checks even when the initiating change is administrative.
- Shared activity/OSPE/My Skills CSS and late Logbook overrides influence computed output. Avoid broad global token edits as a shortcut.
- The current theme preference is `vx-theme` and a shell class, while the project guide describes `medsy-theme` and HTML attributes. Any persistence/OLED/density migration is a shared-shell decision, not a silent module refactor.
- Storage is synchronous and local. Cross-tab events refresh data, but production requests need explicit asynchronous loading, cancellation/stale-response handling, and server conflict rules.
- The production build passed despite bundle warnings. The existing browser-check script in `.logbook-check.local/admin-logbook.mjs` targets older default-queue markup and should not be treated as current workflow coverage.
- Audit runtime used the built application: the Vite watcher encountered a lock on the isolated browser profile. This was an audit-tooling issue, not a product defect.
- Existing unrelated Blueprint working-tree changes were left untouched. No dependencies were installed, and no application source or flow log was changed.

## 8. Proposed execution order, subject to approval

| Package | Items | Concrete outcome |
|---|---|---|
| 1. Trust and task completion | A01–A02, B02, C01–C04, D01 | Matching counts/results, truthful load states, discoverable decisions, coherent validation, visible feedback, accessible primary controls. |
| 2. Responsive workflow and continuity | B01, B03–B07, C02, C05, C07, D02, D05 | Compact working views, preserved context, usable mobile navigation, clear permissions and confirmations. |
| 3. Policy-led lifecycle and integration | A03–A06, C06 | Implement only the confirmed readiness, evidence, permission, chain, and conflict rules; document backend contracts. |
| 4. Consistency and scale | A07, B08, D03–D09 | Consistent terminology/styles/charts, realistic fixtures, scalable lists, separately scoped performance work and optional evidence/history polish. |

These are planning groups, not authorisation. Individual IDs can be approved or deferred. If approved work changes navigation or step sequence, record that actual flow change in the existing root flow-change log at implementation time.

## 9. Acceptance criteria for approved implementation

- A dashboard metric opens exactly the records represented by its count and retains the correct department/subject/date scope.
- Loading/error/empty/success states are distinguishable; failed loads never masquerade as zero work; retry is visible and recoverable.
- Faculty can open, grade, approve, return with required feedback, reassign, and bulk-approve eligible records without hidden actions or lost drafts.
- Assignment explains conditional requirements, protects meaningful input, identifies recipients, and preserves learner handoff/locked task values.
- Final approvals follow the agreed readiness, evidence-cutoff, chain, permission, and late-entry policy; approved/returned transitions provide visible feedback and sensible focus.
- List context survives detail navigation; invalid links provide a recovery path; hidden filters are exposed and removable.
- Core content reflows at 320/390, 768, 1024/1366, and 1440+ widths, with sidebar expanded/collapsed. Check long titles, lengthy feedback, empty/full lists, and mobile drawer actions as well as the page shell.
- Keyboard-only operation covers navigation, search, selection, forms, charts, dialogs, Escape, focus restoration, and error focus. Check a screen reader, zoom, light/dark contrast, and reduced motion before visual acceptance.
- Existing service tests and production build pass; add targeted regression coverage for approved correctness fixes and browser journeys. A build alone is not the approval criterion.
- No unsolicited section removal, academic-policy change, permission expansion, new dependency, or unrelated page redesign.

## 10. Source map

- Page orchestration, counts, filters, lists, and mutations: [AdminLogbookPage.jsx](src/pages/AdminLogbookPage.jsx)
- App-owned URL state: [useAdminLogbookRoute.js](src/services/useAdminLogbookRoute.js)
- Chart calculations/navigation: [AdminLogbookDashboard.jsx](src/components/logbook/AdminLogbookDashboard.jsx)
- Identity, visibility, overdue logic: [logbookPeople.js](src/services/logbookPeople.js)
- Readiness and competency measures: [logbookProgress.js](src/services/logbookProgress.js), [AdminLogbookStudentDetail.jsx](src/components/logbook/AdminLogbookStudentDetail.jsx)
- Assignment, review, and sign-off rules: [adminLogbook.js](src/services/adminLogbook.js)
- Storage, record validation, comments, and progress: [logbook.js](src/services/logbook.js)
- Decision UI: [FacultyReview.jsx](src/components/logbook/FacultyReview.jsx), [LogbookEntryDetail.jsx](src/components/logbook/LogbookEntryDetail.jsx)
- Assignment/chain UI: [LogbookFacultyActions.jsx](src/components/logbook/LogbookFacultyActions.jsx)
- Final approval and dialog lifecycle: [LogbookSignoff.jsx](src/components/logbook/LogbookSignoff.jsx), [LogbookDrawer.jsx](src/components/logbook/LogbookDrawer.jsx)
- Search, scale, and history: [AdminLogbookQuickSearch.jsx](src/components/logbook/AdminLogbookQuickSearch.jsx), [AdminLogbookSkills.jsx](src/components/logbook/AdminLogbookSkills.jsx), [AdminLogbookHistory.jsx](src/components/logbook/AdminLogbookHistory.jsx)
- Visual cascade: [LogbookPage.css](src/pages/LogbookPage.css), [AdminLogbookPage.css](src/pages/AdminLogbookPage.css), [activity-visual-tokens.css](src/styles/activity-visual-tokens.css), [LogbookStatus.css](src/components/logbook/LogbookStatus.css)
