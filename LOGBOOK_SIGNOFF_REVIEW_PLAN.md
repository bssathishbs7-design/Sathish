# Logbook sign-off review and implementation plan

30 September 2026. Scope: My Logbook and Admin Logbook, compared with Digital Logbook.dc.html. Plan only; no application code changed during this review.

## Expected end-to-end flow

1. Learner completes assigned activities and submits entries.
2. Addressed faculty approves or returns individual entries; graded skills retain their attempt/remedial history.
3. Department faculty opens Students > student > Subject readiness. Readiness requires an approved entry and no Pending entries or To do tasks. Coverage/certification informs discretionary faculty judgement; it is not a new automatic gate.
4. Learner sees Ready in My Logbook, opens subject approval and confirms submission against the displayed chain.
5. The configured chain is snapshotted. The current approver alone can approve or return. Submitted subject records remain locked.
6. Approval advances one step. Return requires feedback, unlocks the subject and sends it back to the learner.
7. After corrections and any necessary entry verification, the learner resubmits. The current configured chain starts from its first approver; earlier history remains available.
8. The final signature completes and seals the subject. Notes/comments remain available under the existing policy; signed record content stays locked.

## Evidence and limits

- Read current learner/admin pages, shared sign-off drawer, readiness components, routing, services and prototype executable rules.
- Re-ran all 34 existing Logbook service tests: passed.
- Re-ran 18 approval browser checks and six confirmation checks: passed. Includes returns from each of the three default stages, cross-tab learner updates, completion, mobile drawer containment, changed chains and stale confirmations.
- Additional isolated-browser probes reproduced: Ready absent for the planned Dean; drawer closes after an approval advances; office review URL uses a name query rather than student ID.
- These checks use browser-backed demo services and isolated test data, not a deployed backend. Broad browser/accessibility certification was not performed.

## Prioritised findings

| ID | Priority | Finding and evidence | Proposed change | Rationale / expected impact |
|---|---|---|---|---|
| SO-01 | High | Open student logbook loses exact review context. Office users navigate to a subject with a free-text student name; department users navigate to a student without retaining the selected subject. Confirmed in AdminLogbookPage signoffProps and the office browser route. | Carry student ID and subject as explicit route filters; display the selected context and provide a return link to the same approval. | Ensures the approver reviews exactly the student's submitted subject, even when names repeat, and can resume the decision. |
| SO-02 | Medium | After approve/return, the record moves out of Awaiting your signature; the drawer resolves selection against that list and disappears. A generic success notice remains. Browser reproduced after approve. Prototype resolves the selected record from the full sign-off store. | Resolve the selected approval independently of queue membership; keep a read-only outcome visible with next approver, returned-to-learner or completed state. Remove obsolete decision controls immediately. | Makes successful handoff explicit and preserves context without allowing a second decision. |
| SO-03 | Medium | Dashboard With other approvers and Completed logbooks cards both open the same unfiltered Sign-offs view. Other logbooks mixes Ready, Returned, in-flight and Completed records, without status/subject/student filtering. Source-confirmed. | Introduce route-backed sign-off filters and wire each metric to its matching state. Sort actionable/recent records predictably. | Makes dashboard counts actionable and allows users to find returned or completed approvals. This is an improvement beyond the prototype's similarly broad navigation. |
| SO-04 | Medium | Subject detail provides entry browsing and chain configuration but no per-student readiness/sign-off shortcut. Faculty must discover Students > student > subject separately. Source-confirmed; the prototype also puts readiness under Students. | Add compact per-student approval status and links from subject review to the existing readiness/details flow. Keep readiness authority unchanged. | Connects subject review with final approval without duplicating workflow logic or redesigning the header. |
| SO-05 | Medium | My Logbook subject approval exposes status in a row, while the submit action, next approver and returned feedback require opening the details drawer. Current dashboard shortcuts reach the subject, not the approval drawer. The prototype presents more approval context directly on the subject. | Show the next required action, current approver and a concise return-reason summary in the subject approval card; deep-link approval tasks to their details. Retain explicit submission confirmation. | Makes the learner handoff and returned-work instructions easier to discover. |
| SO-06 | Medium | UI submit eligibility checks pending/tasks, but the service also requires at least one approved entry. A Ready/Returned record with zero approved entries can still present an enabled submit action before service rejection. Source-confirmed edge case. | Use one shared eligibility result for readiness/submission controls and service checks, including reason text. | Prevents actions that are known to fail and explains the precise blocker. Keep existing discretionary coverage policy. |
| SO-07 | Medium | Return feedback is required by the service, but the UI permits confirmation without it; the error appears only after attempting the decision. Reproduced by the existing browser tests. | Validate empty/whitespace feedback before confirmation; associate the inline error with the field and focus it. | Avoids an unnecessary confirmation step and makes correction clear for keyboard/screen-reader users. |
| SO-08 | Low | Planned office approvers do not see Ready records before learner submission because these have no snapshotted chain. Browser reproduced for Dean. This also occurs in the prototype's Other logbooks list; it is not evidence of a missing approval stage. | If pre-submission visibility is desired, resolve the configured chain for Ready-only visibility and label Awaiting learner submission. Never grant approve/return before submission. | Provides pipeline visibility. Optional scope; confirm institutional preference before implementing. |
| SO-09 | Low | Sign-off lists show status but little timing context; timestamped events and returned-by details require opening history. No status-specific guidance appears in generic empty lists. Source-confirmed. | Surface submitted/returned/completed dates and returned-by attribution; use empty messages appropriate to the selected state. | Helps prioritisation and distinguishes no work from no matching results. Do not invent an overdue threshold. |

