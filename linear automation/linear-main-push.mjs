import { createHash } from 'node:crypto'
import { readFileSync, appendFileSync } from 'node:fs'
import { pathToFileURL } from 'node:url'

const ZERO_SHA = /^0{40}$/
const singleLine = value => String(value || '').replace(/[\r\n\t]+/g, ' ').trim()
const code = value => '`' + singleLine(value).replace(/`/g, "'").slice(0, 300) + '`'

/** Stable per push run, including reruns; separate pushes of the same SHA still get separate tasks. */
export function issueIdForRun(repository, runId) {
  const bytes = createHash('sha256').update(`medsy-linear-push:${repository}:${runId}`).digest().subarray(0, 16)
  bytes[6] = (bytes[6] & 15) | 64
  bytes[8] = (bytes[8] & 63) | 128
  const hex = bytes.toString('hex')
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`
}

/** Build bounded Markdown without executing commit messages or filenames as shell code. */
export function buildIssue(event, env, comparison) {
  const base = `https://github.com/${env.GITHUB_REPOSITORY}`
  const commits = comparison?.commits || (event.commits || []).map(commit => ({
    sha: commit.id, commit: { message: commit.message, author: { name: commit.author?.name } },
  }))
  const latest = event.head_commit?.message || commits.at(-1)?.commit?.message || 'Repository changes'
  const compareUrl = ZERO_SHA.test(event.before || '')
    ? `${base}/commit/${event.after}` : `${base}/compare/${event.before}...${event.after}`
  const files = comparison?.files || []
  const commitCount = comparison?.total_commits ?? event.size ?? commits.length
  const title = `UI update: ${singleLine(latest).slice(0, 170)} (${event.after.slice(0, 7)})`
  const description = [
    `A push to ${code(env.GITHUB_REPOSITORY)} on ${code('main')} has been recorded as a completed UI update.`,
    '**These changes are already on main. This task records the completed UI update.**',
    `Pushed by: ${code(event.sender?.login || event.pusher?.name || env.GITHUB_ACTOR)}`,
    `Before: ${code(event.before)}\nAfter: ${code(event.after)}`,
    `[Review the changes](${compareUrl}) · [Workflow run](${base}/actions/runs/${env.GITHUB_RUN_ID})`,
    '### Commits',
    ...commits.slice(0, 100).map(commit => `- [${commit.sha.slice(0, 7)}](${base}/commit/${commit.sha}) ${code(commit.commit?.message)} — ${code(commit.commit?.author?.name)}`),
    commitCount > 100 ? `Showing the first 100 of ${commitCount} commits. See the comparison for the full push.` : '',
    !commits.length ? 'No commit summary was available. Use the comparison link above.' : '',
    '### Changed files',
    ...files.slice(0, 100).map(file => `- ${code(file.status)} ${code(file.filename)}${file.previous_filename ? ` (from ${code(file.previous_filename)})` : ''}`),
    files.length > 100 ? 'Showing the first 100 changed files. See the comparison for all changes.' : '',
    comparison ? '' : 'GitHub comparison details were unavailable; use the comparison link to inspect changed files. Commit details above come from the push event.',
    comparison && !files.length ? 'No changed files returned by GitHub for this comparison.' : '',
    event.forced ? '**Force push:** review the branch history as well as the comparison.' : '',
    `Automation reference: ${env.GITHUB_REPOSITORY}/actions/runs/${env.GITHUB_RUN_ID}`,
  ].filter(Boolean).join('\n\n')
  return { title, description }
}

/**
 * @param {{event:Object, env:Object, fetchImpl?:typeof fetch}} options GitHub push payload and workflow environment.
 * @returns {Promise<{skipped?:boolean, existing?:boolean, issue?:{id:string,identifier:string,url:string}}>} Result for the job summary.
 */
export async function syncPush({ event, env, fetchImpl = fetch }) {
  if (env.GITHUB_EVENT_NAME !== 'push' || event.ref !== 'refs/heads/main' || event.deleted) return { skipped: true }
  for (const name of ['LINEAR_API_KEY', 'LINEAR_TEAM_ID', 'LINEAR_DONE_STATE_ID', 'LINEAR_ASSIGNEE_ID', 'LINEAR_LABEL_ID', 'GITHUB_TOKEN', 'GITHUB_REPOSITORY', 'GITHUB_RUN_ID']) {
    if (!env[name]) throw new Error(`Missing ${name}. Configure the workflow before retrying.`)
  }
  if (!/^[\w.-]+\/[\w.-]+$/.test(env.GITHUB_REPOSITORY) || !/^\d+$/.test(env.GITHUB_RUN_ID)
    || !/^[a-f0-9]{40}$/.test(event.before || '') || !/^[a-f0-9]{40}$/.test(event.after || '')) throw new Error('Invalid GitHub push metadata.')
  const linear = async (query, variables) => {
    const response = await fetchImpl('https://api.linear.app/graphql', {
      method: 'POST', signal: AbortSignal.timeout(30000),
      headers: { Authorization: env.LINEAR_API_KEY, 'Content-Type': 'application/json' },
      body: JSON.stringify({ query, variables }),
    })
    if (!response.ok) throw new Error(`Linear request failed (HTTP ${response.status}). Rerun this job after resolving access or rate limits.`)
    const result = await response.json()
    if (result.errors?.length || !result.data) throw new Error('Linear rejected the request. Check the API key, team, status, assignee and label permissions, then rerun this job.')
    return result.data
  }
  const id = issueIdForRun(env.GITHUB_REPOSITORY, env.GITHUB_RUN_ID)
  const existing = await linear('query($id: ID!) { issues(includeArchived: true, filter: { id: { eq: $id } }, first: 1) { nodes { id identifier url } } }', { id })
  if (existing.issues.nodes.length) return { existing: true, issue: existing.issues.nodes[0] }

  let comparison = null
  if (!ZERO_SHA.test(event.before)) {
    try {
      const response = await fetchImpl(`https://api.github.com/repos/${env.GITHUB_REPOSITORY}/compare/${event.before}...${event.after}?per_page=100`, {
        signal: AbortSignal.timeout(30000), headers: { Authorization: `Bearer ${env.GITHUB_TOKEN}`, Accept: 'application/vnd.github+json', 'X-GitHub-Api-Version': '2022-11-28' },
      })
      if (response.ok) comparison = await response.json()
    } catch { /* The push still needs recording when a force push or API outage prevents comparison. */ }
  }
  const input = { id, teamId: env.LINEAR_TEAM_ID, stateId: env.LINEAR_DONE_STATE_ID, assigneeId: env.LINEAR_ASSIGNEE_ID, labelIds: [env.LINEAR_LABEL_ID], ...buildIssue(event, env, comparison) }
  const created = await linear('mutation($input: IssueCreateInput!) { issueCreate(input: $input) { success issue { id identifier url } } }', { input })
  if (!created.issueCreate.success || !created.issueCreate.issue) throw new Error('Linear did not confirm issue creation. Rerun this job; its stable issue ID prevents duplicate creation.')
  return { existing: false, issue: created.issueCreate.issue }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    const result = await syncPush({ event: JSON.parse(readFileSync(process.env.GITHUB_EVENT_PATH, 'utf8')), env: process.env })
    const summary = result.skipped ? 'Skipped: this event is not a main-branch push.'
      : `${result.existing ? 'Already recorded' : 'Created'}: [${result.issue.identifier}](${result.issue.url})`
    console.log(summary)
    if (process.env.GITHUB_STEP_SUMMARY) appendFileSync(process.env.GITHUB_STEP_SUMMARY, summary + '\n')
  } catch (error) {
    console.error(error.message)
    process.exitCode = 1
  }
}
