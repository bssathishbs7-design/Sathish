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

The history workflow updates the existing [Commit Document](https://linear.app/medsy/document/commit-document-da40e4e2b367) in Medsy_UI. It preserves the title and publishes a native four-column table: description and author; date and time in IST; changed files and line counts; GitHub commit links. It creates no documents, subdocuments or attachments.

Each row includes total file and line counts, with up to three file paths and the link to the complete diff. This keeps the content below Linear's verified 250,000-character limit. The renderer reduces file-name previews for larger histories; if even compact rows exceed its 240,000-character budget, it shows the newest rows and explicitly links the complete GitHub history. Binary files have no line counts; merge statistics compare with the first parent. Timestamps are commit times, not historical push times.

The workflow checks out latest main with full history, then renders and updates Linear directly. It uses only GitHub contents-read permission and the existing MEDSY_UI_LINEAR_API_KEY secret. It does not generate attachments or push documentation changes back to GitHub. A missing, trashed or wrong-team target causes a visible failure rather than creating a replacement. Identical content skips the write.

The body is automation-managed; use document comments for review discussions. The fixed target ID is 22c6599f-60ee-434a-a3b6-ba0efc5df627. A failed history run can be rerun from Actions after fixing access.
