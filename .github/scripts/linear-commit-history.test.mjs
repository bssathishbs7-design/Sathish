import test from 'node:test'
import assert from 'node:assert/strict'
import { publishHistory, linearHistoryContent, HISTORY_TITLE } from './linear-commit-history.mjs'

const env = { LINEAR_API_KEY: 'test-key', LINEAR_TEAM_ID: 'team', LINEAR_HISTORY_DOCUMENT_ID: 'doc' }
const markdown = '# Commit history\n\n## Changes by commit\n\n<details>\n<summary>Changed files</summary>\n\nsrc/App.jsx\n</details>'
const reply = data => ({ ok: true, json: async () => ({ data }) })
test('creates one document directly in the configured team', async () => {
  const calls = []
  await publishHistory({ markdown, env, fetchImpl: async (url, options) => {
    calls.push(JSON.parse(options.body))
    return calls.length === 1 ? reply({ documents: { nodes: [] } }) : reply({ documentCreate: { success: true, document: { id: 'doc', url: 'https://linear.app/doc' } } })
  } })
  assert.equal(calls[1].variables.input.teamId, 'team')
  assert.equal(calls[1].variables.input.id, 'doc')
  assert.equal(calls[1].variables.input.title, HISTORY_TITLE)
  assert.doesNotMatch(calls[1].variables.input.content, /<details>/)
})
test('an existing document is updated, not duplicated', async () => {
  let calls = 0
  await publishHistory({ markdown, env, fetchImpl: async (url, options) => {
    calls++
    if (calls === 1) return reply({ documents: { nodes: [{ id: 'doc', content: 'old', team: { id: 'team' } }] } })
    assert.match(JSON.parse(options.body).query, /documentUpdate/)
    return reply({ documentUpdate: { success: true, document: { id: 'doc' } } })
  } })
  assert.equal(calls, 2)
})
test('unchanged history avoids unnecessary writes; wrong-team documents are protected', async () => {
  const document = { id: 'doc', title: HISTORY_TITLE, content: linearHistoryContent(markdown), team: { id: 'team' } }
  assert.equal((await publishHistory({ markdown, env, fetchImpl: async () => reply({ documents: { nodes: [document] } }) })).unchanged, true)
  await assert.rejects(publishHistory({ markdown, env, fetchImpl: async () => reply({ documents: { nodes: [{ ...document, team: { id: 'other' } }] } }) }), /Refusing to overwrite/)
})
test('invalid input and API errors cannot report a successful update', async () => {
  await assert.rejects(publishHistory({ markdown: 'partial', env }), /complete generated/)
  await assert.rejects(publishHistory({ markdown, env, fetchImpl: async () => ({ ok: false, status: 403 }) }), /HTTP 403/)
  await assert.rejects(publishHistory({ markdown, env, fetchImpl: async () => ({ ok: true, json: async () => ({ errors: [{ message: 'Denied' }] }) }) }), /Linear rejected/)
})
