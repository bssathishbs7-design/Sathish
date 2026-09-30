# My Logbook and Admin Logbook: combined UI/UX audit

Date: 26 September 2026  
Status: **Plan only — awaiting scope approval. No application code changed.**

## 1. Recommendation

Treat My Logbook and Admin Logbook as two views of one learning-record workflow. Keep their role-specific navigation, but share the definitions of records, requirements, review responsibility, remedial resolution, and final approval.

The existing workflow is functional, including live updates between student and faculty tabs. The highest priorities are protecting remedial/competency integrity, making counts and completion rules trustworthy, improving access to primary actions, and providing consistent validation, recovery, and feedback. Visual polish should support those fixes rather than become a separate redesign.

This document consolidates **63 findings from the two detailed audits into 30 coordinated work items**. It also adds cross-role verification and a confirmed consequence of the requirement-calculation problem: one student's submission can change the target that Admin displays for a different student.

Use the **LB-01–LB-30** IDs below for approval. The earlier documents remain evidence appendices; their overlapping items should not be implemented twice:

- [My Logbook detailed audit](MY_LOGBOOK_AUDIT.md) — 32 findings.
- [Admin Logbook detailed audit](ADMIN_LOGBOOK_AUDIT.md) — 31 findings.

## 2. Users, goals, and the complete journey

| User | Goal | Successful experience |
|---|---|---|
| Student | Record accurate evidence and complete required learning | Understand what to log, save/recover work, submit to the right faculty, and see accurate progress. |
| Student responding to feedback | Correct a record or complete a remedial attempt | See the original feedback, preserve the correct competency link, and know when follow-up is complete. |
| Department faculty | Assign, review, and guide learning | See the correct queue, inspect evidence, give clear feedback, and make decisions efficiently. |
| Faculty supervising a cohort | Identify gaps and readiness | Compare students using authoritative requirements and clearly distinguish activity from certification. |
| HoD / Dean / Director | Complete final approval | Know what evidence is being signed, who acted previously, and who acts next. |

Assumed context: short student sessions on phones between learning activities; concentrated faculty review on laptops, with tablet/mobile access. These are design assumptions, not validated user-research findings.

### Connected workflow and responsibilities

| Stage | Student side | Faculty/approver side | Shared contract to preserve or clarify |
|---|---|---|---|
| Start | Create a draft or open an assigned task | Assign a named activity to selected recipients | Same activity, recipient, instructions, deadline, and locked fields. |
| Submit | Confirm accuracy and send the record | Receive an actionable Pending entry | Stable record identity, permitted reviewer, submission timestamp. |
| Review | See status and feedback | Approve, return, or reassign | Clear ownership, decision validation, and preserved history. |
| Correct | Edit/resubmit an ordinary returned record | Review the corrected version | Preserve identity and history; saving corrections must not silently submit them. |
| Remediate | Continue/create an attempt linked to the returned competency | Grade the linked repeat/remedial attempt | A different competency cannot resolve the original requirement. |
| Establish readiness | Understand completed requirements and remaining tasks | Mark a subject ready under agreed rules | Logged coverage, approved attempts, certified skills, and readiness are distinct. |
| Final submission | Submit the ready subject logbook | HoD → Dean → Director, or the approved configured chain | Explicit evidence cutoff, chain ownership, next actor, return/re-entry rules. |
| Complete | See completion and any late work | Inspect signed history | A completed signature must have an unambiguous relationship to later entries. |

## 3. Evidence and verification

### Evidence retained from the preceding audits in this conversation

- **96 viewport/view combinations:** 42 for My Logbook and 54 for Admin Logbook at 320, 390, 768, 1024, 1366, and 1440 CSS pixels. These checks are reused, not claimed as 96 new runs for this consolidation.
- All main sections plus representative entry, assignment, review, subject, skill, profile, and final-approval states were inspected. Additional small-height mobile and collapsed-sidebar checks were recorded.
- Representative light/dark rendering, computed control styles, validation, save failures, corrupt storage, navigation continuity, and modal focus outcomes were checked.
- Both baseline builds passed; the existing four Logbook service test files passed **17/17 tests**. They do not cover the confirmed integrity failures. No application source changed during these audits, so identical build/test runs were not repeated merely for consolidation.

