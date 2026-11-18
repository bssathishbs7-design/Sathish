import test from 'node:test'
import assert from 'node:assert/strict'
import { encodeAssessmentStorage, decodeAssessmentStorage, installAssessmentStorageCompression } from './assessmentStorageCompression.js'

function stores(limit = Infinity) {
  class MemoryStorage {
    values = new Map()
    get length() { return this.values.size }
    key(index) { return [...this.values.keys()][index] ?? null }
    getItem(key) { return this.values.get(key) ?? null }
    setItem(key, value) {
      const size = [...this.values].reduce((total, [savedKey, text]) => total + (savedKey === key ? 0 : text.length), 0) + value.length
      if (size > limit) throw new Error('QuotaExceededError')
      this.values.set(key, String(value))
    }
  }
  return { local: new MemoryStorage(), session: new MemoryStorage(), prototype: MemoryStorage.prototype }
}
const paper = JSON.stringify({ logoPreview: 'data:image/png;base64,' + 'image'.repeat(3000), questionRows: [{ questionText: 'Describe the patient’s symptoms – பக்கம்', images: ['data:image/png;base64,' + 'question'.repeat(3000)] }] })

test('compression retains every byte of questions, Unicode, images and logos', () => {
  assert.ok(encodeAssessmentStorage(paper).length < paper.length)
  assert.equal(decodeAssessmentStorage(encodeAssessmentStorage(paper)), paper)
  assert.equal(decodeAssessmentStorage(null), null)
  assert.equal(encodeAssessmentStorage('{}'), '{}')
})

test('migrates existing records and permits a complete publication within the same quota', () => {
  const { local, session, prototype } = stores(paper.length + 100)
  local.setItem('vx-create-assessment-setup', paper)
  assert.throws(() => local.setItem('vx-assessment-published', paper), /Quota/)
  installAssessmentStorageCompression(local, prototype)
  local.setItem('vx-assessment-published', paper)
  assert.equal(local.getItem('vx-create-assessment-setup'), paper)
  assert.equal(local.getItem('vx-assessment-published'), paper)
  assert.equal(local.length, 2)
  session.setItem('vx-assessment-published', paper)
  assert.equal(session.values.get('vx-assessment-published'), paper)
  installAssessmentStorageCompression(local, prototype)
  assert.equal(local.getItem('vx-assessment-published'), paper)
})

test('does not change unrelated storage and preserves previous records after failed writes', () => {
  const { local, prototype } = stores(1000)
  local.setItem('unrelated', 'unchanged')
  local.setItem('vx-assessment-published', '[{"id":"old"}]')
  installAssessmentStorageCompression(local, prototype)
  assert.throws(() => local.setItem('unrelated', 'x'.repeat(2000)), /Quota/)
  assert.equal(local.getItem('unrelated'), 'unchanged')
  assert.equal(local.getItem('vx-assessment-published'), '[{"id":"old"}]')
})