## What already works and must be preserved

- Ready and Returned learner tasks appear both on the dashboard and in Needs action results.
- Entry approval and final subject sign-off are separate processes.
- Department-only readiness and chain editing; addressed-faculty entry review; current-chain-step final approval.
- Planned chain shown for Ready details; frozen chain/history retained for submitted rounds.
- Owner-only learner submission, required return feedback, explicit decision confirmations and stale-confirmation protection.
- Returns from every default approval stage, restart at the first approver and preservation of prior rounds.
- Submitted/completed record locks, sealed-work exclusion from learner action lists and completion updates.
- Approval history already exists; rebuilding it is not proposed.

## Implementation sequence after approval

1. SO-01: exact review navigation and return-to-approval context.
2. SO-02, SO-06, SO-07: decision outcome continuity and aligned validation.
3. SO-03 through SO-05: discovery and state-specific navigation using existing components.
4. SO-09, and SO-08 only if requested: compact contextual improvements.

## Acceptance checks

- Repeat the full readiness > learner submit > each configured approver > completion journey.
- Return at every stage, correct/review entries, resubmit and confirm old history persists.
- Approve from each queue and retain the outcome; second approval is unavailable.
- Two learners with the same display name open distinct subject records using IDs.
- Multi-department faculty retain the selected subject when opening a student; office users retain both identifiers.
- Refresh/back/forward preserve filters and approval context; state changes in another tab refresh eligibility.
- Empty-feedback return and zero-approved submission give field/action-level explanations before confirmation.
- Ready/Returned/Submitted/Completed links and metric counts agree in both views.
- Preserve draft/task/submitted/completed locks, discretionary readiness and learner notes/comments policy.
- Check desktop/tablet/mobile, keyboard focus, drawer close/restore, light/dark and long feedback.

## Assumptions, open questions and constraints

- Preserve current header, card style, account selector and existing business rules. This plan proposes navigation/content/validation improvements only.
- The approval chain remains configurable; HoD > Dean > Director is the default, not a hardcoded restriction.
- Open question for optional SO-08: should planned office approvers see Ready logbooks before learner submission, or only once submitted? Current behaviour can remain if preferred.
- Missing institutional inputs: actual approver roster/delegation, overdue SLA, notification channels and any authorised reopening policy. No automatic reminders, substitute approvers, or reopening are proposed without these requirements.
- Browser storage and sample identities are not production authentication. Server-side permissions, atomic decisions/concurrency and durable audit storage remain integration work; passing local tests does not establish these guarantees.
- No critical state-transition failure was reproduced in this review. Source-confirmed UX gaps should not be described as missing core approval stages.

## Source pointers

- src/pages/AdminLogbookPage.jsx: signoff visibility, metrics, signoffProps, student readiness action and two sign-off lists.
- src/components/logbook/LogbookSignoff.jsx: selected-record resolution, confirmation, feedback and learner eligibility.
- src/components/logbook/AdminLogbookStudentDetail.jsx: per-subject readiness.
- src/components/logbook/LogbookSubjectDetail.jsx and LogbookDashboard.jsx: learner entry points.
- src/services/adminLogbook.js and logbookPolicy.js: state transitions, chain snapshots and record locks.
- Digital Logbook.dc.html: markReady, submitSignoff, soOthers/soCur and subject approval presentation.
