import test from 'node:test'
import assert from 'node:assert/strict'
import { compactPublishedAssessments, savePublishedAssessments } from './assessmentPublicationStorage.js'

test('compacts repeated images once while retaining logo, nested questions and publication data', async () => {
  const source = 'data:image/png;base64,large'
  const record = { id: 'a', setup: { logoPreview: source, draftWorkspace: { duplicate: 'editor' }, students: ['student'] }, questionRows: [{ questionText: 'Describe the image', images: [{ url: source }], descriptiveSections: [{ images: [source] }] }] }
  let conversions = 0
  const rows = await compactPublishedAssessments([record], async () => { conversions++; return 'data:image/webp;base64,small' })
  assert.equal(conversions, 1)
  assert.equal(rows[0].setup.draftWorkspace, undefined)
  assert.equal(rows[0].setup.logoPreview, 'data:image/webp;base64,small')
  assert.equal(rows[0].questionRows[0].images[0].url, rows[0].setup.logoPreview)
  assert.equal(rows[0].questionRows[0].descriptiveSections[0].images[0], rows[0].setup.logoPreview)
  assert.equal(rows[0].questionRows[0].questionText, 'Describe the image')
  assert.deepEqual(rows[0].setup.students, ['student'])
  assert.equal(record.setup.logoPreview, source)
  assert.ok(record.setup.draftWorkspace)
})

test('fits a quota that rejects unoptimised records without dropping questions or older assessments', async () => {
  const image = 'data:image/png;base64,' + 'a'.repeat(2000)
  const rows = [{ id: 'new', setup: { logoPreview: image }, questionRows: [{ questionText: 'Question', images: [image] }] }, { id: 'old', questionRows: [{ questionText: 'Older question' }] }]
  let saved = ''
  const storage = { setItem: (key, value) => { if (value.length > 1000) throw new Error('QuotaExceededError'); saved = value } }
  assert.throws(() => storage.setItem('vx-assessment-published', JSON.stringify(rows)))
  await savePublishedAssessments(rows, storage, async () => 'data:image/webp;base64,small')
  assert.equal(JSON.parse(saved).length, 2)
  assert.equal(JSON.parse(saved)[0].questionRows.length, 1)
})

test('a failed save never replaces the published list with a summary or a single record', async () => {
  let calls = 0
  await assert.rejects(savePublishedAssessments([{ id: 'new' }], { setItem: () => { calls++; throw new Error('QuotaExceededError') } }), /QuotaExceededError/)
  assert.equal(calls, 1)
})
