# MED-19 implementation and verification

Implemented in the React frontend on 27 October 2026. The approved interpretation is **no question versioning**: an author's approved edit replaces the content under the same permanent QB ID. The accompanying ID guide has been corrected accordingly.

## Lifecycle

| Record | Temporary identity | Permanent identity issued at |
| --- | --- | --- |
| Skill activity | DRF-SA | First assignment |
| Assessment | DRF-AP | Publication, direct or after approval |
| Blueprint | DRF-BP | Blueprint approval only |
| Bank question | DRF-QB | Bank approval |
| Assessment-authored question | DRF-AQ | Assessment publication |

Internal record keys remain unchanged. `draftCode` remains an alias after publication or approval. Republishing preserves existing AP/AQ identities; subsequent assignments preserve the source activity identity. Unapproved blueprints remain drafts when the assessment is published. Approved blueprint templates retain their permanent IDs and survive removal of their paired assessment workflow.

Editing another author's or a Medsy question produces a new institution question, with `derivedFrom` retaining the source ID. Editing a bank snapshot inside an assessment detaches it into an AQ draft. Existing bank snapshots do not silently receive later bank edits; a content comparison displays a notice. Published AQ questions can be selected in Assessment History and submitted for bank approval, producing separate QB identities.

## Code boundaries

- `src/config/institution.js`: institution namespace.
- `src/utils/qid.js`: Damm formatting, validation, ordering, counters and recovery.
- `src/utils/draftReference.js`: cryptographic typed draft references.
- `src/services/assessmentIdentity.js`, `blueprintApproval.js`, `skillIdentity.js`: lifecycle transitions.
- `src/utils/questionBankIdentity.js`, `questionLifecycle.js`: bank ownership and AQ provenance.
- `src/utils/questionSearch.js`: ID, draft alias, paper, numeric and pasted-list lookup, typo suggestions and deletion notes.
- `src/utils/questionContent.js`: snapshot comparison without version metadata.
- Shared components: `CopyIdBadge`, `SkillIdentity`, `QuestionHistoryButton`, `QuestionSnapshotNotice`, `AssessmentBankSubmission`, `IdGuideDialog`.

## Data contract for backend integration

The current adapters use the existing local/session storage architecture. They do **not** establish multi-user uniqueness or server-side authorisation.

```js
/**
 * @typedef {Object} IdentifiedQuestion
 * @property {string} id Immutable internal key.
 * @property {string} draftCode Original DRF-QB or DRF-AQ reference.
 * @property {string} [questionBankId] Approved permanent bank identity.
 * @property {string} [assessmentQuestionId] Published assessment-owned identity.
 * @property {string} [derivedFrom] Source visible ID for an independent derivative.
 * @property {string[]} [idAliases] Earlier draft references retained after own edits.
 * @property {string} authorId Authenticated author, supplied by the server in production.
 * @property {string} questionText Saved question content, including rich text.
 * @property {Object[]} options Saved options and answer associations.
 * @property {Object[]} [history] Audit events; not question versions.
 */
```

Assessment identity lives in `setup.assessmentId` (internal), `setup.assessmentCode` (visible), and `setup.draftCode` (alias); publication also exposes the visible ID and alias on the record. Blueprint workflows are keyed by the assessment's internal ID. Skills use a source activity key, with assignment instances resolving back to it; their identity projection stores `{code, draftCode, history}`.

The backend must:

1. Allocate permanent IDs in the same atomic transaction as assignment, approval or publication. Lock the institution/type counter, enforce a unique constraint, and make retries idempotent using the internal key and transition request.
2. Preserve the issued-number high watermark and deletion tombstones. Never roll it back when records are deleted; reserve SA/AP sequences 1–20 for samples. Refuse an overflowing batch before issuing anything.
3. Enforce authenticated ownership for same-ID edits, reviewer permissions, and immutable Medsy originals. Client `replaceQuestionId` and author fields are requests, not authority.
4. Save snapshots, aliases, provenance, approval decisions and audit events transactionally. Retain approved reusable blueprint templates independently of assessment deletion.
5. Apply ID sorting before server pagination: institution, type, numeric value, internal ID. Keep drafts last. Resolve draft aliases and deletion notes across all stored records, not just a loaded page.

The browser mock uses `vx-qid-sequences` and a separate `vx-qid-issued` high watermark. It recovers from known stored permanent IDs when counters are missing. Browser storage is editable and clearable; it cannot provide production cross-tab/cross-device allocation guarantees. Existing blueprint draft reservation additionally uses Web Locks where available.

## Verified

- `npm test`: 395 tests passed. Coverage includes Damm errors, transposed digits, counter recovery, overflow, legacy IDs, publication retries, blueprint approval/deletion, skill history, snapshot independence, provenance and ID searches.
- `npm run build`: passed. Existing large-bundle and mixed static/dynamic import warnings remain.
- Changed-file lint comparison: no new findings against the existing baseline.
- Browser smoke checks: Skills Configuration, Question Bank and Assessment routes rendered without captured runtime errors.
- Question Bank browser checks: spaced/unpadded IDs, approved draft aliases, typo suggestions and multi-ID searches returned the expected rows using an isolated test question.
- ID guide checks: dark/light presentation, monospace chips, selection, successful copying and clipboard fallback, Escape dismissal with focus restored to the profile button, and no horizontal overflow at widths 390, 768, 1024 and 1440. The guide switches to vertical flows on mobile; existing application restrictions on mobile workflow pages remain.

## Acceptance still required with the backend

Run real role-based end-to-end assignment, approval, publication, revision and deletion tests after API integration. Include concurrent approvals, retries after connection loss, counter restoration, failed transactions, clipboard permissions on supported devices, and snapshot behaviour across users. Local unit tests and browser smoke checks do not substitute for these integration tests.

## UI review update

At the user's request, the standalone Search by ID and Sort by ID controls have been removed from all screens. Their shared component and stylesheet were removed. The ID parsing/search utilities and their unit coverage remain available, but no ID search control is currently exposed in the UI. The browser search checks above describe the implementation before this removal.