Evidence: [student layouts](.logbook-check.local/my-audit/layout.json), [student interactions](.logbook-check.local/my-audit/interactions.json), [student edge checks](.logbook-check.local/my-audit/edge-checks.json), [faculty layouts](.logbook-check.local/audit/layout.json), [faculty interactions](.logbook-check.local/audit/interactions.json), [faculty computed styles](.logbook-check.local/audit/style-checks.json).

### Additional checks for this combined audit

Re-read the shared services and cross-role selectors, then exercised the built application in separate student/faculty tabs using an isolated preview profile:

| Handoff | Observed result |
|---|---|
| Faculty assigns an activity | Appears in the already-open student dashboard without reload. |
| Student completes and submits | Appears in the faculty review queue. |
| Faculty returns it with feedback | Student receives an Edit and resubmit action without reload. |
| Student corrects and resubmits | Reappears in the already-open faculty queue. |
| Faculty approves | Student's record updates to Approved. |
| Faculty posts a comment | Comment arrives in the student's already-open detail drawer. |
| Faculty marks the subject ready | Student subject approval updates to Ready. |
| Student submits; HoD, Dean, Director approve | Student's open approval drawer advances to Awaiting Dean, Awaiting Director, and Completed. |

[Cross-role browser observations](.logbook-check.local/combined-audit/cross-role-browser.json). Final approvers were selected using isolated preview-account state. Reduced-motion mode was used for the two-tab run to avoid background-tab animation timing interfering with automation; ordinary/reduced motion was separately inspected in the earlier audits. The profile and test records were isolated from user data and cleared afterwards.

An additional in-memory probe submitted IM1.1 with `numReq=99` for student MC2568. Admin's cohort-wide skill selector then used **99** for peer MC2569, while MC2569's learner selector still used **3**. This is captured in LB-03; no application data was written by the probe.

### Strengths and limits

Preserve native dialog focus containment, existing input error associations on learner forms, category-change warnings, assignment locks, save-failure draft preservation, normal note-save/close behaviour, correct dedicated remedial submission, and working cross-tab refreshes. Do not introduce a reload requirement where updates already work.

No page-level horizontal overflow was detected in the sampled default layouts. This does not establish that every expanded/long-content case is correct. Physical devices, Safari/Firefox, screen readers, 200% zoom, forced colours, every theme/density combination, production data volumes, and real backend latency remain acceptance work. This is not a claim that all possible issues have been exhausted.

## 4. Prioritised, consolidated issue register

**Evidence:** R = browser reproduction from these audits; S = current source inspection; E = isolated service/selector reproduction; P = policy decision required.  
**Priority:** Critical = conditional live-deployment blocker; High = integrity, important accessibility, or material task-completion impact; Medium = recurring friction/consistency/risk; Low = secondary polish.  
**References:** M refers to My Logbook audit IDs; A refers to Admin Logbook audit IDs. Every original finding is mapped in section 9.

### Data integrity, permissions, and completion meaning

