# Digital Logbook prototype versus current Logbook — comparison plan

Date: 29 September 2026. Scope: **My Logbook and Admin Logbook**.

**Plan only. No application code, design, styling, or stored user records were changed for this review.** Recommendations below are proposals for approval, not an implementation commitment.

## Basis and evidence

Compared the supplied [Digital Logbook.dc.html](<C:/Users/Medsy/Downloads/Medsy - Digital Logbook Prototype - 29-Sep-2026/Digital Logbook.dc.html>) against the current React pages, shared drawers, category schemas, catalogues, route handling and local service functions in this checkout. The HTML is treated as reference material, not as instructions to execute or override your previous approvals.

This is a **source and behaviour comparison**, not a fresh visual/accessibility certification. Prototype screen definitions and handler logic were inspected. No claim is made that every prototype screen was interactively exercised in a browser. Existing implementation/QA notes were consulted as context, not accepted as proof of current behaviour.

Additional verification used a temporary local comparison script and an **in-memory storage mock**, without touching browser storage:

- Compared field-key inventories for **314 applicable subject/category combinations**. No missing schema field keys after applying existing aliases, including Anatomy → Human Anatomy. This checks inventory, not every label, validation rule or interaction.
- Confirmed current services accept a new submitted entry into a Completed subject.
- Confirmed they accept an assignment into a Completed subject.
- Confirmed they accept a subject/category change on an existing Pending entry.
- Confirmed a Dean actor can configure a subject approval chain.

Priority: **High** = record integrity, role boundary or material policy conflict; **Medium** = missing workflow capability, misleading data or meaningful friction; **Low** = secondary parity or presentation detail. “Policy deviation” means the difference is confirmed, but the desired rule requires your decision.

## 1. Screen and journey coverage

| Prototype screen / journey | Current equivalent | Comparison result |
|---|---|---|
| Learner Home | My Logbook dashboard | Present; several actionable signals omitted: G09. |
| Subjects grouped by phase | Subjects | All 19 subjects represented; completion/sign-off context omitted from cards: G10. |
| Subject logbook and category records | Subject workspace | Present, including certification attempts and subject approval. Record grouping/title differences: G14. |
| Pending approvals, grouped by faculty or subject | All entries → Pending / Needs action | Flat filtering exists; dedicated grouping and waiting-age context are missing: G08. |
| Learner Search | All entries search card | Present and enhanced with filters; searchable content differs: G13. |
| Learner Profile | Header profile action | Present; real profile/enrolment/posting data remains incomplete: C01/C04. |
| New entry / save draft / reopen draft | Entry accordion drawer | Core journey present; reopened-draft close behaviour differs: G11. |
| Assigned task → progress save → submit | Assignment and entry drawers | Present with locked task fields; completed-subject exclusion missing: G02. |
| Pending entry → edit / withdraw | Entry detail and edit drawer | Present; pending context is not locked: G03. Returned withdrawal differs: G18. |
| Returned ordinary entry → correct → resubmit | Edit and resubmit | Present under the same record ID. |
| Returned certifiable skill → linked repeat/remedial | Linked remedial entry | Present, with stronger matching/duplicate checks than the HTML. |
| Entry notes, comments and evidence | Shared entry drawer | Present, but faculty cannot read learner notes and initial-comment entry is absent: G07/G12. |
| Faculty Overview | Admin dashboard | Present with queue, risk, assignment and sign-off entry points. |
| Faculty Queue → individual/bulk decision | Queue + shared review drawer | Present; ordinary records can be bulk approved, graded skills require individual review. |
| Faculty Students → student detail | Students + student detail | Present; cohort/department scope differs: C04. |
| Faculty Subjects → subject → category/activity/student | Subjects + grouped records | Present; grouping keys omit some category identifiers: G14. |
| Faculty Categories → category detail | Categories | Present. Current empty configured categories remain discoverable. |
| Faculty Skills → student attempts | Skills | Present; status buckets and draft-derived skills need attention: G15/G16. |
| Faculty History | My signed history | Present, including earlier decisions after resubmission. No missing prototype history-filter feature was established. |
| Faculty Search | Search | Present; broader subject scope, but notes are not indexed: G13/D06. |
| Approval-chain configuration | Subject → Configure approval chain | Add/remove/reorder/reset exists; authority differs: G05. |
| Faculty ready → learner submit → HoD → Dean → Director | Subject approval / Sign-offs | Present, including return and resubmission; sealing and some lifecycle details differ: G01/G02/G19/G20/C03. |
| Dean/Director role-specific navigation | Office account Admin Logbook | Present: Dashboard, Subjects, Sign-offs and Search. Legacy learner review route is a separate concern: G04. |

