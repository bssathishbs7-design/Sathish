import test from 'node:test'
import assert from 'node:assert/strict'
import { parseFileChanges, renderHistory } from './generate-commit-history.mjs'

test('file parsing preserves unusual names and binary changes', () => {
  assert.deepEqual(parseFileChanges('2\t1\tsrc/a name.jsx\0-\t-\timage.png\0'), [
    { added: '2', removed: '1', path: 'src/a name.jsx' }, { added: '-', removed: '-', path: 'image.png' },
  ])
  assert.equal(parseFileChanges('1\t0\tline\nbreak\tname\0')[0].path, 'line\nbreak\tname')
})
test('history is deterministic, uses IST timestamps, and escapes commit text', () => {
  const commits = [{ sha: 'a'.repeat(40), short: 'aaaaaaa', subject: 'UI | <fix>', body: 'Detailed change', author: 'Developer', committedAt: '2026-10-27T00:00:00Z', authoredAt: '2026-10-26T23:00:00Z', changes: [{ path: 'src/App.jsx', added: '5', removed: '2' }] }]
  const result = renderHistory(commits, 'https://github.com/owner/repo')
  assert.equal(result, renderHistory(commits, 'https://github.com/owner/repo'))
  assert.match(result, /27 Oct 2026, 05:30:00 IST/)
  assert.match(result, /UI &#124; &lt;fix&gt;/)
  assert.match(result, /5 lines added; 2 lines removed/)
  assert.match(result, /src\/App.jsx/)
  assert.match(result, /They are not push timestamps/)
})
