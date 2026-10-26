import test from 'node:test'
import assert from 'node:assert/strict'
import { analyseStudentFile, STUDENT_COLUMNS } from './studentImport.js'
import { sampleDirectory } from './studentManagement.js'
const sheet = [STUDENT_COLUMNS, ['NEW001', 'New Student', 'new@example.edu', '+91', '9876543210', '']]
test('analysis withholds a valid preview until the minimum time elapses', async t => {
 t.mock.timers.enable({ apis: ['setTimeout'] })
 let revealed = false
 const pending = analyseStudentFile({}, '2026', sampleDirectory(), { readFile: async () => sheet }).then(result => { revealed = true; return result })
 await new Promise(resolve => setImmediate(resolve))
 t.mock.timers.tick(29999)
 await new Promise(resolve => setImmediate(resolve))
 assert.equal(revealed, false)
 t.mock.timers.tick(1)
 assert.deepEqual(await pending, sheet)
})
test('read failures are shown only after analysis time, and cancellation rejects stale work', async t => {
 t.mock.timers.enable({ apis: ['setTimeout'] })
 let revealed = false
 const failure = analyseStudentFile({}, '2026', sampleDirectory(), { readFile: async () => { throw new Error('Invalid file') } }).catch(error => { revealed = true; return error })
 await new Promise(resolve => setImmediate(resolve))
 assert.equal(revealed, false)
 t.mock.timers.tick(30000)
 assert.match((await failure).message, /Invalid file/)
 const request = new AbortController()
 const pending = analyseStudentFile({}, '2026', sampleDirectory(), { signal: request.signal, readFile: () => new Promise(() => {}) })
 request.abort()
 await assert.rejects(pending, { name: 'AbortError' })
})