## 2. High-priority findings

### G01 — Completed subject logbooks remain writable

- **Area/type:** Both pages; business-rule deviation, integrity risk.
- **Prototype:** `isSealed`, `saveDraft`, `submit`, `editEntry`, `logRemedial` and `withdraw` block changes to signed-off subject records. The subject picker marks signed-off subjects.
- **Current:** Individual Approved entries are locked, but the subject's Completed status is not checked by entry saving or creation. Subject actions still offer Create entry / Log attempt. The final approval drawer explicitly says later submissions remain available as late entries.
- **Evidence:** HTML lines 2381, 2820–2907; `src/services/logbook.js:111`; `src/components/logbook/LogbookSubjectDetail.jsx`; `src/components/logbook/LogbookSignoff.jsx` Completed message. New-entry acceptance reproduced in memory.
- **Proposed action:** Decide whether final approval seals the subject or permits an audited addendum. If sealed, use one shared lifecycle rule in services and actions, including drafts, corrections and remedial attempts. Keep notes/comments separate according to the chosen policy.
- **Rationale/impact:** A final signature must have a clear meaning; later changes should not silently alter the approved body of work.
- **Open question:** The HTML itself has an older comment at line 2342 saying late entries remain possible, contradicted by its later executable sealing guards. Which policy is authoritative?

### G02 — Assignments do not exclude signed-off learners

- **Area/type:** Admin assignment → My Logbook task; missing eligibility rule.
- **Prototype:** Individual assignment to a sealed logbook is refused. A batch skips sealed logbooks and reports the skipped count.
- **Current:** `assignEntries` sends to every selected learner, including Completed subjects; success text reports all recipients saved.
- **Evidence:** HTML lines 2539–2545; `src/services/adminLogbook.js:57`; `src/components/logbook/LogbookFacultyActions.jsx:11`. Acceptance reproduced in memory.
- **Proposed action:** Once G01 is decided, apply the same eligibility check to recipient selection and service saving, and report assigned/skipped counts accurately.
- **Rationale/impact:** Avoids issuing tasks that contradict the subject's completed state.

### G03 — A submitted Pending entry can change subject and category

- **Area/type:** My Logbook edit; workflow/identity discrepancy.
- **Prototype:** `editEntry` opens the existing submitted record with `lock: true`; subject and category stay fixed.
- **Current:** Form locking covers linked remedials, assignments and Returned entries, but not ordinary Pending entries. The service also permits the change and can move the same record ID into another subject/category/reviewer context.
- **Evidence:** HTML lines 2865–2868; `src/components/logbook/LogbookEntryForm.jsx:31`; `src/services/logbook.js:111`. Acceptance reproduced in memory.
- **Proposed action:** Keep submitted context immutable during correction; if moving a submitted record is required, define an explicit audited transfer workflow rather than reusing normal editing.
- **Rationale/impact:** Preserves review ownership, reporting and the meaning of a submitted record.

### G04 — A legacy learner route exposes faculty review controls