| ID / Priority / Scope | Issue identified | Proposed improvement | Rationale | Expected impact |
|---|---|---|---|---|
| **LB-01 — Critical before live deployment — Both** | **S/P:** Identity selection, records, uploads, and workflow persistence are a local prototype; sample reset is exposed in learner Profile. Cross-department read/comment permissions have no confirmed production policy. | Separate preview tools from live UI; specify authenticated ownership, read/comment/review permissions, durable uploads/storage, server transitions, and conflict responses. | UI restrictions and a local account selector are not production authorisation or durable saving. | An explicit backend handoff and honest production-readiness boundary. |
| **LB-02 — High — Both** | **R/S/E:** Student “Log attempt” beside Remedial due creates an unlinked record. A linked remedial can change IM1.1 to IM1.2 and still clear IM1.1's warning. The direct remedial form omits original feedback. | Use one contextual remedial action, resume existing drafts, preserve/validate parent competency identity, and display original feedback. Reject mismatched children in both mutation and resolution logic. | A new ordinary attempt and a correction of a specific failed competency are different actions. | Reliable remediation from every entry point, with no false clearance. |
| **LB-03 — High — Both** | **R/S/E/P:** Learner-entered “Number required to certify” changes progress targets, even in a draft. A draft raised one subject total from 5 to 101. A submitted value of 99 also made Admin show 99 for a peer whose learner view still showed 3. | Establish one authoritative requirement source and its effective version; show student targets read-only unless a different explicit policy is approved. Do not derive one learner's target from another learner's entry. | Student and faculty must evaluate the same requirement; a draft must not redefine it. | Stable targets and agreement between learner and cohort views. |
| **LB-04 — High, policy-dependent — Both** | **S/R/P:** Logged category coverage includes Pending/Returned work, while skills use approved attempts. Faculty readiness can be marked with incomplete skills; a Ready logbook with 1/2 skills certified can submit. | Agree readiness rules and any reasoned overrides; label logged coverage, approved attempts, certified skills, and readiness separately. | Different units currently look like interchangeable measures of completion. | Clear, consistent academic expectations without inventing requirements. |
| **LB-05 — High, policy-dependent — Both** | **S/P:** Chains are snapshotted, but approval displays live evidence. Pending records remain editable; late/new work can appear after subject submission, and final approval does not revalidate those changes. | Define evidence cutoff, allowed Pending edits, late entries, and resubmission rules. Use a submission revision/snapshot or explicit changed-evidence review. | A signature needs a defined set of evidence behind it. | Traceable approval and predictable handling of changes. |
| **LB-06 — High, policy-dependent — Admin** | **S/P:** Department faculty and office actors can configure chains; any reviewer can be chosen and only one is required. Mandatory roles and cross-department authority are unconfirmed. | Confirm who configures chains and which approvers/roles are allowed or required; apply the same policy in UI and service contracts. | Chain changes alter approval responsibility. | Governed configuration without accidental bypasses. |
| **LB-07 — High — Admin** | **R/S:** A dashboard bar showing 3 pending entries opens 5, because its destination loses department scope. Selected subjects may become text searches. Office metrics all open unfiltered Sign-offs. | Derive counts and destinations from the same explicit scope/status/date selectors; carry exact filters to results and show them. | A number-to-list action promises the same population. | Trustworthy drill-downs and quicker access to the correct work. |
| **LB-08 — Medium — Both** | **S:** “Certified this week” counts rolling-seven-day approved graded-entry events, not necessarily completed skills. Date filters use another boundary. Student “Recent activity” ignores new decision/comment timestamps. | Standardise date helpers and definitions; distinguish approved attempts, full certification, review age, deadlines, and actual recent events. | Similar labels currently describe different events and periods. | Understandable chronology, metrics, and new-feedback discovery. |

### Role-specific navigation and task efficiency

| ID / Priority / Scope | Issue identified | Proposed improvement | Rationale | Expected impact |
|---|---|---|---|---|
| **LB-09 — High — Student / handoff** | **R/S:** Ready/Returned final subject approvals are absent from student Needs action. The action is available only inside subject approval details. | Include final-submission/returned-logbook tasks with subject links and counts distinct from individual entry tasks. | Important unfinished work should not be invisible in the action summary. | Better completion of the student-to-approver handoff. |
| **LB-10 — High — Both** | **R/S:** Repeated headers and creation/assignment panels push useful records below the first mobile screen. Faculty reviews follow four charts; student actions follow verification summaries. | Use compact contextual headers on working views; put urgent reviews, returned work, deadlines, and signatures before secondary analytics. Keep concise primary actions. | Repeated introductory content delays the intended task. | Less scrolling and faster task access across devices. |
| **LB-11 — High — Both** | **R/S:** Faculty verification starts below comments (around y=924 in a 900px-high sample drawer); its footer exposes Done. Students confirm submission with only a short collapsed detail summary, while future faculty grading takes substantial form space. | Design role-specific drawer hierarchy within one shared shell: evidence and decision controls first for reviewers; useful submission summary and compact future-grading disclosure for students. | Review and acknowledgement should be supported by visible relevant information. | Faster decisions and fewer submission errors. |
| **LB-12 — Medium — Both** | **R/S:** Learner subviews are not URL-backed; refresh returns home. Both roles lose filters/sort on list return. Admin Search is hard to re-enter and omits a subject control; learner results have mixed underlying order and limited filtering. | Use App-owned route/history state, retain list context and useful scroll, expose complete active filters, and define stable sorting plus concise subject/date/search controls. | Users should return to the exact work they were doing. | Predictable refresh/back behaviour and efficient retrieval. |
| **LB-13 — Medium — Admin / shell** | **R/S:** Eight faculty pills scroll on phones with limited discovery of later sections. Breadcrumbs truncate and are not parent links; history controls default enabled. Invalid student IDs show an ordinary empty result rather than recovery. | Improve mobile section selection and active visibility; provide meaningful parent navigation and accurate history state; validate routes and offer recovery for unavailable records. | Orientation and recovery should work without guessing. | Fewer navigation dead ends and better keyboard/mobile use. |
| **LB-14 — Medium — Both** | **S/R:** Unused categories disappear; learner category filters silently fall back and reactivate. Unconfigured requirements can appear as 0/0; empty views lack contextual actions. Admin's all-subject catalogue does not distinguish own departments clearly. | Separate available categories from matching records; make filter changes explicit; distinguish empty, no-match, unavailable requirement, and complete states; show scope and useful next actions. | Zero, unknown, and complete are not equivalent. | Clearer discovery, filtering, and first-use guidance. |
| **LB-15 — High — Assignment handoff** | **R/S:** Admin labels both task details and instructions optional but requires one. Cohort scope needs clearer recipient counts. Students see assignments twice, without deadline prioritisation, and the completion form omits the due date. | Explain conditional requirements inline, show recipient counts and batch outcomes, consolidate/prioritise student task presentation, and retain instructions/deadlines in the form. | Assignment intent and obligations must remain clear on both sides. | Fewer failed assignments and better student follow-through. |

