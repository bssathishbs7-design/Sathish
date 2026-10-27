# Main pushes to Medsy_UI

Every push to `main` triggers `.github/workflows/linear-main-push.yml` and creates one task in the Medsy_UI team, in **Done**, assigned to **Sathishkumar R**, with the **UI Update** label. Multiple commits in one push create one task. The task includes the pusher, commit authors/messages, changed files, before/after SHAs, a comparison link and the Actions run link. The task title is `UI update: <commit message> (<short SHA>)`.

This records a completed UI update after changes reach `main`; Done does not certify code review. It does not protect the branch or require approval before merging. Local commits must be pushed to GitHub. Other branches and branch-deletion events do not create tasks.

## Configuration

- Repository: `bssathishbs7-design/Sathish`.
- Repository Actions secret: `MEDSY_UI_LINEAR_API_KEY` (never place its value in workflow files).
- Team, Done state, assignee and label IDs are non-secret workflow environment values.
- The job has read-only GitHub contents permission and uses a pinned checkout action with credential persistence disabled. It installs no application dependencies and runs no application build scripts.
- The Linear key must be able to read and create issues in Medsy_UI. Limit access to repository workflows and the API key to trusted maintainers.

## Operation and recovery

The issue UUID is deterministic from the repository name and GitHub workflow run ID. Re-running the same Actions run finds the existing task, including archived tasks. Even overlapping attempts use the same UUID, preventing duplicate issues. A separate push that happens to use the same commit SHA gets a separate task.

If a run fails, open GitHub **Actions → Record Linear UI update for main push → Re-run failed jobs** after fixing the secret or API access. The task link is written to the run summary. No automatic mutation retry is performed after an uncertain API response; rerunning checks for the existing task first.

Summaries include up to 100 commits and 100 files. Large comparisons are labelled as partial; the comparison link is the source for the full diff. If GitHub cannot compare the push (for example after some force pushes), the task still records the push payload and explicitly says that file details were unavailable.

GitHub must have Actions enabled. GitHub's push-event limits and recognised skip-workflow commit instructions can prevent a run; this integration does not override GitHub's event delivery rules. It does not backfill historical pushes.

## Validation

Run `node --test --test-isolation=none "linear automation/linear-main-push.test.mjs"` for mock-backed coverage of task creation, rerun identity, scope, required assignee/status/label configuration, missing secrets, API errors, comparison failures and bounded summaries. The deployment push is the live end-to-end verification: its Actions run must complete successfully and link a new MEDUI task.

## Automatic Linear commit-history document

The history workflow updates the existing [Commit Document](https://linear.app/medsy/document/commit-document-da40e4e2b367) in Medsy_UI. It preserves the title and publishes a native five-column table: serial number (newest row is 1); description and author; date and time in IST; changed files and line counts; GitHub commit links. It creates no documents, subdocuments or attachments.

Each row includes total file and line counts, with up to three file paths and the link to the complete diff. This keeps the content below Linear's verified 250,000-character limit. The renderer reduces file-name previews for larger histories; if even compact rows exceed its 240,000-character budget, it shows the newest rows and explicitly links the complete GitHub history. Binary files have no line counts; merge statistics compare with the first parent. Timestamps are commit times, not historical push times.

The workflow checks out latest main with full history, then renders and updates Linear directly. It uses only GitHub contents-read permission and the existing MEDSY_UI_LINEAR_API_KEY secret. It does not generate attachments or push documentation changes back to GitHub. A missing, trashed or wrong-team target causes a visible failure rather than creating a replacement. Identical content skips the write.

The body is automation-managed; use document comments for review discussions. The fixed target ID is 22c6599f-60ee-434a-a3b6-ba0efc5df627. A failed history run can be rerun from Actions after fixing access.

## Automatically route assignments to Medsy_UI

The workflow `linear-assignment-routing.yml` checks every five minutes (at minute 2, 7, 12, and so on), independently of repository pushes. It can also be started with Run workflow in GitHub Actions. GitHub can delay scheduled jobs, so this is polling rather than instant webhook delivery.

Scope: non-archived, non-deleted Medsy issues assigned to Sathishkumar R. Completed, canceled and duplicate issues are excluded. Eligible issues move to Medsy_UI, matching their current status by name; missing statuses such as Planning map to Todo. The script preserves the assignee and parent relationship and processes eligible parents first. It never expands the move list to other assignees.

All pages are collected before moving issues, then each issue is reread immediately before its update. Linear's update API has no conditional assignment check, so a concurrent reassignment between that read and write remains a small race; the response is verified and any unexpected result stops further moves. Successful moves leave the source team and are not repeated on the next run.

The workflow uses the existing encrypted MEDSY_UI_LINEAR_API_KEY secret, which must have read/write access to both teams. No credentials are committed. Disable this specific workflow in Actions to pause routing. A manually moved-back issue that remains assigned to Sathish and active will be moved again at the next check.

Validation: `node --test --test-isolation=none "linear automation/linear-assignment-routing.test.mjs"`. Tests cover scope, status fallback, parents, pagination, reassignment checks, reruns and API errors.

## File organisation

All automation scripts, tests and this guide live in `linear automation/`. GitHub requires the three workflow entry files to remain in `.github/workflows/`; each calls its script here with a quoted path.

Run all automation checks from the repository root:

```sh
node --test --test-isolation=none "linear automation/linear-main-push.test.mjs" "linear automation/linear-assignment-routing.test.mjs" "linear automation/linear-commit-history.test.mjs" "linear automation/generate-commit-history.test.mjs"
```

The optional local history command is `node "linear automation/generate-commit-history.mjs"`. Its output is `linear automation/COMMIT_HISTORY.md`; the workflow updates the existing Linear document directly.
