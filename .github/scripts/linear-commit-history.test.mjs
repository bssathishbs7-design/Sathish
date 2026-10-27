import test from 'node:test'
import assert from 'node:assert/strict'
import { publishHistory, renderLinearHistory, DOCUMENT_LIMIT } from './linear-commit-history.mjs'

const env = { LINEAR_API_KEY: 'test-key', LINEAR_TEAM_ID: 'team', LINEAR_HISTORY_DOCUMENT_ID: 'doc' }
const commit = { sha: 'a'.repeat(40), short: 'aaaaaaa', subject: 'Fix | UI', author: 'Sathish', committedAt: '2026-10-27T00:00:00Z', changes: [{ path: 'src/App.jsx', added: '3', removed: '1' }] }
const content = renderLinearHistory([commit])
const document = { id: 'doc', title: 'Commit Document', content: null, team: { id: 'team' } }
const reply = data => ({ ok: true, json: async () => ({ data }) })
test('renders serial numbers and four detail columns with IST timestamps and exact change counts', () => {
  assert.match(content, /S\. no\. \| Description and author \| Date and time in IST \| Changed files and line counts \| GitHub commit links/)
  assert.deepEqual(renderLinearHistory([commit, commit]).split('\n').filter(line => /^\| \d+ \|/.test(line)).map(line => line.split('|')[1].trim()), ['1', '2'])
  assert.match(content, /27 Oct 2026, 05:30:00 IST/)
  assert.match(content, /Fix &#124; UI — Sathish/)
  assert.match(content, /1 files \(\+3 \/ -1\)/)
  assert.match(content, /src\/App.jsx/)
  assert.match(content, /github.com\/bssathishbs7-design\/Sathish\/commit/)
})
test('updates only existing document content and preserves its title', async () => {
  const calls = []
  await publishHistory({ content, env, fetchImpl: async (url, options) => {
    calls.push(JSON.parse(options.body))
    return calls.length === 1 ? reply({ documents: { nodes: [document] } }) : reply({ documentUpdate: { success: true, document } })
  } })
  assert.match(calls[1].query, /documentUpdate/)
  assert.deepEqual(calls[1].variables, { id: 'doc', input: { content } })
})
test('missing, trashed and wrong-team documents cannot be replaced or recreated', async () => {
  for (const nodes of [[], [{ ...document, trashed: true }], [{ ...document, team: { id: 'other' } }]]) {
    let count = 0
    await assert.rejects(publishHistory({ content, env, fetchImpl: async () => { count++; return reply({ documents: { nodes } }) } }), /No new document|Refusing/)
    assert.equal(count, 1)
  }
})
test('unchanged content skips writes and API errors are safely reported', async () => {
  assert.equal((await publishHistory({ content, env, fetchImpl: async () => reply({ documents: { nodes: [{ ...document, content }] } }) })).unchanged, true)
  await assert.rejects(publishHistory({ content, env, fetchImpl: async () => ({ ok: true, json: async () => ({ errors: [{ message: 'Rejected test-key', extensions: { code: 'FORBIDDEN' } }] }) }) }), error => error.message.includes('FORBIDDEN') && !error.message.includes('test-key'))
})
test('large histories fit Linear limits and disclose any oldest-row omission', () => {
  const result = renderLinearHistory(Array.from({ length: 2000 }, () => commit))
  assert.ok(result.length <= DOCUMENT_LIMIT)
  assert.match(result, /Showing the newest .* of 2000/)
  assert.match(result, /Complete GitHub history/)
})