### Input protection, decisions, and feedback

| ID / Priority / Scope | Issue identified | Proposed improvement | Rationale | Expected impact |
|---|---|---|---|---|
| **LB-16 — High — Both** | **R/S:** Admin subject/category changes clear activity values; some meaningful edits are not guarded. Chain drafts lack navigation protection. New student entries silently save incomplete drafts on close, while edits prompt; reload can lose in-memory edits/notes/comments. | Adopt a consistent, visible saving model with recoverable drafts, meaningful dirty tracking, compatible-field retention, and explicit protection/discard behaviour. Keep learner category-change warnings that already work. | Input should neither disappear nor be silently saved under an unexpected rule. | Predictable saving and less lost/repeated work. |
| **LB-17 — High — Admin** | **R/S:** Missing grade/feedback produces generic errors without field associations or first-invalid-field focus. Return-specific inputs compete with approval inputs. | Validate by action, mark required fields, associate errors, focus the first invalid control, and reveal only relevant decision inputs. Reuse the successful learner validation pattern. | Users must know exactly what to fix. | Accessible, dependable review and return decisions. |
| **LB-18 — Medium — Both** | **R/S:** Success feedback can sit behind open dialogs; learner toasts expire quickly. Sign-off movement or entry removal can remove the trigger and drop focus to BODY. | Show feedback inside the active interaction context, announce state changes, and deliberately focus the next record/list heading when a trigger disappears. | A completed operation should remain apparent without losing keyboard position. | Clear outcomes and continuous keyboard workflows. |
| **LB-19 — Medium — Both** | **R/S/P:** Browser confirmations differ from in-app prompts. Student Withdraw deletes and uses a four-second confirmation label. Bulk selection lacks a mixed state and can change during save; final decisions lack a contextual summary. | Confirm deletion versus recall policy; use reusable, persistent contextual confirmation only where warranted. Explain consequences/counts, represent partial selection, and freeze mutation scope while busy. | Users need predictable consequences and a stable set of records being processed. | Safer destructive/batch actions without unnecessary confirmation steps. |
| **LB-20 — Medium — Both / integration** | **S/R:** Review/comment mutations use separate busy state; reassignment and feedback share draft protection. Responsible reviewer/read-only context appears too late. Current synchronous storage hides network race risks. | Coordinate per-record mutations and conflicts, preserve independent drafts, and show review ownership near record identity. Preserve working cross-tab refreshes. | Responsibility and pending saves must stay coherent during handoff. | Fewer wasted opens, conflicting updates, and lost feedback. |
| **LB-21 — High — Both** | **R/S:** Admin renders zero-count content after a failed load; My Logbook safely hides content but exposes raw JSON errors and a repeating Reload action. Subject approval initially uses not-ready copy before loading completes. | Share explicit loading, loaded-empty, stale, unavailable, and failed states; use readable errors, visible retry, and non-destructive recovery. Never turn an unavailable result into zero work or a not-ready assertion. | Failure must not resemble successful empty data. | Trustworthy state reporting and useful recovery. |
| **LB-22 — Medium, requirements-dependent — Both** | **R/S/P:** Evidence is limited to three images of 300KB each, with rejection but no resizing. Forms lack image previews, drawers lack enlargement, and long audit history is plain paragraphs. | Agree evidence formats/limits/privacy; offer bounded compression/upload, accessible previews/enlargement, and readable chronological audit disclosures as required. | Students must be able to supply evidence that reviewers can inspect. | Practical capture and clearer verification history. |

