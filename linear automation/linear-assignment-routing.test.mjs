import test from 'node:test'
import assert from 'node:assert/strict'
import { eligible, destinationState, parentFirst, routeAssignedIssues } from './linear-assignment-routing.mjs'

const env = { LINEAR_API_KEY: 'test-key', LINEAR_SOURCE_TEAM_ID: 'source', LINEAR_DESTINATION_TEAM_ID: 'destination', LINEAR_ASSIGNEE_ID: 'me' }
const states = [{ id: 'todo', name: 'Todo', type: 'unstarted' }, { id: 'review', name: 'In Review', type: 'started' }]
const issue = { id: 'one', identifier: 'MED-1', archivedAt: null, trashed: false, team: { id: 'source' }, assignee: { id: 'me' }, state: { id: 'old', name: 'Planning', type: 'unstarted' }, parent: null }
const reply = data => ({ ok: true, json: async () => ({ data }) })
const setup = { source: { key: 'MED' }, destination: { key: 'MEDUI', states: { nodes: states } } }
const page = nodes => ({ issues: { nodes, pageInfo: { hasNextPage: false } } })
test('only active source-team issues assigned to the configured user qualify', () => {
  assert.equal(eligible(issue, env), true)
  for (const change of [{ archivedAt: 'date' }, { trashed: true }, { team: { id: 'destination' } }, { assignee: { id: 'other' } }, ...['completed', 'canceled', 'duplicate'].map(type => ({ state: { type } }))]) assert.equal(eligible({ ...issue, ...change }, env), false)
})
test('status names are preserved and missing names map to Todo', () => {
  assert.equal(destinationState({ name: 'In Review' }, states).id, 'review')
  assert.equal(destinationState({ name: 'Planning' }, states).id, 'todo')
  assert.throws(() => destinationState({ name: 'Planning' }, []), /fallback/)
})
test('parents are processed first without pulling unrelated parents into scope', () => {
  assert.deepEqual(parentFirst([{ ...issue, id: 'child', parent: { id: 'one' } }, issue]).map(row => row.id), ['one', 'child'])
  assert.equal(parentFirst([{ ...issue, parent: { id: 'unrelated' } }]).length, 1)
})
test('pagination finishes before writes and reassigned issues are skipped on recheck', async () => {
  const queries = [], second = { ...issue, id: 'two', identifier: 'MED-2' }
  const responses = [setup, { issues: { nodes: [issue], pageInfo: { hasNextPage: true, endCursor: 'next' } } }, page([second]), { issue: { ...issue, assignee: { id: 'other' } } }, { issue: second },
    { issueUpdate: { success: true, issue: { identifier: 'MEDUI-2', url: 'url', team: { id: 'destination' }, assignee: { id: 'me' }, state: states[0], parent: null } } }]
  const result = await routeAssignedIssues({ env, fetchImpl: async (url, options) => { queries.push(JSON.parse(options.body)); return reply(responses.shift()) } })
  assert.equal(result.skipped.length, 1); assert.equal(result.moved.length, 1)
  assert.equal(queries[2].variables.after, 'next')
  assert.deepEqual(queries[5].variables.input, { teamId: 'destination', stateId: 'todo', parentId: null })
})
test('moving a subissue preserves its parent without changing the assignee', async () => {
  const child = { ...issue, parent: { id: 'parent' }, state: { name: 'In Review', type: 'started' } }
  const responses = [setup, page([child]), { issue: child }, { issueUpdate: { success: true, issue: { identifier: 'MEDUI-1', team: { id: 'destination' }, assignee: { id: 'me' }, state: states[1], parent: child.parent } } }]
  await routeAssignedIssues({ env, fetchImpl: async (url, options) => {
    const query = JSON.parse(options.body)
    if (query.query.startsWith('mutation')) { assert.equal(query.variables.input.parentId, 'parent'); assert.equal(query.variables.input.assigneeId, undefined) }
    return reply(responses.shift())
  } })
})
test('empty subsequent runs perform no mutations; GraphQL failures stop safely', async () => {
  const responses = [setup, page([])]
  assert.deepEqual(await routeAssignedIssues({ env, fetchImpl: async () => reply(responses.shift()) }), { moved: [], skipped: [] })
  await assert.rejects(routeAssignedIssues({ env, fetchImpl: async () => ({ ok: true, json: async () => ({ errors: [{ message: 'Denied test-key' }] }) }) }), error => /rejected/.test(error.message) && !error.message.includes('test-key'))
})
