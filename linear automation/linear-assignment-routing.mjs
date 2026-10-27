import { appendFileSync } from 'node:fs'
import { pathToFileURL } from 'node:url'

const CLOSED_TYPES = ['completed', 'canceled', 'duplicate']
export const eligible = (issue, env) => Boolean(issue && !issue.archivedAt && !issue.trashed
  && issue.team?.id === env.LINEAR_SOURCE_TEAM_ID && issue.assignee?.id === env.LINEAR_ASSIGNEE_ID
  && issue.state && !CLOSED_TYPES.includes(issue.state.type))

/** Match the status name in the destination; an absent name maps to Todo as approved. */
export function destinationState(source, states) {
  const match = states.find(state => state.name.trim().toLowerCase() === source.name.trim().toLowerCase())
    || states.find(state => state.name === 'Todo' && state.type === 'unstarted')
  if (!match) throw new Error('No matching destination status or Todo fallback. No move attempted.')
  return match
}

/** Move parents before their assigned children; never expand scope to other assignees. */
export function parentFirst(issues) {
  const pending = new Map(issues.map(issue => [issue.id, issue])), ordered = []
  while (pending.size) {
    const next = [...pending.values()].find(issue => !pending.has(issue.parent?.id))
    if (!next) throw new Error('Unexpected issue hierarchy cycle. No moves attempted.')
    pending.delete(next.id); ordered.push(next)
  }
  return ordered
}

export async function routeAssignedIssues({ env, fetchImpl = fetch }) {
  for (const key of ['LINEAR_API_KEY', 'LINEAR_SOURCE_TEAM_ID', 'LINEAR_DESTINATION_TEAM_ID', 'LINEAR_ASSIGNEE_ID']) if (!env[key]) throw new Error(`Missing ${key}.`)
  if (env.LINEAR_SOURCE_TEAM_ID === env.LINEAR_DESTINATION_TEAM_ID) throw new Error('Source and destination teams must differ.')
  const request = async (query, variables = {}) => {
    const response = await fetchImpl('https://api.linear.app/graphql', { method: 'POST', signal: AbortSignal.timeout(30000),
      headers: { Authorization: env.LINEAR_API_KEY, 'Content-Type': 'application/json' }, body: JSON.stringify({ query, variables }) })
    if (!response.ok) throw new Error(`Linear HTTP ${response.status}. Check access/rate limits; the next run retries remaining source-team issues.`)
    const result = await response.json()
    if (result.errors?.length || !result.data) {
      const detail = (result.errors || []).map(error => error.extensions?.userPresentableMessage || error.message).join('; ').replaceAll(env.LINEAR_API_KEY, '[redacted]').slice(0, 500)
      throw new Error(`Linear rejected assignment routing: ${detail}`)
    }
    return result.data
  }
  const setup = await request('query($source: String!, $destination: String!) { source: team(id: $source) { id key } destination: team(id: $destination) { id key states { nodes { id name type } } } }', { source: env.LINEAR_SOURCE_TEAM_ID, destination: env.LINEAR_DESTINATION_TEAM_ID })
  if (setup.source?.key !== 'MED' || setup.destination?.key !== 'MEDUI') throw new Error('Unexpected source/destination team. No moves attempted.')
  const states = setup.destination.states.nodes
  const fields = 'id identifier archivedAt trashed team { id } assignee { id } state { id name type } parent { id }'
  const candidates = [], cursors = new Set()
  let after = null
  do {
    const page = await request(`query($source: ID!, $assignee: ID!, $after: String) { issues(first: 100, after: $after, includeArchived: false, filter: { team: { id: { eq: $source } }, assignee: { id: { eq: $assignee } }, state: { type: { nin: ["completed", "canceled", "duplicate"] } } }) { nodes { ${fields} } pageInfo { hasNextPage endCursor } } }`, { source: env.LINEAR_SOURCE_TEAM_ID, assignee: env.LINEAR_ASSIGNEE_ID, after })
    candidates.push(...page.issues.nodes.filter(issue => eligible(issue, env)))
    const info = page.issues.pageInfo
    if (!info.hasNextPage) break
    if (!info.endCursor || cursors.has(info.endCursor)) throw new Error('Pagination did not advance. No moves attempted.')
    cursors.add(info.endCursor); after = info.endCursor
  } while (true)
  const moved = [], skipped = []
  const ordered = parentFirst(candidates)
  // Validate every initial mapping before the first external write.
  ordered.forEach(issue => destinationState(issue.state, states))
  for (const candidate of ordered) {
    // Re-read immediately before moving: assignments/statuses may change while collecting pages.
    const { issue } = await request(`query($id: String!) { issue(id: $id) { ${fields} } }`, { id: candidate.id })
    if (!eligible(issue, env)) { skipped.push(candidate.identifier); continue }
    const state = destinationState(issue.state, states)
    const input = { teamId: env.LINEAR_DESTINATION_TEAM_ID, stateId: state.id, parentId: issue.parent?.id || null }
    const result = await request('mutation($id: String!, $input: IssueUpdateInput!) { issueUpdate(id: $id, input: $input) { success issue { identifier url team { id } assignee { id } state { id name } parent { id } } } }', { id: issue.id, input })
    const updated = result.issueUpdate.issue
    if (!result.issueUpdate.success || updated?.team.id !== env.LINEAR_DESTINATION_TEAM_ID || updated?.assignee?.id !== env.LINEAR_ASSIGNEE_ID
      || updated?.state.id !== state.id || (updated?.parent?.id || null) !== (issue.parent?.id || null)) throw new Error(`Move for ${issue.identifier} needs verification. Stopped further moves.`)
    moved.push({ from: issue.identifier, to: updated.identifier, url: updated.url, state: updated.state.name })
  }
  return { moved, skipped }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    const result = await routeAssignedIssues({ env: process.env })
    const summary = [`Moved ${result.moved.length} issue(s) from Medsy to Medsy_UI.`,
      ...result.moved.map(issue => `- ${issue.from} → [${issue.to}](${issue.url}) — ${issue.state}`),
      result.skipped.length ? `Skipped ${result.skipped.length} issue(s) whose assignment, status or team changed.` : ''].filter(Boolean).join('\n')
    console.log(summary)
    if (process.env.GITHUB_STEP_SUMMARY) appendFileSync(process.env.GITHUB_STEP_SUMMARY, summary + '\n')
  } catch (error) { console.error(error.message); process.exitCode = 1 }
}