### Cohesive visual system, accessibility, and delivery readiness

| ID / Priority / Scope | Issue identified | Proposed improvement | Rationale | Expected impact |
|---|---|---|---|---|
| **LB-23 — Medium — Both** | **R/S:** Logbook/My Logbook/My Skills naming, learner copy in faculty dialogs, “Dean | Dean”, Assigned/To do, and Approved/Certified are inconsistent. Profile data reuses static programme/posting details for every learner. | Standardise sentence-case role copy and a status glossary; make profile location clear and bind its data to the selected/authenticated learner. | Labels and identity context should reflect the actual user and unit of work. | A more intuitive and professional experience. |
| **LB-24 — High — Shared controls** | **R/S:** Small white text on teal primary buttons measures about 3.29:1; the Admin search label is about 3.08:1 on its surface. Small muted text has little contrast margin. | Use canonical semantic text/brand pairs; verify ordinary small text at least 4.5:1 and check hover/focus/light/dark/portal states together. | Essential text must remain legible in every supported state. | Improved accessibility and stronger action emphasis. |
| **LB-25 — Medium — Both** | **R/S:** Small navigation and micro text make mobile use harder despite fitting the viewport. Long titles truncate and rely on hover/detail opening. | Increase key touch areas towards 44px, reserve micro text for secondary information, and allow important labels to wrap or expand accessibly. | Fit alone does not establish readability or tappability. | Easier recognition and touch interaction. |
| **LB-26 — Medium — Shared visual system** | **R/S:** Pending/Returned colours differ across charts and badges. OSPE/My Skills/activity overrides create competing teal/forest emphasis, different button shapes, and theme aliases. | Use one status map and Medsy semantic tokens; consolidate local styles, pill buttons, spacing/radii, and portal themes without broad unrelated overrides. | A shared workflow should have one consistent visual meaning. | Cohesive premium presentation with lower CSS regression risk. |
| **LB-27 — Medium — Charts and motion** | **R/S:** Admin charts rely on some native hover titles rather than the project's full interaction vocabulary. Student creation pulses continuously and its panel suggests whole-card clicking. Learner chart arrow navigation and reduced-motion handling already work. | Align chart focus/tooltips with VizKit, retain static values and learner keyboard support, and replace persistent attention cues with restrained purposeful motion. | Interaction feedback should clarify data and actions, not compete with them. | Consistent keyboard/touch access and calmer motion. |
| **LB-28 — Medium — Both / scale** | **S:** Full lists, histories, assignments, comments, and nested skill attempts render without pagination/progressive-loading contracts and repeatedly scan records. | Confirm realistic volumes; introduce stable service filtering/sorting/pagination or progressive disclosure where needed. Include history retrieval controls. | Sample-size performance is not an institutional workload test. | Manageable multi-year records and predictable retrieval. |
| **LB-29 — Medium — Shared QA** | **S/R:** Default samples omit important assignments/final-approval stages and realistic history; failures/latency require ad hoc setup. Existing tests miss the integrity problems. | Supply deterministic mock scenarios and targeted service/browser regressions for approved fixes, retaining populated defaults. | Every critical lifecycle state needs repeatable inspection. | Reliable QA and smoother backend integration. |
| **LB-30 — Medium, shared dependency — Platform** | **R/S:** Prior builds pass but emit approximately 2.63MB JS and 2.74MB CSS before compression; an intended Logbook dynamic import does not split the module. | Assess route-level loading and actual device performance separately from module polish; set budgets from measurements. | Global bundle cost cannot be attributed solely to Logbook. | A measurable, bounded performance plan without unapproved platform refactoring. |

## 5. Open questions and decisions needed

