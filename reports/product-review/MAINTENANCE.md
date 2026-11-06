# Product review report maintenance

The root `business-analyst-reference.html` is a generated, offline-capable reference. Its data source is `data.json`; the HTML template, CSS and JavaScript are co-located here. This is a reference artifact, not an application route or runtime dependency.

## Routine workflow

1. Run `node scripts/reports/update-reference.mjs --refresh` after application changes.
2. Inspect changed modules and their consumers; run checks appropriate to the actual change.
3. Edit module/page findings and evidence in `data.json`. Record expected versus actual behaviour, source/date, accountable team, supporting teams, priority rationale, recommended solution and acceptance checks. Only confirmed failures get fix prompts; pending checks get investigation prompts; business ambiguities get decision prompts.
4. Record an actual re-review with `--record-review <module-id> --result Partial --note "Evidence and limitations"`. A module-wide pass is rejected while open findings or unpassed page checks remain.
5. Run `--check`; it is read-only and exits nonzero if the artifact or source baseline is stale. A successful check means freshness, not production readiness.

For a live local change trigger, `--watch` scans every five seconds until stopped. It marks stale modules and regenerates the reference. It does not execute tests, make code fixes, review business rules or certify a release. No watcher is installed as a background service.

## Source coverage

The checker hashes `src`, `public`, package/lock files, Vite config and the app HTML. Module filename patterns plus transitive relative imports identify affected sources. Shared shell/config changes and unclassified inputs conservatively affect all modules. Deleted inputs remain comparable via the previous snapshot. Downstream reviewers must still assess semantic dependencies that imports alone cannot establish.

Student Management remains authoritative for its roster/calendar context; inspect Faculty, Skills, Assessment and Logbook consumers when changes can affect eligibility or records. Explicit related-module links in the source data describe semantic dependencies; the checker invalidates related modules when their upstream inputs change.

New registered pages are included as unreviewed, using a known module key mapping or the Unassigned module. Names/routes follow the registry. Removed pages are retained with `removed: true` and excluded from active counts. Reassign unknown pages before claiming complete reviewed module coverage.

## Versions and review provenance

`version` and module `version` use major.minor numbers. Content/source changes increment affected modules; report/presentation changes increment the main document. Filtering, downloads, unchanged refreshes and personal notes do not increment formal versions. For a planned major release, set the target major with `.0` above the latest recorded history version and document the structural reason in the changed summary. The builder respects that higher version and records a new history entry.

`observedSource` is the latest source snapshot detected by the builder, including commit, dirty state and hash. It is not a reviewed-source claim. Original Student Management file hashes and historical 46 service / 19 read-only browser checks remain attached to their original review. A new `currentReview` records the deliberate re-review attestation and source. Do not relabel historical tests as rerun merely because the document was rebuilt.

The first formal version is a baseline of the simplified report; the old unversioned HTML and seed are archived in `archive/`. Do not alter those archive files.

## Notes and downloads

Personal notes use `medsy-product-review-notes-v1`. The previous `medsy-product-workspace-v1` record is read without deletion and preserved in the archive panel/export. Review evidence is not overwritten by annotations. Corrupt or unavailable storage is reported; no damaged original is overwritten. Notes backups can be imported and merged with explicit user confirmation.

Module downloads use genuine Word (.docx) or PDF files only. They contain all module pages/findings despite filters, recorded evidence, versions, lifecycle history and implementation prompts. A plan download additionally includes its request and worker outputs. Browser-only personal annotations remain separate from audited evidence and are not included in server documents. Existing JSON backups can still be imported; new JSON/HTML download actions are not exposed.

## Local AI planning workspace

Run `node scripts/reports/planning-server.mjs` and open `http://127.0.0.1:6190`. The independent reference page does not modify application navigation or application data. A directly opened HTML file remains a read-only audit viewer with browser notes; server planning/export controls require the local URL.