- **Area/type:** My Logbook routing and role handling; current implementation concern.
- **Prototype:** Learner and faculty actions are separated by role routes and the faculty persona.
- **Current:** `?name=faculty` is read from the URL without a view allow-list. `LogbookPage` renders faculty detail mode on that route without passing an authenticated reviewer; the detail component defaults to `REVIEWERS[0]`. `App.jsx` also retains a `logbookReview` route handoff. Entries addressed to that default actor can become actionable in the local preview flow.
- **Evidence:** `src/services/useLogbookNavigation.js:7`; `src/pages/LogbookPage.jsx` faculty branch and detail props; `src/components/logbook/LogbookEntryDetail.jsx:22`; `src/App.jsx:683`.
- **Proposed action:** Retire or explicitly restrict the legacy route, resolve actors from the intended account boundary, and reject faculty mutations from learner context. Validate direct URLs as well as visible navigation.
- **Rationale/impact:** Prevents review controls and decisions appearing through an unintended learner entry point. This is a code-confirmed local role-boundary issue, not a claim of a tested production authentication exploit.

### G05 — Approval-chain editing authority is broader than the prototype

- **Area/type:** Admin; policy deviation.
- **Prototype:** Only the subject's department can edit its chain (`canEditChain`). Dean/Director views are not department editors.
- **Current:** Both UI and service permit Dean/Director editing for any subject. The service also allows the global-chain branch when no subject is supplied without an equivalent actor check. The default HoD account belongs to every subject, unlike the prototype's department-specific head.
- **Evidence:** HTML lines 2373–2378; `src/services/adminLogbook.js:80`; `src/services/logbookPeople.js` HOD definition; `src/pages/AdminLogbookPage.jsx` ApprovalChain condition. Dean subject-edit acceptance reproduced in memory.
- **Proposed action:** Confirm who owns chain configuration, distinguish department and institute-wide permissions, and define subject-specific HoD resolution.
- **Rationale/impact:** The approval path should not be configurable by an unintended role. Broader institute authority may be valid, but it must be explicit.

### G06 — Same storage key, incompatible prototype/app record formats

- **Area/type:** Both; conditional migration/data concern.
- **Prototype/current:** Both use `medsy-logbook-deltas-v3`, but the HTML uses fields such as `student`, `compNo`, `assigned`, `decided`, top-level `signoffs`/`chains` and prototype category IDs. The app expects `studentId`, `competency`, `assignment`, `audit`, `workflow.signoffs` and mapped category IDs.
- **Current gap:** `readDeltas` checks the outer container, not a prototype-to-app migration. `belongsTo` defaults an ownerless record to MC2568. Prototype records copied into the same storage namespace could be misattributed or lose functional workflow interpretation.
- **Evidence:** HTML lines 1697–1701, 2376, 2542, 2915–2935; `src/services/logbook.js:26–53`; `src/services/logbookPeople.js` belongsTo; `src/services/adminLogbook.js:19`.
- **Proposed action:** Use an explicit schema version and a validated migration/import adapter if prototype data must transfer; otherwise isolate namespaces and reject incompatible records with a recovery message.
- **Rationale/impact:** Avoids interpreting old data as a different learner or workflow. This is conditional: a separately opened HTML file and the app normally have different origins, so shared data has not been assumed.

## 3. Medium-priority findings