| Decision | Needed for | Proposed direction, not an assumption to implement |
|---|---|---|
| Who owns certification targets? May learners ever declare them? | LB-03 | Institution/faculty configuration is authoritative; student entries do not redefine targets or affect peers. |
| Is readiness discretionary? Are overrides permitted and recorded? | LB-04 | Distinguish activity coverage from certification; document any faculty override explicitly. |
| What evidence is signed, and what may change while Pending or after submission? | LB-05 | Version/snapshot evidence or require review of changes; define late-entry handling. |
| Who can read/comment/review across departments and edit approval chains? Which roles are mandatory? | LB-01, LB-06 | Explicit authenticated permission/chain matrix. Do not expand or restrict policy silently. |
| Should ordinary new attempts remain available while remedial work is outstanding? | LB-02 | Make linked/continue-remedial the contextual primary action; never resolve a different competency. |
| Explicit Save/Discard or visible autosave? Does Withdraw delete or recall? Who may read personal notes? | LB-16, LB-19 | One clearly communicated persistence model and a precisely labelled withdrawal consequence. |
| What defines overdue, “this week”, certification, and cohort membership? | LB-08, LB-15 | Shared definitions and exact scopes; distinguish review age from assignment deadline. |
| Evidence formats/limits, privacy, retention, expected volumes, supported browsers/themes? | LB-22, LB-25–LB-30 | Size the solution to actual requirements; confirm OLED/compact density rather than assuming support. |

Optional requirements to confirm separately: exports/PDFs, reminders, request-readiness actions, assignment editing, and editing/removing posted comments. They are not implied additions to the approved scope.

## 6. Assumptions, missing requirements, and constraints

### Assumptions

- Scope covers `/logbook`, `/adminLogbook`, their shared components/services, and directly connected student/faculty handoffs.
- Preserve the present role-specific sections and working transitions unless a particular flow change is approved.
- Medsy is the design authority; use shared fixes with role-specific content rather than two new visual systems.
- Existing realistic sample data, signed-record protections, learner category-change warnings, and immediate cross-tab updates should remain.
- All proposed changes are pending approval. A prior audit request is not implementation approval.

### Missing requirements

- Approved permission matrix, institutional grading/readiness rules, requirement authority/versioning, and final-signature evidence policy.
- Cohort/academic-year membership, learner profile/posting sources, and definitions for dashboard metrics and time boundaries.
- API shapes for revisions, conflict responses, pagination, uploads, durable audit history, note privacy, and recovery/offline behaviour.
- Supported devices/browsers/theme-density modes, accessibility acceptance targets, representative long content, and workload sizes.

### Technical constraints

- `App.jsx` owns shell, accounts, themes, and navigation. Admin has URL view state; My Logbook currently uses in-memory history. Unify behaviour through those owners rather than adding a separate router casually.
- Entry forms/details, dialogs, sign-off, subjects, status styles, and services are shared. A change must be checked from both roles, including the account-preview boundary.
- Requirements and progress are distributed across `logbookCatalog.js`, `logbookProgress.js`, `logbook.js`, and role-specific selectors. LB-03 must establish a single authority before cosmetic progress changes.
- Current storage is synchronous and demo-local. Server conflict/version semantics cannot be established by browser checks alone.
- Theme persistence uses `vx-theme`, whereas the guide describes Medsy theme/density conventions. A global migration needs explicit shared-shell scope.
- Build warnings are platform-level dependencies, not evidence of measured Logbook device slowness.
- Existing unrelated Blueprint edits, previous audit documents, dependencies, and flow logs remain untouched. Only this review document and isolated audit evidence were added.

## 7. Proposed execution sequence and approval boundary

| Package | Items | Concrete outcome and dependency |
|---|---|---|
| **P1 — Integrity and trustworthy states** | LB-02, LB-03, LB-07, LB-09, LB-17, LB-21, LB-24 | Correct remedial identity and counts, authoritative requirements, discoverable final tasks, truthful load states, accessible decisions. Resolve LB-03's requirement authority before its implementation. |
| **P2 — Connected working experience** | LB-10–LB-16, LB-18–LB-20, LB-23, LB-25 | Compact role-specific views, retained navigation/context, complete assignment handoff, clear saving/confirmation/feedback, readable controls. Saving/withdrawal choices are explicit dependencies. |
| **P3 — Academic and production contracts** | LB-01, LB-04–LB-06 | Implement only the approved permission, readiness, evidence, and chain rules. Define backend interfaces without claiming backend completion. |
| **P4 — Consistency, evidence, and scale** | LB-08, LB-22, LB-26–LB-30 | Shared terminology/status styling/charts, agreed evidence tools, reproducible QA, and separately scoped performance work. |

