# Product review maintenance

These repository instructions supplement the Medsy Project Master Guide supplied by the user. Preserve its React/JavaScript, vanilla CSS, Medsy token, accessibility, mock-data, scope and verification requirements.

## Mandatory after project changes

The user requires `business-analyst-reference.html` to stay aligned with project changes. Maintain it as a standalone module/page/team review; do not add it to application navigation.

1. Identify changed modules, pages, roles and downstream journeys before closing a coding task. Include consumers of student calendars/rosters, shared navigation and shared services.
2. Run `node scripts/reports/update-reference.mjs --refresh`. This detects application-source changes and marks previously reviewed affected modules **Needs re-review**. It does not verify behaviour or repair defects.
3. Review the affected implementation and run relevant service tests and browser checks. Respect a user's plan-only or no-fix boundary. If checks cannot run, record the exact limitation; do not retain an unsupported current pass.
4. Update `reports/product-review/data.json`: page functionality/design statuses, dated evidence, confirmed findings versus pending verification, accountable/supporting teams, recommendations, acceptance checks and source references. Preserve historical evidence and user annotations. Never fabricate tests, owners, release readiness, budgets or review dates.
5. After actually re-reviewing a module, record it with:
   `node scripts/reports/update-reference.mjs --record-review <module-id> --result Partial --note "Actual review evidence and remaining limitations"`
   Use the appropriate result: `Partial`, `Verified pass`, `Failed`, `Blocked` or `Not reviewed`. A source-hash refresh alone is never a review. Keep source-changed modules that were not rechecked as **Needs re-review**.
6. Finish with `node scripts/reports/update-reference.mjs --check`. Fix report-generation/inventory inconsistencies before handoff. Report unfinished re-reviews honestly.

## Report authoring

- Edit the source data and `reports/product-review/template.html`, `report.css`, `report.js`; regenerate the root HTML. Do not hand-edit the generated HTML.
- Exactly one primary module owns each registered page. New registry pages are initially put in **Unassigned module** if no mapping is known; assign them and review their journeys. Removed registry pages remain in source history.
- Minor report/module versions advance when their content or source baseline changes; unaffected module versions remain unchanged. For a major structural change, set the next major version above the latest history entry and document the reason in the changed summary before refreshing; the builder records the history. Do not invent history for unversioned artifacts.
- Each module download must include all its pages/findings, version, date, source reference, evidence, limitations and AI prompts, independent of active UI filters. Preserve offline readability.
- Personal browser notes/assignments are separate from audited evidence. Keep old storage keys readable and never silently overwrite or discard existing notes. Test migrations and exports.
- The HTML cannot inspect a repository by itself. For changes outside coding sessions, run `--refresh` or use `--watch` while working. Do not claim unattended monitoring is active unless the watcher is actually running.
- Do not fix application issues merely because they appear in a report. Implement only the user's authorised scope. Do not post, publish or send report content externally without the required explicit approval.

See `reports/product-review/MAINTENANCE.md` for data, version and verification details.