| ID | Area / issue | Prototype versus current evidence | Proposed improvement | Rationale / expected impact |
|---|---|---|---|---|
| G07 | Faculty cannot read learner notes | HTML 2790–2805 and 3333 explicitly make notes visible/read-only to faculty. `LogbookEntryDetail.jsx:67` renders notes only for learners; faculty receives neither the text nor its edited timestamp. | Confirm shared/private meaning, then expose the appropriate read-only content and clarify the learner label. | Restores review context and avoids ambiguity from “Personal notes”. Do not silently turn genuinely private notes into shared data. |
| G08 | Pending follow-up grouping is absent | HTML 3050–3060 creates By faculty / By subject groups, oldest waits and waiting labels. Current `LogbookPage.jsx` redirects pending to Search; `LogbookViews.jsx` provides a flat list without reviewer grouping. | Preserve the current page design and add the missing grouping/follow-up behaviour if approved. | Learners can find which faculty or subject needs follow-up instead of scanning individual rows. |
| G09 | Learner dashboard omits several action signals | HTML 2970–3000 includes skills certified/in progress, requirements not started for begun postings, over-14-day/oldest waits, nearest posting deadline/outstanding work, and this-week logging count. `LogbookDashboard.jsx:24` has Total, Pending, Approved and Needs action but no equivalent set. | Restore approved metrics using reliable requirement/posting data; keep metric units and click destinations explicit. | Supports “What am I missing?” and “What is due soon?” rather than only record counts. Posting data needs C01. |
| G10 | Subject cards lack final-approval status | HTML `subjectCard` 2629–2640 shows Ready/Returned/Awaiting/Completed plus approver/date, separate from phase completion. Current `LogbookSubjectCard.jsx` gets no workflow data and shows count/attempt progress only. | Feed final-approval metadata into the existing subject-card content; keep phase completion and formal sign-off distinct. | Users can find a ready/returned/signed-off logbook before opening each subject. |
| G11 | Reopened drafts/tasks do not auto-save on close as the prototype does | HTML `closeForm` 2860 auto-saves changed drafts and assigned-task progress. Current `LogbookPage.jsx` opens existing drafts/tasks as `mode: 'edit'`; `LogbookEntryForm.jsx:114` auto-saves only when mode is not edit, so a close confirmation is shown instead. | Decide between consistent explicit save or prototype auto-save, and distinguish draft/task mode from submitted editing. | Predictable close/Escape behaviour. Current confirmation protects changes; this is a workflow deviation, not proof of silent loss. |
| G12 | Cannot compose the first comment in the entry form | HTML `collect` 2125–2138 keeps `extra.comment` in drafts and appends it to the thread on submission. Current form has remarks, notes and photos, but no initial-comment field or equivalent conversion. Comments can be posted after opening the saved entry. | Add the initial-comment step only if required; preserve unsent text and append it exactly once on submission. | Avoids an extra reopen/post journey and preserves prototype draft-comment behaviour. |
| G13 | Search indexes differ between roles and prototype | HTML learner search includes category names/short names and faculty codes; faculty search includes learner notes. `logbook.js:95` omits category labels and faculty IDs; `AdminLogbookPage.jsx` search omits notes. | Define a shared search-field contract with role-appropriate visibility; include the approved fields consistently. | Searches such as a category name or note-only phrase should behave predictably. Scope expansion is a separate decision, D06. |
| G14 | Generic titles and grouping omit category-specific identifiers | HTML `entryTitle` 2570–2593 and `itemParts` 2438–2450 use module, exercise, specimen, session type, procedure participation and other category-specific context. Current `logbook.js:33` is a fallback chain and `logbookPresentation.js` groups by category + competency + that title. | Define category-aware display titles and stable grouping keys using existing fields. | Separates, for example, two specimens with the same diagnosis or two session types sharing a topic; improves emergency/immunisation/medico-legal record discoverability. |
| G15 | Drafts/tasks can create apparent skill progress | HTML `skills` 2600 excludes Draft and To do. Current `collectSkills` reads all graded records; `skillProgress` includes their attempts, and subject detail treats a To do attempt as “In progress” because it only excludes Draft in that check. | Keep configured not-started skills visible, but exclude unsubmitted records from logged/started attempt metrics. | Separates catalogue availability, assigned work, drafts and real submitted performance. |
| G16 | Count/status definitions are inconsistent | `LogbookSubjectCard.jsx:14` counts To do as “entries logged”; dashboard Total includes Draft but its Logged entries destination excludes Draft and includes To do (`LogbookViews.jsx`). In `AdminLogbookSkills.jsx:39`, “in progress” includes remedial students and “remedial” counts them again. HTML excludes Draft/To do from live records and uses exclusive skill-status buckets. | Establish one counting contract, make tile destinations return the counted set, and separate mutually exclusive statuses. | Prevents counts changing meaning between dashboard, cards, lists and certification views. |
| G17 | Text limits differ and are not uniformly service-validated | HTML `MAX_REMARK` is 500 for notes, comments and assignment instructions. Current notes allow 4,000; comments/instructions allow 2,000; remarks remain 500. `updateLogbookEntry` does not enforce the UI notes/comment limits, and assignment/review services do not consistently enforce text maxima. | Agree per-field limits, then enforce and document them in form and service contracts. | Predictable validation and backend handoff; longer limits are not inherently wrong, but are an unconfirmed deviation. |
| G18 | Returned-entry withdrawal is unavailable | HTML `withdraw` 2887 accepts Pending, Returned and Draft (subject-sealing restrictions also apply). Current `updateLogbookEntry` allows only Draft/Pending; the UI prevents deletion of Returned entries and assignments. | Confirm allowed deletion states, retention and handling of linked attempts. Preserve your approved explicit deletion confirmation. | Resolves whether learners may remove erroneous Returned records. This is distinct from the already approved meaning of “Withdraw” as deletion. |
| G21 | Default examples do not cover the revised schema/lifecycle completely | HTML seeds cover multiple category types and final-approval stages. Current `logbookSample.js` includes older examples, e.g. Pending ccp `im-2` has no age/gender or P/A selection required by the current schema. Default workflow has no sign-offs; separate scenario fixtures exist. | Keep default examples schema-consistent; make read-only/test fixtures cover Ready/Submitted/Returned/Completed, sealed assignments and each conditional form. | Avoids demos that approve incomplete historical samples and ensures missing policy paths can be tested. Do not overwrite a user's saved records. |

