# Logbook integration

The learner entry point is `/logbook`, after My Skill Activity in the sidebar. Approval Queue's **Review Logbook** action opens a local faculty demonstration view. App owns the internal view and a back stack capped at ten destinations.

## Data boundary

`src/services/logbookCatalog.js` contains the 19 subject labels and 24 selectable category types from the supplied HTML prototype, grouped by phase and activity family. The persisted subject key `Human Anatomy` displays as `Anatomy`; existing category IDs remain stable. An additional legacy `community` category preserves old Community visits records but is excluded from new-entry pickers. Subject-specific categories follow the prototype restrictions. Previously selected categories remain available with a subject hint; remedial attempts are reached through returned records.

The six original subjects retain their sample competency requirements. Newly added subjects have no invented requirements and allow manually entered competency codes. Category forms in `src/services/logbookSchemas.js` reproduce the supplied HTML: field groups, choices, required and optional inputs, subject variants and learner-read-only grading. These reference forms still require institutional confirmation before production deployment. `src/services/logbookSample.js` contains the sample student, posting, faculty and entries, and re-exports the catalogue for existing callers.

The entry UI is a full-height right-side drawer on desktop and fills the screen on mobile, with fixed header/actions and a scrolling form. The three-section accordion starts with Subject & category, advances automatically after both selections, and validates Activity details on Continue before opening Faculty verification. Sections retain their values when reopened; draft saving is available throughout eligible entry flows, and submission appears at verification. Mandatory stars use the semantic danger colour. Forms use each category?s actual inputs and validate only that schema. Dates appear once within the relevant form. Saved keys remain stable, and older extra fields are retained and displayed during editing. Subject/category searches support grouped options, arrow keys, Enter, and Escape (closing the picker before the dialog). Up to three recent category shortcuts come from saved entries. Selection changes preserve common fields and request confirmation before clearing populated incompatible fields. Optional notes and attachments stay collapsed until requested; sign-off is explicit on every submission.

`src/services/logbook.js` defines the entry shape with JSDoc and exposes asynchronous list, save, update and reset methods. Components do not access browser storage directly. The local implementation reconciles sample records with additions, edits and removal IDs under `medsy-logbook-deltas-v3`. Same-window events and storage events refresh mounted views. Unposted comments survive drawer toggles during a page session; posted comments persist.

Drafts do not contribute to submitted totals or completion. Only approved entries in the matching subject, certifiable category and competency count toward required attempts. Each competency's contribution to overall progress is capped at its requirement. Returned records remain intact, with a new attempt referencing the parent through `linkedTo`; another active remedial child cannot be created for the same parent.

## API responsibilities

- Replace local mutations with authenticated API calls and enforce student ownership, faculty assignment and record locks on the server. The faculty demo is not an authorization system.
- Preserve immutable submitted content after approval. Store personal notes independently and append comments with server-provided author identity and timestamps.
- Store learner acknowledgement and faculty verification timestamps. Use revision/version checks for concurrent changes; local browser storage is a demo cache, not a multi-user database.
- Upload photos to durable attachment storage. The demo accepts up to three JPG/PNG/WebP images, each at most 300 KB, and persists their data URLs. Legacy attachments containing only names remain visible by name.
- Provide the actual faculty directory, curriculum field schemas, required attempts, batch and posting end dates.
- Supply definitions and validation for grading codes `F/R/Re`, `M/B/E` and `C/R/Re`. The optional data shape preserves them; the demo does not invent labels or automatically derive grades from approval decisions.
- Scope records and local caching to the authenticated learner when integrating accounts. Local reset affects only the Logbook sample data key.

## Verification

Run `node --test --test-isolation=none src/services/logbook.test.js` for lifecycle, reconciliation, validation, search, competency progress and storage-failure checks. Run `npm run build` for production bundling.
