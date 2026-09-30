# Logbook flow and approval recheck

29 September 2026. Scope: My Logbook and Admin Logbook. Existing design, headers and filter layout preserved.

## Additional gaps fixed

| Gap | Correction |
|---|---|
| Sealed drafts/returned work still appeared under Needs action; locked Pending records could remain selectable for faculty bulk review. | Action lists, review eligibility and direct learner entry points respect subject locks. Historical records remain searchable. |
| Faculty Ready approval details could show no approvers. | Ready details resolve the configured subject chain. |
| Returned resubmission confirmation could name the old first approver. | Historical signatures retain their original chain; the upcoming submission and confirmation show the current configured chain. |
| An open confirmation could apply to a later approval round, or submit after the chain changed. | Confirmation captures the reviewed round/step and chain. Local services reject stale context and require renewed confirmation. |
| Submission service accepted an omitted learner identity. | Final submission requires the owning learner ID and rejects faculty-context submission. Server authentication remains an integration requirement. |
| A repeatedly returned remedial could create duplicate follow-up branches from both original and later attempts. | Only the latest unresolved attempt needs follow-up. Earlier records link to existing children. New parallel branches are rejected; existing saved history remains editable according to its normal status. |

## End-to-end checks

All 34 Logbook service tests passed. Targeted ESLint and production build passed; existing bundle-size and mixed-import build warnings remain.

Isolated Chromium verification passed 46 assertions across four scripts:

- 16 existing workflow checks: assignment, learner submission, return/correction, faculty approval, live updates, remedial draft resume, navigation/filter persistence and complete sign-off handoff.
- 18 approval checks: faculty readiness, planned chain visibility, returns from HoD/Dean/Director, required return feedback, learner live status, prior-round step labels, restart at HoD, final completion, preserved four-round history, locked actions and mobile approval drawer containment.
- Six confirmation checks: historical versus upcoming chain, configuration change while confirmation is open, renewed confirmation, and rejection of a stale approval round. The stale-round check simulates an external update in the isolated browser store.
- Six repeated-remedial checks: no First attempt option on linked repeats, required attempt/rating, one follow-up after a second return, correct parent linkage, chain cleared after approval and history navigation.

No application runtime exceptions were recorded by these browser scripts. The completed approval drawer was visually reviewed at 390px. This recheck focuses on workflows; it is not a new cross-browser/accessibility certification.

Evidence: `.logbook-check.local/approval-recheck/{results,confirmations,remedial}.json`, `completed-mobile.png`, and `.logbook-check.local/comparison-evidence/workflow.json`. Regression coverage: `src/services/logbookComparison.test.js`.

## Remaining integration boundaries

The app still uses browser-backed demo services. Real enrolments, institutional requirements and posting calendars are not supplied. Backend authentication, atomic concurrency enforcement and durable audit storage remain necessary before deployment. This recheck does not claim those external dependencies are implemented.