## 4. Low-priority parity differences

| ID | Issue | Evidence and consequence | Proposed action / expected impact |
|---|---|---|---|
| G19 | Faculty can mark a Returned subject Ready again | HTML `markReady` 2382 rejects any existing sign-off; the learner fixes/resubmits a Returned sign-off. Current `changeSignoff` accepts ready from Not ready or Returned. | Decide whether re-readiness is a supported intervention. If yes, record why; otherwise retain the direct learner resubmission path. Removes an ambiguous extra state transition. |
| G20 | Sign-off/attestation detail loses some prototype context | HTML `signLabel` 2712 and entry detail distinguish facilitator/faculty labels and a named learner acknowledgement. HTML subject approval shows “Marked ready by” and “Submitted” summaries and decision steps. Current detail uses generic learner confirmation/decision dates; readiness is in collapsed history. A Returned subject's step list labels all steps Upcoming, leaving the earlier decisions only in history. | If those distinctions are institutionally meaningful, show them within existing detail sections and distinguish the returned round from the upcoming resubmission round. This is a metadata/clarity proposal, not a request for a drawn-signature feature. |

## 5. Shared concerns and missing requirements

These are **not features proven to be implemented by the HTML and missing from the app**. They need decisions for production readiness.

| ID / priority | Concern | Evidence / uncertainty | Proposed decision or work |
|---|---|---|---|
| C01 / High | Institutional requirements, certification catalogue and posting calendar are incomplete | HTML explicitly uses mock category minimums and a mock rotation calendar. App matches category minimums, but certification targets are sample data for only a subset of subjects; actual cohort/year/posting configuration is absent. | Supply authoritative requirements, effective versions and learner posting/enrolment data. Your approved catalogue-owned target rule stays in place. |
| C02 / High | Both implementations are local prototypes, not authenticated shared records | App uses localStorage, sample actors, in-browser evidence and no server revision checks. Re-reading storage narrows stale-state risk but is not an atomic cross-tab/network transaction. Notes/comments/withdraw service calls do not themselves require an authenticated owner. | Define authenticated actor/ownership enforcement, revision conflicts, durable uploads, server persistence and pagination. Do not describe current sample role switching as authentication. |
| C03 / High | Final approval snapshots the chain, not the record set | Both snapshot approvers on submission, but derive displayed entries/progress live. Current later sign-off approval does not re-check new Pending/To do records; work can change while a chain is underway. HTML also lacks a full immutable record snapshot. | Decide whether to freeze records, snapshot a revision, or invalidate/restart approval when underlying work changes. Test additions/assignments between submission and each signature. |
| C04 / Medium | Cohort membership and department scope are sample assumptions | HTML uses a one-department persona and a roster derived from department activity. App supports multi-department actors, uses all three sample learners in skill denominators, combines department requirements for risk, and gives one HoD all subjects. Different sample names/counts alone are not defects. | Define enrolled learners by subject/posting, responsibility scopes and department-specific heads. Use that denominator for risk, progress and batch assignment. |