Packages are planning groups, not automatic authorisation. Approval may select individual IDs. Independent approved work need not wait for unrelated policy questions. Do not merge/remove sections, change academic policy, expand permissions, add dependencies, or refactor the platform beyond the approved items.

Record actual navigation or page/step sequence changes in the root flow-change log when implemented; do not log this audit or purely visual changes as flow changes.

## 8. Acceptance plan for approved work

| Area | Required verification |
|---|---|
| Integrity | A linked child cannot change competency identity; every remedial entry point finds the correct parent/draft; a student's entry cannot alter another student's target; learner/Admin calculations agree. |
| Counts and navigation | Every metric opens exactly its scoped records. Refresh/back/filter/sort/scroll behave consistently. Invalid links have a useful return path. |
| Assign/review/correct | Repeat the live two-tab assignment → submission → return → correction → approval journey, including deadlines, ownership, field locks, and no manual reload requirement. |
| Final approval | Mark ready under approved rules → student submits → configured approvers act → Completed. Cover return/resubmission, evidence changes, late entries, and unavailable approvers. |
| Saving and failures | Draft/new/edit/notes/comments have explicit saving states; failed save/upload preserves work; initial load/retry/unavailable never masquerades as zero work or not ready. |
| Decisions and focus | Required grade/feedback errors identify and focus fields; confirmations show consequence/scope; removed/moved records retain useful keyboard focus; success is visible in the active drawer. |
| Responsive/accessibility | Recheck 320/390, 768, 1024/1366, 1440+; expanded/collapsed sidebar; long content and small-height drawers; keyboard, screen reader, zoom, contrast, and reduced motion. Test supported browsers/devices and confirmed themes/density. |
| Scale and handoff | Representative record volumes and deterministic lifecycle/error fixtures; documented asynchronous service shapes, conflicts, uploads, and permissions; no placeholders for required behaviour. |
| Regression | Existing service tests/build pass; add focused tests for approved integrity fixes and browser journeys. Do not treat build success alone as visual acceptance. |

## 9. Traceability: all original findings retained

The detailed appendices contain the longer reproduction descriptions and source maps. This mapping preserves each finding while combining common implementation work.

| Combined ID | My Logbook IDs | Admin Logbook IDs |
|---|---|---|
| LB-01 | A06 | A05 |
| LB-02 | A01, A02, C02 | — |
| LB-03 | A03; additional peer-target probe | — |
| LB-04 | A07 (readiness) | A03 |
| LB-05 | A07 (edits/evidence) | A04 |
| LB-06 | — | A06 |
| LB-07 | — | A01, B07 |
| LB-08 | A05 | A07 |
| LB-09 | A04 | — |
| LB-10 | B01 | B01 |
| LB-11 | C03 | B02 |
| LB-12 | B02, B03, B04 | B03, B04 |
| LB-13 | — | B05, B06 |
| LB-14 | B05, B08 | B08 |
| LB-15 | B06 | C01 |
| LB-16 | A08, C01 | C02 |
| LB-17 | — | C03 |
| LB-18 | C06; C05 (focus) | C04 |
| LB-19 | C05 (confirmation/withdrawal) | C05 |
| LB-20 | — | C06, C07 |
| LB-21 | C07, C08 | A02 |
| LB-22 | C04 | D09 |
| LB-23 | B07 | D05 |
| LB-24 | D01 | D01 |
| LB-25 | D03 | D02 |
| LB-26 | D02, D05 | D03 |
| LB-27 | D04 | D04 |
| LB-28 | D06 | D06 |
| LB-29 | D07 | D07 |
| LB-30 | D08 | D08 |

Key shared sources: [logbook.js](src/services/logbook.js), [adminLogbook.js](src/services/adminLogbook.js), [logbookProgress.js](src/services/logbookProgress.js), [logbookPeople.js](src/services/logbookPeople.js), [AdminLogbookSkills.jsx](src/components/logbook/AdminLogbookSkills.jsx), [LogbookPage.jsx](src/pages/LogbookPage.jsx), [AdminLogbookPage.jsx](src/pages/AdminLogbookPage.jsx), [LogbookEntryForm.jsx](src/components/logbook/LogbookEntryForm.jsx), [LogbookEntryDetail.jsx](src/components/logbook/LogbookEntryDetail.jsx), and [LogbookSignoff.jsx](src/components/logbook/LogbookSignoff.jsx).