Copy `.env.planning.example` to `.env.planning.local` and set `OPENAI_API_KEY` and `OPENAI_MODEL` locally, then restart the service. These values are read only on the server. No credentials were available during implementation; live provider execution remains unverified. Configuration presence is not proof of model availability or document compatibility. The integration follows the [Responses structured-output guide](https://developers.openai.com/api/docs/guides/structured-outputs) and [file-input guide](https://developers.openai.com/api/docs/guides/file-inputs).

Drafts, optional attachments, runs and immutable plan versions are saved in ignored `.product-planning.local/workspace.json`. This is a local, single-user workspace, not a multi-user production service. Keep private backups of this directory; do not commit its contents. A corrupt state file fails closed. Interrupted runs are marked blocked on restart; retries require a new confirmation. No automatic paid retries run.

The Yes/No dialog is required before every AI request. Yes permits sending the selected request, report evidence, bounded source excerpts and optional files to the configured OpenAI model. No preserves the form and files. Seven actual stages run: six specialist reviews and lead analyst synthesis. The first specialist receives attachments; subsequent specialists receive its results. They do not execute tests, application code or deployment tools. Source excerpts are bounded and explicitly marked truncated; source completeness must not be inferred.

Module lifecycle, historical audit verdicts and run status are separate. Approval is tied to a current plan ID and fingerprint. Tracking In progress/Pending verification/Complete requires an approved plan. Completion also requires a verification attestation; it is not an automated proof of passing tests. Source drift invalidates approval and marks historical plans outdated. The local service checks source when requested by the UI (every ten seconds while visible and without an open dialog); this is source monitoring, not an unattended behavioural review.

PDF creation uses locally installed Chrome/Edge in headless mode. Set `MEDSY_PDF_BROWSER` if detection cannot find your browser. Word export requires no external process. Both formats can be read offline.

## Validation

## Module review action

Each module exposes Review before Plan. Review scope, context and attachments have independent drafts in `reviewDrafts`; completed analyses are immutable versions in `reviews`. The existing `runs` collection uses `kind: review` or `kind: plan`, with one active run per module across both kinds. Review confirmation is mandatory and does not authorise code changes or a planning run.

Reviews use the same seven actual AI stages and bounded source inputs as planning. Results cover selected pages and areas; omitted pages remain Not assessed. New AI concerns cannot be marked confirmed or verified pass. An existing confirmed finding may retain that classification only when its module/page identity matches; its stored title and evidence are preserved. Missing configuration leaves save-scope and recorded evidence available.

Review readiness is tracked separately as `reviewStatus`; review generation never promotes the module lifecycle, audit verdicts or plan approval. Source drift marks reviews outdated. Selected current-review findings can prefill the Plan popup; that popup keeps its separate Yes/No confirmation. The handoff does not overwrite an existing saved plan draft until the user explicitly saves it. Word/PDF exports include the selected review version, source, scope, page results, limitations and worker timestamps.

Run `node --test --test-isolation=none scripts/reports/review.test.mjs` for scope validation, evidence guards, storage migration, versioned review execution, export and stale-review handoff checks. Live AI output remains unverified without locally configured credentials; automated workflow checks use an isolated test provider.

- `node --test --test-isolation=none scripts/reports/update-reference.test.mjs` checks invalidation, source freshness, inventory and stable versioning in isolated fixtures.
- `node scripts/reports/update-reference.mjs --check` verifies generated output/source agreement.
- `node --test --test-isolation=none scripts/reports/planning.test.mjs` checks lifecycle gates, source invalidation, request ownership, Word structure and HTTP workflow using an explicit test provider. Test-provider output is never used by the normal service.
- Browser QA should cover filtering, team drill-down, page details, copy fallback, local note persistence/migration, confirmation No/Yes, disconnected AI, and Word/PDF exports. Check desktop/tablet/mobile, keyboard and no page-level overflow.
- Changes only to this report do not need an application flow-change entry. Log `FLOW_CHANGES.md` only when application flows actually change.

### OpenAI connection popup
The header connection button opens API key and model fields. Link performs a small billable structured-response check before atomically saving .env.planning.local and updating the running service. This file overrides process configuration for these two fields on restart. Credentials never enter workspace state or exports. Cancel discards unsent inputs; controls remain locked during the bounded verification request. Active AI jobs block configuration changes. A successful check does not verify PDF/image support or run a module review.

### Hierarchical AI specialists
Hierarchy v1.0 is shared by the browser and server from scripts/reports/team-hierarchy.mjs. New runs snapshot roles and hierarchy version. Ten baseline stages run specialists first, engineering coordination next, product/CTO branch reviews and executive synthesis last. Optional AI/ML scope adds an eleventh stage and is shown before confirmation. Existing seven-stage histories remain unchanged and explicitly labelled legacy. Operations and documentation ownership are retained within engineering, QA, product and BA responsibilities. Role statuses describe AI analysis only, never module completion.

### All-role module reviews (hierarchy 1.1)
Review always assigns all 11 roles, including AI/ML applicability assessment. Plan retains optional AI scope. Approved module service suites run once in a temporary source copy, with restricted filesystem permissions, no inherited API credentials and a 60-second timeout. There is no arbitrary AI-generated command execution. Browser/design and production API coverage remains pending. Unmapped or unavailable suites are explicitly pending or blocked. Successful service checks are not page-wide passes. Specialist concerns and questions survive synthesis; conflicting assessments are retained. Partial failures preserve a downloadable partial report and completed role contributions; they cannot feed implementation planning. Retry creates a new version and retains history. Module downloads include the latest review by default.

### Codex copy-only handoffs
Module Actions now copy review prompts without an API key; Fix bugs opens selected-finding planning. Copying never changes statuses. Codex writes evidence to canonical pages/findings and module.codexReview {version,at,fingerprint,status,summary,roles:[{roleId,status,findingIds,blockers,evidence,nextAction}]}; use all role IDs from team-hierarchy.mjs and the refreshed observedSource fingerprint. Preserve prior review records in codexReviewHistory. Store module.codexPlan {id,version,at,fingerprint,findingIds,summary,steps,acceptance,status:Planned}, preserving codexPlanHistory. steps/acceptance are string arrays. Approved-fix copy requires exact selected IDs, a current fingerprint, a recorded plan, and explicit Yes confirmation. Copying is not execution. Canonical findings may add accountableRole/supportingRoles; do not invent human assignments. Review/plan/fix prompts require refresh/check and evidence-based state updates. Module Word/PDF exports include Codex records.