## 6. Fields/data and validation comparison

The **category-field inventory is substantially implemented**. There is no evidence that entire category forms need rebuilding.

| Category / group | Field coverage in current app | Difference / caveat |
|---|---|---|
| Skill competency | Competency, activity, completion date | Present. |
| Certifiable skill | Competency, activity, date, phase-dependent required count, faculty attempt/rating/decision | Present. Required count is catalogue-owned by prior approval, D01. |
| Linked repeat/remedial | Parent link, competency/activity/date, faculty repeat/remedial grading | Present. App stores the original category with linkedTo rather than a separate remedial category, D04. |
| ECE / AETCOM | Competency or module, topic/date, four reflection prompts | Present. Reflection optionality matches the prototype; do not make it mandatory without a policy decision. |
| Vertical / horizontal integration | Competency, topic, departments, date | Present. |
| SDL | Competency/topic/date; DVL-only teaching week | Present. |
| Small-group teaching / Journal club-CPC | Session type, topic, date, attended/presented role | Present. |
| Practical / simulation | Exercise/activity/date/observation; station/activity/date/attempt number | Present. |
| Procedure | Procedure, patient reference, date, four participation options | Present in active schema; simplified older FIELDS metadata must not be used as the API schema. |
| Clinical case presentation | Serial, patient reference, age/gender, diagnosis, P/A, date, three reflections | Present; older sample data can omit newer required fields, G21. |
| Clerkship | Serial, patient reference, age/gender, provisional diagnosis, admission/discharge dates | Present. The app derives its record date from discharge/admission; the HTML uses submission date separately from clinical field dates. Keep these meanings distinct. |
| Emergency / OBGY / paediatrics | Duty shift/cases; delivery type/patient/parity/outcome; clinic type/children/vaccines | Present. Title and grouping context can be lost, G14. |
| Postmortem / pharmacology / specimens | Record/exercise type and case/drug/findings; specimen number/identification/date | Present. |
| FAP | Place, families, visit date, members, findings, follow-up | Present. |
| Field visit/survey | Optional survey day/village/data count, date, analysis, presentation, visit place and reflections | Present; visit place is required in the second group in both implementations. |
| Community health / achievements | Activity type/place/date/beneficiaries/findings; serial/activity | Present. |
| Additional information | Remarks, notes, attachments, comments | Notes visibility, initial comment and limits differ: G07/G12/G17. Evidence implementation is more complete than HTML placeholders, D03. |
| Assignment metadata | Assigner, date, due date, instructions, locked values | Present. Prototype TASK_KEYS includes numReq; its omission from current assignable fields follows approved catalogue target ownership. No unrelated missing assignment-field set was established. |
| Final approval metadata | Subject/student/status, chain snapshot, current step, history, completion timestamp | Present. Ownership, sealing and returned-step presentation differ. Prototype storage shape is incompatible without migration, G06. |

Validation coverage already present:

- Subject/category applicability and valid subject-department reviewer selection.
- Required first-group record fields; optional reflection groups except explicitly required fields.
- Real calendar-date validation, no future clinical dates, and discharge on/after admission.
- Positive whole-number validation for submitted counts; valid option checks.
- Learner acknowledgement before submission; faculty-only grading controls.
- Attempt/rating required for graded decisions; no First attempt on a linked remedial; return feedback required.
- Assigned subject/category/reviewer and faculty-supplied fields locked.
- Remedial parent ownership, subject/category/competency matching and duplicate prevention.
- Assignment due date from today onwards, and details or instructions required.
- Nonempty, duplicate-free approval chain; only the current snapshotted approver advances it.

