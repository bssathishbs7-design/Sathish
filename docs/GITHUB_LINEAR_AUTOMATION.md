# Main pushes to Medsy_UI

Every push to `main` triggers `.github/workflows/linear-main-push.yml` and creates one task in the Medsy_UI team, in **In Review**. Multiple commits in one push create one task. The task includes the pusher, commit authors/messages, changed files, before/after SHAs, a comparison link and the Actions run link. No reviewer is automatically assigned; team members can pick up the task.

This is review after changes reach `main`. It does not protect the branch or require approval before merging. Local commits must be pushed to GitHub. Other branches and branch-deletion events do not create tasks.

## Configuration

- Repository: `bssathishbs7-design/Sathish`.
- Repository Actions secret: `MEDSY_UI_LINEAR_API_KEY` (never place its value in workflow files).
- Team and In Review state IDs are non-secret workflow environment values.
- The job has read-only GitHub contents permission and uses a pinned checkout action with credential persistence disabled. It installs no application dependencies and runs no application build scripts.
- The Linear key must be able to read and create issues in Medsy_UI. Limit access to repository workflows and the API key to trusted maintainers.

## Operation and recovery

The issue UUID is deterministic from the repository name and GitHub workflow run ID. Re-running the same Actions run finds the existing task, including archived tasks. Even overlapping attempts use the same UUID, preventing duplicate issues. A separate push that happens to use the same commit SHA gets a separate task.

If a run fails, open GitHub **Actions → Create Linear review task for main push → Re-run failed jobs** after fixing the secret or API access. The task link is written to the run summary. No automatic mutation retry is performed after an uncertain API response; rerunning checks for the existing task first.

Summaries include up to 100 commits and 100 files. Large comparisons are labelled as partial; the comparison link is the source for the full diff. If GitHub cannot compare the push (for example after some force pushes), the task still records the push payload and explicitly says that file details were unavailable.

GitHub must have Actions enabled. GitHub's push-event limits and recognised skip-workflow commit instructions can prevent a run; this integration does not override GitHub's event delivery rules. It does not backfill historical pushes.

## Validation

Run `node --test --test-isolation=none .github/scripts/linear-main-push.test.mjs` for mock-backed coverage of task creation, rerun identity, scope, missing secrets, API errors, comparison failures and bounded summaries. The deployment push is the live end-to-end verification: its Actions run must complete successfully and link a new MEDUI task.

## Automatic Linear commit-history document

The separate commit-history workflow refreshes an editable document titled **Sathish — Commit history**, directly in the **Medsy_UI Documents** section. It publishes the generated Markdown as document content, not as a file attachment. It creates the document once with a fixed ID, then updates that same document after main pushes; unchanged content produces no write.

The job checks out latest main with full history and uses only GitHub contents-read permission. It does not commit or push documentation changes back to the repository. The Linear API key is supplied by the same encrypted repository secret used for task creation. The fixed document ID and team ID are configured in the workflow. A deleted document or a document belonging to a different team is not overwritten.

Commit timestamps appear in IST (UTC+05:30), with original ISO dates retained. These are commit times, not historical push times. File lists are published as native Markdown tables without HTML disclosure elements. Comments on the Linear document can hold review discussions; its generated body is replaced on each refresh.

Local preview: node scripts/generate-commit-history.mjs. Publishing entry point: .github/scripts/linear-commit-history.mjs. The generated Markdown is published as editable Linear document content.

Both workflows must be reviewed and merged, and the encrypted secret configured, before automatic updates are active. The first successful history run creates the document; later runs refresh it.
