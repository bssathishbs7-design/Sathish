import test from 'node:test'
import assert from 'node:assert/strict'
import { syncPush, issueIdForRun, buildIssue } from './linear-main-push.mjs'

const env = { GITHUB_EVENT_NAME: 'push', GITHUB_REPOSITORY: 'owner/repo', GITHUB_RUN_ID: '123', GITHUB_TOKEN: 'test-github', LINEAR_API_KEY: 'test-linear', LINEAR_TEAM_ID: 'team', LINEAR_REVIEW_STATE_ID: 'review' }
const event = { ref: 'refs/heads/main', before: 'a'.repeat(40), after: 'b'.repeat(40), sender: { login: 'author' }, commits: [{ id: 'b'.repeat(40), message: 'Update UI', author: { name: 'Author' } }] }
const issue = { id: 'id', identifier: 'MEDUI-1', url: 'https://linear.app/example' }
const response = data => ({ ok: true, json: async () => data })

test('one task contains the push summary and review state, without executing shell text', async () => {
  const calls = []
  const fetchImpl = async (url, options) => {
    calls.push({ url, options })
    if (calls.length === 1) return response({ data: { issues: { nodes: [] } } })
    if (calls.length === 2) return response({ commits: [{ sha: event.after, commit: { message: 'Fix UI $(echo injected)', author: { name: 'Author' } } }], files: [{ filename: 'src/App.jsx', status: 'modified' }], total_commits: 1 })
    return response({ data: { issueCreate: { success: true, issue } } })
  }
  assert.equal((await syncPush({ event, env, fetchImpl })).issue, issue)
  const input = JSON.parse(calls[2].options.body).variables.input
  assert.equal(input.stateId, 'review')
  assert.equal(input.teamId, 'team')
  assert.match(input.description, /src\/App.jsx/)
  assert.match(input.description, /already on main/)
  assert.match(input.description, /\$\(echo injected\)/)
  assert.equal(calls.filter(call => call.options.body?.includes('mutation')).length, 1)
})
test('reruns reuse the same issue; a separate push gets a new identity even at the same SHA', async () => {
  let requests = 0
  const result = await syncPush({ event, env, fetchImpl: async () => { requests++; return response({ data: { issues: { nodes: [issue] } } }) } })
  assert.equal(result.existing, true)
  assert.equal(requests, 1)
  assert.equal(issueIdForRun('owner/repo', '123'), issueIdForRun('owner/repo', '123'))
  assert.notEqual(issueIdForRun('owner/repo', '123'), issueIdForRun('owner/repo', '124'))
})
test('other branches, deletion and non-push events never write to Linear', async () => {
  const fetchImpl = () => { throw new Error('Unexpected request') }
  for (const alternate of [{ ...event, ref: 'refs/heads/feature' }, { ...event, deleted: true }]) assert.equal((await syncPush({ event: alternate, env, fetchImpl })).skipped, true)
  assert.equal((await syncPush({ event, env: { ...env, GITHUB_EVENT_NAME: 'pull_request' }, fetchImpl })).skipped, true)
})
test('missing secrets and GraphQL errors fail visibly before creating tasks', async () => {
  await assert.rejects(syncPush({ event, env: { ...env, LINEAR_API_KEY: '' } }), /Missing LINEAR_API_KEY/)
  await assert.rejects(syncPush({ event, env, fetchImpl: async () => response({ errors: [{ message: 'Denied' }] }) }), /Linear rejected/)
  await assert.rejects(syncPush({ event, env, fetchImpl: async () => ({ ok: false, status: 401 }) }), /HTTP 401/)
})
test('unavailable comparisons still produce an honest push task', async () => {
  let requests = 0, description
  const fetchImpl = async () => {
    requests++
    if (requests === 1) return response({ data: { issues: { nodes: [] } } })
    if (requests === 2) throw new Error('Network unavailable')
    return response({ data: { issueCreate: { success: true, issue } } })
  }
  const original = fetchImpl
  await syncPush({ event, env, fetchImpl: async (url, options) => { if (options.body?.includes('mutation')) description = JSON.parse(options.body).variables.input.description; return original() } })
  assert.match(description, /comparison details were unavailable/)
  assert.match(description, /Update UI/)
})
test('large pushes are bounded and marked as partial summaries', () => {
  const comparison = { commits: Array.from({ length: 100 }, () => ({ sha: event.after, commit: { message: 'Change', author: { name: 'A' } } })), total_commits: 150, files: Array.from({ length: 300 }, (_, i) => ({ filename: `file-${i}`, status: 'modified' })) }
  const summary = buildIssue(event, env, comparison)
  assert.match(summary.description, /first 100 of 150 commits/)
  assert.match(summary.description, /first 100 changed files/)
  assert.doesNotMatch(summary.description, /file-100`/)
})