Validation gaps/deviations requiring attention: completed-subject guards, Pending context immutability, role enforcement, prototype-data migration, per-field length contract, and optional subject/record revision locking while final approval is underway. These are covered above rather than counted twice.

## 7. Intentional/current improvements — do not classify as missing work

| ID | Difference to preserve unless separately changed |
|---|---|
| D01 | **Previously approved:** catalogue-owned certification targets and explicit unknown-target labels. HTML derives targets from logged numReq values and can fall back to one. Do not restore that behaviour automatically. |
| D02 | **Previously approved:** faculty-discretionary readiness with distinct logged coverage, approved attempts and certified skills. Matching every category minimum is not currently a mandatory sign-off gate. |
| D03 | **Previously approved:** real JPG/PNG/WebP evidence with bounded compression/previews, three images, 300 KB stored-photo limit. HTML only stages attachment names. |
| D04 | Category/key aliases and linkedTo-based remedials preserve current stored records. Human Anatomy versus Anatomy and simulation/slab etc. are mappings, not missing screens. Migration remains a separate concern. |
| D05 | **Previously approved:** persistent explicit deletion/bulk/sign-off confirmations instead of short-lived two-tap confirmations. Return-state deletion eligibility remains an unresolved policy difference, G18. |
| D06 | App-owned URL/history, persistent filters, broader Admin Search, progressive lists, immediate shared-record refresh and recovery states improve on the prototype. Cross-subject search access should still be confirmed with institutional permissions. |
| D07 | **Your current instruction:** keep both header designs and the new single-row search/filter card. This comparison proposes no visual redesign, header replacement or reversion to prototype styling. |

## 8. Open questions before dependent implementation

1. Does final subject approval seal records, or allow explicitly audited late/addendum entries? What happens to existing drafts and to comments/notes after sealing?
2. May learner records change while a final-approval chain is in progress, and should changes restart approval?
3. Are notes shared with faculty, as the HTML states, or private? Existing note data must not change visibility silently.
4. Who may edit approval chains: subject faculty, subject HoD, Dean/Director, or a separate institutional administrator?
5. May Returned records be deleted? How should deletion interact with remedial links and review history?
6. Should prototype-created data transfer into this app? If yes, provide the intended import scope and identity mappings; no import is authorised by this review.
7. Which text limits, close/save behaviour and initial-comment workflow should be authoritative where the app differs?
8. What are the real subject/cohort memberships, certification targets, posting dates and department-specific HoD assignments?

## 9. Assumptions and technical constraints

- The latest HTML is the comparison reference; your explicit previous policy approvals outrank conflicting prototype defaults.
- Existing Medsy appearance and approved header/filter layout are fixed constraints. Behavioural recommendations should fit existing components.
- Demo names, three versus larger sample cohorts and historical timestamps are not themselves feature defects.
- Local-storage same-origin collisions are conditional; neither shared origin nor existing corrupt data was assumed.
- HTML depends on its bundled support.js and design-system assets. Current app uses React components/services. Source parity does not establish identical runtime rendering or accessibility.
- No backend, authenticated permission model, institutional rules catalogue or production data migration specification was supplied.
- This review did not run a new cross-browser/device/screen-reader audit or change live data. It did run the isolated field inventory and four service probes described above.

## 10. Proposed approval sequence — no work started

1. **Resolve policy boundaries:** G01/G02/G05/G18 and C01–C04.
2. **Protect records and roles:** G03/G04, the approved lifecycle guards, and G06 if migration is required.
3. **Restore missing journey capabilities:** G07–G13 while keeping the current design.
4. **Align data semantics:** G14–G17, G19–G21, field contracts and representative fixtures.
5. **Verify the approved subset:** learner/faculty/HoD/Dean/Director journeys, direct URLs, returned/remedial paths, signed-off subjects, mixed-recipient assignment, count-to-list consistency, field boundaries and responsive behaviour.

Approve by IDs or choose a priority group. Items marked policy-dependent should only be implemented after that policy is resolved; the rest can be prioritised independently.
